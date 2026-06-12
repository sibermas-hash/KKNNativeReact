import { useState } from 'react';
import { View, Text, TextInput, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { unwrapList } from '@/lib/api-helpers';
import {
  useTheme,
  useStyles,
  useFormStyles,
  Screen,
  SectionTitle,
  SurfaceCard,
  PrimaryButton,
  SecondaryButton,
  LoadingState,
  EmptyState,
  FieldLabel,
} from '@/components/ui/primitives';

type MonitoringVisit = {
  id: number;
  visit_date: string;
  location?: string;
  notes?: string;
  group_name?: string;
  created_at: string;
};

export function DplMonitoringScreen() {
  const qc = useQueryClient();
  const endpoints = dplEndpoints(api);
  const [showForm, setShowForm] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const { colors } = useTheme();
  const formStyles = useFormStyles();

  const styles = useStyles((colors) => ({
    form: { gap: 12 },
    formActions: { flexDirection: 'row' as const, gap: 10, marginTop: 4 },
    list: { gap: 10 },
    item: { gap: 4 },
    date: { fontSize: 11, fontWeight: '900' as const, color: colors.primary, textTransform: 'uppercase' as const },
    location: { fontSize: 14, fontWeight: '800' as const, color: colors.text },
    notes: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'monitoring'],
    queryFn: async () => {
      const res = await endpoints.monitoring.index();
      return unwrapList<MonitoringVisit>(res);
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('visit_date', visitDate);
      fd.append('location', location);
      fd.append('notes', notes);
      if (photo) fd.append('photo', { uri: photo.uri, name: 'monitoring.jpg', type: 'image/jpeg' } as unknown as Blob);
      return endpoints.monitoring.store(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dpl', 'monitoring'] });
      setShowForm(false);
      setVisitDate(''); setLocation(''); setNotes(''); setPhoto(null);
      Alert.alert('Berhasil', 'Kunjungan monitoring berhasil dicatat.');
    },
    onError: () => Alert.alert('Gagal', 'Gagal menyimpan data monitoring.'),
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0]);
  };

  const visits = Array.isArray(data) ? data : [];

  if (isLoading) return <LoadingState label="Memuat data monitoring..." />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <SectionTitle title="Monitoring Lapangan" subtitle="Catat kunjungan monitoring ke lokasi KKN." />

      {!showForm && <PrimaryButton label="+ Catat Kunjungan Baru" onPress={() => setShowForm(true)} tone="teal" />}

      {showForm && (
        <SurfaceCard style={styles.form}>
          <FieldLabel required>Tanggal Kunjungan (YYYY-MM-DD)</FieldLabel>
          <TextInput
            style={formStyles.input}
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder="2026-05-10"
            placeholderTextColor={colors.textSubtle}
          />

          <FieldLabel required>Lokasi</FieldLabel>
          <TextInput
            style={formStyles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Nama desa/lokasi"
            placeholderTextColor={colors.textSubtle}
          />

          <FieldLabel>Catatan</FieldLabel>
          <TextInput
            style={[formStyles.input, formStyles.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Catatan kunjungan..."
            placeholderTextColor={colors.textSubtle}
            multiline
          />

          <SecondaryButton label={photo ? '📷 Foto diambil' : '📷 Ambil Foto'} onPress={pickPhoto} />

          <View style={styles.formActions}>
            <SecondaryButton label="Batal" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
            <PrimaryButton label="Simpan" onPress={() => submit.mutate()} loading={submit.isPending} disabled={!visitDate || !location} style={{ flex: 1 }} />
          </View>
        </SurfaceCard>
      )}

      {visits.length === 0 ? (
        <EmptyState title="Belum ada kunjungan" description="Catat kunjungan monitoring pertama Anda." />
      ) : (
        <View style={styles.list}>
          {visits.map((v) => (
            <SurfaceCard key={v.id} style={styles.item}>
              <Text style={styles.date}>{v.visit_date}</Text>
              <Text style={styles.location}>{v.location || v.group_name || '-'}</Text>
              {v.notes && <Text style={styles.notes} numberOfLines={2}>{v.notes}</Text>}
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
