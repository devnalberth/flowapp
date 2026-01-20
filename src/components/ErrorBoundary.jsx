import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#fff', background: '#18181b', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>Ops! Algo deu errado.</h1>
          <p>Ocorreu um erro ao carregar a interface.</p>
          <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', margin: '1rem 0', overflow: 'auto' }}>
            <code style={{ color: '#fbbf24' }}>
              {this.state.error && this.state.error.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Tentar recarregar página
          </button>
          <br /><br />
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            style={{ padding: '0.75rem 1.5rem', background: '#3f3f46', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Limpar cache e Sair
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;