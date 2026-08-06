import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { vendorRequestsService } from '../services/platformAdminService'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const STATUSES = ['', 'pending', 'changes_requested', 'approved', 'rejected']

const STATUS_COLOR = {
  pending: 'hsl(var(--wa))',
  changes_requested: 'hsl(var(--in))',
  approved: 'hsl(var(--su))',
  rejected: 'hsl(var(--er))'
}

// Only offer decisions the backend will accept for the current status.
const DECISIONS = {
  pending: [
    { key: 'approve', label: 'Approve' },
    { key: 'request-changes', label: 'Request changes', needsNote: true },
    { key: 'reject', label: 'Reject', needsNote: true }
  ],
  changes_requested: [
    { key: 'approve', label: 'Approve' },
    { key: 'reject', label: 'Reject', needsNote: true }
  ],
  approved: [],
  rejected: []
}

export default function AdminVendorRequests() {
  const confirm = useConfirm()
  const [status, setStatus] = useState('pending')
  const [busyId, setBusyId] = useState(null)
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['vendor-requests', status],
    queryFn: () => vendorRequestsService.list(status || undefined)
  })

  const requests = data?.data ?? []

  const decide = async (req, decision) => {
    let note
    if (decision.needsNote) {
      // The applicant reads this, so it is collected in a real field with the
      // required-check in the dialog rather than in window.prompt.
      const result = await confirm({
        title: decision.label,
        message: `Give a reason for "${decision.label}". The applicant will see this.`,
        confirmLabel: decision.label,
        requireReason: true,
        reasonPlaceholder: 'Reason the applicant will see…'
      })
      if (!result) return
      note = result.reason
    }

    setBusyId(req.id)
    try {
      await vendorRequestsService.decide(req.id, decision.key, note)
      await queryClient.invalidateQueries({ queryKey: ['vendor-requests'] })
      toast.success(
        decision.key === 'approve'
          ? 'Approved — the applicant now has vendor access'
          : `${decision.label} recorded`
      )
    } catch (err) {
      toast.error(err.message || 'Could not record the decision')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Vendor Applications</h1>
            <p>Approving an application grants the vendor role and creates their vendor ID in the same transaction.</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginRight: '8px' }}>STATUS</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === '' ? 'All' : s.replace('_', ' ')}</option>)}
          </select>
        </div>

        <DataPanel
          loading={isPending}
          error={error?.message}
          onRetry={refetch}
          isEmpty={requests.length === 0}
          emptyText="No applications match this filter."
        >
          <div style={{ display: 'grid', gap: '14px' }}>
            {requests.map((r) => (
              <div key={r.id} style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))' }}>{r.businessName}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>
                      {r.userEmail}{r.contactPhone ? ` · ${r.contactPhone}` : ''}{r.businessType ? ` · ${r.businessType}` : ''}
                    </p>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}` }}>
                    {String(r.status).replace('_', ' ')}
                  </span>
                </div>

                <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', margin: '14px 0 0' }}>
                  {r.gstNumber && (
                    <div><dt style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--bc) / 0.5)' }}>GST</dt><dd style={{ margin: 0, fontSize: '13px' }}>{r.gstNumber}</dd></div>
                  )}
                  {r.vendorId && (
                    <div><dt style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--bc) / 0.5)' }}>VENDOR ID</dt><dd style={{ margin: 0, fontSize: '13px' }}>{r.vendorId}</dd></div>
                  )}
                  {r.address && (
                    <div><dt style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--bc) / 0.5)' }}>ADDRESS</dt><dd style={{ margin: 0, fontSize: '13px' }}>{r.address}</dd></div>
                  )}
                </dl>

                {(r.rejectionReason || r.changeRequestNote) && (
                  <p style={{ margin: '12px 0 0', padding: '10px 12px', borderRadius: '8px', background: 'hsl(var(--b2))', fontSize: '13px', color: 'hsl(var(--bc) / 0.8)' }}>
                    <strong>Note to applicant:</strong> {r.rejectionReason || r.changeRequestNote}
                  </p>
                )}

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(DECISIONS[r.status] || []).length === 0
                    ? <span style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.45)' }}>This application is closed.</span>
                    : (DECISIONS[r.status] || []).map((d) => (
                      <button
                        key={d.key}
                        onClick={() => decide(r, d)}
                        disabled={busyId === r.id}
                        style={{
                          padding: '8px 16px', borderRadius: '8px',
                          border: d.needsNote ? '1px solid hsl(var(--b3))' : 'none',
                          background: d.needsNote ? 'transparent' : 'hsl(var(--p))',
                          color: d.needsNote ? 'hsl(var(--bc))' : 'hsl(var(--pc))',
                          fontWeight: 700, fontSize: '13px',
                          cursor: busyId === r.id ? 'not-allowed' : 'pointer',
                          opacity: busyId === r.id ? 0.5 : 1
                        }}
                      >
                        {busyId === r.id ? '…' : d.label}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
      </div>
    </AdminLayout>
  )
}
