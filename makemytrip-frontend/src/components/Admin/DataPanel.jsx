import PropTypes from 'prop-types'

// Shared loading / error / empty / content shell so every admin screen presents
// the same states instead of each page inventing its own.
export default function DataPanel({ loading, error, onRetry, isEmpty, emptyText, children }) {
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
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'hsl(var(--bc) / 0.55)' }}>
        <p style={{ margin: 0, fontSize: '15px' }}>{emptyText || 'Nothing to show yet.'}</p>
      </div>
    )
  }

  return children
}

DataPanel.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  isEmpty: PropTypes.bool,
  emptyText: PropTypes.string,
  children: PropTypes.node
}
