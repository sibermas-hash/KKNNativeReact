import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const endpoints = studentEndpoints(api);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => {
      const res = await endpoints.dashboard();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const registration = data?.registration as Record<string, unknown> | null | undefined;

  return (
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>Halo, {String(user?.name || 'Mahasiswa')} 👋</Text>
          {user?.nim && <Text style={styles.nimText}>NIM: {user.nim}</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{String((data?.daily_report_count as number) || 0)}</Text>
            <Text style={styles.statLabel}>Laporan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{String((data?.work_program_count as number) || 0)}</Text>
            <Text style={styles.statLabel}>Progja</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statStatus}>
              {String(registration?.status === 'approved' ? '✅' : registration?.status === 'pending' ? '⏳' : '❌')}
            </Text>
          </View>
        </View>

      {registration?.group ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kelompok</Text>
          <Text style={styles.cardText}>{String((registration.group as Record<string, unknown>)?.name || '-')}</Text>
          <Text style={styles.cardSubtext}>Lokasi: {String(((registration.group as Record<string, unknown>)?.location as Record<string, unknown>)?.name || '-')}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/reports')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Buat Laporan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2563eb' }]} onPress={() => router.push('/(tabs)/activities')}>
          <Text style={styles.actionIcon}>🎯</Text>
          <Text style={styles.actionText}>Program Kerja</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  welcome: { marginBottom: 20 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  nimText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#0d9488' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  statStatus: { fontSize: 24, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardText: { fontSize: 14, color: '#334155', marginTop: 4 },
  cardSubtext: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#0d9488', borderRadius: 16, padding: 20, alignItems: 'center' },
  actionIcon: { fontSize: 28 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },
});
