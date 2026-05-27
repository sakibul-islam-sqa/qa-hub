'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { authErrorMessage, detectProviderKind, useAuth } from '@/lib/auth/AuthContext';

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps = {}) {
  const { theme, toggle } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    try {
      await signOut();
      toast.success('Signed out', {
        description: 'See you next time!',
      });
      router.replace('/login');
    } catch (err) {
      toast.error('Sign-out failed', { description: authErrorMessage(err) });
    }
  }

  async function handleDelete(password?: string) {
    await deleteAccount(password);
    toast.success('Account deleted', {
      description: 'Your account and all stored data were removed.',
    });
    router.replace('/login');
  }

  const displayName = user?.displayName?.trim() || user?.email || '';
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  const providerKind = detectProviderKind(user);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg/75 px-3 backdrop-blur-md sm:px-6 md:h-16">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-all hover:bg-surface-2 hover:text-fg"
        >
          <span suppressHydrationWarning>
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </span>
        </button>

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface pl-1 pr-3 text-xs shadow-sm transition-all hover:border-accent/50 hover:shadow-soft"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-accent text-[11px] font-semibold text-accent-fg shadow-glow-soft">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate font-medium md:inline lg:max-w-[160px]">
                {displayName}
              </span>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-xl border border-border bg-surface shadow-floating"
              >
                <div className="from-accent/8 border-b border-border bg-gradient-to-br via-transparent to-accent-2/5 px-3.5 py-3 text-xs">
                  <div className="truncate font-semibold text-fg">{displayName}</div>
                  {user.email && user.email !== displayName && (
                    <div className="mt-0.5 truncate text-muted">{user.email}</div>
                  )}
                </div>
                <Link
                  href="/settings/ai"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4 text-muted" />
                  AI connections
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 text-muted" />
                  Sign out
                </button>
                <div className="border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                  role="menuitem"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteOpen && user && (
        <DeleteAccountDialog
          email={user.email || displayName}
          providerKind={providerKind}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </header>
  );
}

interface DeleteAccountDialogProps {
  email: string;
  providerKind: ReturnType<typeof detectProviderKind>;
  onCancel: () => void;
  onConfirm: (password?: string) => Promise<void>;
}

function DeleteAccountDialog({
  email,
  providerKind,
  onCancel,
  onConfirm,
}: DeleteAccountDialogProps) {
  const toast = useToast();
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const needsPassword = providerKind === 'password';
  const confirmMatches = confirmText.trim().toUpperCase() === 'DELETE';
  const canSubmit = !busy && confirmMatches && (!needsPassword || password.length > 0);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onConfirm(needsPassword ? password : undefined);
    } catch (err) {
      toast.error('Could not delete account', {
        description: authErrorMessage(err),
      });
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
        <button
          type="button"
          onClick={() => !busy && onCancel()}
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
            <h2 id="delete-account-title" className="text-base font-semibold">
              Delete your account?
            </h2>
            <p className="mt-1 text-xs text-muted">
              This permanently deletes <span className="font-medium text-fg">{email}</span> and
              removes all stored data (AI provider settings, encrypted API keys, vault, and custom
              prompts). This action cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {needsPassword ? (
            <div>
              <Label htmlFor="delete-account-password">Confirm your password</Label>
              <div className="relative mt-2">
                <Input
                  id="delete-account-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  placeholder="Your account password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-border bg-surface-2/60 px-3 py-2 text-xs text-muted">
              You signed in with Google. A Google popup will open to confirm before your account is
              deleted.
            </p>
          )}

          <div>
            <Label htmlFor="delete-account-confirm">
              Type <span className="font-mono text-danger">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-account-confirm"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={busy}
              placeholder="DELETE"
              className="mt-2 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!canSubmit}>
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
