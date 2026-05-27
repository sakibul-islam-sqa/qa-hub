'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TZOption {
  value: string;
  label: string;
  offset: string;
  isLocal?: boolean;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: TZOption[];
  className?: string;
}

export function TimezoneSelect({ value, onChange, options, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlight, setHighlight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    function onMouse(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = options.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
    // intentionally only depend on `open` - parent recomputes `options`
    // every second for live offsets; re-running this effect would reset
    // the user's search query / highlight / focus mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    setHighlight(0);
  }, [query]);

  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const selected = options.find((o) => o.value === value);

  function commit(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) commit(filtered[highlight].value);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'group flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm transition-all hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:w-auto sm:min-w-[260px]',
          open && 'border-accent/60 ring-2 ring-accent/30',
        )}
      >
        <Globe className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-left font-medium">{selected?.label ?? value}</span>
          {selected?.isLocal && <LocalPill />}
        </div>
        <span className="shrink-0 font-mono text-[11px] text-muted">{selected?.offset}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted transition-transform',
            open && 'rotate-180 text-accent',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)] sm:left-auto sm:right-0 sm:w-[360px]">
          <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search timezone…"
              className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[11px] text-muted hover:text-fg"
              >
                Clear
              </button>
            )}
          </div>
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Timezones"
            className="max-h-72 overflow-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted">No timezones match</li>
            ) : (
              filtered.map((o, i) => {
                const isSel = o.value === value;
                const isHl = i === highlight;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => commit(o.value)}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        isHl ? 'bg-surface-2' : '',
                        isSel ? 'text-accent' : 'text-fg',
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 text-accent transition-opacity',
                          isSel ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.isLocal && <LocalPill />}
                      <span className="shrink-0 font-mono text-[11px] text-muted">{o.offset}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-border bg-surface-2/50 px-3 py-1.5 text-[10px] text-muted">
            <span>
              {filtered.length} of {options.length} zones
            </span>
            <span className="float-right hidden sm:inline">
              ↑↓ to navigate · ↵ to select · esc to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LocalPill() {
  return (
    <span className="rounded-full bg-accent/15 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider text-accent">
      Local
    </span>
  );
}
