import React from 'react'
import { useLocation } from 'react-router-dom'
import '../../styles/Sections.css'

const FOOTER_COLS = [
  {
    title: 'MAKEMYTRIP',
    links: ['About Us', 'Careers', 'Sustainability', 'MMT Foundation', 'Legal Notices', 'CSR Policy', 'Investor Relations'],
  },
  {
    title: 'FLIGHTS',
    links: ['Cheap Flights', 'Flight Status', 'Domestic Airlines', 'International Airlines', 'IndiGo Flights', 'SpiceJet', 'Air India', 'Vistara', 'Go First'],
  },
  {
    title: 'HOTELS',
    links: ['Hotels in Mumbai', 'Hotels in Delhi', 'Hotels in Goa', 'Hotels in Bangalore', 'Hotels in Jaipur', 'Hotels in Chennai', 'Hotels in Shimla', 'Hotels in Ooty'],
  },
  {
    title: 'HOLIDAYS',
    links: ['Goa Packages', 'Kerala Packages', 'Shimla Packages', 'Manali Packages', 'Dubai Packages', 'Singapore Packages', 'Thailand Packages', 'Maldives Packages'],
  },
]

const SOCIAL = [
  { name: 'Facebook', icon: '🔵' },
  { name: 'Twitter / X', icon: '🐦' },
  { name: 'LinkedIn', icon: '💼' },
  { name: 'YouTube', icon: '📺' },
  { name: 'Instagram', icon: '📸' }
]

export default function Footer() {
  const location = useLocation()

  if (location.pathname === '/' || location.pathname === '/flights/results') return null

  return (
    <footer className="portal-footer">
      {/* Top Informational Columns */}
      <div className="footer-upper">
        <div className="footer-container">
          <div className="footer-grid">
            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="footer-column">
                <h4 className="footer-column-title">{col.title}</h4>
                <ul className="footer-links-list">
                  {col.links.map((l) => (
                    <li key={l} className="footer-link-item">
                      <a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="footer-anchor">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Black Bar */}
      <div className="footer-lower">
        <div className="footer-container bottom-flex">
          <div className="footer-social-wrapper">
            <span className="social-label">Follow Us:</span>
            <div className="social-icons">
              {SOCIAL.map((s) => (
                <a 
                  key={s.name} 
                  href={`#${s.name.toLowerCase()}`} 
                  className="social-icon-link" 
                  title={s.name}
                >
                  <span className="icon-symbol">{s.icon}</span>
                  <span className="icon-name">{s.name}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="footer-copyright-block">
            <span className="copyright-text">
              © {new Date().getFullYear()} MAKEMYTRIP PVT. LTD. Country: <strong>India</strong> | <strong>USA</strong> | <strong>UAE</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
