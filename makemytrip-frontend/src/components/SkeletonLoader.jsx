export const FlightCardSkeleton = () => (
  <div style={{
    backgroundColor: 'hsl(var(--b2))',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ height: '20px', width: '60%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px' }}></div>
      <div style={{ height: '20px', width: '20%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px' }}></div>
    </div>
    <div style={{ height: '16px', width: '40%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '8px' }}></div>
    <div style={{ height: '16px', width: '50%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px' }}></div>
  </div>
)

export const HotelCardSkeleton = () => (
  <div style={{
    backgroundColor: 'hsl(var(--b2))',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{ height: '200px', backgroundColor: 'hsl(var(--b3))' }}></div>
    <div style={{ padding: '12px' }}>
      <div style={{ height: '20px', width: '70%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ height: '16px', width: '50%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ height: '20px', width: '30%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px' }}></div>
    </div>
  </div>
)

export const DetailsSkeleton = () => (
  <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
    <div style={{ height: '300px', width: '100%', backgroundColor: 'hsl(var(--b3))', borderRadius: '8px', marginBottom: '20px' }}></div>
    <div style={{ height: '20px', width: '60%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '12px' }}></div>
    <div style={{ height: '16px', width: '80%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '12px' }}></div>
    <div style={{ height: '16px', width: '70%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px', marginBottom: '20px' }}></div>
    <div style={{ height: '40px', width: '100%', backgroundColor: 'hsl(var(--b3))', borderRadius: '4px' }}></div>
  </div>
)

const skeletonStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = skeletonStyles
  document.head.appendChild(style)
}
