import { useState } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'

const AdminHelp = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')
  const [ticketStatus, setTicketStatus] = useState('')

  const faqs = [
    { q: 'How do I approve a new vendor registration?', a: 'Navigate to Management -> Vendors in the sidebar. Locate the registration pending approval, click Details, verify tax settings, and select Approve to trigger credential dispatch.' },
    { q: 'How is seat availability synchronized for flights?', a: 'Flight sync relies on webhook integrations with carrier GDS platforms. If a sync fails, navigate to System Logs under API Health, identify the payload, and click Re-trigger webhook.' },
    { q: 'Can I restrict vendor listings globally?', a: 'Yes. Navigate to Account settings under System settings. Locate system status configurations and toggle listings authorization to admin review.' },
    { q: 'How do I generate a weekly revenue report?', a: 'Go to Dashboard -> Audience Overview. Select the date range or export format (PDF/CSV) from the reporting settings dropdown to download the ledger.' }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTicketSubmit = (e) => {
    e.preventDefault()
    setTicketStatus('Support ticket submitted successfully! Reference: TKT-' + Math.floor(Math.random() * 90000 + 10000))
    setTicketSubject('')
    setTicketDesc('')
    setTimeout(() => setTicketStatus(''), 5000)
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 0' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Admin Help Center
          </h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Find operating guides, troubleshooting documentation, or raise support tickets with developers.
          </p>

          {/* Premium Search Bar */}
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search help topics, FAQs, tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 44px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
            />
            <i className="fas fa-search" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}></i>
          </div>
        </div>

        {/* Documentation Categories Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <DocCard icon="fas fa-book-open" title="Admin Onboarding" desc="Learn layout controls, metrics summaries, and sidebar navigation guides." />
          <DocCard icon="fas fa-hotel" title="Stays & Flight Approvals" desc="Detailed flows for auditing vendor rooms, schedules, and active bookings." />
          <DocCard icon="fas fa-shield-alt" title="Account Security & MFA" desc="Managing staff access logs, security configurations, and credential rotations." />
          <DocCard icon="fas fa-cogs" title="API Settings & Health" desc="Configure webhook parameters, environment payloads, and check routing health." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* FAQs List */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Common Troubleshoots
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFaqs.map((faq, index) => (
                <div key={index} style={{ borderBottom: index < filteredFaqs.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '12px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)', display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: 'hsl(var(--p))' }}>Q:</span> {faq.q}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '22px' }}>
                    {faq.a}
                  </div>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '13px' }}>
                  No matching help articles found.
                </div>
              )}
            </div>
          </div>

          {/* Developer Support Ticket Form */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Contact Developer Support
            </h3>

            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Ticket Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight schedule sync delay issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Problem Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue with API payloads or system dashboard logs in detail..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {ticketStatus && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {ticketStatus}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'hsl(var(--p))',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(237, 74, 41, 0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

const DocCard = ({ icon, title, desc }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'hsl(var(--p))'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.transform = 'none'
  }}>
    <div style={{ width: '36px', height: '36px', background: 'hsl(var(--p) / 0.15)', color: 'hsl(var(--p))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', marginBottom: '14px' }}>
      <i className={icon}></i>
    </div>
    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{title}</h4>
    <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</p>
  </div>
)

export default AdminHelp
