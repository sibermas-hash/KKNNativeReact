import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { route } from 'ziggy-js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Safe environment check that works in browser contexts
function isProduction(): boolean {
  try {
    // @ts-expect-error process is defined in Node but not in browser
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

function isDevelopment(): boolean {
  try {
    // @ts-expect-error process is defined in Node but not in browser
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Log to backend in production
    if (isProduction()) {
      fetch(route('api.log-error'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        }),
      }).catch(() => {});
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200/60">
            <div className="bg-rose-600 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Terjadi Kesalahan</h1>
            </div>

            <div className="p-8">
              <p className="text-sm text-gray-900 text-center mb-6">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman atau hubungi
                administrator.
              </p>

              {isDevelopment() && this.state.error && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200/60">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Refresh Halaman
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 bg-white border-2 border-gray-200/60 hover:border-gray-200/60 text-gray-700 font-semibold py-3 rounded-xl transition-all"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
