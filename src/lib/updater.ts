/**
 * Update checker shared by the website and the Android app.
 *  - Website / app web layer: a new release on the server → "Update available" → reload into it.
 *  - Android native shell: if the server says a newer APK exists (native.code higher than the
 *    one baked into this APK's user agent), offer to download it.
 */
import { useEffect, useState } from 'react';

export const APP_VERSION: string = (import.meta.env.VITE_APP_VERSION as string | undefined) || 'dev';
const UA_TAG = /BCSMonsterApp\/(\d+)/;
const DOWNLOAD_HOST = 'https://dl.5-223-93-53.sslip.io';

interface RemoteVersion {
  version: string;
  native?: { code: number; version: string; apk: string };
}

export type UpdateInfo =
  | { kind: 'web'; version: string }
  | { kind: 'apk'; version: string; url: string };

export function nativeCode(): number | null {
  const m = typeof navigator !== 'undefined' ? navigator.userAgent.match(UA_TAG) : null;
  return m ? Number(m[1]) : null;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (APP_VERSION === 'dev') return null;
  let remote: RemoteVersion;
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    remote = (await res.json()) as RemoteVersion;
  } catch {
    return null;
  }
  const installed = nativeCode();
  if (installed !== null && remote.native?.code && remote.native.code > installed && remote.native.apk) {
    const file = remote.native.apk.split('/').pop();
    return { kind: 'apk', version: remote.native.version || remote.version, url: `${DOWNLOAD_HOST}/bcs/${file}` };
  }
  if (remote.version && remote.version !== APP_VERSION) return { kind: 'web', version: remote.version };
  return null;
}

export async function applyUpdate(u: UpdateInfo): Promise<void> {
  if (u.kind === 'apk') {
    // Different host → Capacitor hands it to the system browser, which downloads and offers to install.
    window.location.href = u.url;
    return;
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    /* no service worker */
  }
  window.location.reload();
}

const SNOOZE_KEY = 'bcs-monster-update-snooze';

/** React hook: polls on start, every 10 minutes, and whenever the app comes back to the foreground. */
export function useUpdateCheck(): [UpdateInfo | null, () => void] {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const u = await checkForUpdate();
      if (!alive || !u) return;
      let snoozed = '';
      try {
        snoozed = sessionStorage.getItem(SNOOZE_KEY) || '';
      } catch {
        /* ignore */
      }
      if (snoozed !== `${u.kind}:${u.version}`) setInfo(u);
    };
    const first = window.setTimeout(run, 4000);
    const every = window.setInterval(run, 10 * 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(every);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  const dismiss = () => {
    if (info) {
      try {
        sessionStorage.setItem(SNOOZE_KEY, `${info.kind}:${info.version}`);
      } catch {
        /* ignore */
      }
    }
    setInfo(null);
  };
  return [info, dismiss];
}
