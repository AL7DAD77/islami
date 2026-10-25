import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alhaddad.islami',
  appName: 'إسلامي',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_adhan',
      iconColor: '#02634D',
    },
  },
  android: {
    webContentsDebuggingEnabled: false,
    allowMixedContent: true,
  },
};

export default config;