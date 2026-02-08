import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // In production, you could send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Optionally reload the page
    if (this.props.resetOnError) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
          <Card className="max-w-lg w-full p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>

              <p className="text-sm text-ink-500 dark:text-ink-300 mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <Card className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-left">
                  <p className="text-xs font-mono text-red-800 dark:text-red-200 mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-red-700 dark:text-red-300">
                      <summary className="cursor-pointer mb-2">Stack trace</summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
