import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Algo salió mal</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            Ocurrió un error inesperado. Por favor, intenta recargar la página.
          </p>
          <button
            className="primary-btn"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
