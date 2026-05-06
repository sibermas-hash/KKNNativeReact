import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function ReportsScreen() {
  const router = useRouter();
  const endpoints = studentEndpoints(api);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'daily-reports'],
    queryFn: async () => {
      const res = await endpoints.dailyReports.index();
      return res.data as { success: boolean; data: Record<string, unknown>[] };
    },
  });

  const reports = data?.data || [];

  const statusColors: Record<string, string> = { draft: '#94a3b8', submitted: '#f59e0b', approved: '#10b981', revision: '#ef4444' };
  const statusLabels: Record<string, string> = { draft: 'Draft', submitted: 'Menunggu', approved: 'Disetujui', revision: 'Revisi' };

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Belum ada laporan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{String(item.date_label || '')}</Text>
              <View style={[styles.badge, { backgroundColor: statusColors[item.status as string] || '#94a3b8' }]}>
                <Text style={styles.badgeText}>{statusLabels[item.status as string] || item.status as string}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{String(item.title || '')}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{String(item.activity || '')}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/reports/create')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12, color: '#64748b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 8 },
  cardBody: { fontSize: 14, color: '#475569', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300' },
});
