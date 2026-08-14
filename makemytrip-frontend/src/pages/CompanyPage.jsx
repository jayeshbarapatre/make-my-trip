import { useEffect, useState } from 'react';
import { cmsService } from '../services/cmsService';
import './CompanyPage.css';
import { photo } from '../utils/images'

export default function CompanyPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await cmsService.getPageBySlug('company');
      setPage(response.data?.data || null);
      setError('');
    } catch (_err) {
      console.warn('CMS Page not found, rendering beautiful default fallback company data.');
      // Keep error empty so we render beautiful default data
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  // Harmonized defaults (matching loaded seed data)
  const defaultTitle = 'About TripOra';
  const defaultSubtitle = 'India\'s #1 Travel Company | Empowering Millions to Travel the World';
  
  const stats = [
    { num: '50M+', label: 'Happy Travelers' },
    { num: '26+', label: 'Years in Service' },
    { num: '1M+', label: 'Daily Bookings' },
    { num: '24/7', label: 'Customer Support' }
  ];

  const services = [
    { icon: '✈️', title: 'Flight Bookings', desc: 'Search and book flights across domestic and international airlines with best prices guaranteed.' },
    { icon: '🏨', title: 'Hotel Stays', desc: 'Explore hotels, resorts, and homestays with exclusive deals and verified reviews.' },
    { icon: '🚂', title: 'Train Bookings', desc: 'Book train tickets across Indian Railways with instant confirmation.' },
    { icon: '🚌', title: 'Bus Services', desc: 'Book comfortable buses for intercity and local travel.' },
    { icon: '🚗', title: 'Cab Rentals', desc: 'Affordable and reliable cab services for your local travel needs.' },
    { icon: '🎒', title: 'Holiday Packages', desc: 'Curated travel packages for unforgettable vacation experiences.' }
  ];

  const values = [
    { icon: '💡', title: 'Innovation', desc: 'Constantly innovating to deliver cutting-edge travel solutions.' },
    { icon: '🤝', title: 'Trust', desc: 'Building lasting relationships with customers and partners.' },
    { icon: '⭐', title: 'Excellence', desc: 'Striving for excellence in every aspect of our service.' },
    { icon: '🌍', title: 'Sustainability', desc: 'Committed to responsible and sustainable travel practices.' }
  ];

  const team = [
    { initials: 'RD', name: 'Rajesh Desai', role: 'Founder & CEO' },
    { initials: 'SP', name: 'Sneha Patel', role: 'Chief Product Officer' },
    { initials: 'AK', name: 'Amit Kumar', role: 'Chief Technology Officer' },
    { initials: 'PJ', name: 'Priya Joshi', role: 'Chief Financial Officer' }
  ];

  const benefits = [
    'Best Prices Guaranteed: We offer competitive pricing with price match assurance',
    'Verified Reviews: Real reviews from real travelers to help you make informed decisions',
    '24/7 Support: Our customer support team is available round-the-clock to assist you',
    'Easy Booking: Simple and secure booking process with multiple payment options',
    'Exclusive Deals: Access to exclusive offers and discounts not available elsewhere',
    'Travel Insurance: Optional travel insurance to protect your journey',
    'Hassle-Free Cancellations: Flexible cancellation policies for your peace of mind',
    'Mobile App: Manage your bookings on the go with our feature-rich mobile app'
  ];

  if (loading) {
    return (
      <div className="company-page flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const title = page?.title || defaultTitle;
  const subtitle = page?.shortDescription || defaultSubtitle;

  return (
    <div className="company-page pb-16">
      
      {/* Hero Section */}
      <div className="company-container">
        <section className="company-hero-sec" data-aos="fade-up">
          <h1 className="company-hero-title">{title}</h1>
          <p className="company-hero-sub">{subtitle}</p>
        </section>
      </div>

      {/* Stats Section */}
      <div className="company-container">
        <section className="company-stats-grid" data-aos="fade-up" data-aos-delay="100">
          {stats.map((s, idx) => (
            <div key={idx} className="company-stat-card">
              <div className="company-stat-num">{s.num}</div>
              <div className="company-stat-lbl">{s.label}</div>
            </div>
          ))}
        </section>
      </div>

      {/* Story Section */}
      <div className="company-container">
        <section className="company-story-sec">
          <div className="company-story-content" data-aos="fade-right">
            <h2>Our Story</h2>
            <p>
              Founded in 2000, TripOra revolutionized travel in India by making it easier, more affordable, and more accessible to millions.
              From humble beginnings, we've grown to become India's most trusted online travel platform, serving travelers across the globe.
            </p>
            <p>
              Today, TripOra is a one-stop destination for all travel needs - flights, hotels, trains, buses, holiday packages, and much more.
              Our mission is simple: to inspire and empower people to discover the world with confidence and convenience.
            </p>
          </div>
          <div className="company-story-img" data-aos="fade-left">
            <img 
              src={photo('state-empty-trips')} loading="lazy" decoding="async" 
              alt="TripOra Story Journey"
              onError={(e) => {
                e.target.src = '/assets/img/logo/logo.png';
              }}
            />
          </div>
        </section>
      </div>

      {/* What We Offer Section */}
      <div className="company-container">
        <section className="company-offer-sec" data-aos="fade-up">
          <h2 className="company-sec-title">What We Offer</h2>
          <div className="company-services-grid">
            {services.map((item, idx) => (
              <div key={idx} className="company-service-card" data-aos="zoom-in" data-aos-delay={idx * 50}>
                <div className="company-service-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Core Values Section */}
      <div className="company-container">
        <section className="company-values-sec" data-aos="fade-up">
          <h2 className="company-sec-title">Our Core Values</h2>
          <div className="company-values-grid">
            {values.map((v, idx) => (
              <div key={idx} className="company-value-card" data-aos="fade-up" data-aos-delay={idx * 100}>
                <div className="company-value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Leadership Team Section */}
      <section className="company-team-sec">
        <div className="company-container">
          <h2 className="company-sec-title">Our Leadership Team</h2>
          <div className="company-team-grid">
            {team.map((t, idx) => (
              <div key={idx} className="company-team-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
                <div className="company-member-avatar">{t.initials}</div>
                <div className="company-member-name">{t.name}</div>
                <div className="company-member-role">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <div className="company-container">
        <section className="company-why-sec" data-aos="fade-up">
          <h2 className="company-sec-title">Why Choose TripOra?</h2>
          <ul className="company-why-list">
            {benefits.map((item, idx) => {
              const parts = item.split(':');
              return (
                <li key={idx} className="company-why-item" data-aos="fade-right" data-aos-delay={idx * 50}>
                  <span className="company-why-icon">✓</span>
                  <div>
                    <strong>{parts[0]}:</strong>{parts[1]}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* CTA Section */}
      <div className="company-container">
        <section className="company-cta-sec" data-aos="zoom-in">
          <h2>Ready to Explore the World?</h2>
          <p>Join millions of travelers who trust TripOra for their travel needs.</p>
          <a href="/" className="company-cta-btn">Start Your Journey Now</a>
        </section>
      </div>

    </div>
  );
}
