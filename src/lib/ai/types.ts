export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'github'
  | 'mistral'
  | 'cerebras'
  | 'ollama';

export type ProviderKind = 'openai-compatible' | 'anthropic' | 'gemini';

export interface AiModel {
  id: string;
  label: string;
  description?: string;
}

export interface AiProvider {
  id: AiProviderId;
  name: string;
  kind: ProviderKind;
  apiKeyLabel: string;
  apiKeyHint: string;
  apiKeyUrl: string;
  models: AiModel[];
  /** OpenAI-compatible providers: full URL to the chat completions endpoint. */
  baseUrl?: string;
  /** OpenAI-compatible providers: extra headers always sent with each request. */
  extraHeaders?: Record<string, string>;
  /** If false, requests don't need an API key (e.g. Ollama running locally). */
  requiresKey?: boolean;
  /** Short label shown next to the name, e.g. "Free tier" / "Local". */
  badge?: string;
  /** One-line note shown on the settings card. */
  notes?: string;
}

export interface EncryptedApiKey {
  ct: string;
  iv: string;
}

export interface ProviderSettings {
  /**
   * Legacy plaintext key - only present on pre-vault docs. New saves use
   * `apiKeyEnc` exclusively. Keep this field readable for backward compat
   * but never write it.
   */
  apiKey?: string;
  /** Encrypted API key. Required for any provider that needs auth. */
  apiKeyEnc?: EncryptedApiKey;
  defaultModel: string;
  customModels: string[];
}

export type AiSettings = Partial<Record<AiProviderId, ProviderSettings>> & {
  defaultProvider?: AiProviderId;
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onDelta?: (chunk: string) => void;
}

export interface GenerateResult {
  text: string;
  model: string;
  provider: AiProviderId;
}

export class AiError extends Error {
  status?: number;
  provider: AiProviderId;
  constructor(provider: AiProviderId, message: string, status?: number) {
    super(message);
    this.name = 'AiError';
    this.provider = provider;
    this.status = status;
  }
}
