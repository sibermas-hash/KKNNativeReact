import { useEffect } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { useAuthStore } from '@/stores';
import { Text } from 'react-native';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/(auth)/login');
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' },
      tabBarActiveTintColor: '#0d9488',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 4, height: 60 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', headerTitle: 'SIBERMAS', tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tabs.Screen name="workshops" options={{ title: 'Pembekalan', headerTitle: 'KKN Pembekalan', tabBarIcon: ({ focused }) => <TabIcon icon="🎓" focused={focused} /> }} />
      <Tabs.Screen name="posko" options={{ title: 'Posko', headerTitle: 'Posko Kelompok', tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }} />
      <Tabs.Screen name="domisili" options={{ title: 'Domisili', headerTitle: 'Domisili KKN', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tabs.Screen name="registration" options={{ title: 'Pendaftaran', headerTitle: 'Pendaftaran KKN', tabBarIcon: ({ focused }) => <TabIcon icon="📝" focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan', headerTitle: 'Laporan KKN', tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }} />
      <Tabs.Screen name="activities" options={{ title: 'Kegiatan', headerTitle: 'Kegiatan Harian', tabBarIcon: ({ focused }) => <TabIcon icon="🎯" focused={focused} /> }} />
      <Tabs.Screen name="work-programs" options={{ title: 'Proker', headerTitle: 'Program Kerja', tabBarIcon: ({ focused }) => <TabIcon icon="📌" focused={focused} /> }} />
      <Tabs.Screen name="poster" options={{ title: 'Poster', headerTitle: 'Poster Potensi Desa', tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', headerTitle: 'Profil Mahasiswa', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tabs>
  );
}
