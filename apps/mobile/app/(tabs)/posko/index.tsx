import { useState } from 'react';
import { View, Text, Alert, TextInput, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  useTheme,
  useStyles,
  useFormStyles,
  FieldLabel,
  HeroCard,
  InfoRow,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SurfaceCard,
} from '@/components/ui/primitives';

type PoskoResponse = {
  id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  gmaps_link?: string | null;
  photo_url?: string | null;
  photo_name?: string | null;
};

export default function PoskoScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    gmaps_link: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const { colors } = useTheme();
  const formStyles = useFormStyles();

  const styles = useStyles((colors) => ({
    card: { gap: 16 },
    cardTitle: { fontSize: 17, fontWeight: '900' as const, color: colors.text },
    formGroup: { gap: 8 },
    coordinatesRow: { flexDirection: 'row' as const, gap: 10 },
    coordinateInput: { flex: 1 },
    actions: { gap: 10, marginTop: 4 },
  }));

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'posko'],
    queryFn: () => api.get('/student/posko') as Promise<PoskoResponse>,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('latitude', formData.latitude);
      payload.append('longitude', formData.longitude);
      if (formData.gmaps_link.trim()) payload.append('gmaps_link', formData.gmaps_link.trim());
      return api.post('/student/posko', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      Alert.alert('Berhasil', 'Data posko berhasil diperbarui');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['student', 'posko'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error?.message || 'Gagal menyimpan data posko');
    },
  });

  const handleSubmit = () => {
    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Validasi', 'Latitude dan longitude wajib diisi');
      return;
    }
    mutation.mutate();
  };

  const handleEdit = () => {
    if (data) {
      setFormData({
        latitude: data.latitude?.toString() || '',
        longitude: data.longitude?.toString() || '',
        gmaps_link: data.gmaps_link || '',
      });
    }
    setIsEditing(true);
  };

  if (isLoading) {
    return <LoadingState label="Memuat posko kelompok..." />;
  }

  const posko = data;
  const hasPosko = posko?.latitude != null && posko?.longitude != null;
  const showForm = !hasPosko || isEditing;

  return (
    <Screen>
      <HeroCard
        eyebrow="Posko"
        title="Lokasi Kelompok"
        subtitle="Simpan koordinat posko agar monitoring lapangan lebih akurat."
        tone="blue"
      />

      {!showForm ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.cardTitle}>Data Posko</Text>
          <InfoRow label="Latitude" value={String(posko?.latitude ?? '-')} />
          <InfoRow label="Longitude" value={String(posko?.longitude ?? '-')} />
          <InfoRow label="Google Maps" value={posko?.gmaps_link || '-'} />
          <View style={styles.actions}>
            {posko?.gmaps_link ? (
              <SecondaryButton label="Buka Google Maps" onPress={() => Linking.openURL(posko.gmaps_link!)} />
            ) : null}
            <PrimaryButton label="Edit Posko" onPress={handleEdit} />
          </View>
        </SurfaceCard>
      ) : (
        <SurfaceCard style={styles.card}>
          <Text style={styles.cardTitle}>{hasPosko ? 'Edit Posko' : 'Tambah Posko Baru'}</Text>

          <View style={styles.formGroup}>
            <FieldLabel required>Koordinat</FieldLabel>
            <View style={styles.coordinatesRow}>
              <TextInput
                style={[formStyles.input, styles.coordinateInput]}
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="Latitude"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
              />
              <TextInput
                style={[formStyles.input, styles.coordinateInput]}
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="Longitude"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <FieldLabel>Link Google Maps</FieldLabel>
            <TextInput
              style={formStyles.input}
              value={formData.gmaps_link}
              onChangeText={(text) => setFormData({ ...formData, gmaps_link: text })}
              placeholder="https://maps.google.com/..."
              placeholderTextColor={colors.textSubtle}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={hasPosko ? 'Update Posko' : 'Simpan Posko'}
              onPress={handleSubmit}
              loading={mutation.isPending}
            />
            {isEditing ? <SecondaryButton label="Batal" onPress={() => setIsEditing(false)} /> : null}
          </View>
        </SurfaceCard>
      )}
    </Screen>
  );
}
