'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/auth/AuthContext';

const PUBLIC_PATHS = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  React.useEffect(() => {
    if (!configured) return;
    if (loading) return;
    if (!user && !isPublic) router.replace('/login');
  }, [configured, loading, user, isPublic, router]);

  // Close the mobile nav drawer whenever the route changes.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Public routes (e.g. /login) render raw - no sidebar/header.
  if (isPublic) return <>{children}</>;

  if (!configured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 sm:px-6">
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-5 text-sm sm:p-6">
          <h1 className="text-base font-semibold">Firebase isn&rsquo;t configured</h1>
          <p className="mt-2 text-muted">
            Copy <code className="rounded bg-surface-2 px-1">.env.local.example</code> to{' '}
            <code className="rounded bg-surface-2 px-1">.env.local</code>, fill in your Firebase web
            config, enable Email/Password + Google sign-in in the Firebase console, then restart the
            dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen w-full min-w-0 flex-col">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
