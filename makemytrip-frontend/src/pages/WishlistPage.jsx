import { useNavigate } from 'react-router-dom'
import { useWishlist } from '../hooks/useWishlist'

/**
 * Saved items.
 *
 * The wishlist API existed with no page to reach it: hearts on the listing were
 * component-local state, and the hotel detail button reported success without
 * saving anything. There was nowhere for a customer to see what they had saved
 * because nothing was ever saved.
 *
 * Renders from the denormalised snapshot the server stores, so a withdrawn
 * listing still shows what was saved rather than disappearing silently.
 */

const TYPE_META = {
  hotel: { label: 'Hotel', icon: '🏨', route: (id) => `/hotels/${id}` },
  flight: { label: 'Flight', icon: '✈️', route: () => '/flights' },
  train: { label: 'Train', icon: '🚆', route: () => '/trains' },
  bus: { label: 'Bus', icon: '🚌', route: () => '/buses' },
  cab: { label: 'Cab', icon: '🚖', route: () => '/cabs' }
}

const card = {
  display: 'flex', gap: 16, alignItems: 'center', padding: 16,
  background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))',
  borderRadius: 12, marginBottom: 12
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const { items, toggle, loading, error, isSignedIn, reload } = useWishlist()

  if (!isSignedIn) {
    return (
      <Shell title="Your Wishlist">
        <Empty
          icon="🔒"
          title="Sign in to see your saved items"
          body="Anything you save is kept to your account, so it is there on every device."
          actionLabel="Sign in"
          onAction={() => navigate('/login')}
        />
      </Shell>
    )
  }

  if (loading) {
    return (
      <Shell title="Your Wishlist">
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...card, opacity: 0.5 }}>
            <div style={{ width: 96, height: 72, borderRadius: 8, background: 'hsl(var(--b3))' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: '40%', background: 'hsl(var(--b3))', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 12, width: '25%', background: 'hsl(var(--b3))', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell title="Your Wishlist">
        <Empty
          icon="⚠️"
          title="Could not load your wishlist"
          body={error}
          actionLabel="Try again"
          onAction={reload}
        />
      </Shell>
    )
  }

  if (!items.length) {
    return (
      <Shell title="Your Wishlist">
        <Empty
          icon="🤍"
          title="Nothing saved yet"
          body="Tap the heart on any hotel to keep it here for later."
          actionLabel="Browse hotels"
          onAction={() => navigate('/hotels')}
        />
      </Shell>
    )
  }

  return (
    <Shell title={`Your Wishlist (${items.length})`}>
      {items.map((w) => {
        const meta = TYPE_META[w.type] ?? { label: w.type, icon: '📌', route: () => '/' }
        const s = w.snapshot ?? {}

        return (
          <div key={`${w.type}:${w.itemId}`} style={card}>
            <div
              style={{
                width: 96, height: 72, borderRadius: 8, flexShrink: 0,
                background: s.image ? `center/cover url(${s.image})` : 'hsl(var(--b2))',
                display: 'grid', placeItems: 'center', fontSize: 28
              }}
            >
              {!s.image && meta.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'hsl(var(--bc)/0.55)', fontWeight: 700 }}>
                {meta.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--bc))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name || 'Saved item'}
              </div>
              <div style={{ fontSize: 13, color: 'hsl(var(--bc)/0.6)' }}>
                {s.city}{s.rating ? ` · ★ ${s.rating}` : ''}
              </div>
            </div>

            {s.price ? (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--p))' }}>
                  ₹{Number(s.price).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(var(--bc)/0.55)' }}>per night</div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => navigate(meta.route(w.itemId))}
                style={btn('primary')}
              >
                View
              </button>
              <button
                onClick={() => toggle(w.type, w.itemId, s)}
                style={btn('ghost')}
                aria-label={`Remove ${s.name || 'item'} from wishlist`}
              >
                Remove
              </button>
            </div>
          </div>
        )
      })}
    </Shell>
  )
}

const btn = (variant) => ({
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: variant === 'primary' ? 'none' : '1px solid hsl(var(--b3))',
  background: variant === 'primary' ? 'hsl(var(--p))' : 'transparent',
  color: variant === 'primary' ? 'hsl(var(--pc))' : 'hsl(var(--bc)/0.7)'
})

function Shell({ title, children }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 64px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: 20 }}>{title}</h1>
      {children}
    </div>
  )
}

function Empty({ icon, title, body, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--bc))', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'hsl(var(--bc)/0.6)', marginBottom: 24 }}>{body}</p>
      <button onClick={onAction} style={btn('primary')}>{actionLabel}</button>
    </div>
  )
}
