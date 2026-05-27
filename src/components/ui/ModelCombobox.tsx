'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Check, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightTerms } from '@/lib/highlightTerms';
import type { AiModel } from '@/lib/ai/types';

export interface ModelGroup {
  label: string;
  models: AiModel[];
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  groups: ModelGroup[];
  loading?: boolean;
  onRefresh?: () => void;
  /** Called the first time the dropdown opens - used to lazy-fetch the model list. */
  onFirstOpen?: () => void;
  disabled?: boolean;
  /** Free-form footer text - usually "Last fetched … · 312 models". */
  footer?: React.ReactNode;
  /** Text shown in the trigger when no model is selected. */
  placeholder?: string;
  className?: string;
}

export function ModelCombobox({
  value,
  onChange,
  groups,
  loading,
  onRefresh,
  onFirstOpen,
  disabled,
  footer,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const firstOpenedRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allModels = React.useMemo(() => groups.flatMap((g) => g.models), [groups]);
  const selected = allModels.find((m) => m.id === value);

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
    if (!open) {
      setSearch('');
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function commit(id: string) {
    onChange(id);
    setOpen(false);
  }

  // Whitespace-separated AND-substring match. Mirrors `highlight()` below so
  // every visible row has at least one highlighted span.
  const filter = React.useCallback((value: string, searchValue: string): number => {
    const terms = searchValue.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return 1;
    const hay = value.toLowerCase();
    return terms.every((t) => hay.includes(t)) ? 1 : 0;
  }, []);

  const terms = React.useMemo(() => search.toLowerCase().split(/\s+/).filter(Boolean), [search]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next && !firstOpenedRef.current) {
              firstOpenedRef.current = true;
              onFirstOpen?.();
            }
            return next;
          });
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'group flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm transition-all hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-60',
          open && 'border-accent/60 ring-2 ring-accent/30',
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selected ? (
            <>
              <span className="font-medium">{selected.label}</span>
              <span className="ml-1.5 text-[11px] text-muted">{selected.id}</span>
            </>
          ) : (
            <span className={cn(value ? 'font-mono' : '', 'text-muted')}>
              {value || placeholder || 'Select a model…'}
            </span>
          )}
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted" />}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted transition-transform',
            open && 'rotate-180 text-accent',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]">
          <Command label="Models" className="flex flex-col" shouldFilter filter={filter}>
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
              <Command.Input
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder="Search models…"
                className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
                spellCheck={false}
              />
              {onRefresh && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted transition-colors hover:text-accent disabled:opacity-50"
                  title="Refresh model list"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh
                </button>
              )}
            </div>

            <Command.List className="max-h-72 overflow-auto py-1">
              <Command.Empty className="px-3 py-6 text-center text-xs text-muted">
                No models match
              </Command.Empty>
              {groups.map((group) =>
                group.models.length === 0 ? null : (
                  <Command.Group
                    key={group.label}
                    heading={group.label}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted"
                  >
                    {group.models.map((m) => {
                      const isSel = m.id === value;
                      const haystack = `${m.id} ${m.label}${m.description ? ' ' + m.description : ''}`;
                      return (
                        <Command.Item
                          key={m.id}
                          value={haystack}
                          onSelect={() => commit(m.id)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors data-[selected=true]:bg-surface-2',
                            isSel ? 'text-accent' : 'text-fg',
                          )}
                        >
                          <Check
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 text-accent transition-opacity',
                              isSel ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate">
                              <span className="font-medium">{highlightTerms(m.label, terms)}</span>
                              {m.label !== m.id && (
                                <span className="ml-1.5 font-mono text-[11px] text-muted">
                                  {highlightTerms(m.id, terms)}
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <div className="truncate text-[11px] text-muted">
                                {highlightTerms(m.description, terms)}
                              </div>
                            )}
                          </div>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ),
              )}
            </Command.List>

            {footer && (
              <div className="border-t border-border bg-surface-2/50 px-3 py-1.5 text-[10px] text-muted">
                {footer}
              </div>
            )}
          </Command>
        </div>
      )}
    </div>
  );
}
