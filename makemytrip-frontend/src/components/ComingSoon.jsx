import { useNavigate } from 'react-router-dom'

/**
 * Banner for a vertical that is browsable but not yet bookable.
 *
 * These pages render a full storefront — search panels, priced cards, "Book
 * now" buttons — against no backend at all. Every CTA was a browser alert
 * ("Initiating secure forex purchase flow!"), so a customer could work all the
 * way to what looks like a purchase and get a dialog box. That reads as a bug,
 * and on a page that also quotes prices it reads as a broken checkout.
 *
 * Say plainly that the vertical is not live, and point at one that is.
 */
export default function ComingSoon ({ vertical, blurb, ctaPath = '/', ctaLabel = 'Browse flights' }) {
  const navigate = useNavigate()

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px',
        margin: '0 0 24px',
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'hsl(var(--wa) / 0.12)',
        border: '1px solid hsl(var(--wa) / 0.45)',
        color: 'hsl(var(--bc))'
      }}
    >
      <div style={{ fontSize: '26px', lineHeight: 1 }} aria-hidden="true">🚧</div>
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>
          {vertical} is coming soon
        </div>
        <div style={{ fontSize: '13.5px', lineHeight: 1.5, opacity: 0.75 }}>{blurb}</div>
      </div>
      <button
        onClick={() => navigate(ctaPath)}
        style={{
          flexShrink: 0,
          border: 0,
          borderRadius: '8px',
          padding: '10px 18px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          background: 'hsl(var(--p))',
          color: 'hsl(var(--pc))'
        }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
