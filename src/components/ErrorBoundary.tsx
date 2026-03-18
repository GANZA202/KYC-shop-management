import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-stone-50 p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
            <p className="text-stone-600 text-sm">
              The application encountered an unexpected error. This might be due to a database connection issue or a temporary glitch.
            </p>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-left overflow-auto max-h-40">
              <code className="text-xs text-red-700">{this.state.error?.message}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-stone-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
