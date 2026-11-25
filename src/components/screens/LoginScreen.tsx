import React, { useEffect, useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  Loader2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import {
  AuthUser,
  isGoogleAuthEnabled,
  launchGoogleOAuth,
  loginWithCredentials,
  registerAccount,
  sendPasswordReset
} from '../../auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState<boolean>(false);

  useEffect(() => {
    void isGoogleAuthEnabled().then(setGoogleEnabled);
  }, []);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);

    if (mode === 'reset') {
      setBusy(true);
      const res = await sendPasswordReset(email);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotice('If an account exists for this email, a password reset link has been sent.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setBusy(true);
      const res = await registerAccount(name, email, password);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLoginSuccess(res.user);
      return;
    }

    setBusy(true);
    const res = await loginWithCredentials(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onLoginSuccess(res.user);
  };

  const handleGoogleClick = () => {
    if (!googleEnabled) {
      setError('Google Sign-In is not enabled on the auth server yet. Please sign in or create an account with email.');
      return;
    }
    launchGoogleOAuth();
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center px-4 py-8">
      <div className="ambient-field" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md section-card-branding rounded-[2.25rem] p-6 sm:p-8 space-y-5 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
            {mode === 'reset' ? <KeyRound className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-extrabold theme-text-primary">
            BCS Monster
          </h1>
          <p className="text-xs sm:text-sm font-rounded theme-text-secondary">
            {mode === 'signin' && 'Sign in to continue your preparation'}
            {mode === 'signup' && 'Create your free account and start practising'}
            {mode === 'reset' && 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Mode Switcher */}
        {mode !== 'reset' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-slate-900/50 border border-slate-300/40 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Google Sign-In */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleClick}
              className="w-full py-3 px-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-300/70 dark:border-slate-700/80 font-rounded font-bold text-sm theme-text-primary shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-300/60 dark:border-slate-700/70 w-full" />
              <span className="px-3 text-[11px] font-rounded font-bold theme-text-muted uppercase tracking-wider shrink-0">
                or with email
              </span>
              <div className="border-t border-slate-300/60 dark:border-slate-700/70 w-full" />
            </div>
          </>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="signup-name" className="block text-xs font-rounded font-bold theme-text-secondary pl-1">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Farhan Sadik"
                  maxLength={60}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="login-email" className="block text-xs font-rounded font-bold theme-text-secondary pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label htmlFor="login-password" className="block text-xs font-rounded font-bold theme-text-secondary">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs font-rounded font-bold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg theme-text-muted hover:theme-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="signup-confirm" className="block text-xs font-rounded font-bold theme-text-secondary pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-300 font-rounded font-bold text-xs text-center"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-200 font-rounded font-bold text-xs flex items-center justify-center gap-1.5 text-center"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-rounded font-extrabold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full py-2 font-rounded font-bold text-xs theme-text-secondary hover:theme-text-primary cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
