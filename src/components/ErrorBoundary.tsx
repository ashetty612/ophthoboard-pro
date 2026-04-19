"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Log to console so the real stack (not the minified message) is available
    // in production dev tools for debugging. Also safe for telemetry later.
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ errorInfo: info?.componentStack || null });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      // Clear potentially corrupt localStorage state that could be causing a render crash
      try {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
          // Be conservative: only clear app-scoped keys
          if (
            key.startsWith("ophtho_boards_") ||
            key.startsWith("ophth-") ||
            key.startsWith("ophthoboard-") ||
            key.startsWith("obp-")
          ) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        // localStorage may be unavailable (private mode, quota, etc.) — ignore
      }
      window.location.assign("/");
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const message = this.state.error?.message || "An unexpected error occurred.";
      // React minified errors include a URL — show it so users can diagnose
      const reactDocsMatch = message.match(/https:\/\/react\.dev\/errors\/\d+/);
      const docsUrl = reactDocsMatch?.[0];

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4" aria-hidden>&#x26A0;&#xFE0F;</div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-4 whitespace-pre-wrap break-words">
              {message}
            </p>
            {docsUrl && (
              <p className="text-[11px] text-slate-500 mb-4">
                React docs:{" "}
                <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline">
                  {docsUrl}
                </a>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                title="Clear local state and return home — useful if a stored value is causing the crash"
              >
                Reset & Go Home
              </button>
            </div>
            {process.env.NODE_ENV !== "production" && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Component stack (dev only)
                </summary>
                <pre className="mt-2 text-[10px] text-slate-500 overflow-auto max-h-60 bg-slate-900/50 p-2 rounded">
                  {this.state.errorInfo}
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
