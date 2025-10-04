import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md max-w-md'>
        <h1 className='text-2xl font-bold text-red-600 mb-4'>
          Something went wrong
        </h1>
        <p className='text-gray-600 mb-4'>
          The application encountered an error. Please refresh the page or check
          the console for details.
        </p>
        <details className='mb-4'>
          <summary className='cursor-pointer text-sm text-gray-500'>
            Error Details
          </summary>
          <pre className='mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto'>
            {error?.stack}
          </pre>
        </details>
        <div className='flex space-x-3'>
          <button
            onClick={handleRefresh}
            className='flex-1 bg-blue-700 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors font-medium'
          >
            Refresh Page
          </button>
          <button
            onClick={handleGoHome}
            className='flex-1 bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium'
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

const ErrorBoundary: React.FC<Props> = props => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;
