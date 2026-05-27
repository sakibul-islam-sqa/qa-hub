'use client';

import * as React from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { getFirebase, isFirebaseConfigured } from '@/lib/firebase';

export type AuthProviderKind = 'password' | 'google' | 'unknown';

export function detectProviderKind(user: User | null): AuthProviderKind {
  if (!user) return 'unknown';
  const ids = user.providerData.map((p) => p.providerId);
  if (ids.includes('password')) return 'password';
  if (ids.includes('google.com')) return 'google';
  return 'unknown';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Permanently delete the signed-in user's account along with all of their
   * Firestore data. Password users must supply their current password so
   * Firebase can reauthenticate them; Google users are reauthenticated via a
   * popup and `password` is ignored.
   */
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(configured);

  React.useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const { auth } = getFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      async signInWithEmail(email, password) {
        const { auth } = getFirebase();
        if (!auth) throw new Error('Firebase is not configured.');
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUpWithEmail(email, password) {
        const { auth } = getFirebase();
        if (!auth) throw new Error('Firebase is not configured.');
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        const { auth } = getFirebase();
        if (!auth) throw new Error('Firebase is not configured.');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      },
      async signOut() {
        const { auth } = getFirebase();
        if (!auth) return;
        await fbSignOut(auth);
      },
      async deleteAccount(password) {
        const { auth, db } = getFirebase();
        if (!auth?.currentUser) throw new Error('You are not signed in.');
        const current = auth.currentUser;
        const kind = detectProviderKind(current);

        if (kind === 'password') {
          if (!current.email) throw new Error('This account has no email on file.');
          if (!password) throw new Error('Enter your password to continue.');
          const cred = EmailAuthProvider.credential(current.email, password);
          await reauthenticateWithCredential(current, cred);
        } else if (kind === 'google') {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await reauthenticateWithPopup(current, provider);
        } else {
          throw new Error('This sign-in method does not support account deletion.');
        }

        if (db) {
          const uid = current.uid;
          await Promise.all([
            deleteDoc(doc(db, 'users', uid, 'settings', 'ai')),
            deleteDoc(doc(db, 'users', uid, 'settings', 'vault')),
            deleteDoc(doc(db, 'users', uid, 'prompts', 'test-cases')),
            deleteDoc(doc(db, 'users', uid, 'prompts', 'bug-report')),
          ]);
        }

        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem(`qa-hub-vault-key-${current.uid}`);
          } catch {
            /* ignore */
          }
        }

        await current.delete();
      },
    }),
    [user, loading, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Friendly error message for Firebase Auth errors. */
export function authErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code);
    switch (code) {
      case 'auth/invalid-email':
        return 'That email address looks invalid.';
      case 'auth/email-already-in-use':
        return 'An account with that email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'The browser blocked the sign-in popup. Allow popups and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and retry.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait a moment and try again.';
      case 'auth/requires-recent-login':
        return 'For security, sign in again before deleting your account.';
      case 'auth/missing-password':
        return 'Enter your password to continue.';
      default:
        return code.replace(/^auth\//, '').replace(/-/g, ' ');
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
