import { useNavigate, Link } from 'react-router-dom'
import { OFFERS, PICKS } from '../data/offersData'
import DemoNotice from '../components/DemoNotice'

function PromoCard ({ promo, onOpen }) {
  return (
    <div
      className="hotels-deal-card"
      role="link"
      tabIndex={0}
      aria-label={`${promo.title} — view offer`}
      style={{ cursor: 'pointer' }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
      }}
    >
      <div className="hotels-deal-img-wrapper" style={{ backgroundImage: `url(${promo.image})`, position: 'relative' }}>
        <span
          className="hotels-deal-meta"
          style={{
            position: 'absolute', top: '12px', left: '12px',
            background: 'hsl(var(--p))', color: 'hsl(var(--pc))',
            padding: '5px 12px', borderRadius: '999px',
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em'
          }}
        >
          {promo.tag}
        </span>
      </div>
      <div className="hotels-deal-body">
        <h4>{promo.title}</h4>
        <p className="hotels-deal-meta">{promo.desc}</p>
        <div className="hotels-deal-price-row">
          {promo.from
            ? <span className="hotels-deal-price">From {promo.from}</span>
            : <span className="hotels-deal-meta">{promo.validity}</span>}
          {promo.code && <span className="hotels-deal-meta">Code: {promo.code}</span>}
        </div>
      </div>
    </div>
  )
}

/**
 * Index of every promotion.
 *
 * The home page had three "View all →" links pointing at `#offers`,
 * `#destinations` and `#picks` — anchors to ids that do not exist on the page,
 * so they scrolled nowhere. Offers and picks now have somewhere to go.
 */
export default function OffersPage () {
  const navigate = useNavigate()
  const open = (id) => navigate(`/offers/${id}`)

  return (
    <div style={{ background: 'hsl(var(--b2))', minHeight: '100vh', paddingBottom: '64px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        <nav style={{ fontSize: '13px', marginBottom: '18px', opacity: 0.75 }} aria-label="Breadcrumb">
          <Link to="/" style={{ color: 'hsl(var(--p))', fontWeight: 600 }}>Home</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ fontWeight: 600 }}>Offers</span>
        </nav>

        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 800 }}>Offers &amp; deals</h1>
        <p style={{ margin: '0 0 20px', opacity: 0.75 }}>
          Every current promotion, and what each one actually includes.
        </p>

        <DemoNotice variant="banner" />

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>This week&apos;s offers</h2>
          <div className="hotels-deals-grid">
            {OFFERS.map(o => <PromoCard key={o.id} promo={o} onOpen={() => open(o.id)} />)}
          </div>
        </section>

        <section style={{ marginTop: '36px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700 }}>Editor&apos;s picks</h2>
          <div className="hotels-deals-grid">
            {PICKS.map(p => <PromoCard key={p.id} promo={p} onOpen={() => open(p.id)} />)}
          </div>
        </section>
      </div>
    </div>
  )
}
