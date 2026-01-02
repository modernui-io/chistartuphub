import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (could also send to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050A14] px-6">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <span className="font-mono text-2xl text-white/50">!</span>
            </div>

            {/* Error Message */}
            <h1 className="font-serif text-2xl text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-white/50 text-sm mb-8 font-mono">
              We encountered an unexpected error. Please try reloading the page.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair"
              >
                Go Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] cursor-pointer hover:text-white/50">
                  Error Details
                </summary>
                <pre className="mt-4 p-4 bg-white/5 border border-white/10 text-white/40 text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
