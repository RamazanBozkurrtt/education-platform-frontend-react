import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './i18n/config'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { LibraryProvider } from './hooks/useLibrary'
import { ThemeProvider } from './hooks/useTheme'
import AppErrorToaster from './app/AppErrorToaster'
import ErrorBoundary from './app/ErrorBoundary'
import { normalizeApiError } from './shared/errors/normalizeApiError'
import { logClientError } from './shared/errors/logClientError'
import './index.css'

const shouldRetryRequest = (failureCount: number, error: unknown) => {
  const appError = normalizeApiError(error)

  if (['validation', 'auth', 'forbidden', 'rate_limit', 'not_found'].includes(appError.kind)) {
    return false
  }

  return failureCount < 1
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
      staleTime: 30_000,
    },
    mutations: {
      retry: shouldRetryRequest,
    },
  },
})

const installGlobalErrorLogging = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('error', (event) => {
    logClientError('window_error', event.error ?? event.message, {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logClientError('unhandled_rejection', event.reason, {
      reason: event.reason,
    })
  })
}

installGlobalErrorLogging()

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <LibraryProvider>
              <CartProvider>
                <BrowserRouter>
                  <AppRouter />
                </BrowserRouter>
                <AppErrorToaster />
              </CartProvider>
            </LibraryProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
