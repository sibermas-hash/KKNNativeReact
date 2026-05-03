import { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { fetchUser, isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => { fetchUser(); }, [fetchUser]);

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
