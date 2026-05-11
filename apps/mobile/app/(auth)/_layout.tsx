import { useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { getMobileHomeRoute, useAuthIsLoading, useAuthUser, useIsAuthenticated } from '@/stores';

export default function AuthLayout() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthIsLoading();
  const user = useAuthUser();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getMobileHomeRoute(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
