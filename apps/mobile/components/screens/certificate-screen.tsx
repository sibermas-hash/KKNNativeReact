import { View, Text, StyleSheet, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors, radius, spacing, Screen, SectionTitle, SurfaceCard,
  PrimaryButton, LoadingState, EmptyState, StatusPill, InlineAlert,
} from '@/components/ui/primitives';

type Certificate = {
  id: number;
  title?: string;
  status: string;
  issued_at?: string;
  download_url?: string;
  grade?: string;
  periode_name?: string;
};

export function CertificateScreen() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: async () => {
      const res = await endpoints.certificates.index();
      return res as unknown as { data?: Certificate[] } | Certificate[];
    },
  });

  const certs = Array.isArray(data) ? data : (data as { data?: Certificate[] })?.data || [];

  if (isLoading) return <LoadingState label="Memuat sertifikat..." />;
  if (!certs.length) return (
    <Screen>
      <EmptyState title="Belum ada sertifikat" description="Sertifikat akan tersedia setelah proses yudisium selesai." />
    </Screen>
  );

  return (
    <Screen>
      <SectionTitle title="Sertifikat KKN" subtitle="Unduh sertifikat kelulusan KKN Anda." />

      <InlineAlert tone="emerald" description="Sertifikat dapat diverifikasi melalui QR code yang tertera." />

      {certs.map((cert) => (
        <SurfaceCard key={cert.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{cert.title || 'Sertifikat KKN'}</Text>
            <StatusPill label={cert.status} tone={cert.status === 'issued' ? 'emerald' : 'amber'} />
          </View>
          {cert.periode_name && <Text style={styles.meta}>Periode: {cert.periode_name}</Text>}
          {cert.grade && <Text style={styles.meta}>Nilai: {cert.grade}</Text>}
          {cert.issued_at && <Text style={styles.meta}>Diterbitkan: {cert.issued_at}</Text>}
          {cert.download_url && (
            <PrimaryButton label="Unduh Sertifikat" onPress={() => Linking.openURL(cert.download_url!)} tone="emerald" />
          )}
        </SurfaceCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '900', color: colors.text, flex: 1 },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
});
