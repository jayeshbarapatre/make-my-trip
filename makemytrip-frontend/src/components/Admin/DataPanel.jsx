import PropTypes from 'prop-types'

// Shared loading / error / empty / content shell so every admin screen presents
// the same states instead of each page inventing its own.
export default function DataPanel({
  loading, error, onRetry,
  isEmpty, emptyText, emptyHint, emptyIcon, emptyAction,
  children
}) {
  if (loading) {
    return (
      <div style={{ padding: '56px 20px', textAlign: 'center', color: 'hsl(var(--bc) / 0.6)' }}>
        <div className="dp-spinner" aria-hidden="true" />
        <p style={{ margin: '14px 0 0', fontWeight: 600 }}>Loading…</p>
        <style>{`
          .dp-spinner {
            width: 28px; height: 28px; margin: 0 auto;
            border: 3px solid hsl(var(--bc) / 0.15);
            border-top-color: hsl(var(--p));
            border-radius: 50%;
            animation: dp-spin 0.8s linear infinite;
          }
          @keyframes dp-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { .dp-spinner { animation-duration: 2s; } }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, color: 'hsl(var(--bc))' }}>
          Could not load this data
        </h3>
        <p style={{ margin: '0 0 18px', color: 'hsl(var(--bc) / 0.6)', fontSize: '14px' }}>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '9px 22px', borderRadius: '8px', border: 'none',
              background: 'hsl(var(--p))', color: 'hsl(var(--pc))',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div style={{ padding: '56px 20px', textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: '76px', height: '76px', margin: '0 auto 18px',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'hsl(var(--bc) / 0.04)',
            border: '1px solid hsl(var(--bc) / 0.08)',
            color: 'hsl(var(--bc) / 0.35)'
          }}
        >
          {emptyIcon || <EmptyGlyph />}
        </div>

        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc) / 0.8)' }}>
          {emptyText || 'Nothing to show yet.'}
        </p>

        {emptyHint && (
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'hsl(var(--bc) / 0.5)' }}>{emptyHint}</p>
        )}

        {emptyAction && <div style={{ marginTop: '18px' }}>{emptyAction}</div>}
      </div>
    )
  }

  return children
}

// Inline rather than from react-icons so the shared shell carries no icon-set
// dependency of its own; pages that want a subject-specific glyph pass one.
function EmptyGlyph() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 5.2 4.6A1.8 1.8 0 0 1 6.85 3.5h10.3a1.8 1.8 0 0 1 1.65 1.1L21 9.5" />
      <path d="M3 9.5h5l1.2 2.6h5.6L16 9.5h5v8.2a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 17.7Z" />
    </svg>
  )
}

DataPanel.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  isEmpty: PropTypes.bool,
  emptyText: PropTypes.string,
  emptyHint: PropTypes.string,
  emptyIcon: PropTypes.node,
  emptyAction: PropTypes.node,
  children: PropTypes.node
}
