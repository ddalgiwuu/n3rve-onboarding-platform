// Check React safety preload (should not be needed with unified chunks)
if (typeof window !== 'undefined' && !window.__REACT_SAFETY_OK__) {
  console.warn('⚠️ React safety preload not detected - unified chunks should handle this')
  console.log('🔍 Current window.React:', !!window.React)
  console.log('🔍 Current createContext:', !!(window.React && window.React.createContext))
}

import './utils/reactInit' // Early React initialization
import './utils/reactPolyfill' // Apply React 19 compatibility polyfill first
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { SubmissionProvider } from './contexts/SubmissionContext'
import { SavedArtistsProvider } from './contexts/SavedArtistsContext'
import ReactErrorBoundary from './components/ReactErrorBoundary'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ReactErrorBoundary>
    <AuthProvider>
      <LanguageProvider>
        <SubmissionProvider>
          <SavedArtistsProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <App />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </BrowserRouter>
            </QueryClientProvider>
          </SavedArtistsProvider>
        </SubmissionProvider>
      </LanguageProvider>
    </AuthProvider>
  </ReactErrorBoundary>
)