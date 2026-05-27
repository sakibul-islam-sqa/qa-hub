import * as React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getTool } from '@/lib/tools';

export function ToolPage({ slug, children }: { slug: string; children: React.ReactNode }) {
  const tool = getTool(slug);
  if (!tool) return null;
  const Icon = tool.icon;

  return (
    <div className="relative">
      {/* Subtle gradient backdrop for the header area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-radial opacity-50"
      />

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="group mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg sm:mb-7"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to dashboard
        </Link>

        <header className="mb-7 flex animate-fade-in items-start gap-3 sm:mb-10 sm:gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-accent/20 via-accent/10 to-accent-2/15 text-accent shadow-inner-border sm:h-14 sm:w-14">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-accent opacity-15 blur-lg"
            />
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                {tool.title}
              </h1>
              {tool.badge && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Sparkles className="h-2.5 w-2.5" />
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-fg-muted sm:text-[15px]">{tool.description}</p>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6">{children}</div>
      </div>
    </div>
  );
}
