// PBKDF2-SHA256 password hashing via Web Crypto. Shared by the login page (browser) and
// scripts/hash-password.mjs (Node), so both always derive the same hash.

export const ITERATIONS = 600000;

// Case, spaces and dashes don't matter, so "ABCD-efgh" and "abcdefgh" are the same password.
export const normalizePassword = (password) => password.replace(/[\s-]/g, '').toLowerCase();

const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));

export async function deriveHash(password, { salt, iterations }) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizePassword(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations },
    key,
    256
  );
  return toBase64(bits);
}
