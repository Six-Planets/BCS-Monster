import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bcs-monster-theme';

/**
 * Centralized theme store.
 *
 * The initial theme is applied by the inline script in index.html BEFORE first paint,
 * so this module only reads the attribute that script already set. Components subscribe
 * through `useTheme()`, which means a theme change re-renders only the subscribers
 * (the switch itself) instead of the whole application tree.
 */
const listeners = new Set<() => void>();

function readTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

let current: ThemeMode = readTheme();

function writeDom(next: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', next);
  root.classList.toggle('dark', next === 'dark');
  root.style.colorScheme = next;
}

function applyTheme(next: ThemeMode) {
  const root = document.documentElement;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    writeDom(next);
  } else {
    // Smooth colour transitions during explicit user toggle,
    // avoiding full-page bitmap freeze from startViewTransition so component
    // sliding animations (like the theme toggle thumb) run live and fluid at 60-120fps.
    root.classList.add('theme-switching');
    writeDom(next);
    window.setTimeout(() => root.classList.remove('theme-switching'), 450);
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Ignore storage write errors
  }
}

export function setTheme(next: ThemeMode) {
  if (next === current) return;
  current = next;
  applyTheme(next);
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = (): ThemeMode => 'light';

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
