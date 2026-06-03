import React, { useState, useEffect, useMemo } from 'react';
import { cmsService } from '../services/cmsService';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './FaqPage.css';

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Category state
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    document.title = 'Frequently Asked Questions - MakeMyTrip';
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await cmsService.listFaqs();
      setFaqs(response.data?.data || []);
    } catch (err) {
      console.warn('Error fetching FAQs from database, loading dynamic fallbacks.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Pre-coded structured fallback FAQs mapped to categories
  const fallbackFaqs = [
    { id: 'f1', category: 'Flights', question: 'How do I cancel my flight booking?', answer: 'You can cancel your flight ticket directly in the "My Trips" dashboard. Locate your active booking, click on "Cancel Flight", review the refund details, and submit. Refunds will process back to the original payment source within 3-5 working days.' },
    { id: 'f2', category: 'Flights', question: 'What is the check-in baggage allowance?', answer: 'Allowance depends strictly on the airline and ticket class. Typically, domestic flights allow 15kg check-in baggage and 7kg cabin baggage per adult passenger. Check your confirmation ticket email for precise details.' },
    { id: 'h1', category: 'Hotels', question: 'Is free hotel cancellation available?', answer: 'Yes! Free cancellations depend on the specific hotel rules and room package you choose during checkout. Most stays support free cancellation up to 24 or 48 hours prior to the check-in date.' },
    { id: 'h2', category: 'Hotels', question: 'What documents are required at hotel check-in?', answer: 'All adult guests must show a government-issued photo ID (Aadhaar card, Passport, Driving License, Voter ID) at check-in. PAN cards are generally not accepted as identity proof by hotels.' },
    { id: 'b1', category: 'Bookings', question: 'Where can I find my travel tickets?', answer: 'Once your booking is confirmed, travel tickets are instantly sent to your registered email and mobile number. You can also view, download PDF vouchers, or cancel tickets directly under the "My Trips" profile tab.' },
    { id: 'b2', category: 'Bookings', question: 'Can I change my passenger details after booking?', answer: 'Minor spelling corrections in names are supported depending on airline/hotel policies. Please call our 24/7 customer support center or submit an inquiry via the "Contact Us" form to request corrections.' },
    { id: 'p1', category: 'Payments', question: 'What payment options does MakeMyTrip support?', answer: 'We accept Credit/Debit cards (Visa, MasterCard, RuPay), UPI (PhonePe, GPay, Paytm), NetBanking, and major mobile wallets. All transactions are fully encrypted.' }
  ];

  // Merge database FAQs if they exist, or use default fallback FAQs
  const activeFaqList = useMemo(() => {
    if (faqs && faqs.length > 0) {
      // Add default "All" category if not present in DB entries
      return faqs.map((f, idx) => ({
        id: f.id || `db-${idx}`,
        category: f.category || 'General',
        question: f.question,
        answer: f.answer
      }));
    }
    return fallbackFaqs;
  }, [faqs]);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(['All']);
    activeFaqList.forEach(f => {
      if (f.category) list.add(f.category);
    });
    return Array.from(list);
  }, [activeFaqList]);

  // Filter & search logic
  const filteredFaqs = useMemo(() => {
    return activeFaqList.filter(faq => {
      const matchCategory = activeCategory === 'All' || faq.category === activeCategory;
      const matchSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeFaqList, activeCategory, searchQuery]);

  // Refresh AOS whenever the filtered list updates to prevent animation lockouts (invisible cards)
  useEffect(() => {
    AOS.refresh();
  }, [filteredFaqs]);

  if (loading) {
    return (
      <div className="faq-page flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="faq-page">
      <div className="faq-container">
        
        {/* Hero Section */}
        <header className="faq-hero-banner" data-aos="fade-up">
          <h1 className="faq-hero-title">Frequently Asked Questions</h1>
          <p className="faq-hero-sub">Find answers to common questions about bookings, flights, stays, payments, and cancellations.</p>
          
          {/* Real-time search bar */}
          <div className="faq-search-box">
            <span className="faq-search-icon">🔍</span>
            <input
              type="text"
              className="faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for questions (e.g. flight cancellation, baggage, etc.)"
            />
          </div>
        </header>

        {/* Categories Tab Strip */}
        <div className="faq-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`faq-tab-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setExpandedId(null);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordions List */}
        <section className="faq-list-sec">
          {filteredFaqs.length === 0 ? (
            <div className="faq-no-results">
              <p>No questions matched your search criteria. Please try another term!</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div 
                key={faq.id} 
                className={`faq-accordion-item${expandedId === faq.id ? ' active' : ''}`}
              >
                <button
                  className="faq-accordion-header"
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <span 
                    className="faq-chevron"
                    style={{
                      transform: expandedId === faq.id ? 'rotate(180deg)' : 'none',
                      background: expandedId === faq.id ? 'hsl(var(--p) / 0.12)' : 'hsl(var(--b3))',
                      color: expandedId === faq.id ? 'hsl(var(--p))' : 'hsl(var(--bc) / 0.6)',
                      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, color 0.3s'
                    }}
                  >
                    ▼
                  </span>
                </button>
                {expandedId === faq.id && (
                  <div 
                    className="faq-accordion-body" 
                    style={{ color: 'hsl(var(--bc))' }}
                    dangerouslySetInnerHTML={{ __html: faq.answer }} 
                  />
                )}
              </div>
            ))
          )}
        </section>

      </div>
    </div>
  );
}
