import { Capacitor } from '@capacitor/core';

/**
 * Initialize Capacitor native plugins on app boot.
 * No-op on web platform.
 */
export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Configure status bar
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
  } catch {
    // Status bar plugin may not be available
  }

  // Handle Android back button
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    // App plugin may not be available
  }

  // Request geolocation permissions upfront
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions();
  } catch {
    // User may deny - that's fine
  }
}
