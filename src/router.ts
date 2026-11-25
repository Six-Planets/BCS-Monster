import { useCallback, useSyncExternalStore } from 'react';
import type { ActiveView } from './components/screens/DestinationViews';

/**
 * Tiny hash-based router (no dependency). Works identically on localhost,
 * GitHub Pages subpaths (/BCS-Monster/), and Capacitor Android WebViews.
 */
const HASH_BY_VIEW: Record<ActiveView, string> = {
  home: '#/',
  'mock-test': '#/mock-test',
  'question-bank': '#/question-bank',
  'study-materials': '#/study-materials',
  'private-tutor': '#/private-tutor',
  'bcs-updates': '#/bcs-updates',
  progress: '#/progress',
  profile: '#/profile',
  settings: '#/settings',
  leaderboard: '#/leaderboard'
};

const VIEW_BY_HASH = new Map<string, ActiveView>(
  (Object.keys(HASH_BY_VIEW) as ActiveView[]).map((v) => [HASH_BY_VIEW[v], v])
);

function viewFromLocation(): ActiveView {
  if (typeof window === 'undefined') return 'home';
  const rawHash = window.location.hash.replace(/\/+$/, '');
  const normalized = rawHash === '' || rawHash === '#' ? '#/' : rawHash;
  return VIEW_BY_HASH.get(normalized) ?? 'home';
}

const listeners = new Set<() => void>();
let currentView: ActiveView = viewFromLocation();

function emit() {
  currentView = viewFromLocation();
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', emit);
  window.addEventListener('popstate', emit);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function navigate(view: ActiveView) {
  if (view === currentView) return;
  window.location.hash = HASH_BY_VIEW[view];
  emit();
}

export function useActiveView(): ActiveView {
  return useSyncExternalStore(subscribe, () => currentView, () => 'home' as ActiveView);
}

export function useNavigate() {
  return useCallback((view: ActiveView) => navigate(view), []);
}

export const getActiveView = (): ActiveView => currentView;
