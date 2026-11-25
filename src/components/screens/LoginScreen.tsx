import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, User, Loader2 } from 'lucide-react';
import { AuthUser, loginWithCredentials, registerAccount } from '../../auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = isSignup ? await registerAccount(name, email, password) : await loginWithCredentials(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onLoginSuccess(res.user);
  };

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup');
    setError(null);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center px-4 py-8">
      <div className="ambient-field" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md section-card-branding rounded-[2.25rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-extrabold theme-text-primary">
            BCS Monster
          </h1>
          <p className="text-xs sm:text-sm font-rounded theme-text-secondary">
            {isSignup ? 'Create your free account and start practising' : 'Sign in to continue your preparation'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isSignup && (
            <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-rounded font-bold theme-text-secondary pl-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-rounded font-bold theme-text-secondary pl-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
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

          {error && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-300 font-rounded font-bold text-xs text-center"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-rounded font-extrabold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm font-rounded theme-text-secondary">
          {isSignup ? 'Already have an account?' : 'New to BCS Monster?'}{' '}
          <button type="button" onClick={switchMode} className="font-bold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer">
            {isSignup ? 'Sign in' : 'Create a free account'}
          </button>
        </p>
      </div>
    </div>
  );
};
