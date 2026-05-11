import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { enqueueReport, processQueue } from '@/lib/offlineQueue';
import type { QueuedReport } from '@/lib/offlineQueue';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors,
  FieldLabel,
  formStyles,
  HeroCard,
  InlineAlert,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SurfaceCard,
} from '@/components/ui/primitives';

type LocationState = { latitude: number; longitude: number } | null;

function buildDailyReportFormData(payload: QueuedReport): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('activity', payload.activity);
  formData.append('reflection', payload.reflection || '');
  formData.append('date', payload.date);
  formData.append('captured_at', payload.captured_at);
  formData.append('location_source', 'gps');
  if (payload.latitude != null) formData.append('latitude', String(payload.latitude));
  if (payload.longitude != null) formData.append('longitude', String(payload.longitude));
  if (payload.latitude != null && payload.longitude != null) {
    formData.append('location_name', `${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}`);
  }
  formData.append('category', 'administrasi');
  formData.append('abcd_stage', 'reflection');
  return formData;
}

export default function DailyReportCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const endpoints = studentEndpoints(api);

  const [title, setTitle] = useState('');
  const [activity, setActivity] = useState('');
  const [reflection, setReflection] = useState('');
  const [location, setLocation] = useState<LocationState>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: FormData) => endpoints.dailyReports.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'daily-reports'] });
      Alert.alert('Berhasil', 'Laporan harian berhasil dikirim.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      processQueue(api).catch(() => {});
    },
    onError: async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        const payload = {
          title,
          activity,
          reflection,
          date: new Date().toISOString().split('T')[0],
          captured_at: new Date().toISOString(),
          latitude: location?.latitude,
          longitude: location?.longitude,
        };
        await enqueueReport(payload);
        queryClient.invalidateQueries({ queryKey: ['student', 'daily-reports'] });
        Alert.alert('Offline', 'Anda offline. Laporan disimpan dan akan tersinkronisasi saat jaringan tersedia.');
        router.back();
        return;
      }

      Alert.alert('Error', 'Gagal mengirim laporan. Silakan coba lagi.');
    },
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Izin lokasi diperlukan untuk melaporkan kegiatan KKN. Anda dapat mengirim laporan tanpa lokasi bila diperlukan.');
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Izin lokasi ditolak. Laporan masih bisa dikirim tanpa lokasi GPS.');
        setLocationLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError('Gagal mendapatkan lokasi. Silakan coba lagi.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !activity.trim()) {
      Alert.alert('Validasi', 'Judul dan deskripsi kegiatan wajib diisi.');
      return;
    }

    if (!location) {
      Alert.alert(
        'Konfirmasi',
        'Kirim tanpa lokasi GPS?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Kirim', onPress: () => submitReport() },
        ],
      );
      return;
    }

    submitReport();
  };

  const submitReport = async () => {
    const payload: QueuedReport = {
      title,
      activity,
      reflection,
      date: new Date().toISOString().split('T')[0],
      captured_at: new Date().toISOString(),
    };

    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await enqueueReport(payload);
      Alert.alert('Offline', 'Laporan tersimpan di antrian offline. Akan dikirim saat Anda kembali online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    mutation.mutate(buildDailyReportFormData(payload));
  };

  return (
    <Screen>
      <HeroCard
        eyebrow="Laporan Harian"
        title="Catat Aktivitas"
        subtitle="Dokumentasikan kegiatan lapangan hari ini dengan ringkas dan lengkap."
      />

      <SurfaceCard style={styles.form}>
        <View style={styles.formGroup}>
          <FieldLabel required>Judul Kegiatan</FieldLabel>
          <TextInput
            style={formStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Judul kegiatan hari ini"
            placeholderTextColor={colors.textSubtle}
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel required>Deskripsi Kegiatan</FieldLabel>
          <TextInput
            style={[formStyles.input, formStyles.textarea]}
            value={activity}
            onChangeText={setActivity}
            placeholder="Jelaskan kegiatan yang dilakukan"
            placeholderTextColor={colors.textSubtle}
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel>Refleksi</FieldLabel>
          <TextInput
            style={[formStyles.input, styles.reflectionInput]}
            value={reflection}
            onChangeText={setReflection}
            placeholder="Apa yang dipelajari hari ini?"
            placeholderTextColor={colors.textSubtle}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <FieldLabel>Lokasi GPS</FieldLabel>
          <SecondaryButton
            label={location ? 'Perbarui Lokasi' : 'Gunakan Lokasi Saya'}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          />
          {location ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText} selectable>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          ) : null}
          {locationError ? <InlineAlert tone="amber" description={locationError} /> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Kirim Laporan"
            onPress={handleSubmit}
            loading={mutation.isPending}
            disabled={mutation.isPending}
          />
          <SecondaryButton label="Batal" onPress={() => router.back()} />
        </View>
      </SurfaceCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  formGroup: { gap: 8 },
  reflectionInput: { minHeight: 86, textAlignVertical: 'top' },
  locationInfo: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  locationText: { fontSize: 13, color: '#065F46', fontWeight: '800' },
  actions: { gap: 10, marginTop: 4 },
});
