import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { cmsService } from '../services/cmsService';
import './CmsPageRenderer.css';

export default function CmsPageRenderer({ slug: propsSlug }) {
  const { slug: paramsSlug } = useParams();
  const slug = propsSlug || paramsSlug;
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Accordion active index for cancellation page
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Sticky legal nav active section
  const [activeLegalSection, setActiveLegalSection] = useState('section1');

  useEffect(() => {
    fetchPageData();
  }, [slug]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const response = await cmsService.getPageBySlug(slug);
      setPage(response.data?.data || null);
      setError('');
    } catch (err) {
      console.warn(`CMS page "${slug}" not found in database, loading dynamic frontend template.`);
      setPage(null);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // ── DYNAMIC PAGE TEMPLATE DATABASE ───────────────────────────────────
  const getPageTemplate = () => {
    switch (slug) {
      case 'investor-relations':
        return {
          title: 'Investor Relations',
          subtitle: 'Driving long-term value, innovation, and industry leading growth.',
          stats: [
            { num: '$4.2B', label: 'Market Capitalization' },
            { num: '$820M', label: 'FY25 Total Revenue' },
            { num: '+22%', label: 'Year-over-Year Growth' },
            { num: '12+', label: 'Global Offices' }
          ],
          cardsTitle: 'Investor Center',
          cards: [
            { icon: '📊', title: 'Financial Reports', desc: 'Access quarterly financial results, annual reports, and investor presentations.', meta: 'Updated Q4 FY25' },
            { icon: '🏛️', title: 'Corporate Governance', desc: 'Review board structures, ethical committees, corporate guidelines, and policies.', meta: 'Governance Code' },
            { icon: '📈', title: 'Stock Information', desc: 'Track stock charts, historical listings, share capital changes, and shareholder distributions.', meta: 'NASDAQ: MMYT' },
            { icon: '👥', title: 'Shareholders Center', desc: 'View dividend summaries, AGM schedules, and shareholder assistance resources.', meta: 'Investor Resources' }
          ]
        };

      case 'foundation':
        return {
          title: 'MakeMyTrip Foundation',
          subtitle: 'Empowering local communities, restoring cultural heritage, and driving eco-friendly tourism.',
          stats: [
            { num: '100K+', label: 'Trees Planted' },
            { num: '25+', label: 'Heritage Sites Restored' },
            { num: '50K+', label: 'Local Lives Empowered' },
            { num: '₹12Cr+', label: 'Direct CSR Funding' }
          ],
          cardsTitle: 'Our Impact Areas',
          cards: [
            { icon: '🏔️', title: 'Himalayan Waste Management', desc: 'Eliminating plastics and cleaning tourist routes across Ladakh, Himachal, and Uttarakhand.', meta: 'Eco-Protect' },
            { icon: '🏡', title: 'Local Ecotourism Support', desc: 'Training homestay owners and tour guides to create green livelihood opportunities.', meta: 'Empowerment' },
            { icon: '🏺', title: 'Heritage Site Care', desc: 'Partnering with restoration groups to protect monuments, lakes, and ancient structures.', meta: 'Conservation' },
            { icon: '🤝', title: 'Community Disaster Relief', desc: 'Providing support packages, medical kits, and rehabilitation funds during natural calamities.', meta: 'Social Safety' }
          ]
        };

      case 'newsroom':
        return {
          title: 'Newsroom & Media Hub',
          subtitle: 'Latest official press releases, product updates, and media announcements.',
          cardsTitle: 'Latest Press Releases',
          cards: [
            { icon: '🤖', title: 'MMT Launches Gen-AI Travel Guide', desc: 'Introducing dynamic voice-assisted travel planners powered by Google Cloud Gemini models.', meta: 'Published June 2, 2026' },
            { icon: '🚢', title: 'Cruises Module Added to Search', desc: 'Users can now book over 100 global cruise liners directly on the MakeMyTrip dashboard.', meta: 'Published May 28, 2026' },
            { icon: '🌿', title: 'Partnership for Green Hotels', desc: 'Certifying over 2,000 properties across India with verified eco-badges for responsible stays.', meta: 'Published May 15, 2026' },
            { icon: '💼', title: 'Enterprise Booking Suite Upgraded', desc: 'A major redesign of corporate booking platforms with instant approvals and smart calculators.', meta: 'Published May 08, 2026' }
          ]
        };

      case 'cancellation-refunds':
        return {
          title: 'Cancellations & Refunds',
          subtitle: 'Clear, transparent policies for flight, hotel, bus, and cab cancellations.',
          faqs: [
            { q: 'How do I cancel my flight ticket?', a: 'Go to the "My Trips" dashboard, select your active flight ticket, and click on "Cancel Booking". Refund details will be computed instantly, and money will be returned to the payment source within 3-5 business days.' },
            { q: 'What is the hotel cancellation window?', a: 'Hotel cancellation rules vary by room tier. Free cancellation is generally allowed up to 24-48 hours before check-in. Check the exact refund terms shown on your hotel voucher.' },
            { q: 'Can I get a refund for a missed train or bus?', a: 'Train cancellation rules conform strictly to Indian Railways IRCTC guidelines. Bus tickets cancelled before departure incur a small fee defined by the transport operator.' },
            { q: 'What is "MMT Free Cancellation Upgrade"?', a: 'During checkout, you can purchase the "Free Cancellation Upgrade" starting at ₹199, which allows zero penalty refunds up to 24 hours prior to travel for any reason.' }
          ]
        };

      case 'privacy-policy':
        return {
          title: 'Privacy Policy',
          subtitle: 'How we collect, protect, and handle your personal and financial information.',
          sections: [
            { id: 'section1', label: '1. Information Collection', content: 'We collect information you provide directly, such as passenger details, emails, contact numbers, and travel documents when booking tickets. We also capture browsing information via cookies to customize layouts and flights search.' },
            { id: 'section2', label: '2. Payment Security', content: 'All financial bookings, transaction cards, and UPI transfers are processed using PCI-DSS compliant secure vaults. MakeMyTrip does not store raw credit card CVV numbers.' },
            { id: 'section3', label: '3. Data Sharing', content: 'To fulfill bookings, passenger manifests must be shared with respective airlines, hotels, train operators, or bus agencies. We do not sell user travel behavior profiles to third-party advertisers.' },
            { id: 'section4', label: '4. Your User Rights', content: 'You can modify passenger listings, delete saved cards, or deactivate your MakeMyTrip profile directly inside user settings, or request full account deletion via privacy support.' }
          ]
        };

      case 'terms-of-service':
        return {
          title: 'Terms of Service',
          subtitle: 'Legal agreement governing your use of the MakeMyTrip platform.',
          sections: [
            { id: 'section1', label: '1. Acceptance of Terms', content: 'By opening an account, search routing flights, booking hotels, or using MakeMyTrip API engines, you fully accept these platform terms of service without conditions.' },
            { id: 'section2', label: '2. Booking Contracts', content: 'MakeMyTrip acts as a booking agent connecting travelers with airlines, hotels, bus operators, and cab drivers. The primary contract of transport resides with the service provider.' },
            { id: 'section3', label: '3. Booking Accuracy', content: 'Travelers are responsible for matching government-issued ID card details with names entered during ticket checkout. Misaligned documentation may result in denied entry.' },
            { id: 'section4', label: '4. Dispute Governance', content: 'All user disputes, billing issues, claims, or liability concerns shall be governed under the legal jurisdiction of the courts of New Delhi, India.' }
          ]
        };

      case 'cookie-policy':
        return {
          title: 'Cookie Policy',
          subtitle: 'Learn how we use tracking cookies to personalize your travel search.',
          sections: [
            { id: 'section1', label: '1. Essential Cookies', content: 'These cookies are absolutely required to handle login states, remember filters, and maintain active booking carts through transaction checkouts.' },
            { id: 'section2', label: '2. Analytics & Tracking', content: 'We employ analytics tags to identify performance bottlenecks, monitor flight search speeds, and trace page loading errors.' },
            { id: 'section3', label: '3. Advertising Pixels', content: 'Cookies help us present relevant deals, custom flight discounts, and dynamic hotel banners tailored to cities you search frequently.' },
            { id: 'section4', label: '4. Managing Consents', content: 'You can block cookies inside browser settings, though doing so will clear saved passengers profiles and search history.' }
          ]
        };

      case 'trust-safety':
        return {
          title: 'Trust & Safety',
          subtitle: 'Our top priority: keeping your bookings, user profile, and journeys safe.',
          sections: [
            { id: 'section1', label: '1. Verified Partners Only', content: 'We run security, regulatory, and quality checks on hotels, cab vendors, and bus operators before listing them in search results.' },
            { id: 'section2', label: '2. Secure Authentication', content: 'Login checks use one-time mobile OTP verifications to safeguard your account against unauthorized logins.' },
            { id: 'section3', label: '3. 24/7 Safety Support', content: 'Our safety support line remains active round-the-clock for travelers facing road emergencies, booking denials, or cancellation issues.' },
            { id: 'section4', label: '4. Scam Protection', content: 'Never share passwords or OTP codes with external support callers. MakeMyTrip personnel will never request transaction passwords over phone.' }
          ]
        };

      default:
        return null;
    }
  };

  const template = getPageTemplate();

  if (loading) {
    return (
      <div className="cms-page flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Render original raw database HTML page if it exists in DB AND is NOT a custom styled template
  if (page && !template) {
    return (
      <div className="cms-page">
        <div className="cms-container">
          {page.bannerImage ? (
            <div className="cms-hero-banner" style={{ backgroundImage: `url('${page.bannerImage}')` }}>
              <h1 className="cms-hero-title">{page.title}</h1>
            </div>
          ) : (
            <h1 className="cms-hero-title mt-10">{page.title}</h1>
          )}
          {page.shortDescription && (
            <p className="cms-hero-sub text-zinc-500 mb-6">{page.shortDescription}</p>
          )}
          <div className="prose max-w-none mt-10" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    );
  }

  // Render template-driven pages with premium styles
  if (template) {
    return (
      <div className="cms-page">
        <div className="cms-container">
          
          {/* Header Banner */}
          <header className="cms-hero-banner" data-aos="fade-up">
            <h1 className="cms-hero-title">{template.title}</h1>
            <p className="cms-hero-sub">{template.subtitle}</p>
          </header>

          {/* Stats Section (If applicable) */}
          {template.stats && (
            <section className="cms-stats-row" data-aos="fade-up" data-aos-delay="100">
              {template.stats.map((s, idx) => (
                <div key={idx} className="cms-stat-card">
                  <div className="cms-stat-num">{s.num}</div>
                  <div className="cms-stat-lbl">{s.label}</div>
                </div>
              ))}
            </section>
          )}

          {/* Cards Grid Section (For Newsroom, Investors, CSR) */}
          {template.cards && (
            <section className="cms-cards-section" data-aos="fade-up">
              <h2 className="text-2xl font-extrabold text-primary mb-8" style={{ letterSpacing: '-0.5px' }}>
                {template.cardsTitle}
              </h2>
              <div className="cms-card-grid">
                {template.cards.map((card, idx) => (
                  <div key={idx} className="cms-grid-card" data-aos="zoom-in" data-aos-delay={idx * 50}>
                    <div className="cms-card-icon">{card.icon}</div>
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                    {card.meta && <span className="cms-card-meta">{card.meta}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Accordion FAQ Section (For Cancellations) */}
          {template.faqs && (
            <section className="cms-faq-accordion" data-aos="fade-up">
              {template.faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`cms-faq-item${activeFaq === idx ? ' active' : ''}`}
                >
                  <div 
                    className="cms-faq-header" 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <span>{activeFaq === idx ? '▲' : '▼'}</span>
                  </div>
                  {activeFaq === idx && (
                    <div className="cms-faq-body" data-aos="fade-down">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Side-nav layout for legal/policy docs */}
          {template.sections && (
            <section className="legal-layout" data-aos="fade-up">
              <aside className="legal-sidebar">
                {template.sections.map(sec => (
                  <button
                    key={sec.id}
                    className={`legal-nav-item${activeLegalSection === sec.id ? ' active' : ''}`}
                    onClick={() => {
                      setActiveLegalSection(sec.id);
                      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    {sec.label.split('.')[0]}. {sec.label.split(' ').slice(1).join(' ')}
                  </button>
                ))}
              </aside>
              <div className="legal-content-box">
                {template.sections.map(sec => (
                  <div key={sec.id} id={sec.id} className="mb-10">
                    <h2 className="text-xl font-bold mb-4">{sec.label}</h2>
                    <p className="text-zinc-500 leading-relaxed">{sec.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    );
  }

  // Not found fallback
  return (
    <div className="cms-page py-20 text-center">
      <h1 className="text-3xl font-bold text-red-500">Page not found</h1>
      <p className="mt-4">The page you are looking for does not exist.</p>
    </div>
  );
}
