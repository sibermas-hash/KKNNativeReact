import { View, Text, StyleSheet, Image, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  useTheme,
  useStyles,
  HeroCard,
  InlineAlert,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type DailyReportDetailResponse = {
  data?: Record<string, unknown>;
};

function isReportDetail(value: unknown): value is DailyReportDetailResponse {
  return typeof value === 'object' && value !== null && 'data' in value;
}

/**
 * Student-side read-only detail view for a daily report.
 *
 * Routed from /(tabs)/reports via `router.push('/reports/' + id)`.
 * Shows full report content (activity, reflection, location, photo) and
 * any DPL review notes. Edit is only allowed while status is draft/revision;
 * the Edit button links back to the create flow (reused as editor).
 */
export default function DailyReportDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const endpoints = studentEndpoints(api);

  const styles = useStyles((colors) => ({
    body: { fontSize: 14, color: colors.text, lineHeight: 20 },
    photoCard: { padding: 0, overflow: 'hidden' },
    photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
    actions: { gap: 10, marginTop: 16 },
  }));

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['student', 'daily-reports', id],
    queryFn: async () => {
      const result = await endpoints.dailyReports.show(id);
      return isReportDetail(result) ? (result.data as Record<string, unknown>) : null;
    },
    enabled: Number.isFinite(id),
  });

  if (isLoading) {
    return <LoadingState label="Memuat detail laporan..." />;
  }

  if (error || !data) {
    return (
      <Screen>
        <InlineAlert
          tone="rose"
          title="Laporan tidak ditemukan"
          description="Laporan mungkin sudah dihapus atau Anda tidak memiliki akses."
        />
        <PrimaryButton label="Kembali" onPress={() => router.back()} />
      </Screen>
    );
  }

  const status = String(data.status || 'draft');
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Menunggu',
    approved: 'Disetujui',
    revision: 'Revisi',
  };
  const tone: 'teal' | 'amber' | 'rose' | 'slate' =
    status === 'approved' ? 'teal' : status === 'submitted' ? 'amber' : status === 'revision' ? 'rose' : 'slate';

  const canEdit = status === 'draft' || status === 'revision';
  const reviewNotes = String(data.review_notes || '');
  const photoUrl = typeof data.photo_url === 'string' ? data.photo_url : null;
  const locationName = String(data.location_name || '');

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <HeroCard
        eyebrow={String(data.date_label || '-')}
        title={String(data.title || '-')}
        subtitle={`Status: ${statusLabels[status] || status}`}
        right={<StatusPill label={statusLabels[status] || status} tone={tone} />}
      />

      {reviewNotes ? (
        <InlineAlert tone="amber" title="Catatan DPL" description={reviewNotes} />
      ) : null}

      <SectionTitle title="Aktivitas" />
      <SurfaceCard>
        <Text style={styles.body}>{String(data.activity || '-')}</Text>
      </SurfaceCard>

      {data.reflection ? (
        <>
          <SectionTitle title="Refleksi" />
          <SurfaceCard>
            <Text style={styles.body}>{String(data.reflection)}</Text>
          </SurfaceCard>
        </>
      ) : null}

      {locationName ? (
        <>
          <SectionTitle title="Lokasi" />
          <SurfaceCard>
            <Text style={styles.body}>{locationName}</Text>
          </SurfaceCard>
        </>
      ) : null}

      {photoUrl ? (
        <>
          <SectionTitle title="Foto Kegiatan" />
          <SurfaceCard style={styles.photoCard}>
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          </SurfaceCard>
        </>
      ) : null}

      <View style={styles.actions}>
        {canEdit ? (
          <PrimaryButton
            label="Edit Laporan"
            onPress={() => router.push(`/(tabs)/reports/create?edit=${id}` as never)}
          />
        ) : null}
        <PrimaryButton label="Kembali" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}


