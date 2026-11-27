/**
 * Tiny dependency-free client for the BCS Monster backend on Hetzner
 * (GoTrue auth at /auth/v1, PostgREST at /rest/v1, same origin as the site).
 * Sessions are kept in localStorage and refreshed automatically.
 */
const ENV_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';
const ENV_GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
const DEFAULT_URL = 'https://bcs.5-223-93-53.sslip.io';

/** Same-origin when served from our server; absolute URL in dev / inside the APK fallback. */
export const API_URL: string = (() => {
  if (typeof window !== 'undefined' && /^https:/.test(window.location.origin) && !/localhost/.test(window.location.hostname)) {
    return window.location.origin;
  }
  return ENV_URL || DEFAULT_URL;
})();

const SESSION_KEY = 'bcs-monster-session-v2';

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  user: { id: string; email: string; user_metadata?: Record<string, unknown> };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let session: Session | null = readSession();
const listeners = new Set<(s: Session | null) => void>();

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  session = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage full / private mode */
  }
  listeners.forEach((l) => l(s));
}

export function onSessionChange(fn: (s: Session | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSession(): Session | null {
  return session;
}

function friendly(msg: string, status: number): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_grant') || m.includes('invalid credentials')) return 'Invalid email or password.';
  if (m.includes('email not confirmed')) return 'Please verify your email with the 6-digit code sent to your inbox.';
  if (m.includes('token has expired') || m.includes('otp_expired') || m.includes('invalid otp') || m.includes('invalid token')) {
    return 'Invalid or expired verification code. Please check the code or request a new one.';
  }
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user_already_exists')) return 'This email already has an account. Please sign in.';
  if (m.includes('password should be') || m.includes('weak_password')) return 'Password must be at least 6 characters.';
  if (m.includes('error sending') || m.includes('smtp') || m.includes('dial tcp')) {
    return 'Email delivery server (SMTP) is not configured yet. Please contact the admin to connect SMTP.';
  }
  if (m.includes('rate limit') || status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('email') && m.includes('invalid')) return 'Please enter a valid email address.';
  return msg || 'Something went wrong. Please try again.';
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (init.auth !== false) {
    const s = await validSession();
    if (s) headers.set('Authorization', `Bearer ${s.access_token}`);
  }
  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers });
  } catch {
    throw new ApiError('No internet connection. Please check your network.', 0);
  }
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const b = (body ?? {}) as Record<string, string>;
    const msg = b.msg || b.message || b.error_description || b.error || res.statusText;
    if (res.status === 401 && init.auth !== false) writeSession(null);
    throw new ApiError(friendly(String(msg), res.status), res.status);
  }
  return body as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

type RawSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: Session['user'];
};

function toSession(r: RawSession): Session {
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: r.expires_at ?? Math.floor(Date.now() / 1000) + r.expires_in,
    user: r.user
  };
}

let refreshing: Promise<Session | null> | null = null;

/** Returns a session whose access token is valid for at least another minute (refreshing if needed). */
export async function validSession(): Promise<Session | null> {
  const s = session;
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  if (!refreshing) {
    refreshing = request<RawSession>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ refresh_token: s.refresh_token })
    })
      .then((r) => {
        const next = toSession(r);
        writeSession(next);
        return next;
      })
      .catch((e: ApiError) => {
        // Offline: keep the old session so the app still opens; real auth errors sign out.
        if (e.status !== 0) writeSession(null);
        return e.status === 0 ? s : null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const r = await request<RawSession>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
  });
  const s = toSession(r);
  writeSession(s);
  return s;
}

export interface SignUpOutcome {
  session: Session | null;
  needsVerification: boolean;
  email: string;
}

export async function signUp(email: string, password: string, displayName: string): Promise<SignUpOutcome> {
  const cleanEmail = email.trim().toLowerCase();
  const r = await request<Partial<RawSession> & { id?: string; email?: string; confirmation_sent_at?: string }>(
    '/auth/v1/signup',
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        email: cleanEmail,
        password,
        data: { display_name: displayName.trim() }
      })
    }
  );
  if (r.access_token && r.refresh_token && r.user) {
    const s = toSession(r as RawSession);
    writeSession(s);
    return { session: s, needsVerification: false, email: cleanEmail };
  }
  // GoTrue requires email OTP verification before creating a session.
  return { session: null, needsVerification: true, email: cleanEmail };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  type: 'signup' | 'recovery' | 'email'
): Promise<Session> {
  const r = await request<RawSession>('/auth/v1/verify', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type
    })
  });
  const s = toSession(r);
  writeSession(s);
  return s;
}

export async function resendOtp(email: string, type: 'signup' = 'signup'): Promise<void> {
  await request('/auth/v1/resend', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: email.trim().toLowerCase(), type })
  });
}

export async function signInWithGoogleIdToken(idToken: string, nonce?: string): Promise<Session> {
  const payload: Record<string, string> = {
    provider: 'google',
    id_token: idToken
  };
  if (nonce) payload.nonce = nonce;
  const r = await request<RawSession>('/auth/v1/token?grant_type=id_token', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload)
  });
  const s = toSession(r);
  writeSession(s);
  return s;
}

export async function signOut(): Promise<void> {
  const s = session;
  writeSession(null);
  if (s) {
    try {
      await fetch(API_URL + '/auth/v1/logout', { method: 'POST', headers: { Authorization: `Bearer ${s.access_token}` } });
    } catch {
      /* offline is fine */
    }
  }
}

export async function changePassword(password: string): Promise<void> {
  await request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
}

export async function recoverPassword(email: string): Promise<void> {
  await request('/auth/v1/recover', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: email.trim().toLowerCase() })
  });
}

export interface AuthServerSettings {
  google: boolean;
  email: boolean;
  mailerAutoconfirm: boolean;
  googleClientId: string;
}

export async function getAuthSettings(): Promise<AuthServerSettings> {
  let google = false;
  let email = true;
  let mailerAutoconfirm = true;
  let googleClientId = ENV_GOOGLE_CLIENT_ID.trim();

  try {
    const res = await fetch(`${API_URL}/auth/v1/settings`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as {
        external?: { google?: boolean; email?: boolean };
        mailer_autoconfirm?: boolean;
      };
      google = Boolean(data?.external?.google);
      email = data?.external?.email !== false;
      mailerAutoconfirm = data?.mailer_autoconfirm !== false;
    }
  } catch {
    /* keep defaults */
  }

  if (!googleClientId) {
    try {
      const cfgRes = await fetch(`./auth-config.json?t=${Date.now()}`, { cache: 'no-store' });
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as { googleClientId?: string };
        if (cfg.googleClientId) googleClientId = cfg.googleClientId.trim();
      }
    } catch {
      /* optional runtime config */
    }
  }

  return { google, email, mailerAutoconfirm, googleClientId };
}

export function getGoogleOAuthUrl(): string {
  const redirectTo = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${API_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

/** Handles OAuth / Password Recovery redirect tokens if present in URL hash. */
export async function consumeAuthRedirectHash(): Promise<'recovery' | 'oauth' | null> {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') || '';
  const expiresIn = Number(params.get('expires_in') || 3600);
  const type = params.get('type');
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const user = (await res.json()) as Session['user'];
    writeSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      user
    });
    window.history.replaceState(null, '', window.location.pathname + '#/');
    return type === 'recovery' ? 'recovery' : 'oauth';
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ data */
export interface Profile {
  id: string;
  display_name: string;
  target_bcs: string | null;
  settings: Record<string, unknown>;
}

export async function getProfile(): Promise<Profile | null> {
  const s = await validSession();
  if (!s) return null;
  const rows = await request<Profile[]>(`/rest/v1/profiles?id=eq.${s.user.id}&select=id,display_name,target_bcs,settings`);
  return rows[0] ?? null;
}

export async function updateProfile(patch: Partial<Pick<Profile, 'display_name' | 'target_bcs' | 'settings'>>): Promise<void> {
  const s = await validSession();
  if (!s) return;
  await request(`/rest/v1/profiles?id=eq.${s.user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  });
}

export interface AttemptInput {
  mode: 'mock' | 'practice' | 'subject';
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  duration_sec: number;
  subjects: Record<string, { correct: number; total: number }>;
}

export interface Stats {
  attempts: number;
  questions: number;
  correct: number;
  accuracy: number;
  best_score: number | null;
  avg_score: number | null;
  xp: number;
  last_studied: string | null;
  streak_days: number;
  subjects: Record<string, { correct: number; total: number }>;
}

export interface LeaderRow {
  rank: number;
  display_name: string;
  xp: number;
  attempts: number;
  best_score: number | null;
  is_me: boolean;
}

const QUEUE_KEY = 'bcs-monster-attempt-queue';

function readQueue(): (AttemptInput & { client_id: string })[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(q: (AttemptInput & { client_id: string })[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50)));
  } catch {
    /* ignore */
  }
}

/** Saves a finished test. Works offline: queued and sent automatically when back online. */
export async function recordAttempt(a: AttemptInput): Promise<void> {
  const item = { ...a, score: Math.round(a.score * 100) / 100, client_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
  writeQueue([...readQueue(), item]);
  await flushAttempts();
}

let flushing = false;
export async function flushAttempts(): Promise<void> {
  if (flushing || !session) return;
  const q = readQueue();
  if (!q.length) return;
  flushing = true;
  try {
    await request('/rest/v1/attempts?on_conflict=user_id,client_id', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(q)
    });
    const sent = new Set(q.map((x) => x.client_id));
    writeQueue(readQueue().filter((x) => !sent.has(x.client_id)));
  } catch {
    /* stays queued */
  } finally {
    flushing = false;
  }
}

export const pendingAttempts = (): number => readQueue().length;

export async function getStats(): Promise<Stats> {
  return request<Stats>('/rest/v1/rpc/my_stats', { method: 'POST', body: '{}' });
}

export async function getLeaderboard(limit = 50): Promise<LeaderRow[]> {
  return request<LeaderRow[]>('/rest/v1/rpc/leaderboard', { method: 'POST', body: JSON.stringify({ p_limit: limit }) });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushAttempts());
}
