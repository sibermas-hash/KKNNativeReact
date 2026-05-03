import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { enqueueReport, processQueue } from '@/lib/offlineQueue';
import type { QueuedReport } from '@/lib/offlineQueue';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

type LocationState = { latitude: number; longitude: number } | null;

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
      // Try to process any queued reports
      processQueue(api).catch(() => {});
    },
    onError: async (err: any) => {
      // If offline or network error, enqueue the report for later sync
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        // extract fields for queue
        const payload = {
          title,
          activity,
          reflection,
          date: new Date().toISOString().split('T')[0],
          captured_at: new Date().toISOString(),
          latitude: location?.latitude ? String(location.latitude) : undefined,
          longitude: location?.longitude ? String(location.longitude) : undefined,
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
        setLocationError('Izin lokasi diperlukan untuk melaporkan kegiatan KKN. Anda dapat mengisi koordinat secara manual.');
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Izin lokasi ditolak. Silakan isi koordinat secara manual.');
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
      payload.latitude = String(location.latitude);
      payload.longitude = String(location.longitude);
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await enqueueReport(payload);
      Alert.alert('Offline', 'Laporan tersimpan di antrian offline. Akan dikirim saat Anda kembali online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('activity', payload.activity);
    formData.append('reflection', payload.reflection || '');
    formData.append('date', payload.date);
    formData.append('captured_at', payload.captured_at);
    if (payload.latitude) formData.append('latitude', payload.latitude);
    if (payload.longitude) formData.append('longitude', payload.longitude);

    mutation.mutate(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Buat Laporan Harian</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Judul Kegiatan</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Judul kegiatan hari ini"
        />

        <Text style={styles.label}>Deskripsi Kegiatan</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={activity}
          onChangeText={setActivity}
          placeholder="Jelaskan kegiatan yang dilakukan..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Refleksi</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={reflection}
          onChangeText={setReflection}
          placeholder="Apa yang dipelajari hari ini?"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Lokasi GPS</Text>
        <TouchableOpacity
          style={[styles.gpsButton, locationLoading && styles.gpsButtonDisabled]}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.gpsButtonText}>
              {location ? '📍 Perbarui Lokasi' : '📍 Gunakan Lokasi Saya'}
            </Text>
          )}
        </TouchableOpacity>

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Lokasi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {locationError && (
          <Text style={styles.locationError}>{locationError}</Text>
        )}

        <TouchableOpacity
          style={[styles.submitButton, mutation.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Kirim Laporan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  textarea: { minHeight: 100 },
  gpsButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  gpsButtonDisabled: { opacity: 0.5 },
  gpsButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  locationInfo: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, marginTop: 8 },
  locationText: { fontSize: 13, color: '#166534' },
  locationError: { fontSize: 13, color: '#dc2626', marginTop: 8 },
  submitButton: { backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});
