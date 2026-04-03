import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const getPlatform = (): 'web' | 'android' | 'ios' => Capacitor.getPlatform() as 'web' | 'android' | 'ios';

/**
 * Unified geolocation wrapper.
 * Uses Capacitor Geolocation plugin on native, falls back to browser API on web.
 */
export async function getCurrentPosition(options?: PositionOptions): Promise<{
  coords: { latitude: number; longitude: number; accuracy: number | null };
}> {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
    });
    return {
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      },
    };
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }),
      reject,
      options,
    );
  });
}
