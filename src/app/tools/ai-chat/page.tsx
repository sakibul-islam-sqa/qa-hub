'use client';

import * as React from 'react';
import { Loader2, MessageSquarePlus, Send, Square } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ModelPicker, type PickerValue } from '@/components/ai/ModelPicker';
import { PromptEditor } from '@/components/ai/PromptEditor';
import { ProviderLogo } from '@/components/ai/ProviderLogo';
import { ChatHistoryItem } from '@/components/ai-chat/ChatHistoryItem';
import { ChatModelsSummary } from '@/components/ai-chat/ChatModelsSummary';
import { EmptyConversation } from '@/components/ai-chat/EmptyConversation';
import { MessageBubble } from '@/components/ai-chat/MessageBubble';
import { useAuth } from '@/lib/auth/AuthContext';
import { QA_CHAT_SYSTEM } from '@/lib/ai/prompts';
import { useCustomPrompt } from '@/lib/ai/useCustomPrompt';
import { useAiChatController } from '@/lib/ai/useAiChatController';
import { PROVIDERS } from '@/lib/ai/providers';
import type { AiProviderId } from '@/lib/ai/types';

export default function AiChatPage() {
  const { user } = useAuth();
  const { prompt: systemPrompt } = useCustomPrompt('qa-chat', QA_CHAT_SYSTEM);
  const ctrl = useAiChatController(user);

  const [pick, setPick] = React.useState<PickerValue | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll the conversation to the bottom when new content arrives.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [ctrl.messages.length, ctrl.streaming, ctrl.activeChatId]);

  const activeChat = ctrl.chats.find((c) => c.id === ctrl.activeChatId) ?? null;

  // Distinct (provider, model) pairs used by assistant messages in this chat,
  // in first-seen order. Drives the "N models used" header summary and the
  // decision of when to repeat a model label between bubbles.
  const modelsUsed = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ provider: string; model: string }> = [];
    for (const m of ctrl.messages) {
      if (m.role !== 'assistant' || !m.provider || !m.model) continue;
      const key = `${m.provider}::${m.model}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ provider: m.provider, model: m.model });
    }
    return list;
  }, [ctrl.messages]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!ctrl.busy) void ctrl.send({ systemPrompt, pick });
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await ctrl.remove(pendingDeleteId);
  }

  const pendingDeleteChat = pendingDeleteId
    ? (ctrl.chats.find((c) => c.id === pendingDeleteId) ?? null)
    : null;

  const streamingProviderModel = pick && `${pick.provider}::${pick.model}`;
  const distinct = new Set(modelsUsed.map((m) => `${m.provider}::${m.model}`));
  if (ctrl.busy && streamingProviderModel) distinct.add(streamingProviderModel);
  const multiModel = distinct.size > 1;

  return (
    <ToolPage slug="ai-chat">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <ModelPicker value={pick} onChange={setPick} />
          <PromptEditor
            promptKey="qa-chat"
            defaultPrompt={QA_CHAT_SYSTEM}
            label="QA chat system prompt"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <Label>History</Label>
              <Button size="sm" variant="outline" onClick={() => ctrl.setActiveChatId(null)}>
                <MessageSquarePlus className="h-3.5 w-3.5" /> New
              </Button>
            </div>

            {ctrl.chats.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface-2 p-3 text-xs text-muted">
                No chats yet. Start a conversation below — it&rsquo;ll be saved here.
              </div>
            ) : (
              <ul className="max-h-[260px] space-y-1 overflow-auto lg:max-h-[420px]">
                {ctrl.chats.map((c) => (
                  <ChatHistoryItem
                    key={c.id}
                    chat={c}
                    active={c.id === ctrl.activeChatId}
                    onSelect={() => ctrl.setActiveChatId(c.id)}
                    onDelete={() => setPendingDeleteId(c.id)}
                    onRename={(t) => ctrl.rename(c.id, t)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[420px] flex-col">
          <CardContent className="flex flex-1 flex-col gap-3 p-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {activeChat ? activeChat.title : 'New chat'}
                </h3>
                {modelsUsed.length > 0 ? (
                  <ChatModelsSummary models={modelsUsed} />
                ) : (
                  activeChat?.provider &&
                  activeChat?.model && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                      <ProviderLogo
                        providerId={activeChat.provider as AiProviderId}
                        className="h-3 w-3"
                      />
                      <span className="truncate">
                        {PROVIDERS[activeChat.provider as AiProviderId]?.name ??
                          activeChat.provider}
                        {' · '}
                        {activeChat.model}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-auto px-4 pb-2">
              {ctrl.messages.length === 0 && !ctrl.streaming && !ctrl.busy && <EmptyConversation />}
              {ctrl.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={{ ...m, role: m.role as 'user' | 'assistant' }}
                  showModel={multiModel}
                />
              ))}
              {(ctrl.busy || ctrl.streaming) && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: ctrl.streaming,
                    createdAt: Date.now(),
                    provider: pick?.provider,
                    model: pick?.model,
                  }}
                  showModel={multiModel}
                  streaming={ctrl.busy}
                />
              )}
            </div>

            <div className="border-t border-border bg-surface-2/30 p-3 sm:p-4">
              <div className="flex flex-col gap-2">
                <Textarea
                  rows={3}
                  className="min-h-[72px] resize-y"
                  placeholder={
                    pick
                      ? 'Ask your QA question. Shift+Enter for a new line, Enter to send.'
                      : 'Pick a model above to get started.'
                  }
                  value={ctrl.input}
                  onChange={(e) => ctrl.setInput(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  disabled={!pick}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-muted">
                    {pick
                      ? 'Streamed reply · chat history saved to your account.'
                      : 'Connect a provider in AI settings to enable chat.'}
                  </p>
                  <div className="flex items-center gap-2">
                    {ctrl.busy ? (
                      <Button variant="secondary" onClick={ctrl.stop}>
                        <Square className="h-3.5 w-3.5" /> Stop
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void ctrl.send({ systemPrompt, pick })}
                        disabled={!pick || !ctrl.input.trim()}
                      >
                        {ctrl.busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}{' '}
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        tone="danger"
        title="Delete this chat?"
        description={
          <span>
            This permanently removes{' '}
            <span className="font-medium text-fg">
              &ldquo;{pendingDeleteChat?.title ?? 'this conversation'}&rdquo;
            </span>{' '}
            and all of its messages from your account. This action can&rsquo;t be undone.
          </span>
        }
        confirmLabel="Delete chat"
        cancelLabel="Cancel"
      />
    </ToolPage>
  );
}
