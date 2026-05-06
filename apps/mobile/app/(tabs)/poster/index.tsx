import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function PosterScreen() {
  const qc = useQueryClient();
  const endpoints = studentEndpoints(api);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; mimeType?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'poster'],
    queryFn: async () => {
      const res = await (endpoints as unknown as { poster: { index: () => Promise<unknown> } }).poster.index();
      return (res as { data?: unknown }).data ?? res;
    },
  });

  const poster = data as { kelompok?: { nama_kelompok?: string; poster_potensi_desa_path?: string | null; poster_potensi_desa_name?: string | null }; allowed_types?: string[]; max_size?: string } | null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Pilih file terlebih dahulu');
      const fd = new FormData();
      fd.append('poster', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType || 'application/octet-stream' } as unknown as Blob);
      return (endpoints as unknown as { poster: { store: (d: FormData) => Promise<unknown> } }).poster.store(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'poster'] });
      setSelectedFile(null);
      Alert.alert('Berhasil', 'Poster berhasil diunggah');
    },
    onError: () => Alert.alert('Error', 'Gagal mengunggah poster'),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile({ name: result.assets[0].name, uri: result.assets[0].uri, mimeType: result.assets[0].mimeType });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const existing = poster?.kelompok;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Poster Peta Potensi Desa</Text>
      <Text style={styles.subtitle}>Sesuai Lampiran 10 Panduan KKN</Text>

      {/* Existing Poster */}
      {existing?.poster_potensi_desa_path && (
        <View style={styles.existingCard}>
          <Text style={styles.existingIcon}>✅</Text>
          <View style={styles.existingInfo}>
            <Text style={styles.existingTitle}>Poster Sudah Diunggah</Text>
            <Text style={styles.existingName} numberOfLines={1}>{existing.poster_potensi_desa_name}</Text>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoText}>Format: {poster?.allowed_types?.join(', ') || 'JPG, PNG, PDF'}</Text>
          <Text style={styles.infoText}>Ukuran maks: {poster?.max_size || '10MB'}</Text>
        </View>
      </View>

      {/* File Picker */}
      <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
        <Text style={styles.pickIcon}>📎</Text>
        <Text style={styles.pickText}>
          {selectedFile ? selectedFile.name : 'Pilih File Poster'}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedName} numberOfLines={1}>{selectedFile.name}</Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.uploadBtn, (!selectedFile || mutation.isPending) && styles.uploadBtnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={!selectedFile || mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.uploadBtnText}>
            {existing?.poster_potensi_desa_path ? '🔄 Ganti Poster' : '⬆️ Upload Poster'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  existingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ecfdf5', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  existingIcon: { fontSize: 24 },
  existingInfo: { flex: 1 },
  existingTitle: { fontSize: 14, fontWeight: '700', color: '#065f46' },
  existingName: { fontSize: 12, color: '#047857', marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#fde68a' },
  infoIcon: { fontSize: 16 },
  infoText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', marginBottom: 12 },
  pickIcon: { fontSize: 24 },
  pickText: { fontSize: 14, color: '#64748b', fontWeight: '600', flex: 1 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedName: { flex: 1, fontSize: 13, color: '#166534', fontWeight: '600' },
  removeBtn: { fontSize: 16, color: '#94a3b8', paddingLeft: 8 },
  uploadBtn: { backgroundColor: '#0d9488', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
