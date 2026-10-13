import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-card card" style={{ maxWidth: 560, margin: '2.5rem auto', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--color-danger, #dc2626)', marginBottom: '0.5rem' }}>
            {this.props.title || 'Something went wrong'}
          </h3>
          <p className="muted" style={{ marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            {this.props.message || 'An unexpected error occurred while loading this section. Please reload the page or return to the dashboard.'}
          </p>
          {this.state.error && (
            <details style={{ textAlign: 'left', background: 'var(--color-bg-alt, #f8fafc)', padding: '0.75rem', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error details</summary>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.message || String(this.state.error)}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              ↻ Reload Page
            </button>
            <a href="/" className="btn btn-secondary">
              Go to Dashboard
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
