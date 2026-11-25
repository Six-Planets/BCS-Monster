import type { CapacitorConfig } from '@capacitor/cli';
import { readFileSync } from 'node:fs';

// The APK is a thin native shell around the live site, so every web release reaches phones
// instantly (the app shows "Update available"). deploy/native.json holds the native build number.
let nativeCode = 1;
try {
  nativeCode = Number(JSON.parse(readFileSync('deploy/native.json', 'utf8')).code) || 1;
} catch {
  /* first build */
}

const config: CapacitorConfig = {
  appId: 'com.bcsmonster.app',
  appName: 'BCS Monster',
  webDir: 'dist',
  backgroundColor: '#0E0B20',
  appendUserAgent: `BCSMonsterApp/${nativeCode}`,
  server: {
    url: 'https://bcs.5-223-93-53.sslip.io',
    errorPath: 'offline.html',
    androidScheme: 'https'
  },
  android: { allowMixedContent: false }
};

export default config;
