import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';

export default function DplDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const endpoints = dplEndpoints(api);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'dashboard'],
    queryFn: async () => {
      const res = await endpoints.dashboard();
      return res;
    },
  });

  const groups = (data?.groups as Record<string, unknown>[]) || [];
  const atRisk = (data?.at_risk_students as Record<string, unknown>[]) || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>DPL Dashboard</Text>
        <Text style={styles.nimText}>{user?.name || '-'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{String(groups.length)}</Text>
          <Text style={styles.statLabel}>Kelompok</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{String((data?.pending_reports as number) || 0)}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{String(atRisk.length)}</Text>
          <Text style={styles.statLabel}>Berisiko</Text>
        </View>
      </View>

      {atRisk.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Mahasiswa Tidak Aktif</Text>
          {atRisk.slice(0, 3).map((s) => (
            <Text key={String(s.id)} style={styles.warningText}>• {String(s.name || '-')} ({String(s.nim || '-')})</Text>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Kelompok Bimbingan</Text>
      {groups.map((g) => (
        <TouchableOpacity key={String(g.id)} style={styles.card}>
          <Text style={styles.cardTitle}>{String(g.name || '-')} ({String(g.code || '-')})</Text>
          <Text style={styles.cardSubtext}>{String(g.village_name || '-')} | {String(g.member_count || 0)} anggota</Text>
        </TouchableOpacity>
      ))}
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
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  warningCard: { backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, marginBottom: 20 },
  warningTitle: { fontSize: 14, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  warningText: { fontSize: 13, color: '#991b1b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardSubtext: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
