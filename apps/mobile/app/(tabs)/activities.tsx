import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function ActivitiesScreen() {
  const endpoints = studentEndpoints(api);

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'work-programs'],
    queryFn: async () => {
      const res = await endpoints.workPrograms.index();
      return res;
    },
  });

  const programs = data?.programs || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>Belum ada program kerja</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{String(item.title || '')}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{String(item.description || '-')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{String(item.status || 'draft')}</Text>
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
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardBody: { fontSize: 14, color: '#475569', marginTop: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  badgeText: { fontSize: 11, color: '#0369a1', fontWeight: '600' },
});
