import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { refundsAdminService } from '../services/platformAdminService'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const STATUSES = ['', 'requested', 'approved', 'processing', 'completed', 'rejected', 'failed']

// Stored as the bare custom property so the alpha can be composed inside
// hsl(): `hsl(var(--wa) / 0.15)` is valid, `hsl(var(--wa)) / 0.15` is not.
const STATUS_VAR = {
  requested: '--wa',
  approved: '--in',
  processing: '--in',
  completed: '--su',
  rejected: '--er',
  failed: '--er'
}

const statusColor = (status, alpha) => {
  const v = STATUS_VAR[status] ?? '--bc'
  return alpha === undefined ? `hsl(var(${v}))` : `hsl(var(${v}) / ${alpha})`
}

// Mirrors the server's transition table so the UI never offers an action the
// backend will reject with a 409.
const ACTIONS = {
  requested: [
    { key: 'approve', label: 'Approve' },
    { key: 'reject', label: 'Reject', needsNote: true }
  ],
  approved: [
    { key: 'process', label: 'Issue refund' },
    { key: 'reject', label: 'Reject', needsNote: true }
  ],
  processing: [
    { key: 'complete', label: 'Confirm settled' },
    { key: 'fail', label: 'Mark failed', needsNote: true }
  ],
  failed: [{ key: 'process', label: 'Retry' }],
  completed: [],
  rejected: []
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function AdminRefunds() {
  const confirm = useConfirm()
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState(null)
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin-refunds', status],
    queryFn: () => refundsAdminService.list(status || undefined)
  })

  const refunds = data?.data ?? []

  const runAction = async (refund, action) => {
    let note
    if (action.needsNote) {
      // The customer reads this, so it is collected in a real field with the
      // required-check in the dialog rather than in window.prompt, which some
      // browsers decline to show at all.
      const result = await confirm({
        title: action.label,
        message: `Give a reason for "${action.label}". The customer will see this.`,
        confirmLabel: action.label,
        requireReason: true,
        reasonPlaceholder: 'Reason the customer will see…'
      })
      if (!result) return
      note = result.reason
    }

    setBusyId(refund.id)
    try {
      await refundsAdminService.act(refund.id, action.key, note)
      await queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })
      toast.success(`${action.label} — done`)
    } catch (err) {
      // Gateway failures carry a code; surface the real reason, not a generic one.
      toast.error(err.message || `${action.label} failed`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Refunds</h1>
            <p>Approve, issue and confirm refunds. Issuing calls the payment gateway; completion requires the gateway to confirm settlement.</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginRight: '8px' }}>STATUS</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === '' ? 'All' : s}</option>)}
          </select>
        </div>

        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', overflow: 'hidden' }}>
          <DataPanel
            loading={isPending}
            error={error?.message}
            onRetry={refetch}
            isEmpty={refunds.length === 0}
            emptyText="No refunds match this filter."
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '820px' }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--b2))' }}>
                    {['Refund', 'Booking', 'Status', 'Gross', 'Fee', 'Refund', 'Gateway ref', 'Actions'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: 'hsl(var(--bc) / 0.7)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid hsl(var(--b3))' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.refundId}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{r.bookingId || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: statusColor(r.status, 0.15), color: statusColor(r.status), border: `1px solid ${statusColor(r.status, 0.5)}` }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{inr(r.grossAmount)}</td>
                      <td style={{ padding: '10px 14px' }}>{inr(r.cancellationFee)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{inr(r.refundAmount)}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', whiteSpace: 'nowrap' }}>{r.gatewayRefundId || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {(ACTIONS[r.status] || []).length === 0
                          ? <span style={{ color: 'hsl(var(--bc) / 0.4)', fontSize: '12px' }}>No actions</span>
                          : (ACTIONS[r.status] || []).map((a) => (
                            <button
                              key={a.key}
                              onClick={() => runAction(r, a)}
                              disabled={busyId === r.id}
                              style={{
                                marginRight: '6px', padding: '6px 12px', borderRadius: '6px',
                                border: '1px solid hsl(var(--b3))',
                                background: a.needsNote ? 'transparent' : 'hsl(var(--p))',
                                color: a.needsNote ? 'hsl(var(--bc))' : 'hsl(var(--pc))',
                                fontWeight: 700, fontSize: '12px',
                                cursor: busyId === r.id ? 'not-allowed' : 'pointer',
                                opacity: busyId === r.id ? 0.5 : 1
                              }}
                            >
                              {busyId === r.id ? '…' : a.label}
                            </button>
                          ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>
        </div>
      </div>
    </AdminLayout>
  )
}
