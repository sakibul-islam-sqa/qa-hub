import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { CATEGORIES, TOOLS } from '@/lib/tools';

export default function HomePage() {
  const totalTools = TOOLS.length;
  const aiTools = TOOLS.filter((t) => t.badge === 'AI').length;

  return (
    <div className="relative">
      {/* Decorative backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-radial opacity-70"
      />
      <div
        aria-hidden
        className="bg-grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] opacity-60"
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <section className="mb-10 animate-fade-in sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium text-muted shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {totalTools} tools available · {aiTools} powered by AI
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            Everyday QA tools,
            <br className="hidden sm:block" />{' '}
            <span className="text-gradient">all in one place.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-fg-muted sm:text-base">
            A single workspace for the small jobs QA engineers do dozens of times a day — formatting
            payloads, generating test data, decoding tokens, comparing outputs, and drafting bug
            reports with AI.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/tools/ai-test-cases"
              className="group inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-accent px-4 text-sm font-medium text-accent-fg shadow-glow-soft transition-all hover:shadow-glow"
            >
              <Sparkles className="h-4 w-4" />
              Try the AI assistant
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/tools/json"
              className="group inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-fg transition-all hover:border-border-strong hover:shadow-soft"
            >
              <Zap className="h-4 w-4 text-accent" />
              Jump into JSON tools
            </Link>
          </div>
        </section>

        {/* Tool categories */}
        {CATEGORIES.map((cat, catIdx) => {
          const tools = TOOLS.filter((t) => t.category === cat);
          if (!tools.length) return null;
          return (
            <section
              key={cat}
              className="mb-10 animate-fade-in-up sm:mb-12"
              style={{ animationDelay: `${80 + catIdx * 60}ms` }}
            >
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {cat}
                </h2>
                <span className="text-[11px] text-muted">
                  {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.slug}
                      href={`/tools/${t.slug}`}
                      className="lift group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-soft hover:border-accent/40 hover:shadow-elevated"
                    >
                      {/* Hover gradient overlay */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-accent-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />

                      <div className="relative">
                        <div className="mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-accent/15 via-accent/5 to-accent-2/10 text-accent shadow-inner-border transition-all duration-300 group-hover:border-accent/40 group-hover:from-accent/25 group-hover:to-accent-2/15 group-hover:text-accent group-hover:shadow-glow-soft">
                          <Icon className="h-5 w-5" />
                        </div>

                        {t.badge && (
                          <span className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent backdrop-blur-sm">
                            <Sparkles className="h-2.5 w-2.5" />
                            {t.badge}
                          </span>
                        )}

                        <h3 className="text-sm font-semibold tracking-tight text-fg transition-colors group-hover:text-fg">
                          {t.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{t.description}</p>

                        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted opacity-0 transition-all duration-300 group-hover:text-accent group-hover:opacity-100">
                          Open tool
                          <ArrowRight className="h-3 w-3 -translate-x-0.5 transition-transform group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
