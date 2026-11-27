import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Loader2,
  KeyRound,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  BookOpen,
  Compass,
  ShieldCheck
} from 'lucide-react';
import {
  AuthUser,
  completePasswordResetWithCode,
  getClientAuthConfig,
  launchGoogleOAuth,
  loginWithCredentials,
  loginWithGoogleIdToken,
  registerAccount,
  resendSignupCode,
  sendPasswordReset,
  verifySignupCode
} from '../../auth';
import { AuthServerSettings, INSTANT_GOOGLE_CLIENT_ID } from '../../lib/api';
import { APP_VERSION } from '../../lib/updater';
import { toggleTheme, useTheme } from '../../theme';
import { AmbientSanctuary } from '../common/AmbientSanctuary';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'verify-signup' | 'reset-request' | 'reset-verify';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce?: string;
    context?: 'signin' | 'signup' | 'use';
    auto_select?: boolean;
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with';
      shape?: 'rectangular' | 'pill';
      width?: number;
      logo_alignment?: 'left' | 'center';
    }
  ) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

async function generateNoncePair(): Promise<{ raw: string; hashed: string }> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    return { raw, hashed };
  }
  return { raw, hashed: raw };
}

function waitForGoogleIdentity(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);

  return new Promise((resolve) => {
    const start = Date.now();
    // Ensure script exists (index.html preloads it, this is only a fallback)
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        window.clearInterval(timer);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 60);
  });
}

/** 6 individual tactile OTP code boxes with paste + keyboard navigation */
const OtpBoxes: React.FC<{ value: string; onChange: (val: string) => void }> = ({
  value,
  onChange
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const setAt = (idx: number, char: string) => {
    const clean = char.replace(/[^\d]/g, '');
    if (!clean) {
      const next = digits.slice();
      next[idx] = '';
      onChange(next.join(''));
      return;
    }
    if (clean.length > 1) {
      onChange(clean.slice(0, 6));
      refs.current[Math.min(5, clean.length - 1)]?.focus();
      return;
    }
    const next = digits.slice();
    next[idx] = clean;
    onChange(next.join(''));
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          value={d}
          onChange={(e) => setAt(idx, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && idx > 0) {
              refs.current[idx - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6);
            if (pasted) {
              e.preventDefault();
              onChange(pasted);
              refs.current[Math.min(5, pasted.length - 1)]?.focus();
            }
          }}
          className="h-12 w-full rounded-xl bg-white/85 dark:bg-slate-900/80 border border-indigo-400/50 dark:border-indigo-400/40 font-rounded font-extrabold text-center text-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      ))}
    </div>
  );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Instant default config — zero serial network waterfall before Google One Tap initializes
  const [authCfg, setAuthCfg] = useState<AuthServerSettings>({
    google: Boolean(INSTANT_GOOGLE_CLIENT_ID),
    email: true,
    mailerAutoconfirm: false,
    googleClientId: INSTANT_GOOGLE_CLIENT_ID
  });
  const [gisRendered, setGisRendered] = useState(false);

  const googleWrapRef = useRef<HTMLDivElement | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const onLoginSuccessRef = useRef(onLoginSuccess);
  onLoginSuccessRef.current = onLoginSuccess;

  useEffect(() => {
    void getClientAuthConfig().then(setAuthCfg);
  }, []);

  // Initialize Google Identity Services One Tap + personalized Gmail button immediately (re-themes on Dawn/Midnight)
  useEffect(() => {
    const isMain = mode === 'signin' || mode === 'signup';
    if (!isMain || !authCfg.google || !authCfg.googleClientId) {
      setGisRendered(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const ready = await waitForGoogleIdentity(4500);
      if (cancelled || !ready || !window.google?.accounts?.id) return;

      const noncePair = await generateNoncePair();
      if (cancelled) return;

      const gis = window.google.accounts.id;
      gis.initialize({
        client_id: authCfg.googleClientId,
        nonce: noncePair.hashed,
        context: mode === 'signup' ? 'signup' : 'signin',
        auto_select: false,
        itp_support: true,
        use_fedcm_for_prompt: true,
        callback: async (response: GoogleCredentialResponse) => {
          if (!response.credential) {
            setError('Google sign-in did not return a credential. Please try again.');
            return;
          }
          setBusy(true);
          setError(null);
          const res = await loginWithGoogleIdToken(response.credential, noncePair.raw);
          setBusy(false);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          onLoginSuccessRef.current(res.user);
        }
      });

      if (googleBtnRef.current && googleWrapRef.current) {
        const measured = googleWrapRef.current.clientWidth;
        const btnWidth = Math.min(376, Math.max(240, measured || 340));
        googleBtnRef.current.innerHTML = '';
        gis.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: btnWidth
        });
        setGisRendered(true);
      }

      try {
        gis.prompt();
      } catch {
        /* browser may suppress One Tap after manual dismiss */
      }
    })();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [authCfg.google, authCfg.googleClientId, mode, isDark]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    if (next === 'signin' || next === 'signup') setOtpCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);

    if (mode === 'reset-request') {
      setBusy(true);
      const res = await sendPasswordReset(email);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMode('reset-verify');
      setPassword('');
      setOtpCode('');
      setNotice('6-digit reset code sent! Check your inbox and set your new password below.');
      return;
    }

    if (mode === 'reset-verify') {
      setBusy(true);
      const res = await completePasswordResetWithCode(email, otpCode, password);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLoginSuccess(res.user);
      return;
    }

    if (mode === 'verify-signup') {
      setBusy(true);
      const res = await verifySignupCode(email, otpCode);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLoginSuccess(res.user);
      return;
    }

    if (mode === 'signup') {
      setBusy(true);
      const res = await registerAccount(name, email, password);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.needsVerification) {
        setMode('verify-signup');
        setOtpCode('');
        setNotice(`We sent a 6-digit verification code to ${res.email}.`);
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

  const handleResendCode = async () => {
    if (resending || !email.trim()) return;
    setResending(true);
    setError(null);
    const res =
      mode === 'reset-verify'
        ? await sendPasswordReset(email)
        : await resendSignupCode(email);
    setResending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice('A fresh 6-digit code has been sent to your email.');
  };

  const isMainTab = mode === 'signin' || mode === 'signup';

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-x-hidden">
      {/* AAA Living Peaceful Dawn / Midnight Sanctuary Background */}
      <AmbientSanctuary variant="hero" />

      {/* Minimal Top Bar: Brand Crest + Dawn/Midnight Switch */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full login-glass-pill">
          <img
            src="./Uttoron.png"
            alt="Uttoron"
            width={22}
            height={22}
            className="h-5 w-auto object-contain"
          />
          <span className="font-rounded font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-300 dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent">
            BCS MONSTER
          </span>
          <span className="text-[11px] font-rounded font-semibold theme-text-muted hidden sm:inline">
            by Uttoron
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Dawn Light Sanctuary' : 'Switch to Midnight Aurora Sanctuary'}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full login-glass-pill font-rounded font-bold text-xs theme-text-primary hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Dawn</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Midnight</span>
            </>
          )}
        </button>
      </header>

      {/* Main Split Sanctuary Stage */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT: Serene Editorial Identity (visible prominently on desktop, compact on mobile) */}
          <section className="lg:col-span-6 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full login-glass-pill text-xs font-rounded font-bold text-indigo-700 dark:text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>10th–50th BCS Preliminary • Complete Archive</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-rounded font-extrabold theme-text-primary tracking-tight leading-[1.1]">
                Calm, focused mastery for{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-300 dark:via-sky-300 dark:to-pink-300 bg-clip-text text-transparent">
                  every BCS stage.
                </span>
              </h1>
              <p className="font-bangla text-sm sm:text-base theme-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed">
                ৫,৬৫৫টি বিগত বিসিএস প্রশ্ন, অফিসিয়াল ২০০ নম্বরের সিলেবাস ম্যাপ, BPSC পুনরাবৃত্তি ট্রেন্ড এবং পূর্ণাঙ্গ মক টেস্ট—সব এক শান্ত, দ্রুতগতির লার্নিং স্পেসে।
              </p>
            </div>

            {/* 3 Clean Feature Highlights (hidden on very small phones so auth card stays above the fold) */}
            <div className="hidden sm:grid grid-cols-3 gap-3 pt-1 max-w-lg mx-auto lg:mx-0">
              {[
                {
                  icon: <BookOpen className="w-4 h-4 text-sky-500" />,
                  title: '5,655 Qs',
                  sub: '40 BCS Papers'
                },
                {
                  icon: <Compass className="w-4 h-4 text-indigo-500" />,
                  title: '200 Marks',
                  sub: 'Topic Master'
                },
                {
                  icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
                  title: '1-Tap Sync',
                  sub: 'Cloud Progress'
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-3.5 rounded-2xl login-glass-pill text-left space-y-1"
                >
                  {item.icon}
                  <div className="font-rounded font-extrabold text-sm theme-text-primary leading-tight">
                    {item.title}
                  </div>
                  <div className="font-rounded text-[11px] theme-text-muted">{item.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT: Sculpted Glass Auth Card */}
          <section className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[430px] login-glass-card rounded-[2rem] p-6 sm:p-7 space-y-5 relative overflow-hidden">
              {/* Subtle top prismatic light rim */}
              <div className="pointer-events-none absolute inset-x-10 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-indigo-400/75 to-transparent" />

              {/* Card Title + Mode Tabs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-rounded font-extrabold theme-text-primary">
                      {mode === 'signin' && 'Welcome back'}
                      {mode === 'signup' && 'Create your account'}
                      {mode === 'verify-signup' && 'Verify your email'}
                      {mode === 'reset-request' && 'Reset password'}
                      {mode === 'reset-verify' && 'Enter reset code'}
                    </h2>
                    <p className="text-xs font-rounded theme-text-muted mt-0.5">
                      {mode === 'signin' && 'Continue in 1 tap with Gmail or email'}
                      {mode === 'signup' && 'Start practising in seconds—free forever'}
                      {mode === 'verify-signup' && `Code sent to ${email}`}
                      {mode === 'reset-request' && 'We’ll email you a 6-digit verification code'}
                      {mode === 'reset-verify' && `Enter the 6-digit code sent to ${email}`}
                    </p>
                  </div>
                  {(mode === 'reset-request' || mode === 'reset-verify') && (
                    <span className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </span>
                  )}
                </div>

                {isMainTab && (
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-300/40 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className={`py-2 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer ${
                        mode === 'signin'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'theme-text-secondary hover:theme-text-primary'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className={`py-2 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer ${
                        mode === 'signup'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'theme-text-secondary hover:theme-text-primary'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>

              {/* PRIORITY #1: Instant Zero-Jump Google One Tap + Personalized Gmail Button */}
              {isMainTab && (
                <div className="space-y-2.5">
                  <div
                    ref={googleWrapRef}
                    className="w-full min-h-[44px] flex flex-col items-center justify-center"
                  >
                    {/* Always mounted (never display:none) so GIS measures exact full card width */}
                    <div
                      ref={googleBtnRef}
                      className={gisRendered ? 'w-full flex justify-center' : 'h-0 overflow-hidden'}
                    />

                    {!gisRendered && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => launchGoogleOAuth()}
                        className="w-full h-[44px] px-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 font-rounded font-bold text-sm theme-text-primary shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                          <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                        </svg>
                        <span>
                          {mode === 'signup' ? '1-Tap Sign Up with Google' : 'Continue with Google'}
                        </span>
                      </button>
                    )}
                  </div>

                  {gisRendered && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => launchGoogleOAuth()}
                        className="text-[11px] font-rounded font-semibold theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Choose another Google account →
                      </button>
                    </div>
                  )}

                  <div className="relative flex items-center justify-center pt-1">
                    <div className="border-t border-slate-300/50 dark:border-white/10 w-full" />
                    <span className="px-3 text-[10px] font-rounded font-bold theme-text-muted uppercase tracking-widest shrink-0">
                      or with email
                    </span>
                    <div className="border-t border-slate-300/50 dark:border-white/10 w-full" />
                  </div>
                </div>
              )}

              {/* PRIORITY #2: Streamlined Email + Password + 6-Digit OTP Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label htmlFor="signup-name" className="block text-xs font-rounded font-bold theme-text-secondary pl-1">
                      Full Name
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
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-300/70 dark:border-white/15 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== 'verify-signup' && (
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
                        placeholder="you@gmail.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-300/70 dark:border-white/15 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 6-Digit Individual Verification Code Boxes */}
                {(mode === 'verify-signup' || mode === 'reset-verify') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-rounded font-bold theme-text-secondary">
                        6-Digit Verification Code
                      </span>
                      <button
                        type="button"
                        disabled={resending}
                        onClick={handleResendCode}
                        className="inline-flex items-center gap-1 text-xs font-rounded font-bold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                        <span>{resending ? 'Sending…' : 'Resend'}</span>
                      </button>
                    </div>
                    <OtpBoxes value={otpCode} onChange={setOtpCode} />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'reset-verify') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label htmlFor="login-password" className="block text-xs font-rounded font-bold theme-text-secondary">
                        {mode === 'reset-verify' ? 'New Password' : 'Password'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('reset-request')}
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
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signin' ? 'Enter your password' : 'At least 6 characters'}
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-300/70 dark:border-white/15 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-200 font-rounded font-bold text-xs text-center"
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
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {busy
                      ? 'Please wait…'
                      : mode === 'signin'
                      ? 'Sign In'
                      : mode === 'signup'
                      ? 'Create Account'
                      : mode === 'verify-signup'
                      ? 'Verify & Enter Arena'
                      : mode === 'reset-request'
                      ? 'Send 6-Digit Reset Code'
                      : 'Update Password & Sign In'}
                  </span>
                  {!busy && <ArrowRight className="w-4 h-4" />}
                </button>

                {!isMainTab && (
                  <div className="flex items-center justify-center gap-4 pt-1">
                    {mode === 'reset-request' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset-verify')}
                        className="py-1 font-rounded font-bold text-xs text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer"
                      >
                        Already have a code?
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="py-1 font-rounded font-bold text-xs theme-text-secondary hover:theme-text-primary cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Subtle Version Footer */}
      <footer className="relative z-10 w-full text-center pb-4 pt-2 font-rounded text-[10px] tracking-wide theme-text-muted/80 select-none">
        BCS Monster v{APP_VERSION}
      </footer>
    </div>
  );
};
