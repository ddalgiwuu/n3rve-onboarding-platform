import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  children: ReactNode
  fallback?: ReactNode
  t: (key: string) => string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log errors only in development mode for security
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      const { t } = this.props;

      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                {t('error.somethingWentWrong')}
              </h1>
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
                {t('error.reloadPage')}
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper that provides translation
export default function ErrorBoundary({ children, fallback }: Omit<Props, 't'>) {
  const { t } = useTranslation();

  return (
    <ErrorBoundaryClass t={t} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
