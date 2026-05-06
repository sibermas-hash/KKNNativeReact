import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView } from 'expo-camera';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function RegistrationDocumentsScreen() {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: string | null }>({
    surat_persetujuan: null,
    surat_pernyataan: null,
    transkrip_nilai: null,
    surat_bebas_tunggakan: null,
    surat_kesehatan: null,
    surat_izin_orangtua: null,
    pas_foto: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'registration', 'status'],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.registration.status();
    }
  });

  useEffect(() => {
    if (data?.data?.documents) {
      const docs = data.data.documents;
      setUploadedDocs({
        surat_persetujuan: docs.surat_persetujuan?.url || null,
        surat_pernyataan: docs.surat_pernyataan?.url || null,
        transkrip_nilai: docs.transkrip_nilai?.url || null,
        surat_bebas_tunggakan: docs.surat_bebas_tunggakan?.url || null,
        surat_kesehatan: docs.surat_kesehatan?.url || null,
        surat_izin_orangtua: docs.surat_izin_orangtua?.url || null,
        pas_foto: docs.pas_foto?.url || null,
      });
    }
  }, [data]);

  const uploadMutation = useMutation({
    mutationFn: async ({ document, fileUri }: { document: string; fileUri: string }) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: document === 'pas_foto' ? 'image/jpeg' : 'application/pdf',
        name: `${document}.${document === 'pas_foto' ? 'jpg' : 'pdf'}`,
      } as any);

      const endpoints = studentEndpoints(api);
      const periodeId = data?.data?.registration?.periode_id || 1;
      return await endpoints.documents(periodeId, formData);
    },
    onSuccess: (response, variables) => {
      setUploadedDocs(prev => ({
        ...prev,
        [variables.document]: response.data?.file_url || null,
      }));
      Alert.alert('Upload Berhasil', `Dokumen ${variables.document} berhasil diunggah`);
    },
    onError: (error: any) => {
      Alert.alert('Upload Gagal', error.response?.data?.message || 'Gagal mengunggah dokumen');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handlePickDocument = async (document: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: document === 'pas_foto' ? 'image/*' : 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        uploadMutation.mutate({
          document,
          fileUri: result.assets[0].uri,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Gagal memilih dokumen');
    }
  };

  const uploadAllDocuments = async () => {
    const requiredDocs = ['surat_persetujuan', 'surat_pernyataan', 'transkrip_nilai'];
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs[doc]);

    if (missingDocs.length > 0) {
      Alert.alert('Dokumen Belum Lengkap', `Silakan lengkapi dokumen berikut:\n${missingDocs.map(d => `- ${d}`).join('\n')}`);
      return;
    }

    Alert.alert(
      'Konfirmasi upload',
      'Upload semua dokumen ke server?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Upload',
          onPress: async () => {
            for (const [doc, uri] of Object.entries(uploadedDocs)) {
              if (uri) {
                await uploadMutation.mutateAsync({ document: doc, fileUri: uri });
              }
            }
            Alert.alert('Selesai', 'Semua dokumen berhasil diunggah');
          },
        },
      ]
    );
  };

  const scanQRCode = async (document: string) => {
    const { status } = await BarcodeScanner.requestPermissionsAsync();
    if (status === 'granted') {
      setScannedData({ document });
    } else {
      Alert.alert('Izin Kamera', 'Aplikasi membutuhkan izin kamera untuk memindai QR Code');
    }
  };

  const DocumentItem = ({
    title,
    required,
    description,
    document
  }: {
    title: string;
    required: boolean;
    description: string;
    document: string;
  }) => {
    const isUploaded = uploadedDocs[document] !== null;

    return (
      <View style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.documentTitle}>{title}</Text>
            {required && <Text style={styles.requiredBadge}>Wajib</Text>}
          </View>
          {isUploaded && <Text style={styles.uploadedBadge}>✓ Terupload</Text>}
        </View>
        <Text style={styles.documentDescription}>{description}</Text>
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={[styles.actionButton, isUploaded && styles.disabledButton]}
            onPress={() => handlePickDocument(document)}
            disabled={isUploaded || uploading}
          >
            <Text style={styles.actionButtonText}>
              {isUploaded ? 'Sudah' : 'Upload'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.scanButton]}
            onPress={() => scanQRCode(document)}
          >
            <Text style={styles.actionButtonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const registration = data?.data?.registration;
  const isEditable = registration?.status === 'draft';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dokumen Pendaftaran</Text>

      {!isEditable && registration?.status !== 'draft' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Status pendaftaran: {registration?.status}. Tidak dapat mengedit dokumen.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dokumen Wajib</Text>
        <DocumentItem
          title="Surat Persetujuan"
          required
          description="Surat persetujuan partisipasi KKN yang ditandatangani dan di-stempel"
          document="surat_persetujuan"
        />
        <DocumentItem
          title="Surat Pernyataan"
          required
          description="Surat pernyataan sanggup mengikuti seluruh rangkaian kegiatan KKN"
          document="surat_pernyataan"
        />
        <DocumentItem
          title="Transkrip Nilai"
          required
          description="Transkrip nilai terlegalisir oleh pihak kampus"
          document="transkrip_nilai"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dokumen Tambahan</Text>
        <DocumentItem
          title="Surat Bebas Tunggakan"
          required={false}
          description="Surat keterangan bebas tunggakan biaya kuliah"
          document="surat_bebas_tunggakan"
        />
        <DocumentItem
          title="Surat Kesehatan"
          required={false}
          description="Surat keterangan sehat dari fasilitas kesehatan"
          document="surat_kesehatan"
        />
        <DocumentItem
          title="Surat Izin Orangtua"
          required={false}
          description="Surat izin orangtua/wali untuk mengikuti KKN"
          document="surat_izin_orangtua"
        />
        <DocumentItem
          title="Pas Foto"
          required={false}
          description="Pas foto ukuran 3x4, latar belakang merah (format JPG)"
          document="pas_foto"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Upload</Text>
        {Object.entries(uploadedDocs).map(([key, value]) => (
          <View key={key} style={styles.statusRow}>
            <Text style={styles.statusLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={[styles.statusValue, value ? styles.statusUploaded : styles.statusPending]}>
              {value ? '✓ Uploaded' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>

      {isEditable && (
        <TouchableOpacity
          style={[styles.submitButton, uploading && styles.disabledButton]}
          onPress={uploadAllDocuments}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Semua Dokumen</Text>
          )}
        </TouchableOpacity>
      )}

      {scanning && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={(result) => {
            setScanning(false);
            Alert.alert('QR Code Terbaca', result.data);
          }}
        >
          <View style={styles.scannerOverlay}>
            <TouchableOpacity style={styles.closeScanner} onPress={() => setScanning(false)}>
              <Text style={styles.closeScannerText}>Tutup Scanner</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f1f1f' },
  warningBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#f59e0b' },
  warningText: { fontSize: 14, color: '#b45309' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#0d9488' },
  documentItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  documentTitle: { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
  requiredBadge: { backgroundColor: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  uploadedBadge: { backgroundColor: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  documentDescription: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  documentActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: '#0d9488', borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scanButton: { backgroundColor: '#2563eb', flex: 0.4 },
  disabledButton: { backgroundColor: '#9ca3af', opacity: 0.7 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statusLabel: { fontSize: 14, color: '#333', flex: 1 },
  statusValue: { fontSize: 14, fontWeight: '600' },
  statusUploaded: { color: '#166534' },
  statusPending: { color: '#92400e' },
  submitButton: { backgroundColor: '#0d9488', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeScanner: { position: 'absolute', top: 50, right: 20, backgroundColor: '#000', padding: 15, borderRadius: 50 },
  closeScannerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
