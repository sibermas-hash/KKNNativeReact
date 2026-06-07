import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useAuthUser } from '@/stores';
import {
  useTheme,
  useStyles,
  HeroCard,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatCard,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

type StudentDashboardData = {
  registration?: Record<string, unknown> | null;
  daily_report_count?: number;
  work_program_count?: number;
  final_report?: Record<string, unknown> | null;
  grade?: Record<string, unknown> | null;
};

function isStudentDashboardData(value: unknown): value is StudentDashboardData {
  return typeof value === 'object' && value !== null;
}

function normalizeStatus(status?: string): string | undefined {
  if (!status) return status;
  const s = String(status).toLowerCase();
  if (['approved', 'disetujui', 'verifikasi_pusat', 'completed'].includes(s)) return 'approved';
  if (['pending', 'menunggu', 'document_submitted', 'document_verified'].includes(s)) return 'pending';
  if (['rejected', 'ditolak', 'gugur'].includes(s)) return 'rejected';
  return s;
}

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const endpoints = studentEndpoints(api);

  const { colors } = useTheme();
  const styles = useStyles((colors, toneMap) => ({
    statusSummary: { alignItems: 'flex-start', gap: 6 },
    statusMiniLabel: { fontSize: 8, fontWeight: '900', color: colors.textSubtle, textTransform: 'uppercase' },
    progressCard: { gap: 16 },
    progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    progressTitle: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    progressBadge: { color: colors.emerald, backgroundColor: colors.emeraldSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    progressTrack: { height: 6, borderRadius: 999, backgroundColor: colors.borderSoft, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.emerald },
    phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    phaseItem: { width: '31.8%', borderLeftWidth: 4, borderLeftColor: colors.border, borderRadius: 8, padding: 9, backgroundColor: colors.background, gap: 4 },
    phaseDone: { borderLeftColor: colors.emerald, backgroundColor: colors.emeraldSoft },
    phaseActive: { borderLeftColor: colors.textSubtle, backgroundColor: colors.surface },
    phaseNumber: { color: colors.textSubtle, fontSize: 9, fontWeight: '900' },
    phaseLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    phaseLabelDone: { color: colors.emerald },
    statsGrid: { gap: 12 },
    calloutCard: { backgroundColor: colors.text === '#e2e8f0' ? colors.surface : colors.text, borderColor: colors.text === '#e2e8f0' ? colors.border : colors.text, gap: 16 },
    calloutTitle: { color: colors.text === '#e2e8f0' ? colors.text : '#FFFFFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', lineHeight: 25 },
    calloutText: { color: colors.text === '#e2e8f0' ? colors.textMuted : '#CBD5E1', fontSize: 13, fontWeight: '700', lineHeight: 20 },
    groupCard: { gap: 18 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    locationBadge: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    locationBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
    groupHeaderCopy: { flex: 1, gap: 4 },
    groupTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textTransform: 'uppercase', lineHeight: 22 },
    groupSubtitle: { color: colors.textSubtle, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    infoGrid: { gap: 12 },
    infoItem: { borderRadius: 8, backgroundColor: colors.surfaceMuted, padding: 12, gap: 4 },
    infoLabel: { color: colors.textSubtle, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    infoValue: { color: colors.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    menuCard: { gap: 14 },
    navGrid: { gap: 10 },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async (): Promise<StudentDashboardData> => {
      const result = await endpoints.dashboard();
      return isStudentDashboardData(result) ? result : {};
    },
  });

  const registration = data?.registration as Record<string, unknown> | null | undefined;
  const group = registration?.group as Record<string, unknown> | null | undefined;
  const grade = data?.grade as Record<string, unknown> | null | undefined;
  const finalReport = data?.final_report as Record<string, unknown> | null | undefined;
  const dailyReportCount = Number(data?.daily_report_count || 0);
  const workProgramCount = Number(data?.work_program_count || 0);
  const minLogbook = 30;

  const normalizedStatus = normalizeStatus(registration?.status as string);
  const isApproved = normalizedStatus === 'approved';
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const statusTone = isApproved ? 'emerald' : isPending ? 'amber' : isRejected ? 'rose' : 'slate';
  const statusLabel = normalizedStatus === 'approved'
    ? 'Disetujui'
    : normalizedStatus === 'pending'
      ? 'Menunggu'
      : normalizedStatus === 'rejected'
        ? 'Ditolak'
        : 'Belum Daftar';

  const phases = [
    { id: 1, label: 'Registrasi', done: isApproved, active: isPending || !registration },
    { id: 2, label: 'Persiapan', done: workProgramCount > 0, active: isApproved && workProgramCount === 0 },
    { id: 3, label: 'Pelaksanaan', done: dailyReportCount >= minLogbook, active: workProgramCount > 0 && dailyReportCount < minLogbook },
    { id: 4, label: 'Pelaporan', done: Boolean(finalReport), active: dailyReportCount >= minLogbook && !finalReport },
    { id: 5, label: 'Penilaian', done: Boolean(grade?.is_finalized), active: Boolean(finalReport) && !grade?.is_finalized },
  ];
  const progressPercent = Math.floor((phases.filter((phase) => phase.done).length / phases.length) * 100);

  const groupName = String(group?.name || 'Belum Ditentukan');
  const groupLocation = String((group?.location as Record<string, unknown>)?.name || '-');
  const dplName = String((group?.lecturer as Record<string, unknown>)?.name || 'Belum Ditentukan');

  if (isLoading) {
    return <LoadingState label="Menyiapkan dashboard mahasiswa..." />;
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <HeroCard
        eyebrow="Sistem Informasi KKN"
        title={`Halo, ${String(user?.name || 'Mahasiswa').split(' ')[0]}.`}
        subtitle="Pantau milestone pengabdian, logbook, program kerja, dan status pendaftaran."
        tone="emerald"
        right={
          <View style={styles.statusSummary}>
            <Text style={styles.statusMiniLabel}>Status</Text>
            <StatusPill label={statusLabel} tone={statusTone} />
          </View>
        }
      />

      <SurfaceCard style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Milestone Pengabdian</Text>
          <Text style={styles.progressBadge}>{progressPercent}% Completed</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.phaseGrid}>
          {phases.map((phase) => (
            <View
              key={phase.id}
              style={[
                styles.phaseItem,
                phase.done && styles.phaseDone,
                phase.active && styles.phaseActive,
              ]}
            >
              <Text style={styles.phaseNumber}>0{phase.id}</Text>
              <Text style={[styles.phaseLabel, phase.done && styles.phaseLabelDone]} numberOfLines={1}>{phase.label}</Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.statsGrid}>
        <StatCard label="Logbook Harian" value={`${dailyReportCount}/${minLogbook}`} accent="emerald" />
        <StatCard label="Program Kerja" value={String(workProgramCount)} accent="blue" />
      </View>

      {!isApproved ? (
        <SurfaceCard style={styles.calloutCard}>
          <Text style={styles.calloutTitle}>
            {isRejected ? 'Perbaikan Berkas Diperlukan' : isPending ? 'Audit Pendaftaran Berjalan' : 'Belum Terdaftar?'}
          </Text>
          <Text style={styles.calloutText}>
            {isRejected
              ? `Alasan: "${String(registration?.rejection_reason || 'Periksa kembali kelengkapan berkas Anda.')}"`
              : isPending
                ? 'Sistem sedang meninjau berkas Anda. Mohon tunggu hingga admin memberikan validasi status.'
                : 'Daftarkan diri Anda sekarang untuk mengikuti program KKN.'}
          </Text>
          <PrimaryButton
            label={registration ? 'Cek Detail Status' : 'Mulai Pendaftaran'}
            onPress={() => router.push('/(tabs)/registration')}
          />
        </SurfaceCard>
      ) : null}

      {isApproved && group ? (
        <SurfaceCard style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View style={styles.locationBadge}>
              <Text style={styles.locationBadgeText}>PK</Text>
            </View>
            <View style={styles.groupHeaderCopy}>
              <Text style={styles.groupTitle}>{groupLocation}</Text>
              <Text style={styles.groupSubtitle}>{groupName} - {String(group?.code || '')}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dosen Pembimbing</Text>
              <Text style={styles.infoValue}>{dplName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Wilayah / Desa</Text>
              <Text style={styles.infoValue}>{groupLocation}</Text>
            </View>
          </View>
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.menuCard}>
        <SectionTitle title="Menu Navigasi" subtitle="Aksi cepat seperti panel web SIBERMAS." />
        <View style={styles.navGrid}>
          <SecondaryButton label="Logbook Harian" onPress={() => router.push('/(tabs)/reports')} />
          <SecondaryButton label="Program Kerja" onPress={() => router.push('/(tabs)/work-programs')} />
          <SecondaryButton label="Detail Posko" onPress={() => router.push('/(tabs)/posko')} />
          <SecondaryButton label="Laporan Akhir" onPress={() => router.push('/(tabs)/reports/final')} />
          <SecondaryButton label="Permohonan Izin" onPress={() => router.push('/(tabs)/leave-requests')} />
          <SecondaryButton label="Evaluasi DPL" onPress={() => router.push('/(tabs)/evaluation')} />
          <SecondaryButton label="Sertifikat" onPress={() => router.push('/(tabs)/certificate')} />
        </View>
      </SurfaceCard>
    </Screen>
  );
}


