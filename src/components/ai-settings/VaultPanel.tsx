'use client';

import * as React from 'react';
import { Loader2, Lock, LockKeyhole, ShieldCheck, Trash2, Unlock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { useVault } from '@/lib/ai/VaultContext';
import { clearProvider } from '@/lib/ai/settings';
import { PROVIDER_IDS } from '@/lib/ai/providers';
import type { AiSettings } from '@/lib/ai/types';
import { PassphraseField } from './PassphraseField';
import { DisableVaultDialog } from './DisableVaultDialog';

export function VaultPanel({ settings }: { settings: AiSettings }) {
  const vault = useVault();
  const { user } = useAuth();
  const toast = useToast();

  const [passphrase, setPassphrase] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState<null | 'enable' | 'unlock' | 'disable'>(null);
  const [confirmDisable, setConfirmDisable] = React.useState(false);

  function reset() {
    setPassphrase('');
    setConfirm('');
    setShow(false);
  }

  async function handleEnable() {
    if (passphrase.length < 8) {
      toast.warning('Passphrase too short', {
        description: 'Use at least 8 characters so your vault stays strong.',
      });
      return;
    }
    if (passphrase !== confirm) {
      toast.error('Passphrases do not match', {
        description: 'Re-enter the same passphrase in both fields.',
      });
      return;
    }
    setBusy('enable');
    try {
      await vault.enable(passphrase);
      reset();
      toast.success('Vault enabled', {
        description: 'Your API keys will now be encrypted in this browser.',
      });
    } catch (e) {
      toast.error('Could not enable vault', {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleUnlock() {
    if (!passphrase) return;
    setBusy('unlock');
    try {
      await vault.unlock(passphrase);
      reset();
      toast.success('Vault unlocked', {
        description: 'You can now use saved API keys for this session.',
      });
    } catch (e) {
      toast.error('Could not unlock vault', {
        description: e instanceof Error ? e.message : 'Check the passphrase and try again.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleDisable() {
    if (!user) return;
    setBusy('disable');
    try {
      // API keys can only exist under a vault — clear them all on disable.
      for (const id of PROVIDER_IDS) {
        const entry = settings[id];
        if (entry?.apiKey || entry?.apiKeyEnc) {
          await clearProvider(user.uid, id);
        }
      }
      await vault.disable();
      setConfirmDisable(false);
      toast.success('Vault disabled', {
        description: 'All saved API keys were removed from your account.',
      });
    } catch (e) {
      toast.error('Could not disable vault', {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setBusy(null);
    }
  }

  if (vault.status === 'loading') {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading vault…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6 border-accent/30">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="h-4 w-4 text-accent" /> Vault
                {vault.status === 'unlocked' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
                    <Unlock className="h-3 w-3" /> Unlocked
                  </span>
                )}
                {vault.status === 'locked' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {vault.status === 'disabled' &&
                  'A vault is required to save API keys. Choose a passphrase only you know — it encrypts every key end-to-end so the Firebase project admin cannot read them.'}
                {vault.status === 'locked' &&
                  'Unlock to add, edit, or use API keys this session. The derived key is held in memory only and forgotten when you close the tab.'}
                {vault.status === 'unlocked' &&
                  'New keys are AES-GCM encrypted in your browser before being written to Firestore. Forget the passphrase and the keys are unrecoverable.'}
              </p>
            </div>
            {vault.status === 'unlocked' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => vault.lock()}>
                  <Lock className="h-3.5 w-3.5" /> Lock
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={() => setConfirmDisable(true)}
                  disabled={busy === 'disable'}
                >
                  {busy === 'disable' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Disable vault
                </Button>
              </div>
            )}
          </header>

          {vault.status === 'disabled' && (
            <div className="space-y-3">
              <PassphraseField
                id="vault-pass-new"
                label="Passphrase"
                value={passphrase}
                onChange={setPassphrase}
                show={show}
                onToggleShow={() => setShow((s) => !s)}
                placeholder="At least 8 characters"
              />
              <PassphraseField
                id="vault-pass-confirm"
                label="Confirm passphrase"
                value={confirm}
                onChange={setConfirm}
                show={show}
                placeholder="Repeat to confirm"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={busy !== null || passphrase.length < 8 || passphrase !== confirm}
                >
                  {busy === 'enable' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enabling…
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-3.5 w-3.5" /> Enable vault
                    </>
                  )}
                </Button>
                <span className="text-[11px] text-muted">
                  There is no recovery. Save the passphrase somewhere safe.
                </span>
              </div>
            </div>
          )}

          {vault.status === 'locked' && (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void handleUnlock();
              }}
            >
              <div className="min-w-0 flex-1 sm:min-w-[200px]">
                <PassphraseField
                  id="vault-pass-unlock"
                  label="Passphrase"
                  value={passphrase}
                  onChange={setPassphrase}
                  show={show}
                  onToggleShow={() => setShow((s) => !s)}
                  placeholder="Enter your vault passphrase"
                />
              </div>
              <Button type="submit" disabled={busy !== null || !passphrase}>
                {busy === 'unlock' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Unlocking…
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Unlock
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {confirmDisable && (
        <DisableVaultDialog
          busy={busy === 'disable'}
          onCancel={() => setConfirmDisable(false)}
          onConfirm={handleDisable}
        />
      )}
    </>
  );
}
