
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ffws2026.app',
  appName: 'FFWS 2026',
  webDir: 'public',
  server: {
    url: 'https://ffws-2026.vercel.app',
    cleartext: false
  }
};

export default config;
