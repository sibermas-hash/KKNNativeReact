import { View, Text, RefreshControl, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
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
  StatusPill,
  LoadingState,
  EmptyState,
  FieldLabel,
  type Tone,
} from '@/components/ui/primitives';

type FinalReport = {
  id: number;
  student_name: string;
  nim?: string;
  group_name?: string;
  title?: string;
  status: string;
  submitted_at?: string;
  score?: number;
};

const statusTone: Record<string, Tone> = {
  pending: 'amber', submitted: 'amber', approved: 'emerald', revision: 'rose', rejected: 'rose',
};

export function DplFinalReportsScreen() {
  const qc = useQueryClient();
  const endpoints = dplEndpoints(api);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const { colors } = useTheme();
  const formStyles = useFormStyles();

  const styles = useStyles((colors) => ({
    list: { gap: 12 },
    card: { gap: 8 },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, gap: 10 },
    cardInfo: { flex: 1, gap: 2 },
    name: { fontSize: 14, fontWeight: '900' as const, color: colors.text },
    meta: { fontSize: 11, color: colors.textMuted, fontWeight: '700' as const },
    title: { fontSize: 13, color: colors.text, lineHeight: 19 },
    actions: { flexDirection: 'row' as const, gap: 10, marginTop: 4 },
    revisionForm: { gap: 10, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'final-reports'],
    queryFn: async () => {
      const res = await endpoints.finalReports.index();
      return unwrapList<FinalReport>(res);
    },
  });

  const approve = useMutation({
    mutationFn: (id: number) => endpoints.finalReports.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dpl', 'final-reports'] }); Alert.alert('Berhasil', 'Laporan disetujui.'); },
  });

  const revision = useMutation({
    mutationFn: ({ id, review_notes }: { id: number; review_notes: string }) => endpoints.finalReports.revision(id, { review_notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dpl', 'final-reports'] }); setActiveId(null); setNotes(''); Alert.alert('Berhasil', 'Laporan dikembalikan untuk revisi.'); },
  });

  const reports = Array.isArray(data) ? data : [];

  if (isLoading) return <LoadingState label="Memuat laporan akhir..." />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <SectionTitle title="Laporan Akhir" subtitle="Review dan setujui laporan akhir mahasiswa." />

      {reports.length === 0 ? (
        <EmptyState title="Tidak ada laporan" description="Belum ada laporan akhir yang perlu direview." />
      ) : (
        <View style={styles.list}>
          {reports.map((r) => (
            <SurfaceCard key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{r.student_name}</Text>
                  <Text style={styles.meta}>{r.nim} • {r.group_name || '-'}</Text>
                </View>
                <StatusPill label={r.status} tone={statusTone[r.status] || 'slate'} />
              </View>
              {r.title && <Text style={styles.title} numberOfLines={2}>{r.title}</Text>}
              {r.submitted_at && <Text style={styles.meta}>Dikirim: {r.submitted_at}</Text>}

              {(r.status === 'submitted' || r.status === 'pending') && (
                <View style={styles.actions}>
                  <PrimaryButton label="Setujui" onPress={() => approve.mutate(r.id)} loading={approve.isPending} style={{ flex: 1 }} />
                  <SecondaryButton label="Revisi" onPress={() => setActiveId(r.id)} style={{ flex: 1 }} />
                </View>
              )}

              {activeId === r.id && (
                <View style={styles.revisionForm}>
                  <FieldLabel required>Catatan Revisi</FieldLabel>
                  <TextInput
                    style={[formStyles.input, formStyles.textarea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Jelaskan yang perlu diperbaiki..."
                    placeholderTextColor={colors.textSubtle}
                    multiline
                  />
                  <PrimaryButton label="Kirim Revisi" tone="rose" onPress={() => revision.mutate({ id: r.id, review_notes: notes })} loading={revision.isPending} disabled={!notes.trim()} />
                </View>
              )}
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
