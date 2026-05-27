'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Copy, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { copyRichText, copyToClipboard } from '@/lib/utils';
import { renderMarkdownToHtml } from '@/components/ai/MarkdownPreview';
import { markdownToPlainText } from '@/lib/ai/markdownPlain';
import { cn } from '@/lib/utils';

interface Props {
  /** The original markdown source of the message. */
  source: string;
  className?: string;
  /** Notifies the parent when the dropdown opens/closes so it can keep
   *  hover-revealed UI (e.g. the toolbar wrapping this button) visible. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Two-option copy menu for chat messages:
 *   - "As plain text" copies the raw markdown.
 *   - "With formatting" copies an HTML payload (plus a plain-text fallback)
 *     so pasting into Gmail / Notion / Docs / Word / Slack preserves
 *     headings, lists, tables, and code blocks.
 */
export function CopyMessageButton({ source, className, onOpenChange }: Props) {
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  // Notify the parent about open-state changes from an effect (not from the
  // setState updater) so the parent's setState doesn't run during this
  // component's render — that triggers React's "cannot update a component
  // while rendering a different component" warning.
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);
  React.useEffect(() => {
    onOpenChangeRef.current?.(open);
  }, [open]);
  const [copied, setCopied] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Position the floating menu next to the trigger using fixed coordinates so
  // any ancestor's `overflow:auto` / `overflow:hidden` can't clip it. Recompute
  // on resize/scroll while open.
  const reposition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 224; // matches w-56
    const gap = 6;
    const viewportPad = 8;
    // Prefer right-aligned to the trigger; if that overflows the left edge,
    // flip to left-aligned. Same idea vertically with viewport bottom.
    let left = rect.right - menuWidth;
    if (left < viewportPad) left = Math.min(rect.left, window.innerWidth - menuWidth - viewportPad);
    if (left < viewportPad) left = viewportPad;
    let top = rect.bottom + gap;
    const estHeight = menuRef.current?.offsetHeight ?? 92;
    if (top + estHeight > window.innerHeight - viewportPad) {
      top = Math.max(viewportPad, rect.top - gap - estHeight);
    }
    setCoords({ top, left });
  }, []);

  React.useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    reposition();
    function onMouse(e: MouseEvent) {
      const target = e.target as Node;
      const inWrap = wrapRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inWrap && !inMenu) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onReflow() {
      reposition();
    }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, reposition]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function flashCopied() {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  async function copyPlain() {
    setOpen(false);
    const plain = markdownToPlainText(source);
    const ok = await copyToClipboard(plain);
    if (ok) {
      toast.success('Copied as text', {
        description: 'Markdown syntax stripped — plain text only.',
      });
      flashCopied();
    } else {
      toast.error('Copy failed', {
        description: 'Your browser blocked clipboard access. Try again.',
      });
    }
  }

  async function copyFormatted() {
    setOpen(false);
    const html = enrichHtmlForClipboard(renderMarkdownToHtml(source));
    const plainFallback = markdownToPlainText(source);
    const ok = await copyRichText(html, plainFallback);
    if (ok) {
      toast.success('Copied with formatting', {
        description: 'Paste into Gmail, Notion, Docs, or Slack to keep styling.',
      });
      flashCopied();
    } else {
      toast.error('Copy failed', {
        description: 'Your browser blocked clipboard access. Try again.',
      });
    }
  }

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width: 224,
              visibility: coords ? 'visible' : 'hidden',
            }}
            className="z-[100] overflow-hidden rounded-lg border border-border bg-surface shadow-floating"
          >
            <MenuItem
              icon={<FileText className="h-3.5 w-3.5" />}
              title="As plain text"
              hint="No markdown syntax"
              onClick={copyPlain}
            />
            <MenuItem
              icon={<Wand2 className="h-3.5 w-3.5" />}
              title="With formatting"
              hint="Paste into Gmail, Notion, Docs"
              onClick={copyFormatted}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className={cn('relative inline-flex', className)}>
      <Button
        ref={triggerRef}
        size="sm"
        variant="secondary"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>
      {menu}
    </div>
  );
}

function MenuItem({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-2"
    >
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium text-fg">{title}</span>
        <span className="block text-[11px] text-muted">{hint}</span>
      </span>
    </button>
  );
}

/**
 * Add inline styles to the rendered HTML so the formatting survives a paste
 * into clipboard consumers that don't know our app's CSS (Gmail, Word,
 * Notion, Docs, Slack). External CSS isn't available there — only inline
 * styles + a small set of HTML attributes (border, cellpadding) get honored.
 */
function enrichHtmlForClipboard(html: string): string {
  let out = html;

  // Tables: collapse borders + visible cell borders so the grid is preserved.
  out = out.replace(
    /<table(\s[^>]*)?>/g,
    '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;border:1px solid #d0d7de;font-family:Arial,Helvetica,sans-serif;font-size:13px;">',
  );
  out = out.replace(
    /<th(\s[^>]*)?>/g,
    '<th style="border:1px solid #d0d7de;padding:6px 10px;background:#f6f8fa;text-align:left;font-weight:600;">',
  );
  out = out.replace(
    /<td(\s[^>]*)?>/g,
    '<td style="border:1px solid #d0d7de;padding:6px 10px;vertical-align:top;">',
  );

  // Code blocks: monospace + light background so pre stands out.
  out = out.replace(
    /<pre(\s[^>]*)?>/g,
    '<pre style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:10px 12px;font-family:Menlo,Consolas,monospace;font-size:12.5px;line-height:1.45;overflow:auto;white-space:pre;">',
  );
  out = out.replace(
    /<code(?![^>]*style=)(\s[^>]*)?>/g,
    '<code$1 style="font-family:Menlo,Consolas,monospace;font-size:0.9em;">',
  );
  // Inline <code> (not inside <pre>) gets a soft background. The replace
  // above already added the style; this layers a background on inline ones
  // by transforming inline-code patterns. Pre>code keeps its own styling.
  out = out.replace(
    /<p>([\s\S]*?)<\/p>/g,
    (_, inner) =>
      `<p style="margin:0.5em 0;">${(inner as string).replace(
        /<code style="font-family:Menlo,Consolas,monospace;font-size:0\.9em;">/g,
        '<code style="font-family:Menlo,Consolas,monospace;font-size:0.9em;background:#eef1f4;padding:0.1em 0.35em;border-radius:4px;">',
      )}</p>`,
  );

  // Blockquotes: subtle left accent.
  out = out.replace(
    /<blockquote(\s[^>]*)?>/g,
    '<blockquote style="border-left:3px solid #d0d7de;padding-left:0.75em;margin:0.75em 0;color:#57606a;">',
  );

  // Lists / headings inherit base styling well enough, but reset margin so
  // adjacent paragraphs don't double-space when pasted into Docs.
  out = out.replace(/<(ul|ol)(\s[^>]*)?>/g, '<$1 style="margin:0.5em 0 0.5em 1.25rem;padding:0;">');
  out = out.replace(/<li(\s[^>]*)?>/g, '<li style="margin:0.2em 0;">');

  // Wrap in a div so the receiving editor has a clean root. The font-family
  // and line-height set here propagate to children unless overridden above.
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1f2328;">${out}</div>`;
}
