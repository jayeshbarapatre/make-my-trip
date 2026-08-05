import { Component } from 'react'

/**
 * Catches render-time exceptions anywhere below it.
 *
 * Without this, a single thrown error unmounts the whole React tree and the
 * customer is left staring at a blank white page with no indication that
 * anything went wrong and no way to recover — the failure mode that made a
 * broken checkout page indistinguishable from a slow one.
 *
 * Reset is keyed on `resetKey` so navigating to a different route clears a
 * previous error instead of pinning the customer to the fallback.
 */
export default class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError (error) {
    return { error }
  }

  componentDidUpdate (prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch (error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack)

    // Report it so a crash in production is visible without a customer having
    // to describe it. Plain fetch rather than the axios instance: that one
    // carries auth interceptors that can redirect on 401, and a crash report
    // must never navigate the page. Failure here is swallowed — a broken
    // reporter must not replace one error with another.
    try {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/client-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message ?? String(error),
          stack: error?.stack ?? '',
          componentStack: info?.componentStack ?? '',
          path: window.location.pathname
        }),
        keepalive: true
      }).catch(() => {})
    } catch { /* reporting is best-effort */ }
  }

  render () {
    const { error } = this.state
    if (!error) return this.props.children

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
        <div style={{ fontSize: '44px' }} aria-hidden="true">⚠️</div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ margin: 0, maxWidth: '460px', lineHeight: 1.6, opacity: 0.7 }}>
          This page ran into an unexpected error. Your bookings and payments are unaffected.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ border: 0, borderRadius: '8px', padding: '11px 20px', fontWeight: 700, cursor: 'pointer', background: '#1a73e8', color: '#fff' }}
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.href = '/' }}
            style={{ borderRadius: '8px', padding: '11px 20px', fontWeight: 700, cursor: 'pointer', background: 'transparent', border: '1.5px solid rgba(0,0,0,.15)', color: 'inherit' }}
          >
            Go to homepage
          </button>
        </div>
      </div>
    )
  }
}
