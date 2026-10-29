import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alhaddad.islami',
  appName: 'إسلامي',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher', // ✅ إجبار التطبيق على استخدام أيقونة التطبيق لضمان الظهور
      iconColor: '#02634D',
    },
  },
  android: {
    webContentsDebuggingEnabled: false,
    allowMixedContent: true,
  },
};

export default config;