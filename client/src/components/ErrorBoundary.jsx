import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: '#e2e8f0', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Algo deu errado</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{ fontSize: 12, color: '#ef4444', background: '#1e1e3a', padding: 12, borderRadius: 8, maxWidth: 600, overflow: 'auto' }}>
              {this.state.error?.message}
            </pre>
          )}
          <button onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
