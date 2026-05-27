'use client';

import * as React from 'react';
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  type Ciphertext,
  type VaultMeta,
  createVaultMeta,
  decryptString,
  encryptString,
  exportKey,
  importKey,
  unlockVaultMeta,
} from './crypto';

export type VaultStatus = 'loading' | 'disabled' | 'locked' | 'unlocked';

interface VaultContextValue {
  status: VaultStatus;
  /** Configure a brand new vault from a passphrase. */
  enable(passphrase: string): Promise<void>;
  /** Verify the passphrase and load the key into memory for this session. */
  unlock(passphrase: string): Promise<void>;
  /** Forget the key for this session (does not delete vault config). */
  lock(): void;
  /**
   * Delete the vault config. Caller MUST decrypt any encrypted data first;
   * this hook only clears the meta + session key.
   */
  disable(): Promise<void>;
  encrypt(plaintext: string): Promise<Ciphertext>;
  decrypt(value: Ciphertext): Promise<string>;
}

const VaultContext = React.createContext<VaultContextValue | null>(null);

function sessionKeyName(uid: string) {
  return `qa-hub-vault-key-${uid}`;
}

function metaRef(uid: string) {
  const { db } = getFirebase();
  if (!db) return null;
  return doc(db, 'users', uid, 'settings', 'vault');
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [meta, setMeta] = React.useState<VaultMeta | null>(null);
  const [metaLoaded, setMetaLoaded] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const keyRef = React.useRef<CryptoKey | null>(null);

  // Subscribe to vault meta + restore session key when possible.
  React.useEffect(() => {
    if (!user) {
      setMeta(null);
      setMetaLoaded(false);
      setUnlocked(false);
      keyRef.current = null;
      return;
    }
    const r = metaRef(user.uid);
    if (!r) {
      setMetaLoaded(true);
      return;
    }
    const unsub = onSnapshot(
      r,
      async (snap) => {
        if (!snap.exists()) {
          setMeta(null);
          setMetaLoaded(true);
          setUnlocked(false);
          keyRef.current = null;
          return;
        }
        const data = snap.data() as VaultMeta;
        setMeta(data);
        setMetaLoaded(true);
        // Try to restore from session storage.
        if (typeof window !== 'undefined' && !keyRef.current) {
          const stashed = window.sessionStorage.getItem(sessionKeyName(user.uid));
          if (stashed) {
            try {
              keyRef.current = await importKey(stashed);
              setUnlocked(true);
            } catch {
              window.sessionStorage.removeItem(sessionKeyName(user.uid));
            }
          }
        }
      },
      () => {
        setMetaLoaded(true);
      },
    );
    return unsub;
  }, [user]);

  const status: VaultStatus =
    !user || !metaLoaded ? 'loading' : !meta ? 'disabled' : unlocked ? 'unlocked' : 'locked';

  const value = React.useMemo<VaultContextValue>(
    () => ({
      status,
      async enable(passphrase) {
        if (!user) throw new Error('Sign in first.');
        if (meta) throw new Error('Vault is already enabled.');
        if (!passphrase || passphrase.length < 8) {
          throw new Error('Use a passphrase of at least 8 characters.');
        }
        const { meta: newMeta, key } = await createVaultMeta(passphrase);
        const r = metaRef(user.uid);
        if (!r) throw new Error('Firebase is not configured.');
        await setDoc(r, { ...newMeta, updatedAt: serverTimestamp() });
        keyRef.current = key;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(sessionKeyName(user.uid), await exportKey(key));
        }
        setUnlocked(true);
      },
      async unlock(passphrase) {
        if (!user || !meta) throw new Error('Vault is not configured.');
        const key = await unlockVaultMeta(passphrase, meta);
        keyRef.current = key;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(sessionKeyName(user.uid), await exportKey(key));
        }
        setUnlocked(true);
      },
      lock() {
        keyRef.current = null;
        setUnlocked(false);
        if (user && typeof window !== 'undefined') {
          window.sessionStorage.removeItem(sessionKeyName(user.uid));
        }
      },
      async disable() {
        if (!user) throw new Error('Sign in first.');
        const r = metaRef(user.uid);
        if (!r) throw new Error('Firebase is not configured.');
        await deleteDoc(r);
        keyRef.current = null;
        setUnlocked(false);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(sessionKeyName(user.uid));
        }
      },
      async encrypt(plaintext) {
        if (!keyRef.current) throw new Error('Vault is locked.');
        return encryptString(keyRef.current, plaintext);
      },
      async decrypt(value) {
        if (!keyRef.current) throw new Error('Vault is locked.');
        return decryptString(keyRef.current, value);
      },
    }),
    [user, meta, status],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const ctx = React.useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used inside <VaultProvider>');
  return ctx;
}
