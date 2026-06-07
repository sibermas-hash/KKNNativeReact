import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getMobileHomeRoute, useAuthIsLoading, useAuthUser } from '@/stores';
import { useTheme } from '@/components/ui/primitives';

export default function Index() {
  const router = useRouter();
  const isLoading = useAuthIsLoading();
  const user = useAuthUser();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    router.replace(getMobileHomeRoute(user));
  }, [isLoading, router, user]);

  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.primary} /></View>;
}
