import { useParams, useNavigate, Link } from 'react-router-dom'
import { findPromotion } from '../data/offersData'
import DemoNotice from '../components/DemoNotice'

/**
 * The page behind every promotion card on the home page.
 *
 * Offers and editor's picks share it — they carry the same shape and a visitor
 * does not distinguish them. Each one ends in `action`, a link into a real part
 * of the site, so the page is a step towards booking rather than a dead end with
 * nicer typography.
 */
export default function OfferDetailsPage () {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const offer = findPromotion(offerId)

  if (!offer) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }} aria-hidden="true">🏷️</div>
          <h1 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: 800 }}>This offer has ended</h1>
          <p style={{ margin: '0 0 22px', opacity: 0.7, lineHeight: 1.6 }}>
            The promotion you followed is no longer listed. There are current offers on the home page.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'hsl(var(--b2))', minHeight: '100vh', paddingBottom: '64px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>

        <nav style={{ fontSize: '13px', marginBottom: '18px', opacity: 0.75 }} aria-label="Breadcrumb">
          <Link to="/" style={{ color: 'hsl(var(--p))', fontWeight: 600 }}>Home</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span>Offers</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ fontWeight: 600 }}>{offer.title}</span>
        </nav>

        <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', border: '1px solid hsl(var(--b3))' }}>
          <div
            style={{
              height: '260px',
              backgroundImage: `url(${offer.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}
            role="img"
            aria-label={offer.title}
          >
            <span style={{
              position: 'absolute', top: '16px', left: '16px',
              background: 'hsl(var(--p))', color: 'hsl(var(--pc))',
              padding: '6px 14px', borderRadius: '999px',
              fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em'
            }}>
              {offer.tag}
            </span>
          </div>

          <div style={{ padding: '28px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, lineHeight: 1.25 }}>{offer.title}</h1>
            <p style={{ margin: '0 0 18px', fontSize: '16px', lineHeight: 1.6, opacity: 0.8 }}>{offer.desc}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
              {offer.from && (
                <span style={{ background: 'hsl(var(--su) / 0.12)', color: 'hsl(var(--su))', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                  From {offer.from} per person
                </span>
              )}
              {offer.validity && (
                <span style={{ background: 'hsl(var(--b2))', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  {offer.validity}
                </span>
              )}
              {offer.code && (
                <span style={{ background: 'hsl(var(--wa) / 0.14)', color: 'hsl(var(--bc))', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Code: {offer.code}
                </span>
              )}
            </div>

            {offer.highlights?.length > 0 && (
              <section style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 700 }}>What you get</h2>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.9, opacity: 0.85 }}>
                  {offer.highlights.map(h => <li key={h}>{h}</li>)}
                </ul>
              </section>
            )}

            {offer.terms?.length > 0 && (
              <section style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 700 }}>Terms &amp; conditions</h2>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, fontSize: '14px', opacity: 0.7 }}>
                  {offer.terms.map(term => <li key={term}>{term}</li>)}
                </ul>
              </section>
            )}

            {/* An offer advertises a discount that demonstration inventory cannot
                actually apply, so say so here rather than only in the footer. */}
            <DemoNotice variant="banner" />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(offer.action.to)}>
                {offer.action.label}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>
                Back to offers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
