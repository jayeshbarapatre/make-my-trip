import { useState } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'

const AdminSecurity = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows 11 PC - Chrome', ip: '192.168.1.15', location: 'Mumbai, India', current: true },
    { id: 2, device: 'iPhone 15 - Safari', ip: '103.241.12.89', location: 'Delhi, India', current: false },
    { id: 3, device: 'MacBook Pro - Chrome', ip: '172.56.9.110', location: 'Bengaluru, India', current: false }
  ])

  const handleRevokeSession = (sessionId) => {
    setSessions(sessions.filter(session => session.id !== sessionId))
  }

  const loginLogs = [
    { time: '2026-06-03 13:45:10', ip: '192.168.1.15', status: 'Success', action: 'Dashboard Login' },
    { time: '2026-06-03 09:12:05', ip: '103.241.12.89', status: 'Success', action: 'API Access' },
    { time: '2026-06-02 18:22:45', ip: '192.168.1.15', status: 'Success', action: 'Change Password' },
    { time: '2026-06-02 14:02:18', ip: '172.56.9.110', status: 'Success', action: 'Session Refresh' },
    { time: '2026-06-01 10:30:11', ip: '89.165.22.45', status: 'Failed', action: 'Invalid Password Attempt' }
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 0' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Security & Authentication
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Monitor admin account access logs, revoke active sessions, and configure security metrics.
          </p>
        </div>

        {/* Security Metrics and Active Sessions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Left: 2FA & Account Status */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Multi-Factor Authentication
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>Two-Step Verification (2FA)</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Require verification code from authenticator app.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Account Audit Metrics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password Age</span>
                  <span style={{ color: 'var(--success)', fontWeight: '600' }}>Updated 3 days ago</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password Strength</span>
                  <span style={{ color: 'var(--success)', fontWeight: '600' }}>Excellent</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Failed Login Restricter</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Enabled (5 attempts lock)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Active Sessions */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Active Sessions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sessions.map(session => (
                <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', background: 'var(--bg-body)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {session.device} {session.current && <span style={{ fontSize: '10px', color: 'var(--success)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Current</span>}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      {session.ip} • {session.location}
                    </div>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      style={{
                        background: 'transparent',
                        color: 'var(--danger)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 1 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No other active sessions.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Logs Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Login & Activity Logs
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '600' }}>IP Address</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Action Performed</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '12px 8px' }}>{log.time}</td>
                    <td style={{ padding: '12px 8px' }}>{log.ip}</td>
                    <td style={{ padding: '12px 8px' }}>{log.action}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        color: log.status === 'Success' ? 'var(--success)' : 'var(--danger)',
                        background: log.status === 'Success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontSize: '11px'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSecurity
