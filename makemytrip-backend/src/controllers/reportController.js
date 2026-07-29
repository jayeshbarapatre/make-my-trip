import { sendExport } from '../utils/exporters.js'
import { writeAuditLog } from '../services/auditLog.js'
import {
  parseRange,
  bookingReport,
  revenueReport,
  refundReport,
  userReport,
  vendorReport,
  dashboardSummary
} from '../services/reportService.js'

const money = (v) => (Number(v) || 0).toFixed(2)
const stamp = (v) => {
  if (!v) return ''
  if (typeof v?.toDate === 'function') return v.toDate().toISOString().slice(0, 19).replace('T', ' ')
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 19).replace('T', ' ')
}

const COLUMNS = {
  bookings: [
    { key: 'bookingId', header: 'Booking ID', width: 16 },
    { key: 'pnr', header: 'PNR', width: 12 },
    { key: 'type', header: 'Type', width: 8 },
    { key: 'status', header: 'Status', width: 10 },
    { key: 'paymentStatus', header: 'Payment', width: 10 },
    { key: 'fromCity', header: 'From', width: 12 },
    { key: 'toCity', header: 'To', width: 12 },
    { key: 'departureDate', header: 'Departure', width: 12 },
    { key: 'totalAmount', header: 'Amount', width: 12, format: money, numeric: true },
    { key: 'userEmail', header: 'Customer', width: 22 },
    { key: 'createdAt', header: 'Booked At', width: 18, format: stamp }
  ],
  revenue: [
    { key: 'date', header: 'Date', width: 12 },
    { key: 'type', header: 'Type', width: 10 },
    { key: 'bookings', header: 'Bookings', width: 10, numeric: true, numFmt: '0' },
    { key: 'cancelled', header: 'Cancelled', width: 10, numeric: true, numFmt: '0' },
    { key: 'grossRevenue', header: 'Gross Revenue', width: 14, format: money, numeric: true },
    { key: 'netRevenue', header: 'Net Revenue', width: 14, format: money, numeric: true }
  ],
  refunds: [
    { key: 'refundId', header: 'Refund ID', width: 18 },
    { key: 'bookingId', header: 'Booking ID', width: 16 },
    { key: 'type', header: 'Type', width: 8 },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'grossAmount', header: 'Gross', width: 12, format: money, numeric: true },
    { key: 'cancellationFee', header: 'Fee', width: 12, format: money, numeric: true },
    { key: 'refundAmount', header: 'Refunded', width: 12, format: money, numeric: true },
    { key: 'gatewayRefundId', header: 'Gateway Ref', width: 18 },
    { key: 'createdAt', header: 'Requested At', width: 18, format: stamp }
  ],
  users: [
    { key: 'userId', header: 'User ID', width: 20 },
    { key: 'name', header: 'Name', width: 18 },
    { key: 'email', header: 'Email', width: 26 },
    { key: 'phone', header: 'Phone', width: 14 },
    { key: 'role', header: 'Role', width: 12 },
    { key: 'accountStatus', header: 'Status', width: 12 },
    { key: 'createdAt', header: 'Registered', width: 18, format: stamp }
  ],
  vendors: [
    { key: 'vendorId', header: 'Vendor ID', width: 22 },
    { key: 'bookings', header: 'Bookings', width: 10, numeric: true, numFmt: '0' },
    { key: 'cancelled', header: 'Cancelled', width: 10, numeric: true, numFmt: '0' },
    { key: 'grossRevenue', header: 'Gross Revenue', width: 14, format: money, numeric: true },
    { key: 'netRevenue', header: 'Net Revenue', width: 14, format: money, numeric: true }
  ]
}

const TITLES = {
  bookings: 'Booking Report',
  revenue: 'Revenue Report',
  refunds: 'Refund Report',
  users: 'User Report',
  vendors: 'Vendor Report'
}

// Admin-only reports expose data across every account; the router gates these
// too, but keeping the list here means a new route cannot accidentally widen them.
const ADMIN_ONLY = new Set(['users', 'vendors'])

const VALID_FORMATS = new Set(['json', 'csv', 'xlsx', 'pdf'])

export const getReport = async (req, res) => {
  const { kind } = req.params
  const format = String(req.query.format ?? 'json').toLowerCase()

  if (!COLUMNS[kind]) {
    return res.status(404).json({ success: false, message: `Unknown report "${kind}"` })
  }
  if (!VALID_FORMATS.has(format)) {
    return res.status(400).json({ success: false, message: `Unsupported format "${format}"` })
  }
  if (ADMIN_ONLY.has(kind) && !['admin', 'super_admin'].includes(req.principal.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to run this report' })
  }

  try {
    const range = parseRange({ from: req.query.from, to: req.query.to })

    const rows = await (async () => {
      switch (kind) {
        case 'bookings': return bookingReport(req.principal, range)
        case 'revenue': return revenueReport(req.principal, range)
        case 'refunds': return refundReport(req.principal, range)
        case 'users': return userReport(range)
        case 'vendors': return vendorReport(range)
        default: return []
      }
    })()

    // Exports leave the system as files, so they are worth an audit entry.
    if (format !== 'json') {
      writeAuditLog({
        req,
        action: 'report_exported',
        entity: 'reports',
        entityId: kind,
        newValue: { format, rows: rows.length, from: req.query.from ?? null, to: req.query.to ?? null }
      })
    }

    const rangeLabel = [req.query.from, req.query.to].filter(Boolean).join(' to ') || 'all time'

    return sendExport(res, {
      format,
      rows,
      columns: COLUMNS[kind],
      filename: `${kind}-report`,
      title: TITLES[kind],
      subtitle: `Period: ${rangeLabel} · scope: ${req.principal.role}`
    })
  } catch (err) {
    console.error(`Report "${kind}" failed:`, err.message)
    res.status(500).json({ success: false, message: 'Could not generate the report' })
  }
}

export const getSummary = async (req, res) => {
  try {
    const range = parseRange({ from: req.query.from, to: req.query.to })
    const summary = await dashboardSummary(req.principal, range)
    res.json({ success: true, data: summary })
  } catch (err) {
    console.error('Report summary failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load the summary' })
  }
}
