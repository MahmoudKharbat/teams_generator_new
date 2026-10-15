import { PASSWORD_HASH } from './authConfig';
import { deriveHash } from './passwordHash';

const SESSION_KEY = 'zemer-session';
const SESSION_DAYS = 30;

export async function checkPassword(password) {
  return (await deriveHash(password, PASSWORD_HASH)) === PASSWORD_HASH.hash;
}

// The session remembers which hash it was created for, so changing the password signs everyone out.
export function hasSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session?.hash === PASSWORD_HASH.hash && session.expires > Date.now();
  } catch {
    return false;
  }
}

export function startSession() {
  try {
    const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ hash: PASSWORD_HASH.hash, expires }));
  } catch {
    // Storage blocked (e.g. private mode): the login still works until the tab is closed.
  }
}

export function endSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing stored
  }
}
