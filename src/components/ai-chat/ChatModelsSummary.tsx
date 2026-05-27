'use client';

import * as React from 'react';
import { ProviderLogo } from '@/components/ai/ProviderLogo';
import { PROVIDERS } from '@/lib/ai/providers';
import type { AiProviderId } from '@/lib/ai/types';

interface UsedModel {
  provider: string;
  model: string;
}

export function ChatModelsSummary({ models }: { models: UsedModel[] }) {
  const [open, setOpen] = React.useState(false);
  if (models.length === 0) return null;

  if (models.length === 1) {
    const m = models[0];
    const providerId = m.provider as AiProviderId;
    return (
      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
        <ProviderLogo providerId={providerId} className="h-3 w-3" />
        <span className="truncate">
          {PROVIDERS[providerId]?.name ?? m.provider}
          {' · '}
          {m.model}
        </span>
      </div>
    );
  }

  // Multiple distinct models used in this chat — stack provider logos and
  // let the user expand to see every (provider, model) pair.
  const overlap = 8;
  return (
    <div className="relative mt-0.5 text-[11px] text-muted">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-surface-2 hover:text-fg"
        aria-expanded={open}
      >
        <span className="inline-flex">
          {models.slice(0, 4).map((m, i) => (
            <span
              key={`${m.provider}::${m.model}`}
              className="grid h-4 w-4 place-items-center rounded-full border border-border bg-surface"
              style={{ marginLeft: i === 0 ? 0 : -overlap }}
            >
              <ProviderLogo providerId={m.provider as AiProviderId} className="h-2.5 w-2.5" />
            </span>
          ))}
        </span>
        <span>{models.length} models used</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[220px] rounded-md border border-border bg-surface p-2 shadow-floating">
          <ul className="space-y-1">
            {models.map((m) => (
              <li key={`${m.provider}::${m.model}`} className="flex items-center gap-2 text-[11px]">
                <ProviderLogo
                  providerId={m.provider as AiProviderId}
                  className="h-3 w-3 shrink-0"
                />
                <span className="truncate">
                  <span className="text-fg">
                    {PROVIDERS[m.provider as AiProviderId]?.name ?? m.provider}
                  </span>
                  <span className="mx-1 text-muted/60">·</span>
                  <span className="text-muted">{m.model}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
