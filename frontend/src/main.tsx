// React safety check - silent in production

import './utils/reactInit'; // Early React initialization
import './utils/reactPolyfill'; // Apply React 19 compatibility polyfill first
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SubmissionProvider } from './contexts/SubmissionContext';
import { SavedArtistsProvider } from './contexts/SavedArtistsContext';
import ReactErrorBoundary from './components/ReactErrorBoundary';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

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
                      zIndex: 55
                    }
                  }}
                />
              </BrowserRouter>
            </QueryClientProvider>
          </SavedArtistsProvider>
        </SubmissionProvider>
      </LanguageProvider>
    </AuthProvider>
  </ReactErrorBoundary>
);
