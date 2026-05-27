import { PROVIDERS } from './providers';
import type { ChatMessage, GenerateOptions, GenerateResult } from './types';
import { AiError } from './types';

/**
 * Recognize aborts robustly: native fetch throws a DOMException with name
 * 'AbortError', but stream consumers may rethrow a regular Error with the
 * same name, and some shims construct it without `DOMException`. Accept any
 * thrown value whose `name` is 'AbortError'.
 */
export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException) return e.name === 'AbortError';
  if (e instanceof Error) return e.name === 'AbortError';
  return false;
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const provider = PROVIDERS[opts.provider];
  switch (provider.kind) {
    case 'openai-compatible':
      return generateOpenAICompatible(opts);
    case 'anthropic':
      return generateAnthropic(opts);
    case 'gemini':
      return generateGemini(opts);
  }
}

async function* readSSE(response: Response, signal?: AbortSignal): AsyncGenerator<string> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || !line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        yield data;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

async function parseError(
  provider: GenerateOptions['provider'],
  response: Response,
): Promise<AiError> {
  let message = `${provider} request failed (${response.status})`;
  try {
    const text = await response.text();
    try {
      const j = JSON.parse(text);
      message = j?.error?.message || j?.error || j?.message || text || message;
      if (typeof message !== 'string') message = JSON.stringify(message);
    } catch {
      if (text) message = text;
    }
  } catch {
    // ignore body read failure
  }
  return new AiError(provider, message, response.status);
}

async function generateOpenAICompatible(opts: GenerateOptions): Promise<GenerateResult> {
  const provider = PROVIDERS[opts.provider];
  if (!provider.baseUrl) {
    throw new AiError(opts.provider, `Missing baseUrl for ${opts.provider}`);
  }

  const messages: ChatMessage[] = opts.system
    ? [{ role: 'system', content: opts.system }, ...opts.messages]
    : opts.messages;

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.maxTokens != null) body.max_tokens = opts.maxTokens;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.extraHeaders ?? {}),
  };
  if (provider.requiresKey !== false && opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    const msg =
      opts.provider === 'ollama'
        ? `Could not reach Ollama at ${provider.baseUrl}. Is Ollama running? Set OLLAMA_ORIGINS="*" in its environment so the browser can call it.`
        : `Network error calling ${provider.name}: ${e instanceof Error ? e.message : String(e)}`;
    throw new AiError(opts.provider, msg);
  }

  if (!response.ok) throw await parseError(opts.provider, response);

  let full = '';
  for await (const data of readSSE(response, opts.signal)) {
    if (data === '[DONE]') break;
    try {
      const json = JSON.parse(data);
      const delta: string | undefined =
        json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content;
      if (delta) {
        full += delta;
        opts.onDelta?.(delta);
      }
    } catch {
      // skip malformed chunks
    }
  }
  return { text: full, model: opts.model, provider: opts.provider };
}

async function generateAnthropic(opts: GenerateOptions): Promise<GenerateResult> {
  const body = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: opts.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok) throw await parseError('anthropic', response);

  let full = '';
  for await (const data of readSSE(response, opts.signal)) {
    try {
      const json = JSON.parse(data);
      if (json.type === 'content_block_delta') {
        const delta: string | undefined = json?.delta?.text;
        if (delta) {
          full += delta;
          opts.onDelta?.(delta);
        }
      } else if (json.type === 'error') {
        throw new AiError('anthropic', json?.error?.message || 'Anthropic stream error');
      }
    } catch (e) {
      if (e instanceof AiError) throw e;
      // skip malformed chunks
    }
  }
  return { text: full, model: opts.model, provider: 'anthropic' };
}

async function generateGemini(opts: GenerateOptions): Promise<GenerateResult> {
  const contents = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens,
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  // Send the API key via header rather than the query string so it doesn't
  // end up in browser history, referer chains, or HAR exports.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': opts.apiKey,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok) throw await parseError('gemini', response);

  let full = '';
  for await (const data of readSSE(response, opts.signal)) {
    try {
      const json = JSON.parse(data);
      const parts: Array<{ text?: string }> | undefined = json?.candidates?.[0]?.content?.parts;
      const delta = parts?.map((p) => p.text ?? '').join('') ?? '';
      if (delta) {
        full += delta;
        opts.onDelta?.(delta);
      }
    } catch {
      // skip malformed chunks
    }
  }
  return { text: full, model: opts.model, provider: 'gemini' };
}
