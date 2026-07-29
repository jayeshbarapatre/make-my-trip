import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { isPrivileged } from '../config/roles.js'
import { sanitizeText } from '../utils/sanitize.js'
import { writeAuditLog } from '../services/auditLog.js'
import { generateInvoiceNumber } from '../utils/idGenerator.js'

export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_ON_CUSTOMER: 'waiting_on_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}

const TRANSITIONS = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING_ON_CUSTOMER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]: []
}

const CATEGORIES = new Set(['booking', 'payment', 'refund', 'account', 'other'])
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent'])

export const createTicket = async (req, res) => {
  try {
    const { subject, message, category = 'other', priority = 'normal', bookingId = null } = req.body
    const uid = req.principal.uid

    const cleanSubject = sanitizeText(subject, 160)
    const cleanMessage = sanitizeText(message, 4000)

    if (!cleanSubject || !cleanMessage) {
      return res.status(400).json({ success: false, message: 'Both a subject and a message are required' })
    }
    if (!CATEGORIES.has(category)) {
      return res.status(400).json({ success: false, message: 'Unknown ticket category' })
    }
    if (!PRIORITIES.has(priority)) {
      return res.status(400).json({ success: false, message: 'Unknown ticket priority' })
    }

    const ref = db.collection('support_tickets').doc()
    const ticketNumber = generateInvoiceNumber('flight').replace('INV-FL-', 'TKT-')

    const doc = {
      ticketNumber,
      userId: uid,
      userEmail: req.principal.email,
      subject: cleanSubject,
      category,
      priority,
      bookingId,
      status: TicketStatus.OPEN,
      messages: [
        { from: 'customer', authorId: uid, body: cleanMessage, at: new Date().toISOString() }
      ],
      assignedTo: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: 'support_ticket_created',
      entity: 'support_tickets',
      entityId: ticketNumber,
      newValue: { category, priority, bookingId }
    })

    res.status(201).json({ success: true, data: { id: ref.id, ...doc } })
  } catch (err) {
    console.error('Create ticket failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not create the ticket' })
  }
}

export const listMyTickets = async (req, res) => {
  try {
    const snap = await db.collection('support_tickets').where('userId', '==', req.principal.uid).get()
    const tickets = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((t) => !t.isDeleted)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: tickets })
  } catch (err) {
    console.error('List tickets failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load your tickets' })
  }
}

const loadOwnedTicket = async (req) => {
  const snap = await db.collection('support_tickets').doc(req.params.id).get()
  if (!snap.exists) return null

  const ticket = snap.data()
  if (ticket.userId !== req.principal.uid && !isPrivileged(req.principal.role)) return null

  return { ref: snap.ref, ticket }
}

export const getTicket = async (req, res) => {
  try {
    const found = await loadOwnedTicket(req)
    if (!found) return res.status(404).json({ success: false, message: 'Ticket not found' })
    res.json({ success: true, data: { id: req.params.id, ...found.ticket } })
  } catch (err) {
    console.error('Get ticket failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load the ticket' })
  }
}

export const replyToTicket = async (req, res) => {
  try {
    const found = await loadOwnedTicket(req)
    if (!found) return res.status(404).json({ success: false, message: 'Ticket not found' })

    const body = sanitizeText(req.body?.message, 4000)
    if (!body) return res.status(400).json({ success: false, message: 'A message is required' })

    if (found.ticket.status === TicketStatus.CLOSED) {
      return res.status(409).json({ success: false, message: 'This ticket is closed. Please open a new one.' })
    }

    const staff = isPrivileged(req.principal.role)

    await found.ref.update({
      messages: FieldValue.arrayUnion({
        from: staff ? 'support' : 'customer',
        authorId: req.principal.uid,
        body,
        at: new Date().toISOString()
      }),
      // A customer reply reopens the conversation; a staff reply hands it back.
      status: staff ? TicketStatus.WAITING_ON_CUSTOMER : TicketStatus.IN_PROGRESS,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal.uid
    })

    const fresh = await found.ref.get()
    res.json({ success: true, data: { id: req.params.id, ...fresh.data() } })
  } catch (err) {
    console.error('Reply to ticket failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not post your reply' })
  }
}

// ── Admin ──

export const listAllTickets = async (req, res) => {
  try {
    const { status } = req.query
    let query = db.collection('support_tickets')
    if (status) query = query.where('status', '==', status)

    const snap = await query.limit(500).get()
    const tickets = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: tickets })
  } catch (err) {
    console.error('List all tickets failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load tickets' })
  }
}

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!TRANSITIONS[status] && status !== undefined) {
      return res.status(400).json({ success: false, message: `Unknown ticket status "${status}"` })
    }

    const ref = db.collection('support_tickets').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Ticket not found' })

    const current = snap.data()
    if (!TRANSITIONS[current.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot move a ticket from ${current.status} to ${status}`
      })
    }

    await ref.update({
      status,
      assignedTo: req.body.assignedTo ?? current.assignedTo ?? req.principal.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal.uid
    })

    writeAuditLog({
      req,
      action: 'support_ticket_updated',
      entity: 'support_tickets',
      entityId: current.ticketNumber ?? req.params.id,
      oldValue: { status: current.status },
      newValue: { status }
    })

    const fresh = await ref.get()
    res.json({ success: true, data: { id: req.params.id, ...fresh.data() } })
  } catch (err) {
    console.error('Update ticket failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not update the ticket' })
  }
}
