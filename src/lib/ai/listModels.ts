import { PROVIDERS } from './providers';
import type { AiModel, AiProviderId } from './types';

const CACHE_TTL_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = 'qa-hub:ai-models:';

interface CacheEntry {
  models: AiModel[];
  fetchedAt: number;
}

const memCache = new Map<AiProviderId, CacheEntry>();

function readSession(providerId: AiProviderId): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + providerId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || !Array.isArray(parsed.models)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(providerId: AiProviderId, entry: CacheEntry) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + providerId, JSON.stringify(entry));
  } catch {
    // quota or disabled storage - ignore
  }
}

export function clearModelsCache(providerId?: AiProviderId) {
  if (providerId) {
    memCache.delete(providerId);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_PREFIX + providerId);
    }
  } else {
    memCache.clear();
    if (typeof window !== 'undefined') {
      const keys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => window.sessionStorage.removeItem(k));
    }
  }
}

export interface ListModelsResult {
  models: AiModel[];
  source: 'live' | 'cache' | 'static';
  fetchedAt?: number;
  /** Set when source is 'static' because the live fetch failed. */
  error?: string;
}

/**
 * Returns the list of models for a provider. Tries (in order):
 *   1. in-memory / sessionStorage cache (if not forced and not expired)
 *   2. live provider /models endpoint
 *   3. static built-in list from PROVIDERS
 */
export async function listModels(
  providerId: AiProviderId,
  apiKey: string,
  opts: { force?: boolean; signal?: AbortSignal } = {},
): Promise<ListModelsResult> {
  const staticModels = PROVIDERS[providerId].models;

  if (!opts.force) {
    const cached = memCache.get(providerId) ?? readSession(providerId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      memCache.set(providerId, cached);
      return { models: cached.models, source: 'cache', fetchedAt: cached.fetchedAt };
    }
  }

  try {
    const live = await fetchLive(providerId, apiKey, opts.signal);
    if (live.length > 0) {
      const entry: CacheEntry = { models: live, fetchedAt: Date.now() };
      memCache.set(providerId, entry);
      writeSession(providerId, entry);
      return { models: live, source: 'live', fetchedAt: entry.fetchedAt };
    }
    return { models: staticModels, source: 'static' };
  } catch (e) {
    return {
      models: staticModels,
      source: 'static',
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function fetchLive(
  providerId: AiProviderId,
  apiKey: string,
  signal?: AbortSignal,
): Promise<AiModel[]> {
  switch (providerId) {
    case 'openai':
      return fetchOpenAICompatible('https://api.openai.com/v1/models', apiKey, signal);
    case 'openrouter':
      return fetchOpenRouter(apiKey, signal);
    case 'groq':
      return fetchOpenAICompatible('https://api.groq.com/openai/v1/models', apiKey, signal);
    case 'mistral':
      return fetchOpenAICompatible('https://api.mistral.ai/v1/models', apiKey, signal);
    case 'cerebras':
      return fetchOpenAICompatible('https://api.cerebras.ai/v1/models', apiKey, signal);
    case 'github':
      return fetchGithubModels(apiKey, signal);
    case 'gemini':
      return fetchGemini(apiKey, signal);
    case 'anthropic':
      return fetchAnthropic(apiKey, signal);
    case 'ollama':
      return fetchOllama(signal);
  }
}

/* ----------------------------- OpenAI-shaped ---------------------------- */

interface OpenAIModelsResponse {
  data?: Array<{ id: string; [k: string]: unknown }>;
}

async function fetchOpenAICompatible(
  url: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<AiModel[]> {
  if (!apiKey) return [];
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  const json = (await res.json()) as OpenAIModelsResponse;
  return (json.data ?? [])
    .map((m) => ({ id: m.id, label: m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ------------------------------- OpenRouter ----------------------------- */

interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;
  pricing?: { prompt?: string; completion?: string };
}

async function fetchOpenRouter(apiKey: string, signal?: AbortSignal): Promise<AiModel[]> {
  // OpenRouter's /models endpoint is public - auth optional.
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch('https://openrouter.ai/api/v1/models', { headers, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  const json = (await res.json()) as { data?: OpenRouterModel[] };
  return (json.data ?? [])
    .map((m) => {
      const isFree =
        m.id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0');
      const description = isFree ? 'Free' : undefined;
      return {
        id: m.id,
        label: m.name || m.id,
        description,
      };
    })
    .sort((a, b) => {
      // Free models first, then alphabetical.
      const aFree = a.description === 'Free' ? 0 : 1;
      const bFree = b.description === 'Free' ? 0 : 1;
      if (aFree !== bFree) return aFree - bFree;
      return a.id.localeCompare(b.id);
    });
}

/* ----------------------------- GitHub Models ---------------------------- */

interface GithubCatalogModel {
  id?: string;
  name?: string;
  publisher?: string;
  summary?: string;
}

async function fetchGithubModels(apiKey: string, signal?: AbortSignal): Promise<AiModel[]> {
  if (!apiKey) return [];
  const res = await fetch('https://models.github.ai/catalog/models', {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  const json = (await res.json()) as GithubCatalogModel[];
  if (!Array.isArray(json)) return [];
  return json
    .map((m) => {
      const id = m.id || (m.publisher && m.name ? `${m.publisher}/${m.name}` : m.name || '');
      if (!id) return null;
      return { id, label: m.name || id, description: m.summary } as AiModel;
    })
    .filter((m): m is AiModel => m !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* --------------------------------- Gemini ------------------------------- */

interface GeminiModel {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

async function fetchGemini(apiKey: string, signal?: AbortSignal): Promise<AiModel[]> {
  if (!apiKey) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  const json = (await res.json()) as { models?: GeminiModel[] };
  return (json.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => {
      const id = m.name.startsWith('models/') ? m.name.slice('models/'.length) : m.name;
      return {
        id,
        label: m.displayName || id,
        description: m.description ? m.description.slice(0, 80) : undefined,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ------------------------------- Anthropic ------------------------------ */

interface AnthropicModel {
  id: string;
  display_name?: string;
  created_at?: string;
}

async function fetchAnthropic(apiKey: string, signal?: AbortSignal): Promise<AiModel[]> {
  if (!apiKey) return [];
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  const json = (await res.json()) as { data?: AnthropicModel[] };
  return (json.data ?? [])
    .map((m) => ({ id: m.id, label: m.display_name || m.id }))
    .sort((a, b) => b.id.localeCompare(a.id)); // newest first
}

/* --------------------------------- Ollama ------------------------------- */

async function fetchOllama(signal?: AbortSignal): Promise<AiModel[]> {
  const res = await fetch('http://localhost:11434/v1/models', { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as OpenAIModelsResponse;
  return (json.data ?? [])
    .map((m) => ({ id: m.id, label: m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 200);
  } catch {
    return '';
  }
}
