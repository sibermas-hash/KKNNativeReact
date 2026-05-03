import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ac.id.uinsaizu.kkn',
  appName: 'SIBERMAS',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://sibermas.uinsaizu.ac.id',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: false,
    useLegacyBridge: false,
  },
};

export default config;
