import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Header from '../components/Common/Header';
import Footer from '../components/Common/Footer';
import './SupportPage.css';

export default function SupportPage() {
  const toast = useToast();
  
  // Local tickets state for dynamic interaction
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-84920',
      category: 'Refunds',
      subject: 'Refund status for Flight BOM-DEL (Booking ID: MMT8392019)',
      description: 'The flight was cancelled by airline. Requested refund status update.',
      status: 'In Progress',
      date: '2026-06-02'
    }
  ]);

  // Form states
  const [category, setCategory] = useState('Flights');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Customer Support & Help Center - MakeMyTrip';
    window.scrollTo(0, 0);
  }, []);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all fields before submitting.', 'Validation Error');
      return;
    }

    const newTicketId = 'TKT-' + Math.floor(Math.random() * 90000 + 10000);
    const newTicket = {
      id: newTicketId,
      category,
      subject: subject.trim(),
      description: description.trim(),
      status: 'Open',
      date: new Date().toISOString().split('T')[0]
    };

    setTickets([newTicket, ...tickets]);
    setSubject('');
    setDescription('');
    toast.success(`Support Ticket ${newTicketId} has been successfully created! Our support team will review it shortly.`, 'Congratulations');
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="support-page-wrapper">
      <Header />
      
      <main className="support-main-container">
        {/* Support Hero Header */}
        <section className="support-hero">
          <div className="support-hero-content">
            <h1 className="support-title">How can we help you today?</h1>
            <p className="support-subtitle">
              Raise a support ticket, track refund requests, or connect with our customer care representatives.
            </p>
          </div>
        </section>

        {/* Quick Assist Cards */}
        <section className="assist-grid">
          <div className="assist-card">
            <div className="assist-icon bg-info-tint">✈️</div>
            <h3>Flight Queries</h3>
            <p>Issues with check-in, delays, reschedule, or baggage allowance details.</p>
          </div>
          <div className="assist-card">
            <div className="assist-icon bg-success-tint">🏨</div>
            <h3>Hotel Help</h3>
            <p>Amend stay details, cancellation guidelines, or request late check-ins.</p>
          </div>
          <div className="assist-card">
            <div className="assist-icon bg-warning-tint">💳</div>
            <h3>Payment & Refunds</h3>
            <p>Track refund status, double debit assistance, or payment failures.</p>
          </div>
          <div className="assist-card">
            <div className="assist-icon bg-primary-tint">🛡️</div>
            <h3>Account Settings</h3>
            <p>Reset password, update mobile/email, or manage security preferences.</p>
          </div>
        </section>

        {/* Bottom Split Layout: Form & Ticket History */}
        <div className="support-split-layout">
          {/* Support Ticket Submission Form */}
          <section className="support-card form-section">
            <h2>Create Support Ticket</h2>
            <p className="section-desc">Submit your query directly to our dedicated customer support desk.</p>
            
            <form onSubmit={handleTicketSubmit} className="support-form">
              <div className="form-group">
                <label htmlFor="category">Query Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="support-select"
                >
                  <option value="Flights">Flights & Aviation</option>
                  <option value="Hotels">Hotels & Stays</option>
                  <option value="Cabs">Cabs & Car Rentals</option>
                  <option value="Buses">Buses & Coaches</option>
                  <option value="Refunds">Refunds & Transactions</option>
                  <option value="Account">Account Profile & Security</option>
                  <option value="General">Other General Queries</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  type="text"
                  placeholder="e.g. Flight ticket not received, need cabin baggage info"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="support-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Detailed Description</label>
                <textarea
                  id="description"
                  rows="5"
                  placeholder="Please describe your problem in detail, including booking references or flight numbers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="support-textarea"
                  required
                />
              </div>

              <button type="submit" className="support-btn-submit">
                Submit Support Ticket
              </button>
            </form>
          </section>

          {/* Active Tickets Tracker */}
          <section className="support-card tracker-section">
            <div className="tracker-header">
              <h2>My Support Tickets</h2>
              <span className="ticket-count-badge">{tickets.length} Total</span>
            </div>
            <p className="section-desc">Search and track status updates for tickets submitted by you.</p>

            <div className="tracker-search-container">
              <input
                type="text"
                placeholder="Search ticket subject or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tracker-search-input"
              />
            </div>

            <div className="ticket-history-list">
              {filteredTickets.map((t) => (
                <div key={t.id} className="ticket-item-card">
                  <div className="ticket-item-header">
                    <span className="ticket-item-id">{t.id}</span>
                    <span className={`status-badge status-${t.status.toLowerCase().replace(' ', '-')}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="ticket-item-category">Category: {t.category}</div>
                  <h4 className="ticket-item-subject">{t.subject}</h4>
                  <p className="ticket-item-desc">{t.description}</p>
                  <div className="ticket-item-footer">
                    <span>Submitted on: {t.date}</span>
                  </div>
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="empty-tickets-state">
                  <p>No active support tickets found matching your query.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
