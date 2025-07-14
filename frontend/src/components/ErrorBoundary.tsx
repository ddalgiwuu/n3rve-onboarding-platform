import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    
    this.setState({
      error,
      errorInfo
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
              <details className="whitespace-pre-wrap">
                <summary className="cursor-pointer mb-2">Error details</summary>
                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="font-mono text-sm text-red-600">
                    {this.state.error && this.state.error.toString()}
                  </p>
                  <p className="font-mono text-xs mt-2 text-gray-600 dark:text-gray-400">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </p>
                </div>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}