import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { reportsService } from '../services/platformAdminService'
import './AdminFlights.css'

const REPORTS = [
  { kind: 'bookings', label: 'Bookings' },
  { kind: 'revenue', label: 'Revenue' },
  { kind: 'refunds', label: 'Refunds' },
  { kind: 'users', label: 'Users' },
  { kind: 'vendors', label: 'Vendors' }
]

const FORMATS = ['csv', 'xlsx', 'pdf']

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const cellValue = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  // Firestore timestamps arrive as { _seconds, _nanoseconds }.
  if (typeof v === 'object' && v._seconds) return new Date(v._seconds * 1000).toLocaleString('en-IN')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function AdminReports() {
  const [kind, setKind] = useState('bookings')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [downloading, setDownloading] = useState(null)

  const range = {}
  if (from) range.from = from
  if (to) range.to = to

  const summary = useQuery({
    queryKey: ['report-summary', from, to],
    queryFn: () => reportsService.summary(range)
  })

  const report = useQuery({
    queryKey: ['report', kind, from, to],
    queryFn: () => reportsService.get(kind, range)
  })

  const rows = report.data?.data ?? []
  const columns = rows.length ? Object.keys(rows[0]) : []

  const handleDownload = async (format) => {
    setDownloading(format)
    try {
      await reportsService.download(kind, format, range)
      toast.success(`${format.toUpperCase()} downloaded`)
    } catch (err) {
      toast.error(err.message || 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  const s = summary.data?.data

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Reports</h1>
            <p>Revenue, bookings, refunds and account activity — exportable as CSV, Excel or PDF.</p>
          </div>
        </div>

        {/* Summary tiles */}
        {s && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {[
              { label: 'Total bookings', value: s.totalBookings },
              { label: 'Cancelled', value: s.cancelledBookings },
              { label: 'Gross revenue', value: inr(s.grossRevenue) },
              { label: 'Net revenue', value: inr(s.netRevenue) },
              { label: 'Avg booking value', value: inr(s.averageBookingValue) },
              { label: 'Refunds pending', value: s.refundsPending }
            ].map((tile) => (
              <div key={tile.label} style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.55)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{tile.label}</div>
                <div style={{ fontSize: '21px', fontWeight: 800, color: 'hsl(var(--bc))', marginTop: '4px' }}>{tile.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginBottom: '18px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            REPORT
            <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))', minWidth: '150px' }}>
              {REPORTS.map((r) => <option key={r.kind} value={r.kind}>{r.label}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            FROM
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            TO
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }} />
          </label>

          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo('') }} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'transparent', color: 'hsl(var(--bc))', cursor: 'pointer', fontWeight: 600 }}>
              Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => handleDownload(f)}
                disabled={downloading !== null || report.isPending}
                style={{
                  padding: '9px 16px', borderRadius: '8px', border: 'none',
                  background: 'hsl(var(--p))', color: 'hsl(var(--pc))',
                  fontWeight: 700, fontSize: '13px',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.6 : 1
                }}
              >
                {downloading === f ? 'Preparing…' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', overflow: 'hidden' }}>
          <DataPanel
            loading={report.isPending}
            error={report.error?.message}
            onRetry={report.refetch}
            isEmpty={rows.length === 0}
            emptyText="No records for the selected period."
          >
            {/* Wide tables scroll inside their own container so the page never
                scrolls horizontally. */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--b2))' }}>
                    {columns.map((c) => (
                      <th key={c} style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: 'hsl(var(--bc) / 0.7)', whiteSpace: 'nowrap' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((row, i) => (
                    <tr key={row.bookingId || row.refundId || row.userId || row.vendorId || i} style={{ borderTop: '1px solid hsl(var(--b3))' }}>
                      {columns.map((c) => (
                        <td key={c} style={{ padding: '10px 14px', color: 'hsl(var(--bc) / 0.85)', whiteSpace: 'nowrap' }}>{cellValue(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 200 && (
              <p style={{ margin: 0, padding: '10px 14px', fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', borderTop: '1px solid hsl(var(--b3))' }}>
                Showing the first 200 of {rows.length} rows — export for the full set.
              </p>
            )}
          </DataPanel>
        </div>
      </div>
    </AdminLayout>
  )
}
