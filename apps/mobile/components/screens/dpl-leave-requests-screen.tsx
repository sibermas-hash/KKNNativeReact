import { View, Text, StyleSheet, RefreshControl, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  colors, spacing, Screen, SectionTitle, SurfaceCard,
  PrimaryButton, SecondaryButton, StatusPill, LoadingState, EmptyState,
  FieldLabel, formStyles, type Tone,
} from '@/components/ui/primitives';

type LeaveRequest = {
  id: number;
  student_name: string;
  nim?: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

const statusTone: Record<string, Tone> = {
  pending: 'amber', approved: 'emerald', rejected: 'rose',
};

export function DplLeaveRequestsScreen() {
  const qc = useQueryClient();
  const endpoints = dplEndpoints(api);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'leave-requests'],
    queryFn: async () => {
      const res = await endpoints.leaveRequests.index();
      return (res as unknown as { data?: LeaveRequest[] })?.data || res as unknown as LeaveRequest[];
    },
  });

  const approve = useMutation({
    mutationFn: (id: number) => endpoints.leaveRequests.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); Alert.alert('Berhasil', 'Izin disetujui.'); },
  });

  const reject = useMutation({
    mutationFn: ({ id, rejection_reason }: { id: number; rejection_reason: string }) => endpoints.leaveRequests.reject(id, { rejection_reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); setRejectId(null); setRejectReason(''); Alert.alert('Berhasil', 'Izin ditolak.'); },
  });

  const requests = Array.isArray(data) ? data : [];

  if (isLoading) return <LoadingState label="Memuat permohonan izin..." />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <SectionTitle title="Permohonan Izin" subtitle="Setujui atau tolak permohonan izin mahasiswa." />

      {requests.length === 0 ? (
        <EmptyState title="Tidak ada permohonan" description="Belum ada permohonan izin dari mahasiswa." />
      ) : (
        <View style={styles.list}>
          {requests.map((r) => (
            <SurfaceCard key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{r.student_name}</Text>
                  <Text style={styles.meta}>{r.nim} • {r.start_date} s/d {r.end_date}</Text>
                </View>
                <StatusPill label={r.status} tone={statusTone[r.status] || 'slate'} />
              </View>
              <Text style={styles.reason} numberOfLines={3}>{r.reason}</Text>

              {r.status === 'pending' && (
                <View style={styles.actions}>
                  <PrimaryButton label="Setujui" onPress={() => approve.mutate(r.id)} loading={approve.isPending} style={{ flex: 1 }} />
                  <SecondaryButton label="Tolak" onPress={() => setRejectId(r.id)} style={{ flex: 1 }} />
                </View>
              )}

              {rejectId === r.id && (
                <View style={styles.rejectForm}>
                  <FieldLabel required>Alasan Penolakan</FieldLabel>
                  <TextInput style={[formStyles.input, formStyles.textarea]} value={rejectReason} onChangeText={setRejectReason} placeholder="Jelaskan alasan penolakan..." multiline />
                  <PrimaryButton label="Tolak Izin" tone="rose" onPress={() => reject.mutate({ id: r.id, rejection_reason: rejectReason })} loading={reject.isPending} disabled={!rejectReason.trim()} />
                </View>
              )}
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '900', color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  reason: { fontSize: 13, color: colors.text, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectForm: { gap: 10, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft },
});
