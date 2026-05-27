'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { CATEGORIES, TOOLS } from '@/lib/tools';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Close drawer on Escape.
  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onMobileClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  const nav = (
    <>
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-border px-4 md:h-16 md:px-5">
        <Link
          href="/"
          onClick={onMobileClose}
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-accent text-accent-fg shadow-glow-soft transition-shadow group-hover:shadow-glow">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-accent opacity-50 blur-md transition-opacity group-hover:opacity-70"
            />
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">QA Hub</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Toolkit
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="mb-5">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {cat}
            </div>
            <ul className="space-y-0.5">
              {TOOLS.filter((t) => t.category === cat).map((t) => {
                const Icon = t.icon;
                const href = `/tools/${t.slug}`;
                const active = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <li key={t.slug}>
                    <Link
                      href={href}
                      onClick={onMobileClose}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all',
                        active
                          ? 'bg-gradient-to-r from-accent/15 to-accent/5 font-medium text-fg shadow-inner-border'
                          : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      {/* Active left indicator */}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-accent to-accent-2"
                        />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-accent' : 'text-muted group-hover:text-fg',
                        )}
                      />
                      <span className="truncate">{t.title}</span>
                      {t.badge && (
                        <span
                          className={cn(
                            'ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider transition-colors',
                            active
                              ? 'border-accent/50 bg-accent/15 text-accent'
                              : 'bg-accent/8 border-accent/25 text-accent/80 group-hover:border-accent/40 group-hover:bg-accent/15',
                          )}
                        >
                          <Sparkles className="h-2 w-2" />
                          {t.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - sticky column from md and up */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface/50 backdrop-blur-sm md:flex md:w-72 md:flex-col">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          onClick={onMobileClose}
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className={cn(
            'absolute inset-y-0 left-0 flex h-full w-[85vw] max-w-[20rem] flex-col border-r border-border bg-surface shadow-floating transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
