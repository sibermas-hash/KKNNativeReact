import { useEffect } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getMobileHomeRoute, isStudentLikeUser, useAuthIsLoading, useAuthUser, useIsAuthenticated } from '@/stores';
import { colors, radius } from '@/components/ui/primitives';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthIsLoading();
  const user = useAuthUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/(auth)/login');
    if (!isLoading && isAuthenticated && !isStudentLikeUser(user)) {
      router.replace(getMobileHomeRoute(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !isAuthenticated || !isStudentLikeUser(user)) return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', headerTitle: 'SIBERMAS', tabBarIcon: ({ focused }) => <TabIcon label="DB" focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan', headerTitle: 'Laporan KKN', tabBarIcon: ({ focused }) => <TabIcon label="LP" focused={focused} /> }} />
      <Tabs.Screen name="work-programs" options={{ title: 'Proker', headerTitle: 'Program Kerja', tabBarIcon: ({ focused }) => <TabIcon label="PR" focused={focused} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifikasi', headerTitle: 'Notifikasi', tabBarIcon: ({ focused }) => <TabIcon label="NF" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', headerTitle: 'Profil Mahasiswa', tabBarIcon: ({ focused }) => <TabIcon label="PF" focused={focused} /> }} />
      {/* Hidden tabs — accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="posko" options={{ href: null, headerTitle: 'Posko Kelompok' }} />
      <Tabs.Screen name="registration" options={{ href: null, headerTitle: 'Pendaftaran KKN' }} />
      <Tabs.Screen name="activities" options={{ href: null, headerTitle: 'Kegiatan Harian' }} />
      <Tabs.Screen name="poster" options={{ href: null, headerTitle: 'Poster Potensi Desa' }} />
      <Tabs.Screen name="leave-requests" options={{ href: null, headerTitle: 'Permohonan Izin' }} />
      <Tabs.Screen name="evaluation" options={{ href: null, headerTitle: 'Evaluasi DPL' }} />
      <Tabs.Screen name="certificate" options={{ href: null, headerTitle: 'Sertifikat KKN' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    borderColor: colors.border,
    backgroundColor: colors.soft,
  },
  tabIconText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '900',
  },
  tabIconTextActive: {
    color: colors.accent,
  },
});
