import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { isPrivileged } from '../config/roles.js'
import { generateInvoiceNumber } from '../utils/idGenerator.js'
import { generateTicketPDF, generateInvoicePDF } from '../services/email/pdfService.js'
import { writeAuditLog } from '../services/auditLog.js'

// Server-side booking documents.
//
// Tickets and invoices were previously produced in the browser by screenshotting
// the confirmation page with html2canvas. That produces a bitmap of whatever
// happened to be on screen — unselectable text, no invoice number, and nothing
// at all if the customer closed the tab. These render from the stored booking
// instead, so a document can be re-issued at any time and always matches the
// record.

const loadOwnedBooking = async (req) => {
  const snap = await db.collection('bookings').doc(req.params.id).get()
  if (!snap.exists) return null

  const booking = { id: snap.id, ...snap.data() }
  if (booking.isDeleted) return null

  // 404 rather than 403: confirming existence would leak that another customer
  // holds this booking id.
  if (booking.userId !== req.principal.uid && !isPrivileged(req.principal.role)) return null

  return { ref: snap.ref, booking }
}

const sendPdf = (res, buffer, filename) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`)
  res.setHeader('Content-Length', buffer.length)
  return res.send(buffer)
}

export const getTicket = async (req, res) => {
  try {
    const found = await loadOwnedBooking(req)
    if (!found) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (String(found.booking.status).toLowerCase() === 'cancelled') {
      return res.status(409).json({
        success: false,
        code: 'BOOKING_CANCELLED',
        message: 'This booking is cancelled — a ticket can no longer be issued for it.'
      })
    }

    const buffer = await generateTicketPDF(found.booking)

    writeAuditLog({
      req,
      action: 'document_issued',
      entity: 'bookings',
      entityId: found.booking.bookingId ?? req.params.id,
      newValue: { document: 'ticket' }
    })

    sendPdf(res, buffer, `ticket-${found.booking.bookingId ?? req.params.id}`)
  } catch (err) {
    console.error('Ticket generation failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not generate the ticket' })
  }
}

export const getInvoice = async (req, res) => {
  try {
    const found = await loadOwnedBooking(req)
    if (!found) return res.status(404).json({ success: false, message: 'Booking not found' })

    // The invoice number must be stable across re-downloads — an invoice that
    // changes its own number every time it is fetched is not an invoice. Mint
    // it once on first request and persist it.
    let invoiceNumber = found.booking.invoiceNumber
    if (!invoiceNumber) {
      invoiceNumber = generateInvoiceNumber(found.booking.type ?? 'flight')
      await found.ref.update({ invoiceNumber, updatedAt: now() })
    }

    const buffer = await generateInvoicePDF({ ...found.booking, invoiceNumber }, invoiceNumber)

    writeAuditLog({
      req,
      action: 'document_issued',
      entity: 'bookings',
      entityId: found.booking.bookingId ?? req.params.id,
      newValue: { document: 'invoice', invoiceNumber }
    })

    sendPdf(res, buffer, `invoice-${invoiceNumber}`)
  } catch (err) {
    console.error('Invoice generation failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not generate the invoice' })
  }
}

export const getRefundReceipt = async (req, res) => {
  try {
    const snap = await db.collection('refunds').doc(req.params.id).get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Refund not found' })

    const refund = { id: snap.id, ...snap.data() }
    if (refund.userId !== req.principal.uid && !isPrivileged(req.principal.role)) {
      return res.status(404).json({ success: false, message: 'Refund not found' })
    }

    // A receipt is only meaningful once the money has actually gone back.
    if (refund.status !== 'completed') {
      return res.status(409).json({
        success: false,
        code: 'REFUND_NOT_COMPLETED',
        message: `This refund is ${refund.status}. A receipt is issued once it has settled.`
      })
    }

    // Rendered through the invoice layout with refund figures — a credit note
    // is the same document with a negative total.
    const buffer = await generateInvoicePDF(
      {
        bookingId: refund.bookingId,
        type: refund.type ?? 'flight',
        userEmail: refund.userEmail ?? null,
        baseFare: refund.grossAmount,
        taxes: 0,
        convenience: refund.cancellationFee,
        discount: 0,
        totalAmount: refund.refundAmount,
        paymentMethod: 'Original payment method',
        transactionId: refund.gatewayRefundId ?? refund.paymentId ?? null
      },
      refund.refundId
    )

    writeAuditLog({
      req,
      action: 'document_issued',
      entity: 'refunds',
      entityId: refund.refundId ?? req.params.id,
      newValue: { document: 'refund_receipt' }
    })

    sendPdf(res, buffer, `refund-${refund.refundId ?? req.params.id}`)
  } catch (err) {
    console.error('Refund receipt generation failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not generate the receipt' })
  }
}
