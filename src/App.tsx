import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomFloatingNav, NavDestination } from './components/layout/BottomFloatingNav';
import type { ActiveView } from './components/screens/DestinationViews';
import { LoginScreen } from './components/screens/LoginScreen';
import { AuthUser, consumeAuthRedirectHash, getStoredUser, logoutUser, subscribeUser } from './auth';
import { flushAttempts } from './lib/api';
import { UpdateBanner } from './components/common/UpdateBanner';
import { getActiveView, navigate, useActiveView } from './router';
import { prefetchBCSQuestionBank } from './data/questionBank';

const HomeScreen = lazy(() =>
  import('./components/screens/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);
const DestinationView = lazy(() =>
  import('./components/screens/DestinationViews').then((m) => ({ default: m.DestinationView }))
);

/**
 * App shell. Everything persistent (ambient background, bottom navigation, the home
 * screen itself) is mounted once and survives route changes. Only the destination
 * screen mounts/unmounts, and it enters with a tiny opacity + transform transition.
 */
export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const view = useActiveView();
  const isHome = view === 'home';
  const homeScroll = useRef(0);
  const prevView = useRef<ActiveView>(view);

  // Keep in sync with the server session (expired / signed out elsewhere) and send any offline results.
  useEffect(() => {
    const unsub = subscribeUser(setCurrentUser);
    void consumeAuthRedirectHash().then((kind) => {
      if (kind === 'recovery') navigate('settings');
    });
    return unsub;
  }, []);
  useEffect(() => {
    if (currentUser) void flushAttempts();
  }, [currentUser]);

  // Idle-prefetch the 5,655-question classified bank once signed in so Mock Test & Question Bank open instantly.
  useEffect(() => {
    if (!currentUser) return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => prefetchBCSQuestionBank(), { timeout: 2500 });
    } else {
      const t = window.setTimeout(() => prefetchBCSQuestionBank(), 1200);
      return () => window.clearTimeout(t);
    }
  }, [currentUser]);

  // Remember the home scroll position without causing any React work.
  useEffect(() => {
    const onScroll = () => {
      if (getActiveView() === 'home') homeScroll.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Instant, predictable scroll handling (restore home position, reset for sub-screens).
  useLayoutEffect(() => {
    if (prevView.current === view) return;
    prevView.current = view;
    window.scrollTo({ top: view === 'home' ? homeScroll.current : 0, behavior: 'instant' as ScrollBehavior });
  }, [view]);

  const handleOpenDestination = useCallback((dest: ActiveView) => navigate(dest), []);
  const handleBackHome = useCallback(() => navigate('home'), []);
  const handleLogout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    navigate('home');
  }, []);

  const handleSelectBottomNav = useCallback((dest: NavDestination) => {
    if (dest === 'arena') {
      navigate('home');
    } else {
      navigate(getActiveView() === dest ? 'home' : dest);
    }
  }, []);

  if (!currentUser) {
    return (
      <>
        <LoginScreen onLoginSuccess={setCurrentUser} />
        <UpdateBanner />
      </>
    );
  }

  const activeNav: NavDestination =
    view === 'progress' || view === 'profile' || view === 'settings' || view === 'leaderboard'
      ? view
      : 'arena';

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between">
      {/* Persistent atmospheric background: one static fixed layer, no blur filters. */}
      <div className="ambient-field" aria-hidden="true" />

      <main className="relative z-10 flex-1 w-full">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center font-rounded font-bold text-sm theme-text-secondary">
              Loading BCS Monster...
            </div>
          }
        >
          {/* Home stays mounted; display:none stops its animations and layout cost while hidden. */}
          <div className={isHome ? 'screen-enter' : 'screen-hidden'}>
            <HomeScreen onOpen={handleOpenDestination} />
          </div>

          {!isHome && (
            <div key={view} className="screen-enter">
              <DestinationView
                view={view}
                onBackHome={handleBackHome}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* Homepage 5-item floating bottom navigation: visible ONLY on the homepage. */}
      {isHome && (
        <BottomFloatingNav activeNav={activeNav} onSelectNav={handleSelectBottomNav} />
      )}

      <UpdateBanner />
    </div>
  );
}

export default App;
