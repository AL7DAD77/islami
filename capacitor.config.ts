import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.alhaddad.islami',
  appName: 'إسلامي',
  webDir: 'public',
  server: {
    url: 'https://islami-blush.vercel.app',
    cleartext: false,
  },
}

export default config