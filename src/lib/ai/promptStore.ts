'use client';

import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';

export type PromptKey = 'test-cases' | 'bug-report' | 'qa-chat';

export const PROMPTS_EVENT = 'qa-hub-prompts-changed';

function ref(uid: string, key: PromptKey) {
  const { db } = getFirebase();
  if (!db) return null;
  return doc(db, 'users', uid, 'prompts', key);
}

function notify() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROMPTS_EVENT));
}

export async function loadPrompt(uid: string, key: PromptKey): Promise<string | null> {
  const r = ref(uid, key);
  if (!r) return null;
  const snap = await getDoc(r);
  if (!snap.exists()) return null;
  const data = snap.data();
  return typeof data.value === 'string' ? data.value : null;
}

export async function savePrompt(uid: string, key: PromptKey, value: string): Promise<void> {
  const r = ref(uid, key);
  if (!r) throw new Error('Firebase is not configured.');
  await setDoc(r, { value, updatedAt: serverTimestamp() });
  notify();
}

export async function resetPrompt(uid: string, key: PromptKey): Promise<void> {
  const r = ref(uid, key);
  if (!r) return;
  await deleteDoc(r);
  notify();
}

/**
 * Subscribe to live updates for a single prompt. Returns an unsubscribe fn.
 * Calls `onChange(value | null)` whenever the document changes.
 */
export function subscribePrompt(
  uid: string,
  key: PromptKey,
  onChange: (value: string | null) => void,
): () => void {
  const r = ref(uid, key);
  if (!r) {
    onChange(null);
    return () => {};
  }
  return onSnapshot(
    r,
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data();
      onChange(typeof data.value === 'string' ? data.value : null);
    },
    () => onChange(null),
  );
}
