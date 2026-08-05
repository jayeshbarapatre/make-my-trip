import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cmsService } from '../../services/cmsService'
import '../../styles/HomePage.css'

const FOOTER_COLS_FALLBACK = [
  { title: 'About',    links: [
    { title: 'Company', url: '/company' },
    { title: 'Careers', url: '/careers' },
    { title: 'Investor relations', url: '/investor-relations' },
    { title: 'Foundation (CSR)', url: '/foundation' },
    { title: 'Newsroom', url: '/newsroom' }
  ]},
  { title: 'Booking',  links: [
    { title: 'Flights', url: '/flights' },
    { title: 'Hotels', url: '/hotels' },
    { title: 'Trains', url: '/trains' },
    { title: 'Buses', url: '/buses' },
    { title: 'Cabs', url: '/cabs' },
  ]},
  { title: 'Support',  links: [
    { title: 'Contact us', url: '/contact-us' },
    { title: 'FAQs', url: '/faqs' },
    { title: 'Cancellation refunds', url: '/cancellation-refunds' },
    { title: 'Travel insurance', url: '/insurance' }
  ]},
  { title: 'Policies', links: [
    { title: 'Privacy policy', url: '/privacy-policy' },
    { title: 'Terms of service', url: '/terms-of-service' },
    { title: 'Cookie policy', url: '/cookie-policy' },
    { title: 'Trust & safety', url: '/trust-safety' }
  ]},
]

export default function Footer() {
  const [sections, setSections] = useState(FOOTER_COLS_FALLBACK)
  const [_loading, setLoading] = useState(true)

  const fetchFooter = async () => {
    try {
      const response = await cmsService.getFooter()
      const data = response.data.data
      if (Array.isArray(data) && data.length > 0) {
        setSections(data)
      }
    } catch (err) {
      console.error('Error fetching footer:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFooter()
  }, [])

  const renderLink = (link) => {
    const title = typeof link === 'string' ? link : link.title
    const url = typeof link === 'string' ? '#' : (link.url || '#')
    const target = typeof link === 'string' ? '_self' : (link.target || '_self')

    if (url.startsWith('/')) {
      return <Link to={url}>{title}</Link>
    }
    return <a href={url} target={target} rel="noreferrer">{title}</a>
  }

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
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">f</a>
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer">𝕏</a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">◎</a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noreferrer">▶</a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noreferrer">in</a>
            </div>
          </div>

          {sections.map(col => (
            <div key={col.id || col.title} className="hp-ft-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links?.map(link => (
                  <li key={link.id || link.title}>
                    {renderLink(link)}
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
