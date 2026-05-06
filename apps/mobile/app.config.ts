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
    permissions: [
      'CAMERA',
      'WRITE_EXTERNAL_STORAGE',
      'READ_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'INTERNET',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
  },
  ios: {
    bundleIdentifier: 'ac.id.uinsaizu.kkn',
    infoPlist: {
      NSCameraUsageDescription: 'Aplikasi membutuhkan akses kamera untuk mengambil bukti kegiatan.',
      NSPhotoLibraryUsageDescription: 'Aplikasi membutuhkan akses galeri untuk memilih dan mengunggah foto.',
      NSLocationWhenInUseUsageDescription: 'Aplikasi membutuhkan akses lokasi untuk pencatatan kehadiran.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Aplikasi membutuhkan akses lokasi untuk pencatatan kehadiran.',
    },
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
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://sibermas.uinsaizu.ac.id/api/v1',
  },
};

export default config;
