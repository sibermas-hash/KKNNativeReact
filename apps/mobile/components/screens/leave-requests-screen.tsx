import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/lib/api';
import {
  colors, radius, spacing, Screen, SectionTitle, SurfaceCard,
  PrimaryButton, SecondaryButton, StatusPill, EmptyState, LoadingState,
  FieldLabel, formStyles, type Tone,
} from '@/components/ui/primitives';

type LeaveRequest = {
  id: number;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  attachment_url?: string;
  created_at: string;
};

const statusTone: Record<string, Tone> = {
  pending: 'amber', approved: 'emerald', rejected: 'rose',
};

export function LeaveRequestsScreen() {
  const qc = useQueryClient();
  const endpoints = studentEndpoints(api);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'leave-requests'],
    queryFn: async () => {
      const res = await endpoints.leaveRequests.index();
      return (res as unknown as { data?: LeaveRequest[] })?.data || res as unknown as LeaveRequest[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('reason', reason);
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      if (file) fd.append('attachment', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as unknown as Blob);
      return endpoints.leaveRequests.store(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'leave-requests'] });
      setShowForm(false);
      setReason(''); setStartDate(''); setEndDate(''); setFile(null);
      Alert.alert('Berhasil', 'Permohonan izin berhasil dikirim.');
    },
    onError: () => Alert.alert('Gagal', 'Gagal mengirim permohonan izin.'),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets[0]) setFile(result.assets[0]);
  };

  const requests = Array.isArray(data) ? data : [];

  if (isLoading) return <LoadingState label="Memuat data izin..." />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <SectionTitle title="Permohonan Izin" subtitle="Ajukan izin tidak mengikuti kegiatan KKN." />

      {!showForm && (
        <PrimaryButton label="+ Ajukan Izin Baru" onPress={() => setShowForm(true)} tone="teal" />
      )}

      {showForm && (
        <SurfaceCard style={styles.form}>
          <FieldLabel required>Alasan Izin</FieldLabel>
          <TextInput style={[formStyles.input, formStyles.textarea]} value={reason} onChangeText={setReason} placeholder="Jelaskan alasan izin..." multiline />

          <FieldLabel required>Tanggal Mulai (YYYY-MM-DD)</FieldLabel>
          <TextInput style={formStyles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-05-10" />

          <FieldLabel required>Tanggal Selesai (YYYY-MM-DD)</FieldLabel>
          <TextInput style={formStyles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-05-12" />

          <SecondaryButton label={file ? `📎 ${file.name}` : '📎 Lampiran (opsional)'} onPress={pickFile} />

          <View style={styles.formActions}>
            <SecondaryButton label="Batal" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
            <PrimaryButton label="Kirim" onPress={() => submit.mutate()} loading={submit.isPending} disabled={!reason || !startDate || !endDate} style={{ flex: 1 }} />
          </View>
        </SurfaceCard>
      )}

      {requests.length === 0 ? (
        <EmptyState title="Belum ada permohonan" description="Anda belum pernah mengajukan izin." />
      ) : (
        <View style={styles.list}>
          {requests.map((item) => (
            <SurfaceCard key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <StatusPill label={item.status} tone={statusTone[item.status] || 'slate'} />
                <Text style={styles.date}>{item.start_date} — {item.end_date}</Text>
              </View>
              <Text style={styles.reason} numberOfLines={3}>{item.reason}</Text>
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  list: { gap: 10 },
  item: { gap: 8 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 11, color: colors.textSubtle, fontWeight: '700' },
  reason: { fontSize: 13, color: colors.text, lineHeight: 19 },
});
