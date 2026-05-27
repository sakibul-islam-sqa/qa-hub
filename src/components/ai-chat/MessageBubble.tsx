'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { MarkdownPreview } from '@/components/ai/MarkdownPreview';
import { CopyMessageButton } from '@/components/ai/CopyMessageButton';
import { ProviderLogo } from '@/components/ai/ProviderLogo';
import { PROVIDERS } from '@/lib/ai/providers';
import type { AiProviderId } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  provider?: string;
  model?: string;
}

export interface MessageBubbleProps {
  message: Message;
  streaming?: boolean;
  /**
   * When true, render a model pill above the bubble. The parent decides this —
   * typically only when the chat actually mixes multiple models.
   */
  showModel?: boolean;
}

export function MessageBubble({
  message,
  streaming,
  showModel: showModelProp = false,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copyOpen, setCopyOpen] = React.useState(false);
  const providerId = message.provider as AiProviderId | undefined;
  const providerName =
    providerId && PROVIDERS[providerId]?.name ? PROVIDERS[providerId].name : providerId;
  const showModel = showModelProp && !isUser && !!providerId && !!message.model;

  return (
    <div className={cn('flex w-full flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      {showModel && (
        <div className="ml-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
          <ProviderLogo providerId={providerId!} className="h-3 w-3" />
          <span className="truncate">
            {providerName}
            <span className="mx-1 text-muted/60">·</span>
            <span className="text-fg/80">{message.model}</span>
          </span>
        </div>
      )}
      <div
        className={cn(
          'group relative max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm shadow-soft',
          isUser
            ? 'bg-gradient-accent text-accent-fg'
            : 'border border-border bg-surface-2/60 text-fg',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : message.content ? (
          <MarkdownPreview source={message.content} />
        ) : streaming ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </span>
        ) : null}

        {!isUser && message.content && (
          <div
            className={cn(
              'mt-1.5 flex items-center gap-1 transition-opacity',
              copyOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <CopyMessageButton source={message.content} onOpenChange={setCopyOpen} />
            {streaming && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> streaming…
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
