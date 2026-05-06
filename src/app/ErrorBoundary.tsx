import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from '../components/ui/Button'
import { logClientError } from '../shared/errors/logClientError'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, errorInfo)
    logClientError('error_boundary', error, { componentStack: errorInfo.componentStack })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">Unexpected Error</p>
            <h1 className="mt-4 text-2xl font-semibold text-rose-50">Something went wrong while rendering this page.</h1>
            <p className="mt-4 text-sm leading-7 text-rose-100/90">
              The app recovered safely. Please refresh and try again.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={this.handleReload} type="button">
                Reload app
              </Button>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
