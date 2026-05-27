'use client';

import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import type { AiProviderId, AiSettings, ProviderSettings } from './types';
import { PROVIDER_IDS } from './providers';

export const SETTINGS_EVENT = 'qa-hub-ai-settings-changed';

/** Firestore shape - nested so `providers` doesn't collide with metadata keys. */
interface StoredAiSettings {
  defaultProvider?: AiProviderId;
  providers?: Partial<Record<AiProviderId, ProviderSettings>>;
}

function ref(uid: string) {
  const { db } = getFirebase();
  if (!db) return null;
  return doc(db, 'users', uid, 'settings', 'ai');
}

function toAiSettings(data: StoredAiSettings | undefined): AiSettings {
  if (!data) return {};
  const out: AiSettings = {};
  if (data.defaultProvider) out.defaultProvider = data.defaultProvider;
  for (const id of PROVIDER_IDS) {
    const entry = data.providers?.[id];
    if (entry) out[id] = entry;
  }
  return out;
}

async function readRaw(uid: string): Promise<StoredAiSettings | undefined> {
  const r = ref(uid);
  if (!r) return undefined;
  const snap = await getDoc(r);
  if (!snap.exists()) return undefined;
  return snap.data() as StoredAiSettings;
}

async function writeRaw(uid: string, value: StoredAiSettings): Promise<void> {
  const r = ref(uid);
  if (!r) throw new Error('Firebase is not configured.');
  await setDoc(r, { ...value, updatedAt: serverTimestamp() });
}

function notify() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
}

/** Fetch the current AI settings for a user (one-shot). */
export async function loadSettings(uid: string): Promise<AiSettings> {
  return toAiSettings(await readRaw(uid));
}

export async function saveProviderSettings(
  uid: string,
  id: AiProviderId,
  partial: Partial<ProviderSettings>,
): Promise<void> {
  const current = (await readRaw(uid)) ?? {};
  const existing = current.providers?.[id] ?? { defaultModel: '', customModels: [] };
  const next: ProviderSettings = {
    defaultModel: partial.defaultModel ?? existing.defaultModel,
    customModels: partial.customModels ?? existing.customModels,
  };
  // Handle apiKeyEnc with explicit-presence semantics so callers can clear it.
  if ('apiKeyEnc' in partial) {
    if (partial.apiKeyEnc) next.apiKeyEnc = partial.apiKeyEnc;
    // else: omit -> removes the field on the next setDoc.
  } else if (existing.apiKeyEnc) {
    next.apiKeyEnc = existing.apiKeyEnc;
  }
  await writeRaw(uid, {
    ...current,
    providers: { ...(current.providers ?? {}), [id]: next },
  });
  notify();
}

export async function clearProvider(uid: string, id: AiProviderId): Promise<void> {
  const current = (await readRaw(uid)) ?? {};
  const providers = { ...(current.providers ?? {}) };
  delete providers[id];
  const next: StoredAiSettings = { ...current, providers };
  if (next.defaultProvider === id) delete next.defaultProvider;
  await writeRaw(uid, next);
  notify();
}

export async function setDefaultProvider(uid: string, id: AiProviderId | undefined): Promise<void> {
  const current = (await readRaw(uid)) ?? {};
  const next: StoredAiSettings = { ...current };
  if (id) next.defaultProvider = id;
  else delete next.defaultProvider;
  await writeRaw(uid, next);
  notify();
}

/** Live subscription. Returns unsubscribe. */
export function subscribeSettings(uid: string, onChange: (value: AiSettings) => void): () => void {
  const r = ref(uid);
  if (!r) {
    onChange({});
    return () => {};
  }
  return onSnapshot(
    r,
    (snap) => onChange(toAiSettings(snap.exists() ? (snap.data() as StoredAiSettings) : undefined)),
    () => onChange({}),
  );
}

/** Delete the entire AI settings doc for the user. */
export async function deleteAllSettings(uid: string): Promise<void> {
  const r = ref(uid);
  if (!r) return;
  await deleteDoc(r);
  notify();
}
