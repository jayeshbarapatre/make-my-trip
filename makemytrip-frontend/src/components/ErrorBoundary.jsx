import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#333' }}>⚠️ Something went wrong</h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', maxWidth: '500px', textAlign: 'center' }}>
            We encountered an unexpected error. Please refresh the page or try again later.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              padding: '15px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              maxWidth: '600px',
              marginBottom: '20px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error details (development only)</summary>
              <pre style={{
                marginTop: '10px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#d32f2f'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#003580',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Go to Home Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
