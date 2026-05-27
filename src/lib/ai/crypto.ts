'use client';

/**
 * Web Crypto helpers for the vault: PBKDF2 key derivation + AES-GCM encryption.
 * All primitives are native (SubtleCrypto) - no dependencies.
 *
 * Threat model: protect API keys at rest in Firestore so a Firebase project
 * admin / leaked backup cannot read them. The user's passphrase never leaves
 * the browser; only `salt`, iteration count, and an encrypted verifier are
 * stored remotely so we can detect wrong passphrases.
 */

export const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VERIFIER_PLAINTEXT = 'qa-hub-vault-v1';

export interface Ciphertext {
  /** Base64 ciphertext (AES-GCM output incl. auth tag). */
  ct: string;
  /** Base64 96-bit IV. */
  iv: string;
}

export interface VaultMeta {
  salt: string;
  iterations: number;
  /** Encrypted known-plaintext used to verify passphrases. */
  verifierIv: string;
  verifierCt: string;
}

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const passKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can stash raw bytes in sessionStorage
    ['encrypt', 'decrypt'],
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return toB64(new Uint8Array(raw));
}

export async function importKey(rawB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    fromB64(rawB64) as BufferSource,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<Ciphertext> {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as BufferSource,
  );
  return { ct: toB64(new Uint8Array(ct)), iv: toB64(iv) };
}

export async function decryptString(key: CryptoKey, value: Ciphertext): Promise<string> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(value.iv) as BufferSource },
    key,
    fromB64(value.ct) as BufferSource,
  );
  return new TextDecoder().decode(pt);
}

/** Create a fresh vault from a passphrase. Returns the meta to store and the live key. */
export async function createVaultMeta(
  passphrase: string,
): Promise<{ meta: VaultMeta; key: CryptoKey }> {
  const salt = randomBytes(SALT_BYTES);
  const iterations = PBKDF2_ITERATIONS;
  const key = await deriveKey(passphrase, salt, iterations);
  const verifier = await encryptString(key, VERIFIER_PLAINTEXT);
  return {
    meta: {
      salt: toB64(salt),
      iterations,
      verifierIv: verifier.iv,
      verifierCt: verifier.ct,
    },
    key,
  };
}

/** Returns the unlocked key if the passphrase matches the stored verifier. */
export async function unlockVaultMeta(passphrase: string, meta: VaultMeta): Promise<CryptoKey> {
  const key = await deriveKey(passphrase, fromB64(meta.salt), meta.iterations);
  try {
    const pt = await decryptString(key, { ct: meta.verifierCt, iv: meta.verifierIv });
    if (pt !== VERIFIER_PLAINTEXT) throw new Error('bad');
  } catch {
    throw new Error('Wrong passphrase.');
  }
  return key;
}
