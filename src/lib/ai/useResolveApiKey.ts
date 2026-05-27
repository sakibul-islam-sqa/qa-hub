'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAiSettings } from './useAiSettings';
import { useVault } from './VaultContext';
import { PROVIDERS } from './providers';
import type { AiProviderId } from './types';

/**
 * Resolve the API key for an AI provider, handling both plaintext-stored
 * keys and vault-encrypted ones, and surfacing the right toast for each
 * failure mode (vault locked, decryption failed, no key configured).
 *
 * Returns null when no usable key is available — callers should `return`
 * early when that happens (the toast has already been shown).
 *
 * Extracted to avoid drift across ai-chat / ai-bug-report / ai-test-cases
 * which previously each duplicated ~30 lines of this logic and had subtly
 * different copy.
 */
export function useResolveApiKey() {
  const toast = useToast();
  const settings = useAiSettings();
  const vault = useVault();

  // Hold a ref to the latest settings/vault so the returned function isn't
  // recomputed on every settings change — important for callers that close
  // over it inside async send handlers.
  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;
  const vaultRef = React.useRef(vault);
  vaultRef.current = vault;

  return React.useCallback(
    async (providerId: AiProviderId): Promise<string | null> => {
      const provider = PROVIDERS[providerId];
      const requiresKey = provider.requiresKey !== false;
      const entry = settingsRef.current[providerId];

      let apiKey = entry?.apiKey ?? '';
      if (!apiKey && entry?.apiKeyEnc) {
        if (vaultRef.current.status !== 'unlocked') {
          toast.warning('Vault is locked', {
            description: 'Unlock your vault in AI settings to use this key.',
          });
          return null;
        }
        try {
          apiKey = await vaultRef.current.decrypt(entry.apiKeyEnc);
        } catch {
          toast.error('Could not decrypt API key', {
            description: 'The passphrase may have changed. Re-paste the key to fix it.',
          });
          return null;
        }
      }

      if (!apiKey && requiresKey) {
        toast.warning('API key missing', {
          description: 'Add an API key for the selected provider in AI settings.',
        });
        return null;
      }
      return apiKey;
    },
    [toast],
  );
}
