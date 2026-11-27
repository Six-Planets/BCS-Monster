import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme, toggleTheme } from '../../theme';

export type { ThemeMode } from '../../theme';

const BrandingBarBase: React.FC = () => {
  const theme = useTheme();
  const onToggleTheme = toggleTheme;
  const isDark = theme === 'dark';

  return (
    <section
      aria-label="BCS MONSTER by Uttoron Brand Identity and Theme Switch"
      className="relative rounded-[1.65rem] sm:rounded-[2.1rem] section-card-branding px-3.5 py-2.5 sm:px-7 sm:py-3.5 overflow-hidden select-none"
    >
      {/* Subtle Prismatic Ambient Highlights */}
      <div className="pointer-events-none absolute -left-10 -top-10 w-44 h-44 rounded-full bg-gradient-to-br from-violet-400/30 via-pink-400/20 to-transparent glow-orb" />
      <div className="pointer-events-none absolute right-16 -bottom-10 w-44 h-44 rounded-full bg-gradient-to-tl from-amber-300/30 via-emerald-300/20 to-transparent glow-orb" />

      <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-6">
        {/* LEFT & CENTER: "BCS MONSTER" Dominant Brand + "by Uttoron" Secondary Identity */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* 3D Glossy Emblem Orb */}
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] sm:p-[2px] shadow-[0_6px_16px_-4px_rgba(139,92,246,0.5)] shrink-0">
            <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white/95 dark:bg-slate-950/90 flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-500" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Dominant "BCS MONSTER" Layered Typography */}
            <span className="font-rounded font-extrabold text-base sm:text-2xl lg:text-3xl tracking-tight bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600 dark:from-indigo-300 dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
              BCS MONSTER
            </span>

            {/* Secondary "by Uttoron" Identity Pill with Exact Uttoron.png Asset */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-xl sm:rounded-2xl bg-white/92 dark:bg-white/95 border border-indigo-200/80 dark:border-white/40 shadow-[0_4px_14px_-4px_rgba(79,70,229,0.16)] shrink-0">
              <span className="text-[10px] sm:text-xs font-rounded font-semibold text-slate-500 tracking-wide">
                by
              </span>
              <img
                src="./Uttoron.png"
                alt="Uttoron Logo"
                width={57}
                height={97}
                decoding="async"
                className="h-4 sm:h-5 w-auto object-contain shrink-0"
              />
              <span className="font-rounded font-bold text-[11px] sm:text-sm bg-gradient-to-r from-[#7B3F8C] via-[#D99B26] to-[#E53924] bg-clip-text text-transparent tracking-tight">
                Uttoron
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Functional, Glossy 3D Dark / Light Sliding Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="theme-toggle-btn relative inline-flex items-center gap-2 sm:gap-2.5 p-1 pr-2.5 sm:p-1.5 sm:pr-3 rounded-full theme-subcard shadow-[0_4px_16px_-4px_rgba(99,102,241,0.22)] hover:scale-[1.03] active:scale-[0.96] transition-transform cursor-pointer select-none shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {/* Recessed Capsule Track */}
          <div
            className={`relative w-[50px] sm:w-[58px] h-[26px] sm:h-[30px] p-[2px] sm:p-[2.5px] rounded-full transition-colors duration-300 flex items-center ${
              isDark
                ? 'bg-slate-900/80 border border-white/10 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.6)]'
                : 'bg-slate-200/80 border border-black/5 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12)]'
            }`}
          >

            {/* Sliding 3D Glossy Thumb (Orb) */}
            <div
              className={`theme-toggle-thumb relative z-10 w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] rounded-full flex items-center justify-center will-change-transform [--toggle-travel:24px] sm:[--toggle-travel:28px] ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-amber-200 shadow-[0_2px_10px_rgba(99,102,241,0.55),0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 text-white shadow-[0_2px_8px_rgba(245,158,11,0.5),0_0_10px_rgba(251,191,36,0.35)]'
              }`}
              style={{
                transform: isDark
                  ? 'translate3d(var(--toggle-travel, 24px), 0, 0)'
                  : 'translate3d(0, 0, 0)',
                transition:
                  'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, background 0.3s ease',
              }}
            >
              {/* Spherical 3D specular highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_28%,rgba(255,255,255,0.7)_0%,transparent_60%)]" />

              {/* Sun Icon (rotates + scales in light mode) */}
              <svg
                viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white absolute inset-0 m-auto transform transition-all duration-300 ease-out ${
                  isDark
                    ? 'scale-0 rotate-90 opacity-0 pointer-events-none'
                    : 'scale-100 rotate-0 opacity-100'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>

              {/* Moon Icon (rotates + scales in dark mode) */}
              <svg
                viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-amber-200 absolute inset-0 m-auto transform transition-all duration-300 ease-out ${
                  isDark
                    ? 'scale-100 rotate-0 opacity-100'
                    : 'scale-0 -rotate-90 opacity-0 pointer-events-none'
                }`}
                fill="currentColor"
              >
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
            </div>
          </div>

          {/* Accompanying Mode Label */}
          <div className="flex flex-col text-left select-none pointer-events-none">
            <span className="hidden sm:block text-[9px] font-rounded uppercase tracking-wider theme-text-muted leading-tight">
              Theme
            </span>
            <span className="block text-[11px] sm:text-xs font-rounded font-bold theme-text-primary leading-tight">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};

export const BCSMonsterBrandingBar = React.memo(BrandingBarBase);
