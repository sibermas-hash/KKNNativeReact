import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';

const notificationRoutes: Record<string, string> = {
  reports: '/(tabs)/reports',
  final_report: '/(tabs)/reports/final',
  registration: '/(tabs)/registration',
  certificate: '/(tabs)/certificate',
  leave_requests: '/(tabs)/leave-requests',
  dpl_reports: '/(dpl-tabs)/reports',
};

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reports', {
    name: 'Laporan KKN',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0d9488',
  });

  await Notifications.setNotificationChannelAsync('announcements', {
    name: 'Pengumuman',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync('grades', {
    name: 'Nilai & Sertifikat',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f59e0b',
  });
}

export function handleNotificationReceived(notification: Notifications.Notification): void {
  if (__DEV__) {
    console.log('Notification received:', notification.request.content.title, notification.request.content.body);
  }
}

export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const screen = response.notification.request.content.data?.screen;
  if (__DEV__) {
    console.log('Notification tapped, target screen:', screen);
  }

  if (typeof screen === 'string') {
    const route = notificationRoutes[screen] ?? (screen.startsWith('/') ? screen : null);
    if (route) {
      router.push(route as never);
    }
  }
}
