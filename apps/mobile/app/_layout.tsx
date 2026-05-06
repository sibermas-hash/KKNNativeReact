import { useEffect, useRef, useCallback } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import {
  registerForPushNotifications,
  setupAndroidChannels,
  handleNotificationReceived,
  handleNotificationResponse,
} from '@/lib/notifications';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { fetchUser, isAuthenticated, isLoading, user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const deviceTokenRegistered = useRef(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Push notification setup - run once on mount
  useEffect(() => {
    setupAndroidChannels();

    registerForPushNotifications().then((token) => {
      // Registration function - only called when auth state is confirmed
      const registerToken = async () => {
        if (!token || deviceTokenRegistered.current) return;

        const deviceId = Platform.OS === 'android' ? Application.getAndroidId() : Device.deviceName;
        try {
          await api.post('/device-tokens', {
            token,
            platform: Platform.OS,
            device_id: deviceId || 'unknown',
          });
          deviceTokenRegistered.current = true;
        } catch (err) {
          console.warn('Failed to register device token:', err);
        }
      };

      // Only register when user is authenticated and stable
      if (isAuthenticated) {
        registerToken();
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      deviceTokenRegistered.current = false;
    };
  }, [isAuthenticated]);

  // Auth routing
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      if (!pathname.startsWith('/(auth)')) router.replace('/(auth)/login');
      return;
    }
    const roles = user?.roles || [];
    const isDpl = roles.includes('dpl') || roles.includes('dosen');
    if (pathname.startsWith('/(tabs)') && isDpl) {
      router.replace('/(dpl-tabs)');
    } else if (pathname.startsWith('/(dpl-tabs)') && !isDpl) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, user, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(dpl-tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
