/**
 * ErrorBoundary Component
 * 
 * T039: React Error Boundary for 3D components
 * Catches and handles errors gracefully
 */

'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * ErrorBoundary Component
 * 
 * Catches errors in 3D components and displays fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D View Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="max-w-md text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              3D View Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred in the 3D view.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 text-xs rounded overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * LoadingSpinner Component
 * 
 * Consistent loading spinner for all loading states
 */
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 * 
 * Displayed when there are no tasks
 */
export function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="max-w-md text-center p-8">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          No Tasks Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create your first task to see it in the 3D view!
        </p>
        <a
          href="#"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Task
        </a>
      </div>
    </div>
  );
}

/**
 * OfflineIndicator Component
 * 
 * Shows when user is offline
 */
export function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-4 py-2 rounded-lg shadow-lg border border-yellow-300 dark:border-yellow-700 z-50">
      <div className="flex items-center gap-2">
        <span className="text-lg">📡</span>
        <span className="font-medium">You&apos;re offline</span>
      </div>
      <p className="text-sm mt-1">Changes will sync when connection is restored.</p>
    </div>
  );
}
