'use client';

import * as React from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { ChatSummary } from '@/lib/ai/chatStore';
import { cn } from '@/lib/utils';

export interface ChatHistoryItemProps {
  chat: ChatSummary;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (next: string) => void;
}

export function ChatHistoryItem({
  chat,
  active,
  onSelect,
  onDelete,
  onRename,
}: ChatHistoryItemProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(chat.title);

  React.useEffect(() => {
    if (!editing) setDraft(chat.title);
  }, [chat.title, editing]);

  function commit() {
    const next = draft.trim();
    if (next && next !== chat.title) onRename(next);
    setEditing(false);
  }

  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors',
          active ? 'bg-accent/10 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        )}
      >
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(chat.title);
                setEditing(false);
              }
            }}
            className="h-7 flex-1 text-xs"
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 flex-1 truncate text-left"
            title={chat.title}
          >
            {chat.title}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={commit}
                aria-label="Save title"
                className="rounded p-1 text-muted hover:bg-surface hover:text-accent"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(chat.title);
                  setEditing(false);
                }}
                aria-label="Cancel rename"
                className="rounded p-1 text-muted hover:bg-surface hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Rename chat"
                className="rounded p-1 text-muted opacity-0 transition-opacity hover:bg-surface hover:text-fg group-hover:opacity-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete chat"
                className="rounded p-1 text-muted opacity-0 transition-opacity hover:bg-surface hover:text-danger group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
