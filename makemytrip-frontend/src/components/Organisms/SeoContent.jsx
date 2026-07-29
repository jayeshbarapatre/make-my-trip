import { SEO_SECTIONS } from '../../data/homepageData'
import '../../styles/Sections.css'

export default function SeoContent() {
  return (
    <section className="seo-content-section">
      <div className="seo-content-inner">
        <div className="seo-content-grid">
          {SEO_SECTIONS.map((sec, i) => (
            <div key={i} className="seo-content-column">
              <h4 className="seo-content-title">{sec.title}</h4>
              <p className="seo-content-paragraph">{sec.content}</p>
            </div>
          ))}
        </div>
        
        <div className="seo-important-disclaimer">
          <p>
            <strong>Disclaimer:</strong> All promotional rates, flight listings, hotel occupancy discounts, and scheduling data displayed on this portal are aggregated from live booking integrations and partner API feeds. Terms and conditions apply based on carrier regulations, hotel check-in bylaws, and payment gateway settlement timelines.
          </p>
        </div>
      </div>
    </section>
  )
}
