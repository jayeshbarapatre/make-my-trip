import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { supportAdminService } from '../services/platformAdminService'
import './AdminFlights.css'

const STATUSES = ['', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']

const STATUS_COLOR = {
  open: 'hsl(var(--wa))',
  in_progress: 'hsl(var(--in))',
  waiting_on_customer: 'hsl(var(--in))',
  resolved: 'hsl(var(--su))',
  closed: 'hsl(var(--bc) / 0.5)'
}

// Matches the server's transition table.
const NEXT_STATUS = {
  open: ['in_progress', 'waiting_on_customer', 'resolved', 'closed'],
  in_progress: ['waiting_on_customer', 'resolved', 'closed'],
  waiting_on_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: []
}

const PRIORITY_COLOR = { urgent: 'hsl(var(--er))', high: 'hsl(var(--wa))', normal: 'hsl(var(--bc) / 0.6)', low: 'hsl(var(--bc) / 0.45)' }

export default function AdminSupport() {
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState(null)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['support-tickets', status],
    queryFn: () => supportAdminService.list(status || undefined)
  })

  const tickets = data?.data ?? []
  const active = tickets.find((t) => t.id === openId) ?? null

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['support-tickets'] })

  const sendReply = async () => {
    if (!reply.trim()) return toast.error('Write a reply first')
    setBusy(true)
    try {
      await supportAdminService.reply(active.id, reply)
      setReply('')
      await refresh()
      toast.success('Reply sent')
    } catch (err) {
      toast.error(err.message || 'Could not send the reply')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (next) => {
    setBusy(true)
    try {
      await supportAdminService.setStatus(active.id, next)
      await refresh()
      toast.success(`Moved to ${next.replace('_', ' ')}`)
    } catch (err) {
      toast.error(err.message || 'Could not update the ticket')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Support</h1>
            <p>Customer tickets. Replying moves a ticket to “waiting on customer”; a customer reply moves it back.</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginRight: '8px' }}>STATUS</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setOpenId(null) }} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === '' ? 'All' : s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <DataPanel loading={isPending} error={error?.message} onRetry={refetch} isEmpty={tickets.length === 0} emptyText="No tickets match this filter.">
          <div style={{ display: 'grid', gap: '12px' }}>
            {tickets.map((t) => {
              const isOpen = t.id === openId
              return (
                <div key={t.id} style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setOpenId(isOpen ? null : t.id); setReply('') }}
                    aria-expanded={isOpen}
                    style={{ width: '100%', textAlign: 'left', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'hsl(var(--bc))' }}>{t.subject}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginTop: '3px' }}>
                        {t.ticketNumber} · {t.userEmail} · {t.category}
                        {t.bookingId ? ` · ${t.bookingId}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: PRIORITY_COLOR[t.priority] }}>{String(t.priority || '').toUpperCase()}</span>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, color: STATUS_COLOR[t.status], border: `1px solid ${STATUS_COLOR[t.status]}` }}>
                        {String(t.status).replace(/_/g, ' ')}
                      </span>
                    </div>
                  </button>

                  {isOpen && active && (
                    <div style={{ borderTop: '1px solid hsl(var(--b3))', padding: '16px 18px' }}>
                      <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                        {(active.messages || []).map((m, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '10px 12px', borderRadius: '10px', fontSize: '13px',
                              background: m.from === 'support' ? 'hsl(var(--p) / 0.1)' : 'hsl(var(--b2))',
                              marginLeft: m.from === 'support' ? '32px' : 0,
                              marginRight: m.from === 'support' ? 0 : '32px'
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--bc) / 0.55)', marginBottom: '3px' }}>
                              {m.from === 'support' ? 'Support' : 'Customer'} · {new Date(m.at).toLocaleString('en-IN')}
                            </div>
                            {m.body}
                          </div>
                        ))}
                      </div>

                      {active.status !== 'closed' ? (
                        <>
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={3}
                            placeholder="Write a reply to the customer…"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button onClick={sendReply} disabled={busy} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'hsl(var(--p))', color: 'hsl(var(--pc))', fontWeight: 700, fontSize: '13px', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                              {busy ? 'Sending…' : 'Send reply'}
                            </button>
                            {(NEXT_STATUS[active.status] || []).map((n) => (
                              <button key={n} onClick={() => changeStatus(n)} disabled={busy} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', background: 'transparent', color: 'hsl(var(--bc))', fontWeight: 600, fontSize: '13px', cursor: busy ? 'not-allowed' : 'pointer' }}>
                                {n.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>This ticket is closed. The customer must open a new one to continue.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DataPanel>
      </div>
    </AdminLayout>
  )
}
