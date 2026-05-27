'use client';

import Link from 'next/link';
import { ArrowLeft, Cloud } from 'lucide-react';
import { PROVIDER_IDS } from '@/lib/ai/providers';
import { configuredProviders } from '@/lib/ai/settings';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { useVault } from '@/lib/ai/VaultContext';
import type { AiProviderId } from '@/lib/ai/types';
import { VaultPanel } from '@/components/ai-settings/VaultPanel';
import { ProviderCard } from '@/components/ai-settings/ProviderCard';

const PROVIDER_GROUPS: Array<{ title: string; description: string; ids: AiProviderId[] }> = [
  {
    title: 'Free-tier friendly',
    description:
      "These either have a real free tier or run locally — start here if you don't want to pay.",
    ids: ['groq', 'gemini', 'mistral', 'cerebras', 'github', 'openrouter', 'ollama'],
  },
  {
    title: 'Pay-per-use',
    description: 'Separate from chat-app subscriptions; you pay only for the tokens you use.',
    ids: ['openai', 'anthropic'],
  },
];

export default function AiSettingsPage() {
  const settings = useAiSettings();
  const configured = configuredProviders(settings);
  const vault = useVault();

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg sm:mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <header className="mb-6 sm:mb-8">
        <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">AI connections</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Connect your own AI provider. AI-powered tools in QA Hub will use whichever model you
          choose. All providers below are supported — pick one or several.
        </p>
      </header>

      <VaultPanel settings={settings} />

      {vault.status === 'unlocked' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="text-fg">
            <div className="font-medium">Keys are encrypted before saving.</div>
            <p className="mt-1 text-muted">
              API keys are AES-GCM encrypted in your browser with your vault passphrase before being
              written to Firestore — the project admin sees only ciphertext.
            </p>
          </div>
        </div>
      )}

      {PROVIDER_GROUPS.map((group) => (
        <section key={group.title} className="mb-8">
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {group.title}
            </h2>
            <p className="mt-1 text-xs text-muted">{group.description}</p>
          </div>
          <div className="space-y-4">
            {group.ids
              .filter((id) => PROVIDER_IDS.includes(id))
              .map((id) => (
                <ProviderCard
                  key={id}
                  providerId={id}
                  isDefault={settings.defaultProvider === id}
                  canBeDefault={configured.includes(id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
