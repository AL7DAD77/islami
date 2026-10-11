import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alhaddad.islami',
  appName: 'إسلامي',
  webDir: 'out',
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true
  }
};

export default config;