import {
  Session,
  consumeAuthRedirectHash,
  getAuthSettings,
  getGoogleOAuthUrl,
  getSession,
  onSessionChange,
  recoverPassword,
  signIn,
  signOut,
  signUp
} from './lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

const LEGACY_KEY = 'bcs-monster-auth-user';

export function toAuthUser(s: Session | null): AuthUser | null {
  if (!s?.user) return null;
  const email = s.user.email ?? '';
  const meta = (s.user.user_metadata ?? {}) as Record<string, unknown>;
  const username = email.split('@')[0] || 'candidate';
  const displayName = typeof meta.display_name === 'string' && meta.display_name.trim() ? meta.display_name.trim() : username;
  return { id: s.user.id, email, username, displayName };
}

export function getStoredUser(): AuthUser | null {
  try {
    localStorage.removeItem(LEGACY_KEY); // old client-only login (pre server accounts)
  } catch {
    /* ignore */
  }
  return toAuthUser(getSession());
}

export function subscribeUser(fn: (u: AuthUser | null) => void): () => void {
  return onSessionChange((s) => fn(toAuthUser(s)));
}

type Result = { ok: true; user: AuthUser } | { ok: false; error: string };

function validate(email: string, password: string): string | null {
  if (!email.trim() || !password) return 'Please enter both email and password.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

export async function loginWithCredentials(email: string, password: string): Promise<Result> {
  const bad = validate(email, password);
  if (bad) return { ok: false, error: bad };
  try {
    const s = await signIn(email, password);
    return { ok: true, user: toAuthUser(s)! };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function registerAccount(name: string, email: string, password: string): Promise<Result> {
  const bad = validate(email, password);
  if (bad) return { ok: false, error: bad };
  if (name.trim().length < 2) return { ok: false, error: 'Please enter your name.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  try {
    const s = await signUp(email, password, name);
    return { ok: true, user: toAuthUser(s)! };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendPasswordReset(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = email.trim();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  try {
    await recoverPassword(clean);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function isGoogleAuthEnabled(): Promise<boolean> {
  const s = await getAuthSettings();
  return s.google;
}

export function launchGoogleOAuth(): void {
  window.location.href = getGoogleOAuthUrl();
}

export { consumeAuthRedirectHash };

export function logoutUser(): void {
  void signOut();
}
