import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  useStyles,
  EmptyState,
  HeroCard,
  LoadingState,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type DplGroupsResponse = {
  groups?: Record<string, unknown>[];
};

function isDplGroupsResponse(value: unknown): value is DplGroupsResponse {
  return typeof value === 'object' && value !== null && 'groups' in value;
}

export default function DplGroupsScreen() {
  const endpoints = dplEndpoints(api);

  const styles = useStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 16, paddingBottom: 32 },
    heroCount: { color: colors.text, fontSize: 28, fontWeight: '900' as const, fontVariant: ['tabular-nums' as const] },
    card: { gap: 14 },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, gap: 12 },
    cardCopy: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 16, fontWeight: '900' as const, color: colors.text, lineHeight: 21 },
    cardSubtext: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    statsRow: { flexDirection: 'row' as const, gap: 10 },
    miniStat: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      padding: 10,
      gap: 3,
    },
    statValue: { fontSize: 18, fontWeight: '900' as const, color: colors.text, fontVariant: ['tabular-nums' as const] },
    statLabel: { fontSize: 11, fontWeight: '800' as const, color: colors.textMuted },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'groups'],
    queryFn: async () => {
      const result = await endpoints.groups.index();
      return isDplGroupsResponse(result) ? result : { groups: [] };
    },
  });

  const groups = Array.isArray(data?.groups) ? data.groups : [];

  if (isLoading) {
    return <LoadingState label="Memuat kelompok bimbingan..." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      data={groups}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <HeroCard
            eyebrow="Kelompok"
            title="Bimbingan Lapangan"
            subtitle="Pantau komposisi kelompok, laporan, dan program kerja mahasiswa."
            tone="blue"
            right={<Text style={styles.heroCount}>{groups.length}</Text>}
          />
          <SectionTitle title="Daftar Kelompok" subtitle="Data kelompok yang berada di bawah bimbingan Anda." />
        </>
      }
      ListEmptyComponent={
        <EmptyState title="Belum ada kelompok" description="Kelompok bimbingan akan tampil setelah data periode KKN tersedia." />
      }
      renderItem={({ item }) => (
        <SurfaceCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{String(item.name || '-')}</Text>
              <Text style={styles.cardSubtext}>{String(item.village_name || '-')}</Text>
            </View>
            <StatusPill label={String(item.code || '-')} tone="blue" />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.statValue}>{String(item.member_count || 0)}</Text>
              <Text style={styles.statLabel}>Anggota</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.statValue}>{String(item.daily_report_count || 0)}</Text>
              <Text style={styles.statLabel}>Laporan</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.statValue}>{String(item.work_program_count || 0)}</Text>
              <Text style={styles.statLabel}>Proker</Text>
            </View>
          </View>
        </SurfaceCard>
      )}
    />
  );
}
