import type { CapacitorConfig } from '@capacitor/cli';

// ⚠️ التطبيق يعرض الموقع المنشور على Vercel (server.url)، و webDir يحمل الملفات المحلية
// (ومنها ملفات الأذان داخل public/audio/adhans التي تُشغَّل من النظام في الخلفية).
// لا تغيّر webDir إلى 'out' لأن المشروع ليس Static Export.
const config: CapacitorConfig = {
  appId: 'com.alhaddad.islami',
  appName: 'إسلامي',
  webDir: 'public',
  server: {
    url: 'https://islami-blush.vercel.app',
    cleartext: false,
  },
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
