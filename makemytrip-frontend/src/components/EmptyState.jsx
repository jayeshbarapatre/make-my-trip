import Photo from './Common/Photo'

export const EmptyState = ({ title, message, photo = 'state-empty-trips', onRetry = null }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px 60px',
    textAlign: 'center',
    backgroundColor: 'hsl(var(--b2))',
    borderRadius: '8px',
    minHeight: '300px'
  }}>
    <div style={{
      width: '100%',
      maxWidth: '420px',
      height: '190px',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(10, 17, 40, 0.10)'
    }}>
      <Photo
        name={photo}
        sizes="(max-width: 480px) 92vw, 420px"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
    <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'hsl(var(--bc))' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '24px', maxWidth: '400px' }}>{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          backgroundColor: 'hsl(var(--p))',
          color: 'hsl(var(--pc))',
          border: 'none',
          padding: '10px 24px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Try Again
      </button>
    )}
  </div>
)

export const ErrorState = ({ message, onRetry = null }) => (
  <EmptyState
    title="Something went wrong"
    message={message || 'An error occurred. Please try again.'}
    photo="state-error"
    onRetry={onRetry}
  />
)

export const NoResultsState = ({ searchQuery = null }) => (
  <EmptyState
    title="No results found"
    message={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your search criteria.'}
    photo="state-no-results"
  />
)

export const LoadingState = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    minHeight: '300px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '4px solid hsl(var(--b3))',
      borderTop: '4px solid hsl(var(--p))',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <p style={{ marginTop: '16px', color: 'hsl(var(--bc) / 0.6)', fontSize: '14px' }}>Loading your results...</p>
  </div>
)

const emptyStateStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = emptyStateStyles
  if (!document.querySelector('[data-empty-state-styles]')) {
    style.setAttribute('data-empty-state-styles', 'true')
    document.head.appendChild(style)
  }
}
