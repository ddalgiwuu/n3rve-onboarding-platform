import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ReactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log React context specific errors
    if (error.message.includes('createContext') || 
        error.message.includes('useContext') ||
        error.message.includes('Provider')) {
      
      console.error('React Context Error:', error)
      console.error('Error Info:', errorInfo)
      
      // Try to reinitialize React if possible
      if (typeof window !== 'undefined') {
        import('../utils/reactPolyfill').then(module => {
          module.ensureReactCompatibility()
        })
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for React context errors
      if (this.state.error?.message.includes('createContext') ||
          this.state.error?.message.includes('useContext')) {
        return this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Application Loading Error</h2>
              </div>
              <p className="text-gray-600 mb-4">
                There was an issue initializing the application. This is likely a temporary compatibility issue.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Application
              </button>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Technical Details</summary>
                <pre className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded overflow-auto">
                  {this.state.error?.message}
                </pre>
              </details>
            </div>
          </div>
        )
      }
      
      // Generic error fallback
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}