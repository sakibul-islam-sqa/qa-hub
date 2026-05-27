'use client';

import type { AiModel, AiProviderId, AiSettings } from './types';
import { PROVIDERS, PROVIDER_IDS } from './providers';

export function isConfigured(settings: AiSettings, id: AiProviderId): boolean {
  const provider = PROVIDERS[id];
  const entry = settings[id];
  if (!entry?.defaultModel) return false;
  if (provider.requiresKey === false) return true;
  return Boolean(entry.apiKey || entry.apiKeyEnc);
}

export function configuredProviders(settings: AiSettings): AiProviderId[] {
  return PROVIDER_IDS.filter((id) => isConfigured(settings, id));
}

export function resolveDefaultPick(
  settings: AiSettings,
): { provider: AiProviderId; model: string } | null {
  const available = configuredProviders(settings);
  if (!available.length) return null;
  const preferred =
    settings.defaultProvider && available.includes(settings.defaultProvider)
      ? settings.defaultProvider
      : available[0];
  const model = settings[preferred]?.defaultModel ?? PROVIDERS[preferred].models[0].id;
  return { provider: preferred, model };
}

export function listModels(settings: AiSettings, id: AiProviderId): AiModel[] {
  const builtin: AiModel[] = PROVIDERS[id].models;
  const custom: AiModel[] = (settings[id]?.customModels ?? []).map((m) => ({ id: m, label: m }));
  return [...builtin, ...custom];
}

/**
 * Models the user has actually connected for this provider: their saved
 * defaultModel plus any custom models they added. Tool pages should use
 * this instead of {@link listModels} so users aren't offered models they
 * haven't verified work with their key.
 */
export function configuredModels(settings: AiSettings, id: AiProviderId): AiModel[] {
  const entry = settings[id];
  if (!entry) return [];
  const builtinMap = new Map<string, AiModel>(PROVIDERS[id].models.map((m) => [m.id, m]));
  const result: AiModel[] = [];
  if (entry.defaultModel) {
    result.push(
      builtinMap.get(entry.defaultModel) ?? {
        id: entry.defaultModel,
        label: entry.defaultModel,
      },
    );
  }
  for (const customId of entry.customModels ?? []) {
    if (customId === entry.defaultModel) continue;
    result.push({ id: customId, label: customId });
  }
  return result;
}

export {
  loadSettings,
  saveProviderSettings,
  clearProvider,
  setDefaultProvider,
  subscribeSettings,
  deleteAllSettings,
  SETTINGS_EVENT,
} from './settingsStore';
