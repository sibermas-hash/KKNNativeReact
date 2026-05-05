import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function DplReportsScreen() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'daily-reports'],
    queryFn: async () => {
      const res = await endpoints.dailyReports.index({ status: 'submitted' });
      return res as { success: boolean; data: Record<string, unknown>[] };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.dailyReports.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); },
  });

  const reports = data?.data || [];

  const handleApprove = (id: number, title: string) => {
    Alert.alert('Setujui Laporan', `Setujui "${title}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Setujui', onPress: () => approveMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Tidak ada laporan pending</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardStudent}>{String((item.mahasiswa as Record<string, unknown>)?.name || '-')}</Text>
            <Text style={styles.cardTitle}>{String(item.title || '')}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{String(item.activity || '')}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(item.id as number, String(item.title || ''))}>
                <Text style={styles.approveText}>✅ Setujui</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailButton}>
                <Text style={styles.detailText}>Detail →</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  cardStudent: { fontSize: 12, color: '#64748b' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  cardBody: { fontSize: 14, color: '#475569', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveButton: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  approveText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  detailButton: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  detailText: { fontSize: 13, fontWeight: '600', color: '#475569' },
});
