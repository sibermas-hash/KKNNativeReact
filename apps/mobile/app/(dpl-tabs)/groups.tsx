import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function DplGroupsScreen() {
  const endpoints = dplEndpoints(api);

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'groups'],
    queryFn: async () => {
      const res = await endpoints.groups.index();
      return res;
    },
  });

  const groups = data?.groups || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Belum ada kelompok</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{String(item.name || '-')} ({String(item.code || '-')})</Text>
            <Text style={styles.cardSubtext}>{String(item.village_name || '-')}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>👥 {String(item.member_count || 0)}</Text>
              <Text style={styles.stat}>📋 {String(item.daily_report_count || 0)}</Text>
              <Text style={styles.stat}>🎯 {String(item.work_program_count || 0)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardSubtext: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  stat: { fontSize: 12, color: '#475569' },
});
