import React from 'react';

/**
 * Google Material 3 Error Boundary
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a graceful fallback UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Safe console logging for debugging
    if (typeof console !== 'undefined' && console.error) {
      console.error('Practicly Application Error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-canvas, #f8fafc)',
            padding: '24px',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--bg-surface, #ffffff)',
              borderRadius: '24px',
              padding: '36px 32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-default, #e2e8f0)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#b91c1c',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px',
              }}
            >
              !
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 8px 0',
              }}
            >
              Something went wrong loading this view
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary, #64748b)',
                lineHeight: 1.6,
                margin: '0 0 20px 0',
              }}
            >
              The system encountered an unexpected state. Click the button below to restore your session and return to the dashboard.
            </p>
            {this.state.error?.message && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-subtle, #f1f5f9)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#475569',
                  textAlign: 'left',
                  marginBottom: '20px',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: 'var(--md-sys-color-primary, #0b57d0)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.16s ease',
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
