import { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TextInput, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors,
  FieldLabel,
  formStyles,
  HeroCard,
  InlineAlert,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type ReportDetailResponse = {
  data?: Record<string, unknown>;
};

function isReportDetail(value: unknown): value is ReportDetailResponse {
  return typeof value === 'object' && value !== null && 'data' in value;
}

/**
 * DPL-side review view for a student's daily report.
 *
 * Routed from /(dpl-tabs)/reports via `router.push('/reports/' + id)`.
 * Supports approve (one-click confirm) and revision (with review_notes
 * textarea). Both actions call the underlying endpoint and invalidate the
 * listing query so the pending count decreases on return.
 */
export default function DplReportDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [revisionNotes, setRevisionNotes] = useState('');

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['dpl', 'daily-reports', id],
    queryFn: async () => {
      const result = await endpoints.dailyReports.show(id);
      return isReportDetail(result) ? (result.data as Record<string, unknown>) : null;
    },
    enabled: Number.isFinite(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] });
    queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports', id] });
  };

  const approveMutation = useMutation({
    mutationFn: () => endpoints.dailyReports.approve(id),
    onSuccess: () => {
      invalidate();
      Alert.alert('Berhasil', 'Laporan telah disetujui.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Gagal', 'Tidak dapat menyetujui laporan. Coba lagi.'),
  });

  const revisionMutation = useMutation({
    mutationFn: (notes: string) => endpoints.dailyReports.revision(id, { review_notes: notes }),
    onSuccess: () => {
      invalidate();
      setRevisionNotes('');
      Alert.alert('Berhasil', 'Permintaan revisi telah dikirim.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Gagal', 'Tidak dapat mengirim revisi. Coba lagi.'),
  });

  const handleApprove = () => {
    Alert.alert('Setujui Laporan', 'Yakin menyetujui laporan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Setujui', onPress: () => approveMutation.mutate() },
    ]);
  };

  const handleRevision = () => {
    const trimmed = revisionNotes.trim();
    if (trimmed.length < 5) {
      Alert.alert('Catatan kurang jelas', 'Tuliskan minimal 5 karakter catatan revisi agar mahasiswa paham yang perlu diperbaiki.');
      return;
    }
    revisionMutation.mutate(trimmed);
  };

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

  const canReview = status === 'submitted';
  const mahasiswa = (data.mahasiswa as Record<string, unknown>) || {};
  const photoUrl = typeof data.photo_url === 'string' ? data.photo_url : null;
  const locationName = String(data.location_name || '');

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <HeroCard
        eyebrow={String(mahasiswa.name || '-')}
        title={String(data.title || '-')}
        subtitle={String(data.date_label || '')}
        right={<StatusPill label={statusLabels[status] || status} tone={tone} />}
      />

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

      {canReview ? (
        <>
          <SectionTitle title="Tindakan Review" />
          <SurfaceCard style={styles.reviewCard}>
            <PrimaryButton
              label={approveMutation.isPending ? 'Menyetujui...' : 'Setujui Laporan'}
              onPress={handleApprove}
              loading={approveMutation.isPending}
            />

            <View style={styles.divider} />

            <FieldLabel>Catatan Revisi (jika perlu diperbaiki)</FieldLabel>
            <TextInput
              style={[formStyles.input, formStyles.textarea, styles.textarea]}
              multiline
              placeholder="Tuliskan apa yang perlu diperbaiki mahasiswa..."
              placeholderTextColor={colors.textMuted}
              value={revisionNotes}
              onChangeText={setRevisionNotes}
            />
            <SecondaryButton
              label={revisionMutation.isPending ? 'Mengirim...' : 'Minta Revisi'}
              onPress={handleRevision}
              disabled={revisionMutation.isPending}
            />
          </SurfaceCard>
        </>
      ) : (
        <InlineAlert
          tone="slate"
          title="Review tertutup"
          description={`Laporan berstatus "${statusLabels[status] || status}" tidak dapat ditinjau ulang.`}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  photoCard: { padding: 0, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  reviewCard: { gap: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
});
