import React, { useCallback, useEffect, useState } from 'react';
import { Award, Check, Flame, KeyRound, Loader2, LogOut, RefreshCw, Target, Trophy, Volume2, WifiOff } from 'lucide-react';
import type { AuthUser } from '../../auth';
import {
  ApiError,
  LeaderRow,
  Stats,
  changePassword,
  getLeaderboard,
  getProfile,
  getStats,
  pendingAttempts,
  updateProfile
} from '../../lib/api';
import { APP_VERSION } from '../../lib/updater';

/* ---------------------------------------------------------------- helpers */
function useLoad<T>(fn: () => Promise<T>): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e: ApiError) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return { data, error, loading, reload: useCallback(() => setTick((t) => t + 1), []) };
}

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = 'section-card-sm', children }) => (
  <div className={`${className} rounded-[2.5rem] p-6 sm:p-10 space-y-6`}>{children}</div>
);

const Status: React.FC<{ loading: boolean; error: string | null; onRetry: () => void }> = ({ loading, error, onRetry }) => {
  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 py-10 font-rounded font-bold text-sm theme-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  if (error)
    return (
      <div className="p-5 rounded-3xl theme-subcard flex flex-col items-center gap-3 text-center">
        <WifiOff className="w-6 h-6 theme-text-muted" />
        <p className="font-rounded text-sm theme-text-secondary">{error}</p>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-rounded font-bold text-xs cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    );
  return null;
};

const fmt = (n: number | null | undefined, digits = 0) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits }));

/* ---------------------------------------------------------------- progress */
export const ProgressView: React.FC = () => {
  const { data, error, loading, reload } = useLoad<Stats>(getStats);
  const queued = pendingAttempts();
  const subjects = data ? Object.entries(data.subjects).sort((a, b) => b[1].total - a[1].total) : [];
  return (
    <Card>
      <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">Your Learning Progress</h1>
      {queued > 0 && (
        <p className="text-xs font-rounded theme-text-secondary">{queued} result(s) saved on this device — they’ll sync when you’re online.</p>
      )}
      <Status loading={loading} error={error} onRetry={reload} />
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Tests Taken', value: fmt(data.attempts) },
              { label: 'Accuracy', value: `${fmt(data.accuracy, 1)}%` },
              { label: 'Best Score', value: data.best_score === null ? '—' : `${fmt(data.best_score, 2)}/200` },
              { label: 'Study Streak', value: `${data.streak_days} ${data.streak_days === 1 ? 'Day' : 'Days'}` }
            ].map((s) => (
              <div key={s.label} className="p-5 rounded-3xl theme-subcard text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">{s.value}</div>
                <div className="text-xs font-rounded theme-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
          {data.attempts === 0 ? (
            <p className="font-rounded text-sm theme-text-secondary text-center">Finish your first mock test to see your progress here.</p>
          ) : (
            <div className="space-y-3">
              <h2 className="font-rounded font-bold theme-text-primary">By subject</h2>
              {subjects.map(([name, v]) => {
                const pct = v.total ? Math.round((100 * v.correct) / v.total) : 0;
                return (
                  <div key={name} className="p-4 rounded-2xl theme-subcard space-y-2">
                    <div className="flex items-center justify-between font-rounded text-sm">
                      <span className="font-bold theme-text-primary">{name}</span>
                      <span className="theme-text-secondary">
                        {v.correct}/{v.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

/* ---------------------------------------------------------------- leaderboard */
const MEDAL = ['bg-amber-400 text-amber-950', 'bg-slate-200 text-slate-800', 'bg-orange-300 text-orange-950'];

export const LeaderboardView: React.FC = () => {
  const { data, error, loading, reload } = useLoad<LeaderRow[]>(() => getLeaderboard(50));
  return (
    <Card className="section-card-up">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">Leaderboard</h1>
        <button type="button" onClick={reload} aria-label="Refresh" className="p-2 rounded-full theme-subcard cursor-pointer">
          <RefreshCw className="w-4 h-4 theme-text-secondary" />
        </button>
      </div>
      <p className="text-xs font-rounded theme-text-secondary">XP = 10 per correct answer + 20 per finished test.</p>
      <Status loading={loading} error={error} onRetry={reload} />
      {data && data.length === 0 && <p className="font-rounded text-sm theme-text-secondary text-center">No scores yet — be the first!</p>}
      <div className="space-y-3">
        {data?.map((row) => (
          <div
            key={`${row.rank}-${row.display_name}`}
            className={`p-4 sm:p-5 rounded-3xl flex items-center justify-between ${row.is_me ? 'bg-indigo-500/20 border-2 border-indigo-400' : 'theme-subcard'}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center font-rounded font-bold text-sm ${MEDAL[row.rank - 1] ?? 'bg-indigo-500/15 theme-text-primary'}`}>
                #{row.rank}
              </span>
              <span className="font-bangla font-bold text-base sm:text-lg theme-text-primary truncate">
                {row.display_name}
                {row.is_me ? ' (You)' : ''}
              </span>
            </div>
            <span className="font-rounded font-bold text-sm text-indigo-600 dark:text-indigo-300 shrink-0">{fmt(row.xp)} XP</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- profile */
export const ProfileView: React.FC<{ currentUser?: AuthUser | null; onLogout?: () => void }> = ({ currentUser, onLogout }) => {
  const { data } = useLoad<Stats>(getStats);
  const badge = !data
    ? null
    : data.streak_days >= 7
    ? 'Consistent Scholar'
    : data.attempts >= 10
    ? 'Dedicated Candidate'
    : data.attempts >= 1
    ? 'Rising Aspirant'
    : 'New Candidate';
  return (
    <Card className="section-card-pt">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-400 mx-auto flex items-center justify-center text-white font-rounded font-bold text-3xl shadow-lg uppercase">
          {(currentUser?.displayName || currentUser?.username || 'BC').slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">{currentUser?.displayName || 'BCS Candidate'}</h1>
          <p className="text-sm font-rounded theme-text-secondary">{currentUser?.email}</p>
        </div>
        {data && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Trophy className="w-4 h-4 text-amber-500" />, label: 'XP', value: fmt(data.xp) },
              { icon: <Target className="w-4 h-4 text-indigo-500" />, label: 'Tests', value: fmt(data.attempts) },
              { icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Streak', value: `${data.streak_days}d` }
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-3xl theme-subcard space-y-1">
                <div className="flex items-center justify-center gap-1.5">{s.icon}</div>
                <div className="text-xl font-rounded font-bold theme-text-primary">{s.value}</div>
                <div className="text-xs font-rounded theme-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {badge && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-rounded font-bold text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{badge} Badge</span>
            </div>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-300 font-rounded font-bold text-sm hover:bg-rose-500/25 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- settings */
const SETTINGS_KEY = 'bcs-monster-settings';
type Pace = 'Calm' | 'Regular' | 'Intense';
interface LocalSettings {
  sound: boolean;
  pace: Pace;
}
function readSettings(): LocalSettings {
  try {
    return { sound: true, pace: 'Regular', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { sound: true, pace: 'Regular' };
  }
}

export const SettingsView: React.FC<{ currentUser?: AuthUser | null }> = ({ currentUser }) => {
  const [settings, setSettings] = useState<LocalSettings>(readSettings);
  const [name, setName] = useState(currentUser?.displayName ?? '');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<'name' | 'pw' | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (!p) return;
        setName(p.display_name);
        const remote = p.settings as Partial<LocalSettings>;
        if (remote && (remote.sound !== undefined || remote.pace)) setSettings((s) => ({ ...s, ...remote }));
      })
      .catch(() => undefined);
  }, []);

  const save = (next: LocalSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    void updateProfile({ settings: { ...next } }).catch(() => undefined);
  };

  const saveName = async () => {
    if (name.trim().length < 2) return setMsg({ ok: false, text: 'Name is too short.' });
    setBusy('name');
    try {
      await updateProfile({ display_name: name.trim().slice(0, 60) });
      setMsg({ ok: true, text: 'Name saved. It shows on the leaderboard.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const savePw = async () => {
    if (pw.length < 6) return setMsg({ ok: false, text: 'Password must be at least 6 characters.' });
    setBusy('pw');
    try {
      await changePassword(pw);
      setPw('');
      setMsg({ ok: true, text: 'Password changed.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const input =
    'flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-300/70 dark:border-slate-700/80 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const btn = 'shrink-0 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-rounded font-bold text-xs cursor-pointer disabled:opacity-60';

  return (
    <Card className="section-card-qb">
      <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">Settings</h1>
      <div className="space-y-4">
        <div className="p-5 rounded-3xl theme-subcard flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-sky-500" />
            <span className="font-rounded font-bold theme-text-primary">Sound Effects</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sound}
            onClick={() => save({ ...settings, sound: !settings.sound })}
            className={`px-4 py-2 rounded-full font-rounded font-bold text-xs cursor-pointer transition-all ${settings.sound ? 'bg-emerald-500 text-white' : 'bg-slate-400/30 theme-text-secondary'}`}
          >
            {settings.sound ? 'On' : 'Off'}
          </button>
        </div>

        <div className="p-5 rounded-3xl theme-subcard flex flex-wrap items-center justify-between gap-3">
          <span className="font-rounded font-bold theme-text-primary">Daily Study Pace</span>
          <div className="flex items-center gap-2">
            {(['Calm', 'Regular', 'Intense'] as const).map((pace) => (
              <button
                key={pace}
                type="button"
                onClick={() => save({ ...settings, pace })}
                className={`px-4 py-1.5 rounded-full font-rounded font-bold text-xs cursor-pointer transition-all ${settings.pace === pace ? 'bg-indigo-600 text-white' : 'bg-indigo-500/15 theme-text-primary'}`}
              >
                {pace}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-3xl theme-subcard space-y-3">
          <label htmlFor="set-name" className="font-rounded font-bold theme-text-primary block">Display name</label>
          <div className="flex gap-2">
            <input id="set-name" className={input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            <button type="button" className={btn} disabled={busy !== null} onClick={saveName}>
              {busy === 'name' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="p-5 rounded-3xl theme-subcard space-y-3">
          <label htmlFor="set-pw" className="font-rounded font-bold theme-text-primary flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-500" /> Change password
          </label>
          <div className="flex gap-2">
            <input id="set-pw" type="password" autoComplete="new-password" placeholder="New password (6+ characters)" className={input} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" className={btn} disabled={busy !== null} onClick={savePw}>
              {busy === 'pw' ? 'Saving…' : 'Change'}
            </button>
          </div>
        </div>

        {msg && (
          <div role="status" className={`p-3 rounded-2xl font-rounded font-bold text-xs text-center flex items-center justify-center gap-2 ${msg.ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>
            {msg.ok && <Check className="w-4 h-4" />} {msg.text}
          </div>
        )}
        <p className="text-center text-[11px] font-rounded theme-text-muted">BCS Monster v{APP_VERSION}</p>
      </div>
    </Card>
  );
};
