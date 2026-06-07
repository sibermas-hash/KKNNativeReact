import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  useTheme,
  useStyles,
  HeroCard,
  InlineAlert,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type PosterEndpoints = {
  poster: {
    index: () => Promise<unknown>;
    store: (data: FormData) => Promise<unknown>;
  };
};

type PosterResponse = {
  kelompok?: {
    nama_kelompok?: string;
    poster_potensi_desa_path?: string | null;
    poster_potensi_desa_name?: string | null;
    poster_url?: string | null;
  };
  allowed_types?: string[];
  max_size_mb?: number;
};

export default function PosterScreen() {
  const qc = useQueryClient();
  const endpoints = studentEndpoints(api) as unknown as PosterEndpoints;
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; mimeType?: string } | null>(null);

  const { colors } = useTheme();

  const styles = useStyles((colors) => ({
    card: { gap: 12 },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12 },
    cardCopy: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 17, fontWeight: '900' as const, color: colors.text },
    fileName: { fontSize: 13, color: colors.textMuted, fontWeight: '700' as const },
    smallButton: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 14 },
    uploadCard: { gap: 14 },
    pickBox: {
      minHeight: 78,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      padding: 14,
      backgroundColor: colors.surfaceMuted,
    },
    pickMark: {
      width: 38,
      height: 38,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.emeraldSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickMarkText: { fontSize: 11, fontWeight: '900' as const, color: colors.primary },
    pickCopy: { flex: 1, gap: 3 },
    pickTitle: { fontSize: 14, fontWeight: '800' as const, color: colors.text },
    pickSubtitle: { fontSize: 12, color: colors.textMuted },
    selectedRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.emeraldSoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    selectedName: { flex: 1, fontSize: 13, color: colors.softText, fontWeight: '800' as const },
    removeText: { fontSize: 13, color: colors.rose, fontWeight: '800' as const },
  }));

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'poster'],
    queryFn: async () => await endpoints.poster.index() as PosterResponse,
  });

  const poster = data ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Pilih file terlebih dahulu');
      const fd = new FormData();
      fd.append('poster', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType || 'application/octet-stream' } as unknown as Blob);
      return endpoints.poster.store(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'poster'] });
      setSelectedFile(null);
      Alert.alert('Berhasil', 'Poster berhasil diunggah');
    },
    onError: (error: any) => Alert.alert('Error', error.response?.data?.error?.message || 'Gagal mengunggah poster'),
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
    return <LoadingState label="Memuat poster potensi desa..." />;
  }

  const existing = poster?.kelompok;
  const hasPoster = Boolean(existing?.poster_potensi_desa_path);

  return (
    <Screen>
      <HeroCard
        eyebrow="Poster Potensi"
        title="Peta Potensi Desa"
        subtitle="Unggah poster kelompok dalam format gambar atau PDF sesuai panduan KKN."
        tone="emerald"
        right={<StatusPill label={hasPoster ? 'Terunggah' : 'Belum'} tone={hasPoster ? 'teal' : 'slate'} />}
      />

      {hasPoster ? (
        <SurfaceCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Poster Aktif</Text>
              <Text style={styles.fileName} numberOfLines={1}>{existing?.poster_potensi_desa_name || '-'}</Text>
            </View>
            {existing?.poster_url ? (
              <SecondaryButton label="Lihat" onPress={() => Linking.openURL(existing.poster_url!)} style={styles.smallButton} />
            ) : null}
          </View>
        </SurfaceCard>
      ) : null}

      <InlineAlert
        tone="amber"
        title="Ketentuan File"
        description={`Format: ${poster?.allowed_types?.join(', ') || 'JPG, PNG, PDF'}; ukuran maks: ${poster?.max_size_mb ? `${poster.max_size_mb}MB` : '5MB'}.`}
      />

      <SurfaceCard style={styles.uploadCard}>
        <Text style={styles.cardTitle}>File Poster</Text>

        <TouchableOpacity activeOpacity={0.82} style={styles.pickBox} onPress={pickFile}>
          <View style={styles.pickMark}>
            <Text style={styles.pickMarkText}>UP</Text>
          </View>
          <View style={styles.pickCopy}>
            <Text style={styles.pickTitle}>{selectedFile ? selectedFile.name : 'Pilih File Poster'}</Text>
            <Text style={styles.pickSubtitle}>Gambar atau PDF dari perangkat</Text>
          </View>
        </TouchableOpacity>

        {selectedFile ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedName} numberOfLines={1}>{selectedFile.name}</Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Text style={styles.removeText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <PrimaryButton
          label={hasPoster ? 'Ganti Poster' : 'Upload Poster'}
          onPress={() => mutation.mutate()}
          disabled={!selectedFile}
          loading={mutation.isPending}
        />
      </SurfaceCard>
    </Screen>
  );
}
