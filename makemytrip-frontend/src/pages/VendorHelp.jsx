import { useState } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'

const VendorHelp = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [desc, setDesc] = useState('')
  const [ticketStatus, setTicketStatus] = useState('')

  const faqs = [
    { q: 'How long does hotel listing approval take?', a: 'Standard listings are audited and authorized by system admins within 12-24 hours. You will receive an alert as soon as the status shifts to APPROVED.' },
    { q: 'Can I add multiple room configurations?', a: 'Yes. Locate your listing in "My Hotels", click the Rooms option, and select "Add Room Type" to configure separate occupancies, prices, and amenities.' },
    { q: 'What is the platform commission rate?', a: 'MakeMyTrip Vendor platform commission defaults to a flat 10% per completed reservation transaction, settled automatically at checkout.' },
    { q: 'How do I edit active calendar blockouts?', a: 'Open the specific hotel rooms list, select manage availability, and toggle dates on the calendar timeline to manually restrict/blockout bookings.' }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTicketSubmit = (e) => {
    e.preventDefault()
    setTicketStatus('Support query submitted to administrators. ID: VEN-SUP-' + Math.floor(Math.random() * 90000 + 10000))
    setSubject('')
    setDesc('')
    setTimeout(() => setTicketStatus(''), 5000)
  }

  return (
    <VendorLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 0' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Help & Support Center
          </h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Learn inventory management rules, read policy documentation, or reach out directly to platform administrators.
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search guides, policies, common FAQs..."
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

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <HelpCard icon="fas fa-hotel" title="Inventory Guides" desc="Learn how to add listings, room options, prices, and upload premium photos." />
          <HelpCard icon="fas fa-calendar-alt" title="Reservation Sync" desc="Managing customer check-ins, cancel regulations, and calendar blockouts." />
          <HelpCard icon="fas fa-file-invoice-dollar" title="Settlements & Pay" desc="Settlement frequency, transaction reports, commission parameters, and taxes." />
          <HelpCard icon="fas fa-shield-alt" title="Account Standards" desc="MFA security setup, profile revisions, and terms of service specifications." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* FAQ Accordion */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Common Questions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFaqs.map((faq, index) => (
                <div key={index} style={{ borderBottom: index < filteredFaqs.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '12px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)', display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: 'hsl(var(--su))' }}>Q:</span> {faq.q}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '22px' }}>
                    {faq.a}
                  </div>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '13px' }}>
                  No matching support articles found.
                </div>
              )}
            </div>
          </div>

          {/* Raise query with Admin */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Contact Support Administrators
            </h3>

            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Message Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST verification request delay"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Query Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide registration details, GST references, or active reservation issues..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
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
                  background: 'hsl(var(--su))',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px hsl(var(--su) / 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Submit Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </VendorLayout>
  )
}

const HelpCard = ({ icon, title, desc }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'hsl(var(--su))'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.transform = 'none'
  }}>
    <div style={{ width: '36px', height: '36px', background: 'hsl(var(--su) / 0.15)', color: 'hsl(var(--su))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', marginBottom: '14px' }}>
      <i className={icon}></i>
    </div>
    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{title}</h4>
    <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</p>
  </div>
)

export default VendorHelp
