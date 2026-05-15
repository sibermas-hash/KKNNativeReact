import { useState, useEffect, useMemo } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, CameraView } from 'expo-camera';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors,
  EmptyState,
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

type DocumentRequirement = {
  field: string;
  label: string;
  description: string;
  required: boolean;
  template_url?: string | null;
};

type ExistingDocument = {
  exists: boolean;
  file_name: string | null;
  file_path: string | null;
  status: string | null;
};

type RegistrationItem = {
  id: number;
  periode_id: number;
  status: string;
};

type RegistrationStatusResponse = {
  registrations?: Array<RegistrationItem & {
    documents?: Array<{ document_type?: string; file_name?: string | null; status?: string | null }>;
  }>;
};

type RegistrationFormResponse = {
  document_requirements?: Array<{
    periode_id: number;
    requirements: DocumentRequirement[];
  }>;
};

function isImageRequirement(field: string): boolean {
  return field.includes('photo') || field.includes('poster') || field.includes('pas_foto');
}

function DocumentItem({
  title,
  required,
  description,
  document,
  state,
  templateUrl,
  uploading,
  onPickDocument,
  onScanQRCode,
}: {
  title: string;
  required: boolean;
  description: string;
  document: string;
  state?: ExistingDocument;
  templateUrl?: string | null;
  uploading: boolean;
  onPickDocument: (document: string) => void;
  onScanQRCode: () => void;
}) {
  const isUploaded = Boolean(state?.exists);

  return (
    <SurfaceCard style={styles.documentItem}>
      <View style={styles.documentHeader}>
        <View style={styles.titleSection}>
          <Text style={styles.documentTitle}>{title}</Text>
          {required ? <StatusPill label="Wajib" tone="amber" /> : <StatusPill label="Opsional" tone="slate" />}
        </View>
        {isUploaded ? <StatusPill label="Terunggah" tone="teal" /> : null}
      </View>
      <Text style={styles.documentDescription}>{description}</Text>
      {state?.file_name ? (
        <Text style={styles.fileNameText} numberOfLines={1} selectable>{state.file_name}</Text>
      ) : null}
      {templateUrl ? <InlineAlert tone="blue" description="Template tersedia di versi web." /> : null}
      <View style={styles.documentActions}>
        <PrimaryButton
          label={isUploaded ? 'Terunggah' : 'Upload'}
          onPress={() => onPickDocument(document)}
          disabled={isUploaded || uploading}
          style={styles.actionButton}
        />
        {required ? (
          <SecondaryButton
            label="Scan QR"
            onPress={onScanQRCode}
            disabled={uploading}
            style={styles.actionButtonSmall}
          />
        ) : null}
      </View>
    </SurfaceCard>
  );
}

export default function RegistrationDocumentsScreen() {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, ExistingDocument>>({});

  const endpoints = studentEndpoints(api);

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['student', 'registration', 'status'],
    queryFn: () => endpoints.registration.status(),
  });

  const { data: formData } = useQuery({
    queryKey: ['student', 'registration', 'form'],
    queryFn: () => endpoints.registration.form(),
  });

  const registrations = ((statusData as RegistrationStatusResponse | undefined)?.registrations ?? []);
  const registration = registrations[0] ?? null;
  const periodeId = registration?.periode_id ?? null;
  const requirements = useMemo(() => (((formData as RegistrationFormResponse | undefined)?.document_requirements ?? [])
    .find((entry) => entry.periode_id === periodeId)?.requirements ?? []), [formData, periodeId]);

  useEffect(() => {
    if (requirements.length === 0) {
      setUploadedDocs({});
      return;
    }

    const existingByType = new Map(
      (registration?.documents ?? [])
        .filter((doc) => doc.document_type)
        .map((doc) => [String(doc.document_type), doc])
    );

    const nextState = requirements.reduce<Record<string, ExistingDocument>>((carry, requirement) => {
      const existing = existingByType.get(requirement.field);
      carry[requirement.field] = {
        exists: Boolean(existing),
        file_name: existing?.file_name ?? null,
        file_path: null,
        status: existing?.status ?? null,
      };
      return carry;
    }, {});

    setUploadedDocs(nextState);
  }, [registration, requirements]);

  const uploadMutation = useMutation({
    mutationFn: async ({ document, asset }: { document: string; asset: DocumentPicker.DocumentPickerAsset }) => {
      setUploading(true);
      const payload = new FormData();
      payload.append(document, {
        uri: asset.uri,
        type: asset.mimeType || 'application/octet-stream',
        name: asset.name,
      } as any);

      if (!periodeId) {
        throw new Error('Periode pendaftaran tidak ditemukan');
      }

      return endpoints.documents(periodeId, payload);
    },
    onSuccess: (_response, variables) => {
      setUploadedDocs(prev => ({
        ...prev,
        [variables.document]: {
          exists: true,
          file_name: variables.asset.name,
          file_path: variables.asset.uri,
          status: 'uploaded',
        },
      }));
      Alert.alert('Upload Berhasil', `Dokumen ${variables.document} berhasil diunggah`);
      queryClient.invalidateQueries({ queryKey: ['student', 'registration', 'status'] });
    },
    onError: (error: any) => {
      Alert.alert('Upload Gagal', error.response?.data?.error?.message || 'Gagal mengunggah dokumen');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handlePickDocument = async (document: string) => {
    try {
      const requirement = requirements.find((item) => item.field === document);
      const result = await DocumentPicker.getDocumentAsync({
        type: isImageRequirement(requirement?.field || '') ? ['image/*'] : ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        uploadMutation.mutate({
          document,
          asset: result.assets[0],
        });
      }
    } catch {
      Alert.alert('Error', 'Gagal memilih dokumen');
    }
  };

  const uploadAllDocuments = async () => {
    const requiredDocs = requirements.filter((item) => item.required).map((item) => item.field);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs[doc]?.exists);

    if (missingDocs.length > 0) {
      Alert.alert('Dokumen Belum Lengkap', `Silakan lengkapi dokumen berikut:\n${missingDocs.map(d => `- ${d}`).join('\n')}`);
      return;
    }

    Alert.alert('Selesai', 'Dokumen wajib untuk periode ini sudah lengkap.');
  };

  const scanQRCode = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setScanning(true);
    } else {
      Alert.alert('Izin Kamera', 'Aplikasi membutuhkan izin kamera untuk memindai QR Code');
    }
  };

  if (isLoading) {
    return <LoadingState label="Memuat dokumen pendaftaran..." />;
  }

  const isEditable = registration?.status === 'draft';
  const uploadedCount = Object.values(uploadedDocs).filter((value) => value.exists).length;

  return (
    <View style={styles.root}>
      <Screen>
        <HeroCard
          eyebrow="Pendaftaran"
          title="Dokumen KKN"
          subtitle="Unggah dan pantau kelengkapan dokumen pendaftaran pada periode aktif."
          right={<StatusPill label={registration?.status || 'draft'} tone={isEditable ? 'amber' : 'slate'} />}
        />

        {registration && !isEditable && registration.status !== 'draft' ? (
          <InlineAlert
            tone="amber"
            title="Dokumen dikunci"
            description={`Status pendaftaran: ${registration?.status}. Dokumen tidak dapat diedit dari aplikasi.`}
          />
        ) : null}

        {requirements.length === 0 ? (
          <EmptyState
            title="Belum ada dokumen"
            description="Persyaratan dokumen akan muncul saat periode pendaftaran aktif."
          />
        ) : (
          <>
            <SectionTitle title="Dokumen Wajib" subtitle="Lengkapi berkas utama untuk proses validasi." />
            {requirements.filter((item) => item.required).map((requirement) => (
              <DocumentItem
                key={requirement.field}
                title={requirement.label}
                required={requirement.required}
                description={requirement.description}
                document={requirement.field}
                state={uploadedDocs[requirement.field]}
                templateUrl={requirement.template_url}
                uploading={uploading}
                onPickDocument={handlePickDocument}
                onScanQRCode={scanQRCode}
              />
            ))}

            {requirements.some((item) => !item.required) ? (
              <>
                <SectionTitle title="Dokumen Tambahan" subtitle="Berkas pendukung bila diminta oleh periode KKN." />
                {requirements.filter((item) => !item.required).map((requirement) => (
                  <DocumentItem
                    key={requirement.field}
                    title={requirement.label}
                  required={requirement.required}
                  description={requirement.description}
                  document={requirement.field}
                  state={uploadedDocs[requirement.field]}
                  templateUrl={requirement.template_url}
                  uploading={uploading}
                  onPickDocument={handlePickDocument}
                  onScanQRCode={scanQRCode}
                />
                ))}
              </>
            ) : null}

            <SurfaceCard style={styles.statusCard}>
              <Text style={styles.cardTitle}>Status Upload</Text>
              <Text style={styles.statusSummary}>{uploadedCount} dari {requirements.length} dokumen sudah tersedia.</Text>
              {Object.entries(uploadedDocs).map(([key, value]) => (
                <View key={key} style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                  <StatusPill label={value?.exists ? 'Terunggah' : 'Pending'} tone={value?.exists ? 'teal' : 'amber'} />
                </View>
              ))}
            </SurfaceCard>

            {isEditable ? (
              <PrimaryButton
                label="Cek Kelengkapan Dokumen"
                onPress={uploadAllDocuments}
                disabled={uploading}
                loading={uploading}
              />
            ) : null}
          </>
        )}
      </Screen>

      {scanning ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={(result) => {
            setScanning(false);
            Alert.alert('QR Code Terbaca', result.data);
          }}
        >
          <View style={styles.scannerOverlay}>
            <SecondaryButton label="Tutup Scanner" onPress={() => setScanning(false)} style={styles.closeScanner} />
          </View>
        </CameraView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  documentItem: { gap: 12 },
  documentHeader: { gap: 10 },
  titleSection: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  documentTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: colors.text, lineHeight: 21 },
  documentDescription: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  fileNameText: { fontSize: 12, color: colors.text, fontWeight: '700' },
  documentActions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
  actionButtonSmall: { flex: 0.7 },
  statusCard: { gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
  statusSummary: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  statusLabel: { flex: 1, fontSize: 12, color: colors.textMuted, fontWeight: '800' },
  scannerOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.55)' },
  closeScanner: { position: 'absolute', top: 54, right: 18, minHeight: 42, paddingVertical: 9 },
});
