'use client';

import * as React from 'react';
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockKeyhole,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { ModelCombobox, type ModelGroup } from '@/components/ui/ModelCombobox';
import { useToast } from '@/components/ui/Toast';
import { ProviderLogo } from '@/components/ai/ProviderLogo';
import { PROVIDERS } from '@/lib/ai/providers';
import { clearProvider, saveProviderSettings, setDefaultProvider } from '@/lib/ai/settings';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { generate } from '@/lib/ai/client';
import { listModels, clearModelsCache, type ListModelsResult } from '@/lib/ai/listModels';
import { useAuth } from '@/lib/auth/AuthContext';
import { useVault } from '@/lib/ai/VaultContext';
import { formatRelative } from '@/lib/ai/formatRelative';
import type { AiModel, AiProviderId } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

export interface ProviderCardProps {
  providerId: AiProviderId;
  isDefault: boolean;
  canBeDefault: boolean;
}

export function ProviderCard({ providerId, isDefault, canBeDefault }: ProviderCardProps) {
  const provider = PROVIDERS[providerId];
  const settings = useAiSettings();
  const stored = settings[providerId];
  const { user } = useAuth();
  const vault = useVault();
  const toast = useToast();
  const keyRequired = provider.requiresKey !== false;

  const hasEncryptedKey = Boolean(stored?.apiKeyEnc);
  const vaultUnlocked = vault.status === 'unlocked';
  // The vault is mandatory for API-key writes. Editing or saving a key is
  // blocked unless the vault is unlocked. Model-only edits remain allowed.
  const keyInputBlocked = keyRequired && !vaultUnlocked;

  const [apiKey, setApiKey] = React.useState(stored?.apiKey ?? '');
  const [defaultModel, setDefaultModelLocal] = React.useState(stored?.defaultModel ?? '');
  const [enabledIds, setEnabledIds] = React.useState<string[]>(() => {
    const ids = [stored?.defaultModel, ...(stored?.customModels ?? [])].filter(Boolean) as string[];
    return Array.from(new Set(ids));
  });
  const [customModel, setCustomModel] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'ok' | 'err' | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const [liveModels, setLiveModels] = React.useState<AiModel[] | null>(null);
  const [modelsSource, setModelsSource] = React.useState<ListModelsResult['source']>('static');
  const [modelsFetchedAt, setModelsFetchedAt] = React.useState<number | null>(null);
  const [modelsError, setModelsError] = React.useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = React.useState(false);

  // Stable dep for the customModels array so the sync effect only fires when
  // the contents actually change, not on every Firestore snapshot.
  const storedCustomKey = (stored?.customModels ?? []).join('|');

  React.useEffect(() => {
    setApiKey(stored?.apiKey ?? '');
    setDefaultModelLocal(stored?.defaultModel ?? '');
    const ids = [stored?.defaultModel, ...(stored?.customModels ?? [])].filter(Boolean) as string[];
    setEnabledIds(Array.from(new Set(ids)));
    setDirty(false);
    setTestResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.apiKey, stored?.defaultModel, storedCustomKey, provider.models]);

  // Stable ref to resolveApiKey so fetchModelsList can call it without
  // depending on the function identity (declared below).
  const resolveApiKeyRef = React.useRef<() => Promise<string | null>>(async () => null);

  const fetchModelsList = React.useCallback(
    async (force: boolean) => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const key = keyRequired ? await resolveApiKeyRef.current() : '';
        if (keyRequired && !key) {
          setModelsLoading(false);
          return;
        }
        const result = await listModels(providerId, key ?? '', { force });
        setLiveModels(result.models);
        setModelsSource(result.source);
        setModelsFetchedAt(result.fetchedAt ?? null);
        if (result.error) setModelsError(result.error);
      } catch (e) {
        setModelsError(e instanceof Error ? e.message : String(e));
      } finally {
        setModelsLoading(false);
      }
    },
    [providerId, keyRequired],
  );

  const hasKey =
    !keyRequired ||
    Boolean(apiKey.trim()) ||
    Boolean(stored?.apiKey) ||
    Boolean(stored?.apiKeyEnc && vaultUnlocked);

  const builtInModels: AiModel[] = liveModels ?? provider.models;

  // Fast lookup of model metadata by ID, falling back to a placeholder for
  // custom IDs that aren't in the built-in or live list.
  const modelById = React.useMemo(() => {
    const map = new Map<string, AiModel>();
    for (const m of provider.models) map.set(m.id, m);
    if (liveModels) for (const m of liveModels) map.set(m.id, m);
    return (id: string): AiModel => map.get(id) ?? { id, label: id };
  }, [provider.models, liveModels]);

  // Models the user could still pick from in the "Add another model" picker.
  const addableModels: AiModel[] = builtInModels.filter((m) => !enabledIds.includes(m.id));
  const addModelGroups: ModelGroup[] = [
    {
      label: modelsSource === 'live' || modelsSource === 'cache' ? 'Live' : 'Built-in',
      models: addableModels,
    },
  ];

  /** Get the plaintext API key for outbound calls (test / generate). */
  resolveApiKeyRef.current = resolveApiKey;

  async function resolveApiKey(): Promise<string | null> {
    const fresh = apiKey.trim();
    if (fresh) return fresh;
    if (stored?.apiKey) return stored.apiKey;
    if (stored?.apiKeyEnc) {
      if (!vaultUnlocked) {
        toast.warning('Vault is locked', {
          description: 'Unlock the vault above to use this saved API key.',
        });
        return null;
      }
      try {
        return await vault.decrypt(stored.apiKeyEnc);
      } catch {
        toast.error('Could not decrypt this key', {
          description: 'The passphrase may have changed. Re-paste the key to fix it.',
        });
        return null;
      }
    }
    return null;
  }

  async function save() {
    if (!user) return;
    const trimmed = apiKey.trim();
    const wantsKeyUpdate = keyRequired && trimmed.length > 0;
    if (wantsKeyUpdate && !vaultUnlocked) {
      toast.warning('Vault is locked', {
        description: 'Unlock the vault before saving a new API key.',
      });
      return;
    }
    setSaving(true);
    try {
      const others = enabledIds.filter((id) => id !== defaultModel);
      const modelPayload = { defaultModel, customModels: others };
      if (wantsKeyUpdate) {
        const enc = await vault.encrypt(trimmed);
        await saveProviderSettings(user.uid, providerId, {
          ...modelPayload,
          apiKeyEnc: enc,
        });
        setApiKey('');
      } else {
        // Model-only update — leave any existing key (encrypted or absent) alone.
        await saveProviderSettings(user.uid, providerId, modelPayload);
      }
      setDirty(false);
      toast.success(`${provider.name} saved`, {
        description: wantsKeyUpdate
          ? 'API key encrypted and models updated.'
          : `${enabledIds.length} model${enabledIds.length === 1 ? '' : 's'} enabled for this provider.`,
      });
    } catch (e) {
      toast.error(`Could not save ${provider.name}`, {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!user) return;
    try {
      await clearProvider(user.uid, providerId);
      clearModelsCache(providerId);
      setApiKey('');
      setDefaultModelLocal(provider.models[0].id);
      setEnabledIds([provider.models[0].id]);
      setCustomModel('');
      setLiveModels(null);
      setModelsSource('static');
      setModelsFetchedAt(null);
      setModelsError(null);
      setDirty(false);
      setTestResult(null);
      toast.success(`${provider.name} disconnected`, {
        description: 'Saved API key and settings were removed from your account.',
      });
    } catch (e) {
      toast.error(`Could not disconnect ${provider.name}`, {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    }
  }

  function enableModel(id: string) {
    if (!id) return;
    if (enabledIds.includes(id)) {
      toast.info('Model already enabled', {
        description: `"${id}" is already in your list.`,
      });
      return;
    }
    setEnabledIds((prev) => [...prev, id]);
    // First model added is automatically the default.
    if (!defaultModel) setDefaultModelLocal(id);
    setDirty(true);
  }

  function disableModel(id: string) {
    if (!enabledIds.includes(id)) return;
    const remaining = enabledIds.filter((x) => x !== id);
    setEnabledIds(remaining);
    // If we just removed the default, promote the next remaining model so
    // there's always a default while any model is enabled.
    if (id === defaultModel) setDefaultModelLocal(remaining[0] ?? '');
    setDirty(true);
  }

  function makeDefaultModel(id: string) {
    if (id === defaultModel) return;
    setDefaultModelLocal(id);
    setEnabledIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDirty(true);
  }

  function addCustomLocal() {
    const m = customModel.trim();
    if (!m) return;
    if (enabledIds.includes(m)) {
      toast.info('Model already enabled', {
        description: `"${m}" is already in your list.`,
      });
      setCustomModel('');
      return;
    }
    setEnabledIds((prev) => [...prev, m]);
    if (!defaultModel) setDefaultModelLocal(m);
    setCustomModel('');
    setDirty(true);
  }

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const key = keyRequired ? await resolveApiKey() : '';
      if (keyRequired && !key) {
        setTesting(false);
        return;
      }
      const result = await generate({
        provider: providerId,
        model: defaultModel,
        apiKey: key ?? '',
        messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
        maxTokens: 20,
        temperature: 0,
      });
      const ok = /pong/i.test(result.text);
      setTestResult(ok ? 'ok' : 'err');
      if (ok) {
        toast.success('Connection works', {
          description: `${provider.name} responded successfully.`,
        });
      } else {
        toast.warning('Unexpected reply', {
          description: `Got: "${result.text.slice(0, 80)}"`,
        });
      }
    } catch (e) {
      setTestResult('err');
      const msg = e instanceof Error ? e.message : 'Connection failed';
      toast.error('Connection failed', { description: msg.slice(0, 200) });
    } finally {
      setTesting(false);
    }
  }

  const connected =
    Boolean(stored?.defaultModel) &&
    (keyRequired ? Boolean(stored?.apiKey || stored?.apiKeyEnc) : true);
  // For key-required providers, every save (including model-only edits) is
  // gated on the vault being unlocked.
  const canSave = dirty && enabledIds.length > 0 && (!keyRequired || vaultUnlocked);
  const canTest =
    Boolean(defaultModel) &&
    (keyRequired
      ? Boolean(apiKey.trim() || stored?.apiKey || (stored?.apiKeyEnc && vaultUnlocked))
      : true);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
              <ProviderLogo providerId={providerId} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                {provider.name}
                {provider.badge && (
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                    {provider.badge}
                  </span>
                )}
                {connected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                )}
                {hasEncryptedKey && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                    <LockKeyhole className="h-3 w-3" /> Encrypted
                  </span>
                )}
                {isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                    <Star className="h-3 w-3" /> Default
                  </span>
                )}
              </h3>
              <p className="mt-1 text-xs text-muted">{provider.apiKeyHint}</p>
              {provider.notes && <p className="mt-1 text-xs text-muted">{provider.notes}</p>}
            </div>
          </div>
          <a
            href={provider.apiKeyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
          >
            {keyRequired ? 'Get a key' : 'Install'} <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {keyRequired ? (
          <div>
            <Label>{provider.apiKeyLabel}</Label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={
                    vault.status === 'disabled'
                      ? 'Enable the vault above to add an API key'
                      : vault.status === 'locked'
                        ? hasEncryptedKey
                          ? '••• stored encrypted — unlock vault to replace'
                          : 'Unlock the vault above to add an API key'
                        : hasEncryptedKey
                          ? 'Replace with a new key…'
                          : 'Paste your key…'
                  }
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setDirty(true);
                    setTestResult(null);
                  }}
                  disabled={keyInputBlocked}
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            {vaultUnlocked ? (
              <p className="mt-1.5 text-[11px] text-muted">
                <LockKeyhole className="mr-1 inline h-3 w-3 text-accent" />
                This key will be encrypted in your browser before being saved.
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted">
                <Lock className="mr-1 inline h-3 w-3" />
                {vault.status === 'disabled'
                  ? 'API keys can only be saved after you enable a vault.'
                  : 'API keys can only be saved while the vault is unlocked.'}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface-2/40 p-3 text-xs text-muted">
            No API key needed — calls go to{' '}
            <code className="font-mono text-fg">{provider.baseUrl}</code>. Make sure Ollama is
            running and started with{' '}
            <code className="font-mono text-fg">OLLAMA_ORIGINS=&quot;*&quot;</code> so the browser
            can reach it.
          </div>
        )}

        <div>
          <div className="flex items-end justify-between gap-2">
            <Label>Models</Label>
            <span className="text-[11px] text-muted">{enabledIds.length} enabled</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Pick every model you want available in the tool pickers. The first one you add becomes
            the default — star another to switch.
          </p>

          {enabledIds.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-border bg-surface-2/40 px-3 py-4 text-center text-xs text-muted">
              No models selected yet. Pick one below to get started.
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface-2/40">
              {enabledIds.map((id) => {
                const m = modelById(id);
                const isModelDefault = id === defaultModel;
                return (
                  <li key={id} className="flex items-center gap-2 px-2.5 py-2">
                    <button
                      type="button"
                      onClick={() => makeDefaultModel(id)}
                      disabled={keyInputBlocked || isModelDefault}
                      title={
                        isModelDefault
                          ? 'Default model used for new requests'
                          : 'Make this the default model'
                      }
                      aria-label={isModelDefault ? 'Default model' : `Make ${m.label} default`}
                      className={cn(
                        'shrink-0 rounded p-1 transition-colors disabled:cursor-default',
                        isModelDefault ? 'text-accent' : 'text-muted hover:text-accent',
                      )}
                    >
                      <Star className={cn('h-3.5 w-3.5', isModelDefault && 'fill-current')} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{m.label}</span>
                        {isModelDefault && (
                          <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">
                            Default
                          </span>
                        )}
                      </div>
                      {m.label !== m.id && (
                        <div className="truncate font-mono text-[11px] text-muted">{m.id}</div>
                      )}
                      {m.description && (
                        <div className="truncate text-[11px] text-muted">{m.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => disableModel(id)}
                      disabled={keyInputBlocked}
                      title="Remove from enabled models"
                      aria-label={`Remove ${m.label}`}
                      className="shrink-0 rounded p-1 text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 hover:disabled:text-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <ModelCombobox
            className="mt-2"
            value=""
            placeholder={
              addableModels.length === 0
                ? 'All listed models are enabled'
                : enabledIds.length === 0
                  ? 'Select a model to get started…'
                  : 'Add another model…'
            }
            disabled={keyInputBlocked || addableModels.length === 0}
            groups={addModelGroups}
            loading={modelsLoading}
            onRefresh={hasKey ? () => void fetchModelsList(true) : undefined}
            onFirstOpen={
              hasKey && liveModels === null ? () => void fetchModelsList(false) : undefined
            }
            onChange={(id) => enableModel(id)}
            footer={
              <span className="flex items-center justify-between gap-2">
                <span>
                  {modelsSource === 'live' && 'Fetched from the provider just now'}
                  {modelsSource === 'cache' && modelsFetchedAt && (
                    <>Cached — fetched {formatRelative(modelsFetchedAt)}</>
                  )}
                  {modelsSource === 'static' && !modelsError && 'Showing built-in defaults'}
                  {modelsSource === 'static' &&
                    modelsError &&
                    `Live fetch failed — showing built-in defaults (${modelsError.slice(0, 60)})`}
                </span>
                <span>{addableModels.length} available</span>
              </span>
            }
          />

          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Or type a custom model ID (e.g. llama-3.1-70b)"
              value={customModel}
              disabled={keyInputBlocked}
              onChange={(e) => setCustomModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomLocal();
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={addCustomLocal}
              disabled={!customModel.trim() || keyInputBlocked}
            >
              Add
            </Button>
          </div>

          {!hasKey && keyRequired && (
            <p className="mt-1.5 text-[11px] text-muted">
              Add an API key above to load this provider&apos;s live model list.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={save} disabled={!canSave || saving}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={runTest}
            disabled={!canTest || testing}
            className={cn(
              testResult === 'ok' && 'border-success/40 text-success',
              testResult === 'err' && 'border-danger/40 text-danger',
            )}
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing…
              </>
            ) : testResult === 'ok' ? (
              <>
                <Check className="h-3.5 w-3.5" /> Works
              </>
            ) : (
              'Test connection'
            )}
          </Button>
          {connected && (
            <>
              {!isDefault && canBeDefault && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void setDefaultProvider(user.uid, providerId)
                      .then(() => {
                        toast.success('Default provider updated', {
                          description: `${provider.name} will now be used for new requests.`,
                        });
                      })
                      .catch((e) => {
                        toast.error('Could not set default provider', {
                          description:
                            e instanceof Error ? e.message : 'Please try again in a moment.',
                        });
                      });
                  }}
                >
                  Make default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-danger"
                onClick={disconnect}
              >
                <Trash2 className="h-3.5 w-3.5" /> Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
