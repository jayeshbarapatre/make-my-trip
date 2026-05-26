import React from 'react'
import { useLocation } from 'react-router-dom'
import '../../styles/HomePage.css'

const FOOTER_COLS = [
  { title: 'About',    links: ['Company', 'Investor relations', 'Careers', 'Foundation (CSR)', 'Newsroom'] },
  { title: 'Booking',  links: ['Flight tickets', 'Hotel bookings', 'Holiday packages', 'Train tickets', 'Bus tickets', 'Cabs'] },
  { title: 'Support',  links: ['Contact us', 'Customer support', 'FAQs', 'Cancellation refunds', 'Travel insurance', 'Web check-in'] },
  { title: 'Policies', links: ['Privacy policy', 'User agreement', 'Terms of service', 'Cookie policy', 'Trust & safety'] },
]

export default function Footer() {
  const location = useLocation()

  return (
    <footer className="hp-footer">
      <div className="hp-wrap">
        <div className="hp-ft-grid">
          <div className="hp-ft-brand">
            <h3>
              <span className="hp-ft-mark">My</span>
              MakeMyTrip
            </h3>
            <p>India's leading online travel company since 2000 — bringing flights, stays, and experiences to over 50 million travellers.</p>
            <div className="hp-ft-social">
              <a href="#fb"  aria-label="Facebook">f</a>
              <a href="#tw"  aria-label="Twitter">𝕏</a>
              <a href="#ig"  aria-label="Instagram">◎</a>
              <a href="#yt"  aria-label="YouTube">▶</a>
              <a href="#li"  aria-label="LinkedIn">in</a>
            </div>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.title} className="hp-ft-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(link => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hp-ft-bottom">
          <div>© 2026 MakeMyTrip Pvt Ltd · All rights reserved</div>
          <div className="hp-ft-pay">
            {['VISA', 'MasterCard', 'RuPay', 'UPI', 'NetBanking'].map(p => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
