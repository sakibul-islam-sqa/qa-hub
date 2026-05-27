import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { VaultProvider } from '@/lib/ai/VaultContext';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export const metadata: Metadata = {
  title: 'QA Hub - Toolkit for QA engineers',
  description:
    'A unified set of everyday tools for software QA: JSON, regex, encoding, test data, diffs, screenshots, accessibility, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* External so CSP can forbid script-src 'unsafe-inline'. Synchronous
            (no async/defer) so the dark class is applied before first paint —
            next/script would defer past hydration and cause a light/dark flash. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-screen bg-bg text-fg">
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <VaultProvider>
                  <AppShell>{children}</AppShell>
                </VaultProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
