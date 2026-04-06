import { Capacitor } from '@capacitor/core';

/**
 * Register for push notifications on native platforms.
 * Sends the device token to the server for later use.
 * No-op on web.
 */
export async function registerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    fetch(route('api.device-tokens.store'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ token: token.value, platform: 'android' }),
      credentials: 'same-origin',
    }).catch(() => {
      // Silently fail - token registration is best-effort
    });
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const url = action.notification.data?.url;
    if (url && typeof url === 'string') {
      window.location.href = url;
    }
  });
}
