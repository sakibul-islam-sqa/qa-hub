'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface DisableVaultDialogProps {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DisableVaultDialog({ busy, onCancel, onConfirm }: DisableVaultDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const backdropMouseDownRef = React.useRef(false);

  // Mount first, then flip to open on the next frames so the CSS transitions
  // actually run from the closed → open state.
  React.useEffect(() => {
    setMounted(true);
    let f2 = 0;
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(f1);
      if (f2) cancelAnimationFrame(f2);
    };
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  if (!mounted) return null;
  const state = open ? 'open' : 'entering';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disable-vault-title"
      data-state={state}
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        // Only treat as backdrop-close when BOTH mousedown and mouseup land on
        // the overlay itself. Prevents accidental close when the user starts a
        // text selection inside the panel and releases on the backdrop.
        backdropMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget && !busy) {
          onCancel();
        }
        backdropMouseDownRef.current = false;
      }}
    >
      <div
        data-state={state}
        className="modal-panel relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-soft"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 id="disable-vault-title" className="text-base font-semibold">
              Disable the vault?
            </h2>
            <p className="mt-1 text-xs text-muted">
              All saved API keys will be removed. You will need to re-enable the vault and re-paste
              your keys to use AI tools again.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Disabling…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Disable vault
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
