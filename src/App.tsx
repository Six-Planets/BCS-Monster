import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomFloatingNav, NavDestination } from './components/layout/BottomFloatingNav';
import { DestinationView, ActiveView } from './components/screens/DestinationViews';
import { HomeScreen } from './components/screens/HomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { AuthUser, getStoredUser, logoutUser } from './auth';
import { getActiveView, navigate, useActiveView } from './router';

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
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
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
      </main>

      {/* Homepage 5-item floating bottom navigation: visible ONLY on the homepage. */}
      {isHome && (
        <BottomFloatingNav activeNav={activeNav} onSelectNav={handleSelectBottomNav} />
      )}
    </div>
  );
}

export default App;
