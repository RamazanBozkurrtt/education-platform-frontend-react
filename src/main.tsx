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
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LibraryProvider>
          <CartProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRouter />
              </BrowserRouter>
            </AuthProvider>
          </CartProvider>
        </LibraryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
