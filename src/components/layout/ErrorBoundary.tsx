'use client';

import * as React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback override. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to the console so the stack and component path are still
    // reachable in production — without this, the boundary swallows the
    // information React would normally print.
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <DefaultFallback error={error} onReset={this.reset} />;
  }
}

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 sm:px-6">
      <div
        role="alert"
        className="w-full rounded-xl border border-danger/40 bg-danger/5 p-5 text-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-fg">Something went wrong</h1>
            <p className="mt-1 text-muted">
              The page hit an unexpected error. You can try again, or reload if it keeps happening.
            </p>
            {error.message && (
              <pre className="mt-3 overflow-auto rounded-md border border-border bg-surface-2 p-2 text-[11px] leading-relaxed text-fg-muted">
                {error.message}
              </pre>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium text-fg transition-colors hover:border-accent/40 hover:text-accent"
              >
                <RotateCw className="h-3.5 w-3.5" /> Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.reload();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-gradient-accent px-3 text-xs font-medium text-accent-fg shadow-glow-soft transition-all hover:shadow-glow"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
