import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { colors, EmptyState, HeroCard, LoadingState, SectionTitle, StatusPill, SurfaceCard } from '@/components/ui/primitives';

type WorkProgramsResponse = {
  programs?: Record<string, unknown>[];
};

function isWorkProgramsResponse(value: unknown): value is WorkProgramsResponse {
  return typeof value === 'object' && value !== null && 'programs' in value;
}

function statusTone(status: string) {
  if (status === 'approved') return 'teal' as const;
  if (status === 'submitted' || status === 'pending') return 'amber' as const;
  if (status === 'revision' || status === 'rejected') return 'rose' as const;
  return 'slate' as const;
}

export default function ActivitiesScreen() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'work-programs'],
    queryFn: async () => {
      const result = await endpoints.workPrograms.index();
      return isWorkProgramsResponse(result) ? result : { programs: [] };
    },
  });

  const programs = Array.isArray(data?.programs) ? data.programs : [];

  if (isLoading) {
    return <LoadingState label="Memuat kegiatan..." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      data={programs}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <HeroCard
            eyebrow="Kegiatan"
            title="Aktivitas Kelompok"
            subtitle="Daftar program dan aktivitas yang sedang berjalan selama KKN."
            right={<Text style={styles.heroCount}>{programs.length}</Text>}
          />
          <SectionTitle title="Daftar Kegiatan" subtitle="Status ringkas dari program kerja kelompok." />
        </>
      }
      ListEmptyComponent={
        <EmptyState
          title="Belum ada kegiatan"
          description="Kegiatan akan tampil setelah program kerja kelompok dibuat atau disetujui."
        />
      }
      renderItem={({ item }) => {
        const status = String(item.status || 'draft');
        return (
          <SurfaceCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{String(item.title || '-')}</Text>
              <StatusPill label={status} tone={statusTone(status)} />
            </View>
            <Text style={styles.cardBody} numberOfLines={3}>{String(item.description || '-')}</Text>
          </SurfaceCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCount: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
