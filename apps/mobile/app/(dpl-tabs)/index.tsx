import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { dplEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useAuthUser } from '@/stores';
import {
  useStyles,
  EmptyState,
  HeroCard,
  InlineAlert,
  LoadingState,
  Screen,
  SectionTitle,
  StatCard,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type DplDashboardData = {
  groups?: Record<string, unknown>[];
  at_risk_students?: Record<string, unknown>[];
  pending_reports?: number;
  grading_progress?: string;
  coordinator_areas?: unknown[];
};

function isDplDashboardData(value: unknown): value is DplDashboardData {
  return typeof value === 'object' && value !== null;
}

export default function DplDashboardScreen() {
  const user = useAuthUser();
  const router = useRouter();
  const endpoints = dplEndpoints(api);

  const styles = useStyles((colors) => ({
    statusSummary: { alignItems: 'center' as const, gap: 2 },
    statusMiniLabel: { fontSize: 8, color: colors.textSubtle, fontWeight: '900' as const, textTransform: 'uppercase' as const },
    pendingText: { color: colors.rose, fontSize: 24, fontWeight: '900' as const, fontVariant: ['tabular-nums' as const] },
    statsGrid: { gap: 12 },
    panel: { gap: 16 },
    groupList: { gap: 8 },
    groupRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    groupCode: { minWidth: 48, borderRadius: 8, backgroundColor: colors.text, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' as const },
    groupCodeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' as const },
    groupCopy: { flex: 1, gap: 3 },
    groupName: { color: colors.text, fontSize: 13, fontWeight: '900' as const, textTransform: 'uppercase' as const },
    groupMeta: { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const },
    attentionList: { gap: 8 },
    attentionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.background },
    avatarMini: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
    avatarMiniText: { color: colors.rose, fontSize: 12, fontWeight: '900' as const },
    quickNav: { gap: 8 },
    navBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    navBtnText: { fontSize: 13, fontWeight: '800' as const, color: colors.text },
    navArrow: { fontSize: 16, color: colors.textSubtle },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dpl', 'dashboard'],
    queryFn: async (): Promise<DplDashboardData> => {
      const result = await endpoints.dashboard();
      return isDplDashboardData(result) ? result : {};
    },
  });

  const groups = (data?.groups as Record<string, unknown>[]) || [];
  const atRisk = (data?.at_risk_students as Record<string, unknown>[]) || [];
  const pendingReports = Number(data?.pending_reports || 0);
  const gradingProgress = String(data?.grading_progress || '0%');
  const coordinatorAreas = (data?.coordinator_areas as unknown[]) || [];

  if (isLoading) {
    return <LoadingState label="Memuat dashboard DPL..." />;
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <HeroCard
        eyebrow="Sistem Monitoring DPL"
        title={`Selamat Datang, ${String(user?.name || 'DPL').split(',')[0]}.`}
        subtitle="Pantau unit bimbingan, laporan masuk, progres nilai, dan atensi khusus."
        tone="emerald"
        right={
          <View style={styles.statusSummary}>
            <Text style={styles.statusMiniLabel}>Perlu Validasi</Text>
            <Text style={styles.pendingText}>{pendingReports}</Text>
          </View>
        }
      />

      <View style={styles.statsGrid}>
        <StatCard label="Unit Bimbingan" value={String(groups.length)} accent="emerald" />
        <StatCard label="Laporan Masuk" value={String(pendingReports)} accent="amber" />
        <StatCard label="Progres Nilai" value={gradingProgress} accent="blue" />
        <StatCard label="Wilayah Tugas" value={String(coordinatorAreas.length || '-')} accent="rose" />
      </View>

      <SurfaceCard style={styles.panel}>
        <SectionTitle title="Kelompok Bimbingan Aktif" subtitle={`${groups.length} kelompok terdata`} />
        {groups.length === 0 ? (
          <EmptyState title="Belum ada unit bimbingan" description="Kelompok bimbingan akan tampil setelah periode KKN aktif." />
        ) : (
          <View style={styles.groupList}>
            {groups.slice(0, 5).map((group) => (
              <View key={String(group.id)} style={styles.groupRow}>
                <View style={styles.groupCode}>
                  <Text style={styles.groupCodeText}>#{String(group.code || '-')}</Text>
                </View>
                <View style={styles.groupCopy}>
                  <Text style={styles.groupName} numberOfLines={1}>{String(group.name || '-')}</Text>
                  <Text style={styles.groupMeta} numberOfLines={1}>{String(group.village_name || '-')}</Text>
                </View>
                <StatusPill label="Unit" tone="slate" />
              </View>
            ))}
          </View>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.panel}>
        <SectionTitle title="Atensi Khusus" subtitle="Mahasiswa yang perlu pemantauan lebih lanjut." />
        {atRisk.length > 0 ? (
          <View style={styles.attentionList}>
            {atRisk.slice(0, 4).map((student) => (
              <View key={String(student.id)} style={styles.attentionRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>{String(student.name || '?').charAt(0)}</Text>
                </View>
                <View style={styles.groupCopy}>
                  <Text style={styles.groupName} numberOfLines={1}>{String(student.name || '-')}</Text>
                  <Text style={styles.groupMeta} numberOfLines={1}>NIM {String(student.nim || '-')} - Unit #{String(student.group_code || '-')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <InlineAlert tone="emerald" description="Semua mahasiswa aktif dan tidak ada atensi khusus saat ini." />
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.panel}>
        <SectionTitle title="Menu Lainnya" subtitle="Akses fitur tambahan." />
        <View style={styles.quickNav}>
          {[
            { label: 'Laporan Akhir', route: '/(dpl-tabs)/final-reports' },
            { label: 'Izin Mahasiswa', route: '/(dpl-tabs)/leave-requests' },
            { label: 'Monitoring', route: '/(dpl-tabs)/monitoring' },
          ].map((item) => (
            <TouchableOpacity key={item.route} style={styles.navBtn} onPress={() => router.push(item.route as never)} activeOpacity={0.7}>
              <Text style={styles.navBtnText}>{item.label}</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SurfaceCard>
    </Screen>
  );
}
