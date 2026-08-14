import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { reportsService } from '../services/platformAdminService'
import { cellValue, filterRows, paginate } from './reportTable'
import './AdminFlights.css'

const REPORTS = [
  { kind: 'bookings', label: 'Bookings' },
  { kind: 'revenue', label: 'Revenue' },
  { kind: 'refunds', label: 'Refunds' },
  { kind: 'users', label: 'Users' },
  { kind: 'vendors', label: 'Vendors' }
]

const FORMATS = ['csv', 'xlsx', 'pdf']

const PAGE_SIZES = [25, 50, 100]

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const pagerStyle = (disabled) => ({
  padding: '7px 14px',
  borderRadius: '8px',
  border: '1px solid hsl(var(--b3))',
  background: disabled ? 'transparent' : 'hsl(var(--b2))',
  color: disabled ? 'hsl(var(--bc) / 0.35)' : 'hsl(var(--bc))',
  fontWeight: 700,
  fontSize: '12.5px',
  cursor: disabled ? 'not-allowed' : 'pointer'
})

export default function AdminReports() {
  const [kind, setKind] = useState('bookings')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Typing re-filters every row on the page, so the work is deferred until the
  // user stops rather than run on each keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Every control that changes which rows are listed goes through here, because
  // narrowing a 400-row report while on page 9 would otherwise land on a page
  // that no longer exists and read as an empty table. Done in the handlers
  // rather than an effect so there is no second render to correct the first.
  const reset = (apply) => (value) => { apply(value); setPage(1) }

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

  const rows = useMemo(() => report.data?.data ?? [], [report.data])
  const columns = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows])

  const filtered = useMemo(() => filterRows(rows, columns, query), [rows, columns, query])
  const { currentPage, totalPages, start, visible } = paginate(filtered, page, pageSize)

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
            <select value={kind} onChange={(e) => reset(setKind)(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))', minWidth: '150px' }}>
              {REPORTS.map((r) => <option key={r.kind} value={r.kind}>{r.label}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            FROM
            <input type="date" value={from} max={to || undefined} onChange={(e) => reset(setFrom)(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            TO
            <input type="date" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }}>
            SEARCH
            <input
              type="search"
              value={search}
              onChange={(e) => reset(setSearch)(e.target.value)}
              placeholder="Name, email, booking ID, city…"
              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))', minWidth: '230px' }}
            />
          </label>

          {(from || to || search) && (
            <button onClick={() => { setFrom(''); setTo(''); setSearch(''); setPage(1) }} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'transparent', color: 'hsl(var(--bc))', cursor: 'pointer', fontWeight: 600 }}>
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

        {/* The export runs on the server from the date range alone; the search
            is applied in the browser to rows already fetched. Saying so beats
            handing someone a CSV that quietly contains more than they filtered
            down to. */}
        {query && filtered.length !== rows.length && (
          <p style={{ margin: '-6px 0 16px', fontSize: '12.5px', color: 'hsl(var(--bc) / 0.6)' }}>
            The search filters this table only — CSV, Excel and PDF exports still cover all {rows.length} rows for the selected dates.
          </p>
        )}

        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', overflow: 'hidden' }}>
          <DataPanel
            loading={report.isPending}
            error={report.error?.message}
            onRetry={report.refetch}
            isEmpty={filtered.length === 0}
            emptyText={query ? `Nothing matches “${query}”.` : 'No records for the selected period.'}
            emptyHint={query ? 'The search looks across every column of this report. Try a shorter term, or clear it.' : undefined}
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
                  {visible.map((row, i) => (
                    <tr key={row.bookingId || row.refundId || row.userId || row.vendorId || start + i} style={{ borderTop: '1px solid hsl(var(--b3))' }}>
                      {columns.map((c) => (
                        <td key={c} style={{ padding: '10px 14px', color: 'hsl(var(--bc) / 0.85)', whiteSpace: 'nowrap' }}>{cellValue(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '12px 14px', borderTop: '1px solid hsl(var(--b3))' }}>
              <span style={{ fontSize: '12.5px', color: 'hsl(var(--bc) / 0.6)' }}>
                Showing {start + 1}–{start + visible.length} of {filtered.length}
                {query && rows.length !== filtered.length ? ` (filtered from ${rows.length})` : ''}
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'hsl(var(--bc) / 0.6)' }}>
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => reset(setPageSize)(Number(e.target.value))}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}
                >
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  style={pagerStyle(currentPage <= 1)}
                >
                  Previous
                </button>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'hsl(var(--bc) / 0.75)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  style={pagerStyle(currentPage >= totalPages)}
                >
                  Next
                </button>
              </div>
            </div>
          </DataPanel>
        </div>
      </div>
    </AdminLayout>
  )
}
