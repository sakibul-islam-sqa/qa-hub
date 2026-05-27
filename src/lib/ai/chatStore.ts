'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import type { AiProviderId } from './types';

export interface ChatSummary {
  id: string;
  title: string;
  provider?: AiProviderId;
  model?: string;
  updatedAt: number;
  createdAt: number;
}

export interface ChatMessageDoc {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: AiProviderId;
  model?: string;
  createdAt: number;
}

function chatsCol(uid: string) {
  const { db } = getFirebase();
  if (!db) return null;
  return collection(db, 'users', uid, 'chats');
}

function chatRef(uid: string, chatId: string) {
  const { db } = getFirebase();
  if (!db) return null;
  return doc(db, 'users', uid, 'chats', chatId);
}

function messagesCol(uid: string, chatId: string) {
  const { db } = getFirebase();
  if (!db) return null;
  return collection(db, 'users', uid, 'chats', chatId, 'messages');
}

function tsToMillis(t: unknown): number {
  if (!t) return 0;
  if (typeof t === 'object' && t !== null && 'toMillis' in t) {
    return (t as Timestamp).toMillis();
  }
  return 0;
}

export async function createChat(
  uid: string,
  init: { title?: string; provider?: AiProviderId; model?: string } = {},
): Promise<string> {
  const col = chatsCol(uid);
  if (!col) throw new Error('Firebase is not configured.');
  const data: Record<string, unknown> = {
    title: init.title?.trim() || 'New chat',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (init.provider) data.provider = init.provider;
  if (init.model) data.model = init.model;
  const ref = await addDoc(col, data);
  return ref.id;
}

export async function updateChatMeta(
  uid: string,
  chatId: string,
  patch: { title?: string; provider?: AiProviderId; model?: string },
): Promise<void> {
  const ref = chatRef(uid, chatId);
  if (!ref) throw new Error('Firebase is not configured.');
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.title !== undefined) data.title = patch.title.trim() || 'Untitled chat';
  if (patch.provider !== undefined) data.provider = patch.provider;
  if (patch.model !== undefined) data.model = patch.model;
  await updateDoc(ref, data);
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  const { db } = getFirebase();
  const ref = chatRef(uid, chatId);
  const msgs = messagesCol(uid, chatId);
  if (!db || !ref || !msgs) return;
  const snap = await getDocs(msgs);
  // Batch up to 450 deletes per round (Firestore limit is 500).
  let batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    if (count >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  await deleteDoc(ref);
}

export async function appendMessage(
  uid: string,
  chatId: string,
  msg: { role: 'user' | 'assistant'; content: string; provider?: AiProviderId; model?: string },
): Promise<string> {
  const col = messagesCol(uid, chatId);
  const ref = chatRef(uid, chatId);
  if (!col || !ref) throw new Error('Firebase is not configured.');
  const data: Record<string, unknown> = {
    role: msg.role,
    content: msg.content,
    createdAt: serverTimestamp(),
  };
  if (msg.provider) data.provider = msg.provider;
  if (msg.model) data.model = msg.model;
  const added = await addDoc(col, data);
  await updateDoc(ref, { updatedAt: serverTimestamp() });
  return added.id;
}

export async function updateMessage(
  uid: string,
  chatId: string,
  messageId: string,
  content: string,
): Promise<void> {
  const { db } = getFirebase();
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid, 'chats', chatId, 'messages', messageId),
    { content },
    { merge: true },
  );
  const ref = chatRef(uid, chatId);
  if (ref) await updateDoc(ref, { updatedAt: serverTimestamp() });
}

export function subscribeChats(uid: string, onChange: (chats: ChatSummary[]) => void): () => void {
  const col = chatsCol(uid);
  if (!col) {
    onChange([]);
    return () => {};
  }
  const q = query(col, orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChatSummary[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          title: (data.title as string) || 'Untitled chat',
          provider: data.provider as AiProviderId | undefined,
          model: data.model as string | undefined,
          createdAt: tsToMillis(data.createdAt),
          updatedAt: tsToMillis(data.updatedAt),
        };
      });
      onChange(items);
    },
    () => onChange([]),
  );
}

export function subscribeMessages(
  uid: string,
  chatId: string,
  onChange: (messages: ChatMessageDoc[]) => void,
): () => void {
  const col = messagesCol(uid, chatId);
  if (!col) {
    onChange([]);
    return () => {};
  }
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChatMessageDoc[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          role: (data.role as 'user' | 'assistant') ?? 'user',
          content: (data.content as string) ?? '',
          provider: data.provider as AiProviderId | undefined,
          model: data.model as string | undefined,
          createdAt: tsToMillis(data.createdAt),
        };
      });
      onChange(items);
    },
    () => onChange([]),
  );
}
