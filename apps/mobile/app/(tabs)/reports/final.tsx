import { useEffect, useState } from 'react';
import { View, Text, Alert, TextInput, Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors,
  FieldLabel,
  formStyles,
  HeroCard,
  InfoRow,
  InlineAlert,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type FinalReportData = {
  report?: Record<string, any> | null;
};

function isFinalReportData(value: unknown): value is FinalReportData {
  return typeof value === 'object' && value !== null;
}

function statusTone(status: string) {
  if (status === 'approved') return 'teal' as const;
  if (status === 'submitted') return 'amber' as const;
  if (status === 'rejected') return 'rose' as const;
  return 'slate' as const;
}

function EditableSection({
  title,
  value,
  onChangeText,
  multiline = false,
}: {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.formGroup}>
      <FieldLabel>{title}</FieldLabel>
      <TextInput
        style={[formStyles.input, multiline && formStyles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Tulis ${title.toLowerCase()} di sini`}
        placeholderTextColor={colors.textSubtle}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

export default function FinalReportScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    video_link: '',
    news_link: '',
  });
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'final-report'],
    queryFn: async () => {
      const result = await endpoints.finalReport.index();
      return isFinalReportData(result) ? result : { report: null };
    },
  });

  const report = data?.report;

  useEffect(() => {
    if (!report) return;
    setFormData({
      title: String(report.title || ''),
      abstract: String(report.abstract || ''),
      video_link: String(report.video_link || ''),
      news_link: String(report.news_link || ''),
    });
  }, [report]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!fileUri) {
        throw new Error('File laporan wajib diunggah');
      }

      const payload = new FormData();
      const pickedFileName = fileName || fileUri.split('/').pop() || 'laporan_akhir.pdf';

      payload.append('file', {
        uri: fileUri,
        type: 'application/pdf',
        name: pickedFileName,
      } as any);

      payload.append('title', formData.title.trim());
      if (formData.abstract.trim()) payload.append('abstract', formData.abstract.trim());
      if (formData.video_link.trim()) payload.append('video_link', formData.video_link.trim());
      if (formData.news_link.trim()) payload.append('news_link', formData.news_link.trim());

      return endpoints.finalReport.store(payload);
    },
    onSuccess: () => {
      Alert.alert('Berhasil', 'Laporan akhir berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['student', 'final-report'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
      setFileUri(null);
      setFileName(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error?.message || error.message || 'Gagal menyimpan laporan akhir');
    },
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        setFileName(result.assets[0].name);
      }
    } catch {
      Alert.alert('Error', 'Gagal memilih dokumen');
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validasi', 'Judul laporan wajib diisi');
      return;
    }

    Alert.alert(
      'Konfirmasi Pengiriman',
      'Laporan akhir akan dikirim ke DPL untuk penilaian. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim',
          onPress: () => submitMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingState label="Memuat laporan akhir..." />;
  }

  const canEdit = !report || ['draft', 'rejected'].includes(report.status);

  if (report && !canEdit) {
    const status = String(report.status || 'submitted');
    return (
      <Screen>
        <HeroCard
          eyebrow="Laporan Akhir"
          title="Status Penilaian"
          subtitle="Ringkasan laporan akhir dan hasil tinjauan DPL."
          tone={statusTone(status)}
          right={<StatusPill label={status} tone={statusTone(status)} />}
        />

        {report.review_notes ? (
          <InlineAlert tone="blue" title="Feedback DPL" description={String(report.review_notes)} />
        ) : null}

        <SurfaceCard style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informasi Laporan</Text>
          <InfoRow label="Judul" value={report.title || '-'} />
          <InfoRow label="Abstrak" value={report.abstract || '-'} />
          {report.approved_at ? (
            <InfoRow
              label="Disetujui"
              value={new Date(report.approved_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          ) : null}
          {report.file_url ? (
            <SecondaryButton
              label="Unduh PDF"
              onPress={() => Linking.openURL(report.file_url || `${api.defaults.baseURL}/student/final-report/${report.id}/preview`)}
              style={styles.downloadButton}
            />
          ) : null}
        </SurfaceCard>

        {report.score != null ? (
          <SurfaceCard style={styles.scoreCard}>
            <Text style={styles.cardTitle}>Nilai Akhir</Text>
            <Text style={styles.scoreValue}>{report.score}/100</Text>
            {report.score >= 70 ? <StatusPill label="Lulus Kriteria" tone="teal" /> : null}
          </SurfaceCard>
        ) : null}

        <SurfaceCard style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Timeline Penilaian</Text>
          {report.submitted_at ? (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(report.submitted_at).toLocaleDateString('id-ID')}</Text>
                <Text style={styles.timelineAction}>Laporan dikirim</Text>
              </View>
            </View>
          ) : null}
          {report.approved_at ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(report.approved_at).toLocaleDateString('id-ID')}</Text>
                <Text style={styles.timelineAction}>Disetujui oleh DPL</Text>
              </View>
            </View>
          ) : null}
        </SurfaceCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <HeroCard
        eyebrow="Laporan Akhir"
        title={report ? 'Edit Laporan Akhir' : 'Buat Laporan Akhir'}
        subtitle="Lengkapi narasi, tautan pendukung, dan file PDF untuk dinilai oleh DPL."
      />

      <InlineAlert
        tone="amber"
        description="Laporan akhir mencakup seluruh kegiatan KKN yang telah dilakukan selama periode. Revisi hanya dapat dilakukan bila status ditolak."
      />

      <SurfaceCard style={styles.form}>
        <EditableSection title="Judul Laporan" value={formData.title} onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))} />
        <EditableSection title="Abstrak" value={formData.abstract} onChangeText={(text) => setFormData((prev) => ({ ...prev, abstract: text }))} multiline />
        <EditableSection title="Link Video" value={formData.video_link} onChangeText={(text) => setFormData((prev) => ({ ...prev, video_link: text }))} />
        <EditableSection title="Link Berita" value={formData.news_link} onChangeText={(text) => setFormData((prev) => ({ ...prev, news_link: text }))} />

        <View style={styles.formGroup}>
          <FieldLabel required>File Laporan PDF</FieldLabel>
          {fileUri ? (
            <View style={styles.fileBox}>
              <Text style={styles.fileName} numberOfLines={1} selectable>{fileName || fileUri.split('/').pop()}</Text>
              <TouchableOpacity onPress={() => {
                setFileUri(null);
                setFileName(null);
              }}>
                <Text style={styles.removeFileText}>Ganti File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SecondaryButton label="Pilih File PDF" onPress={handlePickDocument} />
          )}
        </View>

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Pratinjau</Text>
          <Text style={styles.previewText}>Judul: {formData.title || 'Belum diisi'}</Text>
          <Text style={styles.previewText}>Abstrak: {formData.abstract?.length || 0} karakter</Text>
        </View>

        <PrimaryButton
          label={report ? 'Update Laporan' : 'Kirim Laporan'}
          onPress={handleSubmit}
          disabled={submitMutation.isPending || !fileUri}
          loading={submitMutation.isPending}
        />
      </SurfaceCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: { gap: 6 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  downloadButton: { marginTop: 10 },
  scoreCard: { gap: 10, alignItems: 'flex-start' },
  scoreValue: { color: colors.text, fontSize: 44, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timelineCard: { gap: 14 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.borderStrong, marginTop: 4 },
  timelineDotActive: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, gap: 2 },
  timelineDate: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  timelineAction: { fontSize: 14, fontWeight: '800', color: colors.text },
  form: { gap: 16 },
  formGroup: { gap: 8 },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fileName: { flex: 1, fontSize: 13, color: '#065F46', fontWeight: '800' },
  removeFileText: { color: colors.rose, fontSize: 13, fontWeight: '800' },
  previewBox: {
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  previewTitle: { fontSize: 13, color: colors.text, fontWeight: '900' },
  previewText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
