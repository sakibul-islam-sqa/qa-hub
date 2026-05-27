'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Resolves/rejects to control the loading state. The dialog stays open
   *  until the promise settles; it auto-closes on resolve, stays open on
   *  reject so the caller can show a toast/error inline. */
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual treatment for the confirm button. */
  tone?: 'danger' | 'default';
}

/**
 * App-styled confirmation dialog. Centered modal with backdrop, ESC + click-
 * outside to close. Replaces window.confirm() for destructive actions.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      setBusy(false);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', onKey);
    // Lock body scroll while the modal is open so the page underneath
    // doesn't drift when the user moves their cursor / scroll wheel.
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, busy, onClose]);

  // Focus the confirm button when the dialog opens so Enter activates it.
  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      cardRef.current?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch {
      // Leave the dialog open and let the caller surface the error.
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <div
        aria-hidden
        onClick={() => {
          if (!busy) onClose();
        }}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <div
        ref={cardRef}
        className="relative z-[201] w-full max-w-md animate-fade-in-up overflow-hidden rounded-xl border border-border bg-surface shadow-floating"
      >
        <div className="flex items-start gap-3 p-5">
          {tone === 'danger' && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger/10 text-danger">
              <AlertTriangle className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold tracking-tight text-fg"
            >
              {title}
            </h2>
            {description && <div className="mt-1.5 text-sm text-fg-muted">{description}</div>}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="Close"
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={cn('flex justify-end gap-2 border-t border-border bg-surface-2/30 px-5 py-3')}
        >
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            data-autofocus
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
