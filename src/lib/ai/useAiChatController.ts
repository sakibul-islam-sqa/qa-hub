'use client';

import * as React from 'react';
import type { User } from 'firebase/auth';
import { generate, isAbortError } from '@/lib/ai/client';
import {
  appendMessage,
  createChat,
  deleteChat,
  subscribeChats,
  subscribeMessages,
  updateChatMeta,
  type ChatMessageDoc,
  type ChatSummary,
} from '@/lib/ai/chatStore';
import { deriveTitle } from '@/lib/ai/deriveTitle';
import type { PickerValue } from '@/components/ai/ModelPicker';
import { useToast } from '@/components/ui/Toast';
import { useResolveApiKey } from '@/lib/ai/useResolveApiKey';

export interface AiChatController {
  chats: ChatSummary[];
  messages: ChatMessageDoc[];
  activeChatId: string | null;
  setActiveChatId(id: string | null): void;
  input: string;
  setInput(value: string): void;
  streaming: string;
  busy: boolean;
  send(args: { systemPrompt: string; pick: PickerValue | null }): Promise<void>;
  stop(): void;
  rename(chatId: string, title: string): Promise<void>;
  remove(chatId: string): Promise<{ wasActive: boolean; messageCount: number | null } | null>;
}

/**
 * Owns all chat side effects: Firestore subscriptions, optimistic input,
 * streaming generation, abort handling, and persistence of replies.
 * The page component is left with pure rendering.
 */
export function useAiChatController(user: User | null): AiChatController {
  const toast = useToast();
  const resolveApiKey = useResolveApiKey();

  const [chats, setChats] = React.useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessageDoc[]>([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    return subscribeChats(user.uid, setChats);
  }, [user]);

  React.useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }
    return subscribeMessages(user.uid, activeChatId, setMessages);
  }, [user, activeChatId]);

  // Auto-select the most recent chat once chats first arrive. After the
  // initial selection, a null activeChatId means the user explicitly chose
  // "New chat" — don't snap them back into an existing thread.
  const didAutoSelectRef = React.useRef(false);
  React.useEffect(() => {
    if (activeChatId) {
      if (chats.length && !chats.find((c) => c.id === activeChatId)) {
        // The active chat was deleted — fall back to the most recent.
        setActiveChatId(chats[0]?.id ?? null);
      }
      return;
    }
    if (!didAutoSelectRef.current && chats.length) {
      didAutoSelectRef.current = true;
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Reset the auto-select flag whenever the user changes — a fresh sign-in
  // should auto-pick the new user's most recent chat.
  React.useEffect(() => {
    didAutoSelectRef.current = false;
  }, [user]);

  const startNewChat = React.useCallback(
    async (pick: PickerValue | null): Promise<string | null> => {
      if (!user) return null;
      try {
        const id = await createChat(user.uid, {
          title: 'New chat',
          provider: pick?.provider,
          model: pick?.model,
        });
        setActiveChatId(id);
        return id;
      } catch (e) {
        toast.error('Could not start chat', {
          description: e instanceof Error ? e.message : 'Please try again.',
        });
        return null;
      }
    },
    [user, toast],
  );

  const send = React.useCallback<AiChatController['send']>(
    async ({ systemPrompt, pick }) => {
      const text = input.trim();
      if (!text) return;
      if (!user) {
        toast.warning('Sign in required', {
          description: 'Sign in to use the AI chat and save your history.',
        });
        return;
      }
      if (!pick) {
        toast.warning('No model selected', {
          description: 'Pick an AI model from the picker above.',
        });
        return;
      }
      const apiKey = await resolveApiKey(pick.provider);
      if (apiKey == null) return;

      let chatId = activeChatId;
      let isFirstMessage = false;
      if (!chatId) {
        chatId = await startNewChat(pick);
        if (!chatId) return;
        isFirstMessage = true;
      } else if (messages.length === 0) {
        isFirstMessage = true;
      }

      setInput('');
      setBusy(true);
      setStreaming('');
      const controller = new AbortController();
      abortRef.current = controller;

      // Build the conversation payload BEFORE persisting, so the new user
      // message isn't double-counted from the optimistic snapshot.
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      history.push({ role: 'user', content: text });

      try {
        await appendMessage(user.uid, chatId, { role: 'user', content: text });
      } catch (e) {
        setBusy(false);
        abortRef.current = null;
        // Persistence failed — put the user's text back in the input so they
        // don't have to retype it.
        setInput(text);
        toast.error('Could not save message', {
          description: e instanceof Error ? e.message : 'Please try again.',
        });
        return;
      }

      let full = '';
      try {
        await generate({
          provider: pick.provider,
          model: pick.model,
          apiKey,
          system: systemPrompt,
          messages: history,
          temperature: 0.5,
          maxTokens: 4096,
          signal: controller.signal,
          onDelta: (chunk) => {
            full += chunk;
            setStreaming((prev) => prev + chunk);
          },
        });
      } catch (e) {
        if (isAbortError(e)) {
          toast.info('Generation stopped', {
            description: 'Partial response saved to history.',
          });
        } else {
          const msg = e instanceof Error ? e.message : 'Generation failed';
          toast.error('Generation failed', { description: msg.slice(0, 200) });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        setStreaming('');
      }

      if (full.trim()) {
        try {
          await appendMessage(user.uid, chatId, {
            role: 'assistant',
            content: full,
            provider: pick.provider,
            model: pick.model,
          });
        } catch (e) {
          toast.error('Could not save reply', {
            description: e instanceof Error ? e.message : 'Please try again.',
          });
        }
      }

      if (isFirstMessage) {
        // Title the chat from the first user prompt so the sidebar is browsable.
        const title = deriveTitle(text);
        try {
          await updateChatMeta(user.uid, chatId, {
            title,
            provider: pick.provider,
            model: pick.model,
          });
        } catch {
          // non-fatal
        }
      } else {
        try {
          await updateChatMeta(user.uid, chatId, {
            provider: pick.provider,
            model: pick.model,
          });
        } catch {
          // non-fatal
        }
      }
    },
    [user, activeChatId, messages, input, resolveApiKey, startNewChat, toast],
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const rename = React.useCallback<AiChatController['rename']>(
    async (chatId, title) => {
      if (!user) return;
      try {
        await updateChatMeta(user.uid, chatId, { title });
      } catch (e) {
        toast.error('Could not rename chat', {
          description: e instanceof Error ? e.message : 'Please try again.',
        });
      }
    },
    [user, toast],
  );

  const remove = React.useCallback<AiChatController['remove']>(
    async (chatId) => {
      if (!user) return null;
      // Capture title + message count BEFORE delete fires — by the time the
      // snapshot listener updates, the row is gone.
      const target = chats.find((c) => c.id === chatId);
      const title = target?.title ?? 'Untitled chat';
      const wasActive = chatId === activeChatId;
      const messageCount = wasActive ? messages.length : null;
      try {
        await deleteChat(user.uid, chatId);
        if (wasActive) setActiveChatId(null);
        const parts: string[] = [`"${title}"`];
        if (messageCount != null) {
          parts.push(`${messageCount} ${messageCount === 1 ? 'message' : 'messages'} removed`);
        }
        toast.success('Chat deleted', { description: parts.join(' · ') });
        return { wasActive, messageCount };
      } catch (e) {
        toast.error('Could not delete chat', {
          description: e instanceof Error ? e.message : 'Please try again.',
        });
        throw e;
      }
    },
    [user, chats, activeChatId, messages.length, toast],
  );

  return {
    chats,
    messages,
    activeChatId,
    setActiveChatId,
    input,
    setInput,
    streaming,
    busy,
    send,
    stop,
    rename,
    remove,
  };
}
