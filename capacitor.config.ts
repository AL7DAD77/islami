import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.islami.app',
  appName: 'إسلامي',
  webDir: 'public',
  server: {
    url: 'https://islami-shaml.netlify.app',
    cleartext: false,
  },
}

export default config