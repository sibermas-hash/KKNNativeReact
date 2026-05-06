import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function FinalReportScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    judul_laporan: '',
    abstrak: '',
    bab1_pendahuluan: '',
    bab2_metodologi: '',
    bab3_pembahasan: '',
    bab4_penutup: '',
    daftar_pustaka: '',
    lampiran: '',
  });
  const [fileUri, setFileUri] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'final-report'],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.finalReport.index();
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!fileUri) {
        throw new Error('File laporan wajib diunggah');
      }

      const formDataObj = new FormData();
      if (fileUri) {
        const fileName = fileUri.split('/').pop() || 'laporan_akhir.pdf';
        const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/pdf';

        formDataObj.append('file', {
          uri: fileUri,
          type: fileType,
          name: fileName,
        } as any);
      }

      const endpoints = studentEndpoints(api);
      return await endpoints.finalReport.store(formDataObj);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Laporan akhir berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['student', 'final-report'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Gagal menyimpan laporan akhir');
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
      }
    } catch (error: any) {
      Alert.alert('Error', 'Gagal memilih dokumen');
    }
  };

  const handleSubmit = () => {
    if (!formData.judul_laporan || !formData.abstrak) {
      Alert.alert('Validasi', 'Judul dan abstrak laporan wajib diisi');
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

  const EditableSection = ({ title, field, multiline = false }: { title: string; field: string; multiline?: boolean }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={formData[field as keyof typeof formData]}
        onChangeText={(text) => setFormData({...formData, [field]: text})}
        placeholder={`Tulis ${title.toLowerCase()} di sini...`}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        editable={true}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Memuat laporan...</Text>
      </View>
    );
  }

  const report = data?.data?.report;
  const canEdit = !report || ['draft', 'rejected'].includes(report.status);

  if (report && !canEdit) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Laporan Akhir</Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Status: {report.status}</Text>
          {report.dpl_feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Feedback DPL:</Text>
              <Text style={styles.feedbackText}>{report.dpl_feedback}</Text>
            </View>
          )}
          {report.approved_at && (
            <Text style={styles.approvedAt}>
              Disetujui pada: {new Date(report.approved_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Laporan</Text>
          <View style={styles.dataRow}>
            <Text style={styles.label}>Judul:</Text>
            <Text style={styles.value}>{report.judul_laporan || '-'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.label}>Abstrak:</Text>
            <Text style={styles.value}>{report.abstrak || '-'}</Text>
          </View>
          {report.file_url && (
            <View style={styles.dataRow}>
              <Text style={styles.label}>File Laporan:</Text>
              <TouchableOpacity>
                <Text style={styles.downloadLink}>📄 Download PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {report.score !== null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Nilai Akhir</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{report.score}/100</Text>
            </View>
            {report.score >= 70 && (
              <View style={styles.passCard}>
                <Text style={styles.passText}>✅ LULUS Kriteria Kelulusan</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Timeline Penilaian</Text>
          {report.submitted_at && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(report.submitted_at).toLocaleDateString('id-ID')}</Text>
                <Text style={styles.timelineAction}>Laporan dikirim</Text>
              </View>
            </View>
          )}
          {report.approved_at && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(report.approved_at).toLocaleDateString('id-ID')}</Text>
                <Text style={styles.timelineAction}>Disetujui oleh DPL</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {report ? 'Edit Laporan Akhir' : 'Buat Laporan Akhir'}
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📝 Laporan akhir mencakup seluruh kegiatan KKN yang telah dilakukan selama periode.
          DPL akan menilai laporan ini.
        </Text>
      </View>

      <EditableSection title="Judul Laporan" field="judul_laporan" />
      <EditableSection title="Abstrak" field="abstrak" multiline />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Berdasarkan Bab</Text>
        <EditableSection title="Bab 1: Pendahuluan" field="bab1_pendahuluan" multiline />
        <EditableSection title="Bab 2: Metodologi" field="bab2_metodologi" multiline />
        <EditableSection title="Bab 3: Pembahasan" field="bab3_pembahasan" multiline />
        <EditableSection title="Bab 4: Penutup" field="bab4_penutup" multiline />
      </View>

      <EditableSection title="Daftar Pustaka" field="daftar_pustaka" multiline />
      <EditableSection title="Lampiran" field="lampiran" multiline />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>File Laporan (PDF) *</Text>
        {fileUri ? (
          <View style={styles.fileBox}>
            <Text style={styles.fileName}>📄 {fileUri.split('/').pop()}</Text>
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => setFileUri(null)}
            >
              <Text style={styles.removeFileText}>Ganti File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDocument}
          >
            <Text style={styles.uploadButtonText}>📤 Pilih File PDF</Text>
          </TouchableOpacity>
        )}

        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Persyaratan File:</Text>
          <Text style={styles.requirementText}>• Format: PDF (maks. 10MB)</Text>
          <Text style={styles.requirementText}>• Font size: minimal 11pt</Text>
          <Text style={styles.requirementText}>• Margin: minimal 3cm</Text>
          <Text style={styles.requirementText}>• Line spacing: 1.5</Text>
        </View>
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>Pratinjau Laporan</Text>
        <Text style={styles.previewContent}>
          Judul: {formData.judul_laporan || 'Belum diisi'}
          {'\n'}
          Panjang abstrak: {formData.abstrak?.length || 0} karakter
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitMutation.isPending && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitMutation.isPending || !fileUri}
      >
        {submitMutation.isPending ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.submitButtonText}>Mengirim...</Text>
          </>
        ) : (
          <Text style={styles.submitButtonText}>
            {report ? 'Update Laporan' : 'Kirim Laporan'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, color: '#666', textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f1f1f' },
  statusBox: { backgroundColor: '#dbeafe', borderRadius: 12, padding: 16, marginBottom: 16 },
  statusTitle: { fontSize: 18, fontWeight: '600', color: '#1e40af', marginBottom: 8 },
  feedbackBox: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  feedbackTitle: { fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 4 },
  feedbackText: { fontSize: 14, color: '#3b82f6', lineHeight: 20 },
  approvedAt: { fontSize: 13, color: '#1e40af', marginTop: 8, fontStyle: 'italic' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1f1f1f' },
  dataRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  value: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  downloadLink: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
  scoreCard: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16 },
  scoreTitle: { fontSize: 16, fontWeight: '600', color: '#166534', marginBottom: 8 },
  scoreContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center', marginBottom: 12 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#166534' },
  passCard: { backgroundColor: '#dcfce7', borderRadius: 8, padding: 12, alignItems: 'center' },
  passText: { fontSize: 14, fontWeight: '600', color: '#166534' },
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  timelineTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1f1f1f' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb', marginRight: 12, marginTop: 4 },
  timelineDotActive: { backgroundColor: '#0d9488' },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  timelineAction: { fontSize: 14, fontWeight: '500', color: '#1f1f1f' },
  infoBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f59e0b' },
  infoText: { fontSize: 13, color: '#b45309', lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#374151' },
  textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', minHeight: 45 },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  fileBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#22c55e' },
  fileName: { fontSize: 14, color: '#15803d', marginBottom: 8 },
  removeFileButton: { alignSelf: 'flex-start' },
  removeFileText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  uploadButton: { backgroundColor: '#0d9488', borderRadius: 8, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#0f766e' },
  uploadButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  requirementsBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginTop: 12 },
  requirementsTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  requirementText: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  previewSection: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 },
  previewSectionTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  previewContent: { fontSize: 13, color: '#64748b', fontFamily: 'monospace' },
  submitButton: { backgroundColor: '#0d9488', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledButton: { backgroundColor: '#9ca3af', opacity: 0.7 },
});
