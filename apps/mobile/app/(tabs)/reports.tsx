import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { unwrapList } from '@/lib/api-helpers';
import { useTheme, useStyles, EmptyState, HeroCard, LoadingState, PrimaryButton, Screen, SectionTitle, StatusPill, SurfaceCard } from '@/components/ui/primitives';

export default function ReportsScreen() {
  const router = useRouter();
  const endpoints = studentEndpoints(api);
  const { colors } = useTheme();

  const styles = useStyles((colors, toneMap) => ({
    heroCount: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
    cardButton: { marginBottom: 12 },
    reportCard: { gap: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardDate: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    cardBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    noteBox: { marginTop: 4, backgroundColor: colors.warningSoft, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
    noteText: { fontSize: 13, color: colors.text === '#e2e8f0' ? colors.text : '#92400E', lineHeight: 19 },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'daily-reports'],
    queryFn: async () => {
      const result = await endpoints.dailyReports.index();
      return unwrapList(result);
    },
  });

  const reports = data ?? [];

  const statusLabels: Record<string, string> = { draft: 'Draft', submitted: 'Menunggu', approved: 'Disetujui', revision: 'Revisi' };

  if (isLoading) {
    return <LoadingState label="Memuat laporan harian..." />;
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <HeroCard
        eyebrow="Logbook Harian"
        title="Ritme Kegiatan Lapangan"
        subtitle="Lihat progres laporan harian dan kirim catatan aktivitas terbaru dari posko."
        right={<Text style={styles.heroCount}>{reports.length}</Text>}
      />

      <PrimaryButton label="Buat Laporan Harian" onPress={() => router.push('/(tabs)/reports/create')} />

      <SectionTitle title="Daftar Laporan" subtitle="Status terakhir dari setiap aktivitas yang sudah Anda kirim." />

      {reports.length === 0 ? (
        <EmptyState title="Belum ada laporan" description="Kirim laporan harian pertama untuk mulai membangun logbook kegiatan KKN Anda." />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardButton}
              activeOpacity={0.82}
              onPress={() => router.push(`/(tabs)/reports/${item.id}` as never)}
            >
              <SurfaceCard style={styles.reportCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{String(item.date_label || '-')}</Text>
                  <StatusPill label={statusLabels[item.status as string] || String(item.status || 'draft')} tone={item.status === 'approved' ? 'teal' : item.status === 'submitted' ? 'amber' : item.status === 'revision' ? 'rose' : 'slate'} />
                </View>
                <Text style={styles.cardTitle}>{String(item.title || '-')}</Text>
                <Text style={styles.cardBody} numberOfLines={2}>{String(item.activity || '-')}</Text>
                {String(item.review_notes || '') ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>Catatan: {String(item.review_notes)}</Text>
                  </View>
                ) : null}
              </SurfaceCard>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}


