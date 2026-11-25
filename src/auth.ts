export interface AuthUser {
  email: string;
  username: string;
  displayName: string;
}

const AUTH_STORAGE_KEY = 'bcs-monster-auth-user';

const VALID_CREDENTIALS: Record<string, string> = {
  'user1@monster.com': 'user1',
  'user2@monster.com': 'user2',
  'user3@monster.com': 'user3',
  'user4@monster.com': 'user4',
  'user5@monster.com': 'user5',
  'user6@monster.com': 'user6',
  'user7@monster.com': 'user7',
  'user8@monster.com': 'user8',
  'user9@monster.com': 'user9',
  'user10@monster.com': 'user10'
};

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && typeof parsed.email === 'string' && VALID_CREDENTIALS[parsed.email]) {
      return parsed;
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function loginWithCredentials(
  emailInput: string,
  passwordInput: string
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    return { ok: false, error: 'Please enter both email and password.' };
  }

  const expectedPassword = VALID_CREDENTIALS[email];
  if (!expectedPassword || expectedPassword !== password) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const username = email.split('@')[0];
  const userNumber = username.replace('user', '');
  const user: AuthUser = {
    email,
    username,
    displayName: `BCS Candidate #${userNumber}`
  };

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }

  return { ok: true, user };
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
