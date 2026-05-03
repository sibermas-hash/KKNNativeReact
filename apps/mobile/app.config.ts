import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'SIBERMAS',
  slug: 'sibermas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'sibermas',
  splash: {
    backgroundColor: '#0f172a',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f172a',
    },
    package: 'ac.id.uinsaizu.kkn',
  },
  ios: {
    bundleIdentifier: 'ac.id.uinsaizu.kkn',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-location',
    'expo-camera',
    'expo-image-picker',
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: 'https://sibermas.uinsaizu.ac.id/api/v1',
  },
};

export default config;
