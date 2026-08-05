import { useNavigate } from 'react-router-dom'

/**
 * Shown when a checkout page is reached without the selection it needs.
 *
 * Checkout state lives in router state, which a refresh, a back/forward jump or
 * a pasted link discards. These pages used to `return null` in that case, which
 * paints a blank white page — indistinguishable from a crash, and with no way
 * forward. Tell the customer what happened and send them back to re-select.
 */
export default function CheckoutStateLost ({
  searchPath,
  label = 'search',
  message = 'Your selection was not carried over — this can happen after refreshing the page or opening the link directly.'
}) {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      padding: '40px 24px',
      textAlign: 'center',
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      <div style={{ fontSize: '44px' }} aria-hidden="true">🧭</div>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Let&apos;s pick that again</h2>
      <p style={{ margin: 0, maxWidth: '460px', lineHeight: 1.6, opacity: 0.7 }}>{message}</p>
      <button
        onClick={() => navigate(searchPath, { replace: true })}
        style={{
          marginTop: '6px',
          border: 0,
          borderRadius: '8px',
          padding: '11px 22px',
          fontWeight: 700,
          cursor: 'pointer',
          background: '#1a73e8',
          color: '#fff'
        }}
      >
        Back to {label}
      </button>
    </div>
  )
}
