export const EmptyState = ({ title, message, icon = '✈️', onRetry = null }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: 'hsl(var(--b2))',
    borderRadius: '8px',
    minHeight: '300px'
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
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
    icon="⚠️"
    onRetry={onRetry}
  />
)

export const NoResultsState = ({ searchQuery = null }) => (
  <EmptyState
    title="No results found"
    message={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your search criteria.'}
    icon="🔍"
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
