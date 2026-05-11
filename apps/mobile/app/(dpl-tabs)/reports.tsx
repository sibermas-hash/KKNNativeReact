import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors,
  EmptyState,
  HeroCard,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type DplReportsResponse = {
  data?: Record<string, unknown>[];
};

function isDplReportsResponse(value: unknown): value is DplReportsResponse {
  return typeof value === 'object' && value !== null && 'data' in value;
}

export default function DplReportsScreen() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'daily-reports'],
    queryFn: async () => {
      const result = await endpoints.dailyReports.index({ status: 'submitted' });
      return isDplReportsResponse(result) ? result : { data: [] };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.dailyReports.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); },
  });

  const reports = Array.isArray(data?.data) ? data.data : [];

  const handleApprove = (id: number, title: string) => {
    Alert.alert('Setujui Laporan', `Setujui "${title}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Setujui', onPress: () => approveMutation.mutate(id) },
    ]);
  };

  if (isLoading) {
    return <LoadingState label="Memuat laporan pending..." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      data={reports}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <HeroCard
            eyebrow="Review Laporan"
            title="Laporan Pending"
            subtitle="Tinjau dan setujui laporan harian mahasiswa yang sudah dikirim."
            tone="amber"
            right={<Text style={styles.heroCount}>{reports.length}</Text>}
          />
          <SectionTitle title="Antrian Review" subtitle="Laporan dengan status menunggu persetujuan." />
        </>
      }
      ListEmptyComponent={
        <EmptyState title="Tidak ada laporan pending" description="Semua laporan harian yang masuk sudah ditindaklanjuti." />
      }
      renderItem={({ item }) => (
        <SurfaceCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={styles.cardStudent}>{String((item.mahasiswa as Record<string, unknown>)?.name || '-')}</Text>
              <Text style={styles.cardTitle}>{String(item.title || '-')}</Text>
            </View>
            <StatusPill label="Menunggu" tone="amber" />
          </View>
          <Text style={styles.cardBody} numberOfLines={3}>{String(item.activity || '-')}</Text>
          <View style={styles.actions}>
            <PrimaryButton
              label="Setujui"
              onPress={() => handleApprove(item.id as number, String(item.title || ''))}
              loading={approveMutation.isPending}
              style={styles.actionButton}
            />
            <SecondaryButton
              label="Detail"
              onPress={() => router.push(`/(dpl-tabs)/reports/${item.id}` as never)}
              style={styles.actionButton}
            />
          </View>
        </SurfaceCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCount: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  card: { gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardCopy: { flex: 1, gap: 3 },
  cardStudent: { fontSize: 12, color: colors.textMuted, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
});
