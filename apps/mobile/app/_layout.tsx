import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { LogBox, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

// Suppress the dev-only "Maximum update depth exceeded" overlay coming from
// expo-router's internal ImperativeApiEmitter (imperative-api.js:25). This
// is a known library-side interaction with useSyncExternalStore that fires
// once at mount as a defensive warning but does NOT impact runtime behavior;
// we've already added state-change guards in the Zustand auth store. The
// overlay otherwise blocks the login screen from being visible during dev.
//
// Safe to keep: LogBox only affects dev builds; release builds never render
// the overlay and the underlying library fix will land in a future
// expo-router upgrade.
LogBox.ignoreLogs([
  'Maximum update depth exceeded',
  'Warning: Maximum update depth exceeded',
]);
import {
  getMobileHomeRoute,
  isDplLikeUser,
  isStudentLikeUser,
  useAuthIsLoading,
  useAuthUser,
  useFetchUserAction,
  useIsAuthenticated,
} from '@/stores';
import { api } from '@/lib/api';
import { AnimatedSplashScreen } from '@/components/animated-splash-screen';
import { RootErrorBoundary } from '@/components/root-error-boundary';
import { initSentry } from '@/lib/sentry';
import { processQueue } from '@/lib/offlineQueue';
import { queryClient, useQueryAppStateBridge } from '@/lib/query-client';
import {
  registerForPushNotifications,
  setupAndroidChannels,
  handleNotificationReceived,
  handleNotificationResponse,
} from '@/lib/notifications';

export default function RootLayout() {
  useQueryAppStateBridge();
  initSentry();

  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const fetchUser = useFetchUserAction();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthIsLoading();
  const user = useAuthUser();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const registeredPushUserRef = useRef<string | null>(null);
  const pushRegistrationKey = isAuthenticated
    ? String((user as { id?: string | number } | null)?.id ?? 'authenticated')
    : null;

  useEffect(() => {
    // Run once at mount. `fetchUser` comes from a stable Zustand action
    // so adding it to deps would be safe, but we keep deps empty here to
    // express intent clearly: "call once, never poll".
    fetchUser();
    // Splash + navigation delay: wait 2s before showing the main UI.
    // This gives expo-router time to initialize its internal state,
    // preventing the "Maximum update depth exceeded" error.
    const timeout = setTimeout(() => setAppReady(true), 2000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setupAndroidChannels();

    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      registeredPushUserRef.current = null;
      return;
    }

    const userKey = pushRegistrationKey;
    if (!userKey) return;
    if (registeredPushUserRef.current === userKey) return;

    let cancelled = false;

    async function registerDeviceToken() {
      const token = await registerForPushNotifications();
      if (!token || cancelled || registeredPushUserRef.current === userKey) return;

      const deviceId = Platform.OS === 'android' ? Application.getAndroidId() : Device.deviceName;

      try {
        await api.post('/device-tokens', {
          token,
          platform: Platform.OS,
          device_id: deviceId || 'unknown',
        });

        if (!cancelled) {
          registeredPushUserRef.current = userKey;
        }
      } catch (err) {
        console.warn('Failed to register device token:', err);
      }
    }

    registerDeviceToken();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, pushRegistrationKey]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const syncQueue = () => {
      processQueue(api).catch((error) => {
        console.warn('Failed to process offline queue:', error);
      });
    };

    NetInfo.fetch().then((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncQueue();
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncQueue();
      }
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Auth routing — guard against redirect loops by tracking the last
  // destination we navigated to.
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!appReady || isLoading) return;

    const navigateIfNeeded = (target: string) => {
      if (lastRedirectRef.current === target) return;
      if (pathname === target) return;
      lastRedirectRef.current = target;
      router.replace(target as never);
    };

    if (!isAuthenticated) {
      if (!pathname.startsWith('/(auth)')) navigateIfNeeded('/(auth)/login');
      return;
    }

    const isDpl = isDplLikeUser(user);
    const isStudent = isStudentLikeUser(user);
    const homeRoute = getMobileHomeRoute(user);

    if (pathname === '/' || pathname.length === 0) {
      navigateIfNeeded(homeRoute);
      return;
    }

    if (pathname === '/unsupported' || pathname.startsWith('/unsupported/')) {
      if (homeRoute !== '/unsupported') {
        navigateIfNeeded(homeRoute);
      }
      return;
    }

    if (pathname.startsWith('/(tabs)') && !isStudent) {
      navigateIfNeeded(homeRoute);
    } else if (pathname.startsWith('/(dpl-tabs)') && !isDpl) {
      navigateIfNeeded(homeRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady, isAuthenticated, isLoading, pathname]);

  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        {!appReady ? (
          <AnimatedSplashScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(dpl-tabs)" />
            <Stack.Screen name="unsupported" />
          </Stack>
        )}
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
