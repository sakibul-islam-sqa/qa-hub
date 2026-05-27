'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Bot, Check, ChevronDown, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/Input';
import { ProviderLogo } from '@/components/ai/ProviderLogo';
import { PROVIDERS } from '@/lib/ai/providers';
import { configuredModels, configuredProviders, resolveDefaultPick } from '@/lib/ai/settings';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import type { AiProviderId } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { highlightTerms } from '@/lib/highlightTerms';

export interface PickerValue {
  provider: AiProviderId;
  model: string;
}

interface Props {
  value: PickerValue | null;
  onChange: (next: PickerValue | null) => void;
}

interface Row {
  provider: AiProviderId;
  providerName: string;
  modelId: string;
  modelLabel: string;
  modelDescription?: string;
  isDefault: boolean;
}

export function ModelPicker({ value, onChange }: Props) {
  const settings = useAiSettings();
  const available = configuredProviders(settings);

  React.useEffect(() => {
    if (!value && available.length) {
      const pick = resolveDefaultPick(settings);
      if (pick) onChange(pick);
    }
    if (value && !available.includes(value.provider)) {
      const pick = resolveDefaultPick(settings);
      onChange(pick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.join('|')]);

  const rows: Row[] = React.useMemo(() => {
    const out: Row[] = [];
    for (const id of available) {
      const defaultModelId = settings[id]?.defaultModel;
      const models = configuredModels(settings, id);
      for (const m of models) {
        out.push({
          provider: id,
          providerName: PROVIDERS[id].name,
          modelId: m.id,
          modelLabel: m.label,
          modelDescription: m.description,
          isDefault: m.id === defaultModelId,
        });
      }
    }
    return out;
  }, [available, settings]);

  if (!available.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-2 p-4 text-sm text-muted">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-fg">
          <Bot className="h-4 w-4 text-accent" /> No AI provider configured
        </div>
        <p>
          Connect an OpenAI, Anthropic, or Google key to use this tool.{' '}
          <Link href="/settings/ai" className="text-accent underline-offset-2 hover:underline">
            Open AI settings →
          </Link>
        </p>
      </div>
    );
  }

  const selected =
    (value && rows.find((r) => r.provider === value.provider && r.modelId === value.model)) ||
    rows[0];

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <Label>Model</Label>
        <Link
          href="/settings/ai"
          className="text-[11px] text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Manage providers →
        </Link>
      </div>
      <ProviderModelCombobox
        className="mt-2"
        rows={rows}
        selected={selected}
        onSelect={(r) => onChange({ provider: r.provider, model: r.modelId })}
      />
    </div>
  );
}

interface ComboboxProps {
  rows: Row[];
  selected: Row | undefined;
  onSelect: (row: Row) => void;
  className?: string;
}

function ProviderModelCombobox({ rows, selected, onSelect, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const filter = React.useCallback((value: string, searchValue: string): number => {
    const terms = searchValue.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return 1;
    const hay = value.toLowerCase();
    return terms.every((t) => hay.includes(t)) ? 1 : 0;
  }, []);

  const terms = React.useMemo(() => search.toLowerCase().split(/\s+/).filter(Boolean), [search]);

  // Group rows by provider so the dropdown stays readable when several models
  // are connected for one provider.
  const groups = React.useMemo(() => {
    const map = new Map<AiProviderId, Row[]>();
    for (const r of rows) {
      const arr = map.get(r.provider) ?? [];
      arr.push(r);
      map.set(r.provider, arr);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'group flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 text-left transition-all hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
          open && 'border-accent/60 ring-2 ring-accent/30',
        )}
      >
        {selected ? (
          <>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface ring-1 ring-border">
              <ProviderLogo providerId={selected.provider} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-fg">
                  {selected.providerName}
                </span>
                {selected.isDefault && <DefaultBadge />}
              </span>
              <span className="block truncate text-[11px] text-muted">{selected.modelLabel}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-muted">Select a model…</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted transition-transform',
            open && 'rotate-180 text-accent',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_48px_-12px_rgba(0,0,0,0.28)]">
          <Command label="Providers" className="flex flex-col" shouldFilter filter={filter}>
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
              <Command.Input
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder="Search providers or models…"
                className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
                spellCheck={false}
              />
            </div>

            <Command.List className="max-h-80 overflow-auto p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-xs text-muted">
                No matches
              </Command.Empty>
              {groups.map(([providerId, providerRows]) => (
                <Command.Group
                  key={providerId}
                  className="[&_[cmdk-group-heading]]:hidden"
                  heading={PROVIDERS[providerId].name}
                >
                  {providerRows.map((r) => {
                    const isSel =
                      selected?.provider === r.provider && selected?.modelId === r.modelId;
                    const haystack = `${r.providerName} ${r.modelLabel} ${r.modelId}${
                      r.modelDescription ? ' ' + r.modelDescription : ''
                    }`;
                    return (
                      <Command.Item
                        key={`${r.provider}:${r.modelId}`}
                        value={haystack}
                        onSelect={() => {
                          onSelect(r);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors data-[selected=true]:bg-surface-2',
                          isSel && 'bg-accent/10 data-[selected=true]:bg-accent/15',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 ring-1 ring-border',
                            isSel && 'ring-accent/40',
                          )}
                        >
                          <ProviderLogo providerId={r.provider} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-fg">
                              {highlightTerms(r.providerName, terms)}
                            </span>
                            {r.isDefault && <DefaultBadge />}
                          </span>
                          <span className="block truncate text-[11px] text-muted">
                            {highlightTerms(r.modelLabel, terms)}
                            {r.modelDescription && (
                              <span className="text-muted/70"> · {r.modelDescription}</span>
                            )}
                          </span>
                        </span>
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0 text-accent transition-opacity',
                            isSel ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}

function DefaultBadge() {
  return (
    <span
      title="Default model for this provider"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent"
    >
      <Star className="h-2.5 w-2.5 fill-current" />
      Default
    </span>
  );
}
