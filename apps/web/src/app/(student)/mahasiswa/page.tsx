'use client';
import React from 'react';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { useAuthStore, usePeriodStore } from '@/stores';
import {
  MapPin, ArrowRight, ClipboardList, CheckCircle2,
  Presentation, AlertTriangle, Target,
  ScrollText, LayoutGrid, UserCheck, Users, Lightbulb, Plane, Star, Image,
  GraduationCap, ShieldCheck, Activity, Send, Megaphone, Vote,
} from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '@/components/ui/shared';

type DashboardAnnouncement = {
  id: number;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  content_type?: 'berita' | 'pengumuman';
  published_at?: string | null;
  show_as_popup?: boolean;
  popup_until?: string | null;
};

type LeaderVoteCandidate = {
  peserta_id: number;
  mahasiswa_id?: number;
  nim?: string;
  nama?: string;
  role?: string;
  votes?: number;
};

type LeaderVotePayload = {
  voting?: { open?: boolean; ends_at?: string | null };
  my_vote?: number | null;
  leader?: LeaderVoteCandidate | null;
  candidates?: LeaderVoteCandidate[];
};

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+|t\.me\/[^\s]+/i);
  if (!match) return null;
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
}

function isPopupStillValid(popupUntil?: string | null): boolean {
  if (!popupUntil) return true;
  const timestamp = new Date(popupUntil).getTime();
  return Number.isFinite(timestamp) ? timestamp >= Date.now() : true;
}

function normalizeStatus(status?: string): string | undefined {
  if (!status) return status;
  const s = String(status).toLowerCase();
  if (['completed', 'selesai'].includes(s)) return 'completed';
  if (['approved', 'disetujui', 'verifikasi_pusat'].includes(s)) return 'approved';
  if (['pending', 'menunggu', 'document_submitted', 'document_verified'].includes(s)) return 'pending';
  if (['rejected', 'ditolak', 'gugur'].includes(s)) return 'rejected';
  return status;
}

export default function StudentDashboard(): React.JSX.Element {
  const { user } = useAuthStore();
  const { currentPhase, activePeriod } = usePeriodStore();
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<number | null>(null);
  const [selectedLeaderCandidate, setSelectedLeaderCandidate] = useState<number | null>(null);


  

  const { data, isLoading, isError, error } = useQuery<Record<string, unknown> | null>({
    queryKey: [...QUERY_KEYS.student.dashboard, user?.id],
    queryFn: () => studentApi.dashboard() as unknown as Promise<Record<string, unknown> | null>,
    enabled: !!user?.id,
  });

  const notificationMutation = useMutation({
    mutationFn: (id: number) => studentApi.notificationShown(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard }),
  });

  const registration = data?.registration as Record<string, unknown> | null | undefined;
  const group = registration?.group as Record<string, unknown> | null | undefined;
  const grade = data?.grade as Record<string, unknown> | null | undefined;
  const dailyReportCount = (data?.daily_report_count as number) || 0;
  const workProgramCount = (data?.work_program_count as number) || 0;
  const finalReport = data?.final_report as Record<string, unknown> | null | undefined;
  const dashboardAnnouncements = (data?.dashboard_announcements as DashboardAnnouncement[] | undefined) ?? [];
  const popupAnnouncement = dashboardAnnouncements.find((item) => item.show_as_popup && isPopupStillValid(item.popup_until) && item.id !== dismissedAnnouncementId);
  const popupLink = popupAnnouncement ? extractFirstUrl(`${popupAnnouncement.excerpt ?? ''} ${popupAnnouncement.content ?? ''}`) : null;

  const normalizedStatus = normalizeStatus(registration?.status as string);
  const isCompleted = normalizedStatus === 'completed';
  const isApproved = normalizedStatus === 'approved' || isCompleted;
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const isGroupPinned = isApproved && !!group;
  const isAwaitingPlacement = isApproved && !group && !isCompleted;
  const showKknTools = isGroupPinned || isCompleted;

  const groupName = (group?.name as string) || 'Belum Ditentukan';
  const groupLocation = ((group?.location as Record<string, unknown>)?.name as string) || '-';
  const dplName = ((group?.lecturer as Record<string, unknown>)?.name as string) || 'Belum Ditentukan';
  const leader = group?.leader as { name?: string; is_self?: boolean } | null | undefined;
  const leaderName = leader?.name ? (leader.is_self ? `${leader.name} (Anda)` : leader.name) : 'Sedang Ditentukan';
  const leaderVoting = group?.leader_voting as { open?: boolean; required?: boolean; ends_at?: string | null } | null | undefined;
  const shouldLoadLeaderVote = Boolean(leaderVoting?.open && group?.id);

  const leaderVoteQuery = useQuery<LeaderVotePayload | null>({
    queryKey: ['student', 'group-leader-vote', group?.id],
    queryFn: async () => {
      const res = await studentApi.groupLeaderVote.show() as unknown as { data?: LeaderVotePayload } | LeaderVotePayload;
      return ((res as { data?: LeaderVotePayload })?.data ?? res) as LeaderVotePayload;
    },
    enabled: shouldLoadLeaderVote,
  });

  const leaderVoteMutation = useMutation({
    mutationFn: (candidatePesertaId: number) => studentApi.groupLeaderVote.vote(candidatePesertaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'group-leader-vote', group?.id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
  });
  // Jika mahasiswa sudah punya pendaftaran, label periode harus ikut data pendaftaran
  // supaya tidak campur dengan active/default period global.
  const periodData = registration?.period as { name?: string; jenis?: string; jenis_code?: string; jenis_color?: string; current_phase?: string } | null | undefined;
  const periodName = periodData?.name || (activePeriod?.name as string) || 'Periode KKN';
  // REGULER-005 fix: jenis KKN dari response dashboard (periode.jenis_*)
  const jenisKknLabel = periodData?.jenis || '';
  const jenisKknCode = periodData?.jenis_code || '';
  // Audit F-13 fix: ambil dari backend SystemSetting (key `min_daily_reports`, default 30).
  const minLogbook = Number(data?.min_daily_reports) || 30;
  const phaseOrder = ['upcoming', 'registration', 'placement', 'execution', 'grading', 'finished'];
  // KKN selesai (legacy 51-57 = 'completed', Magang FTIK = 'finished') diperlakukan
  // sebagai fase terakhir agar menu Sertifikat & Nilai terbuka.
  const rawEffectivePhase = periodData?.current_phase || currentPhase || activePeriod?.current_phase || 'upcoming';
  const effectivePhase = (rawEffectivePhase === 'completed' || isCompleted) ? 'finished' : rawEffectivePhase;
  const rawPhaseRank = phaseOrder.indexOf(String(effectivePhase));
  const phaseRank = rawPhaseRank >= 0 ? rawPhaseRank : 0;
  const isPhaseAtLeast = (phase: string) => phaseRank >= phaseOrder.indexOf(phase);
  const dashboardNavItems = [
    { href: '/mahasiswa/laporan-harian', icon: ClipboardList, label: 'Logbook Harian', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
    { href: '/mahasiswa/program-kerja', icon: Presentation, label: 'Program Kerja', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
    { href: '/mahasiswa/posko', icon: MapPin, label: 'Detail Posko', minPhase: 'placement', lockReason: 'Aktif setelah fase penempatan.' },
    { href: '/mahasiswa/laporan-akhir', icon: ScrollText, label: 'Laporan Akhir', minPhase: 'grading', lockReason: 'Aktif saat fase pelaporan/penilaian.' },
    { href: '/mahasiswa/sertifikat', icon: Activity, label: 'Sertifikat & Nilai', minPhase: 'grading', lockReason: 'Aktif setelah penilaian dibuka.' },
    { href: '/mahasiswa/evaluasi', icon: Star, label: 'Hasil Evaluasi', minPhase: 'grading', lockReason: 'Aktif setelah penilaian dibuka.' },
    { href: '/mahasiswa/evaluasi-dpl', icon: UserCheck, label: 'Evaluasi DPL', minPhase: 'grading', lockReason: 'Aktif saat fase penilaian.' },
    { href: '/mahasiswa/izin', icon: Plane, label: 'Izin Absensi', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },

    { href: '/mahasiswa/poster', icon: Image, label: 'Poster KKN', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
  ];

  const phases = [
    { id: 1, label: 'Registrasi', done: isApproved, active: isPending || !registration },
    { id: 2, label: 'Persiapan', done: workProgramCount > 0, active: isApproved && workProgramCount === 0 },
    { id: 3, label: 'Pelaksanaan', done: dailyReportCount >= minLogbook, active: workProgramCount > 0 && dailyReportCount < minLogbook },
    { id: 4, label: 'Pelaporan', done: !!finalReport, active: dailyReportCount >= minLogbook && !finalReport },
    { id: 5, label: 'Penilaian', done: !!grade?.is_finalized, active: !!finalReport && !grade?.is_finalized },
  ];

  const progressPercent = Math.floor((phases.filter((p) => p.done).length / phases.length) * 100);

  const shouldShowPopup = isApproved && registration && !registration.notification_shown;
  useEffect(() => { if (shouldShowPopup) setShowPopup(true); }, [shouldShowPopup]);

  useEffect(() => {
    const currentVote = leaderVoteQuery.data?.my_vote ?? null;
    if (currentVote) setSelectedLeaderCandidate(currentVote);
  }, [leaderVoteQuery.data?.my_vote]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    if (registration?.id && !registration.notification_shown) {
      notificationMutation.mutate(registration.id as number);
    }
  }, [notificationMutation, registration?.id, registration?.notification_shown]);

  const handleCloseDashboardAnnouncement = useCallback(() => {
    if (popupAnnouncement?.id) setDismissedAnnouncementId(popupAnnouncement.id);
  }, [popupAnnouncement?.id]);


  // Escape key handler for modal accessibility
  useEffect(() => {
    if (!showPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClosePopup(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClosePopup, showPopup]);

  useEffect(() => {
    if (!popupAnnouncement || showPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseDashboardAnnouncement(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCloseDashboardAnnouncement, popupAnnouncement, showPopup]);

  if (isError) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-[color:var(--profile-danger-text)]" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[color:var(--profile-danger-text)]">Dashboard gagal dimuat</h2>
          <p className="mt-2 text-sm font-semibold text-[color:var(--profile-danger-text)] opacity-90">
            Sesi/API bermasalah. Silakan refresh halaman atau login ulang.
          </p>
          <p className="mt-2 text-[11px] text-[color:var(--profile-danger-text)] opacity-70">{String((error as Error)?.message || '')}</p>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[color:var(--profile-soft)]" />
        <div className="grid grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[color:var(--profile-soft)]" />)}</div>
      </div>
    );
  }

  return (
    <>
      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="popup-status-title">
          <div className="bg-[color:var(--profile-surface)] rounded-xl shadow-2xl max-w-md w-full p-8 border ring-1 ring-[color:var(--profile-border)]">
            <div className="text-center">
              <div className={clsx('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6', isApproved ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]' : 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)]')}>
                {isApproved ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h2 id="popup-status-title" className="text-xl font-black text-[color:var(--profile-text)] uppercase tracking-tight mb-2">
                Status Pendaftaran: {isApproved ? 'DISETUJUI' : 'DITOLAK'}
              </h2>
              <p className="text-sm text-[color:var(--profile-muted)] mb-6 font-medium">
                {isApproved ? 'Selamat! Anda telah resmi terdaftar sebagai peserta KKN.' : 'Maaf, berkas Anda memerlukan perbaikan.'}
              </p>
              <div className="bg-[color:var(--profile-soft)] rounded-lg p-5 border text-left space-y-4">
                {isApproved ? (
                  <>
                    {group ? (
                      <>
                        <div className="flex gap-3">
                          <MapPin size={16} className="text-[color:var(--profile-primary)] shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase">Lokasi Penempatan</p>
                            <p className="text-sm font-bold text-[color:var(--profile-text)]">{groupLocation}</p>
                            <p className="text-xs text-[color:var(--profile-muted)] font-medium">{groupName}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Users size={16} className="text-[color:var(--profile-primary)] shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase">Dosen Pembimbing</p>
                            <p className="text-sm font-bold text-[color:var(--profile-text)]">{dplName}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3">
                        <Users size={16} className="text-[color:var(--profile-primary)] shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase">Status Penempatan</p>
                          <p className="text-sm font-bold text-[color:var(--profile-text)]">Menunggu Plotting Kelompok</p>
                          <p className="text-xs text-[color:var(--profile-muted)] font-medium">Kelompok, lokasi, dan DPL akan muncul setelah ditetapkan panitia.</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-[10px] font-black text-[color:var(--profile-danger-text)] uppercase mb-1">Catatan Penolakan</p>
                    <p className="text-sm font-bold text-[color:var(--profile-text)] italic">&ldquo;{String(registration?.rejection_reason || 'Periksa kembali kelengkapan berkas Anda.')}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleClosePopup} className="w-full mt-8 h-12 bg-[color:var(--profile-primary)] hover:opacity-90 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-black/10 transition-all active:scale-[0.98]">
              Selesai & Mengerti
            </button>
          </div>
        </div>
      )}

      {popupAnnouncement && !showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color:var(--profile-overlay)] backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dashboard-announcement-popup-title">
          <div className="relative bg-[color:var(--profile-surface)] rounded-2xl shadow-2xl max-w-md w-full p-8 border border-[color:var(--profile-border)] ring-1 ring-black/5">
            <button
              type="button"
              onClick={handleCloseDashboardAnnouncement}
              aria-label="Tutup pengumuman"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--profile-muted)] transition hover:bg-[color:var(--profile-soft)] hover:text-[color:var(--profile-text)]"
            >
              ×
            </button>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]">
                <Send size={32} />
              </div>
              <h2 id="dashboard-announcement-popup-title" className="text-xl font-black text-[color:var(--profile-text)] uppercase tracking-tight mb-2">
                {popupAnnouncement.title}
              </h2>
              {(popupAnnouncement.excerpt || popupAnnouncement.content) && (
                <p className="text-sm text-[color:var(--profile-muted)] mb-6 font-medium leading-relaxed whitespace-pre-line">
                  {popupAnnouncement.excerpt || popupAnnouncement.content}
                </p>
              )}
              {popupLink && (
                <div className="rounded-lg bg-[color:var(--profile-soft)] p-4 text-sm font-bold text-[color:var(--profile-soft-text)] ring-1 ring-[color:var(--profile-border)]">
                  {popupLink.replace(/^https?:\/\//, '')}
                </div>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCloseDashboardAnnouncement}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] px-4 text-xs font-black uppercase tracking-widest text-[color:var(--profile-text)] transition hover:bg-[color:var(--profile-soft)] active:scale-[0.98]"
              >
                Nanti Saja
              </button>
              {popupLink ? (
                <a href={popupLink} target="_blank" rel="noopener noreferrer" onClick={handleCloseDashboardAnnouncement} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-900/10 transition hover:bg-sky-700 active:scale-[0.98]">
                  Buka Tautan <ArrowRight size={16} />
                </a>
              ) : (
                <button type="button" onClick={handleCloseDashboardAnnouncement} className="inline-flex h-12 items-center justify-center rounded-lg bg-sky-600 px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-900/10 transition hover:bg-sky-700 active:scale-[0.98]">
                  Mengerti
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--profile-border)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[color:var(--profile-primary)] animate-pulse" />
              <span className="text-[10px] font-black text-[color:var(--profile-soft-text)] uppercase tracking-[0.2em]">Sistem Informasi KKN</span>
            </div>
            <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight">
              Selamat Datang, {user?.name?.split(' ')[0] || 'Mahasiswa'}.
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-lg px-4 py-3">
            <div className="flex flex-col border-r border-[color:var(--profile-border)] pr-4">
              <span className="text-[8px] font-black text-[color:var(--profile-muted)] uppercase mb-0.5">Status Registrasi</span>
              <StatusBadge status={registration?.status as string || 'unregistered'} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-[color:var(--profile-muted)] uppercase mb-0.5">Tahun Akademik</span>
              <span className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-tight">{periodName}</span>
              {jenisKknLabel && (
                <span className="text-[9px] font-bold text-[color:var(--profile-soft-text)] uppercase tracking-tight mt-0.5">
                  {jenisKknLabel}{jenisKknCode ? ` · ${jenisKknCode}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {dashboardAnnouncements.length > 0 && (
          <section className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)]/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]">
                <Megaphone size={20} />
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[color:var(--profile-warning-text)]">Pengumuman Mahasiswa</h2>
                <p className="text-xs font-medium text-[color:var(--profile-warning-text)]/80">Informasi khusus untuk dashboard mahasiswa.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboardAnnouncements.slice(0, 5).map((item) => {
                const href = item.content_type === 'berita' ? `/berita/${item.slug}` : `/pengumuman/${item.slug}`;
                return (
                  <Link
                    key={item.id}
                    href={item.slug ? href : '#'}
                    className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="line-clamp-2 text-sm font-black text-[color:var(--profile-text)]">{item.title}</p>
                    {(item.excerpt || item.content) && (
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-[color:var(--profile-muted)]">
                        {item.excerpt || item.content}
                      </p>
                    )}
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[color:var(--profile-accent)]">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID') : 'Pengumuman'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* MAIN */}
          <div className="lg:col-span-8 space-y-6">
            {/* PROGRESS */}
            {showKknTools && <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-6 shadow-sm overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-widest flex items-center gap-2">
                  <Target size={16} className="text-[color:var(--profile-primary)]" /> Milestone Pengabdian
                </h3>
                <span className="text-xs font-black text-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] px-2 py-1 rounded tracking-tighter">
                  {progressPercent}% COMPLETED
                </span>
              </div>
              <div className="w-full bg-[color:var(--profile-soft)] h-1.5 rounded-full mb-6 overflow-hidden">
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div className="bg-[color:var(--profile-primary)] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {phases.map((phase) => (
                  <div key={phase.id} className={clsx('p-3 rounded-lg border-l-4 transition-all flex flex-col gap-1', phase.done ? 'bg-[color:var(--profile-soft)] border-emerald-500' : phase.active ? 'bg-[color:var(--profile-surface)] border-slate-300 ring-1 ring-inset ring-[color:var(--profile-border)]' : 'bg-[color:var(--profile-soft)]/50 border-[color:var(--profile-border)] opacity-60')}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-[color:var(--profile-muted)]">0{phase.id}</span>
                      {phase.done && <CheckCircle2 size={12} className="text-[color:var(--profile-primary)]" />}
                    </div>
                    <span className={clsx('text-[10px] font-black uppercase tracking-tight', phase.done ? 'text-[color:var(--profile-text)]' : 'text-[color:var(--profile-muted)]')}>{phase.label}</span>
                  </div>
                ))}
              </div>
            </div>}

            {/* STATS */}
            {showKknTools && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-5 flex items-center gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-0.5">Logbook Harian</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[color:var(--profile-text)] tabular-nums">{dailyReportCount}</span>
                    <span className="text-[10px] font-bold text-[color:var(--profile-muted)] uppercase tracking-tight">/ {minLogbook} Laporan</span>
                  </div>
                </div>
              </div>
              <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-5 flex items-center gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-[color:var(--profile-soft)] text-[color:var(--profile-accent)]">
                  <ScrollText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-0.5">Laporan Akhir</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[color:var(--profile-text)]">{finalReport ? 'TERSEDIA' : 'BELUM ADA'}</span>
                    <span className="text-[10px] font-bold text-[color:var(--profile-muted)] uppercase tracking-tight">{finalReport ? 'Dokumen Terkunci' : 'Segera Unggah'}</span>
                  </div>
                </div>
              </div>
            </div>}

            {/* ACTION CALLOUT */}
            {!showKknTools && (
              <div className="bg-gradient-to-br from-[color:var(--profile-primary)] to-[color:var(--profile-accent)] rounded-xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 p-8 opacity-10 rotate-12 -mr-10 -mt-10">
                  <GraduationCap size={160} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      {isRejected
                        ? 'Perbaikan Berkas Diperlukan'
                        : isAwaitingPlacement
                          ? 'Menunggu Plotting Kelompok'
                          : isPending
                            ? 'Audit Pendaftaran Berjalan'
                            : 'Belum Terdaftar?'}
                    </h3>
                    <p className="text-sm font-medium text-white/80 max-w-xl leading-relaxed">
                      {isRejected
                        ? `Alasan: "${registration?.rejection_reason}"`
                        : isAwaitingPlacement
                          ? 'Pendaftaran Anda sudah disetujui. Saat ini sistem menunggu proses plotting/penempatan kelompok oleh panitia.'
                          : isPending
                            ? 'Sistem sedang meninjau berkas Anda. Mohon tunggu hingga admin atau DPL memberikan validasi status.'
                            : 'Daftarkan diri Anda sekarang untuk mengikuti program KKN.'}
                    </p>
                  </div>
                  <Link
                    href={registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran'}
                    className="inline-flex h-12 px-8 bg-[color:var(--profile-primary)] hover:opacity-90 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all items-center gap-3 active:scale-95 shadow-lg shadow-black/10"
                  >
                    {registration ? 'Cek Detail Status' : 'Mulai Pendaftaran'} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* LEADER VOTING */}
            {shouldLoadLeaderVote && (
              <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)] flex items-center justify-center shrink-0">
                      <Vote size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[color:var(--profile-text)]">Voting Ketua Kelompok</h3>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[color:var(--profile-muted)]">
                        Diskusikan dulu dengan kelompok. Pilih satu calon ketua; suara bisa diubah sampai batas waktu.
                      </p>
                      {leaderVoting?.ends_at && (
                        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--profile-accent)]">
                          Batas voting: {new Date(leaderVoting.ends_at).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {leaderVoteQuery.isLoading ? (
                  <div className="h-24 animate-pulse rounded-xl bg-[color:var(--profile-soft)]" />
                ) : leaderVoteQuery.isError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">Gagal memuat kandidat ketua. Refresh halaman.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(leaderVoteQuery.data?.candidates ?? []).map((candidate) => {
                        const checked = selectedLeaderCandidate === candidate.peserta_id;
                        return (
                          <label
                            key={candidate.peserta_id}
                            className={clsx(
                              'cursor-pointer rounded-xl border p-4 transition-all',
                              checked ? 'border-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] ring-2 ring-[color:var(--profile-primary)]/20' : 'border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] hover:border-[color:var(--profile-primary)]/60',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="leader_candidate"
                                checked={checked}
                                onChange={() => setSelectedLeaderCandidate(candidate.peserta_id)}
                                className="mt-1 h-4 w-4 accent-[color:var(--profile-primary)]"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[color:var(--profile-text)]">{candidate.nama || '-'}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--profile-muted)]">{candidate.nim || '-'} · {candidate.votes ?? 0} suara</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={!selectedLeaderCandidate || leaderVoteMutation.isPending}
                      onClick={() => selectedLeaderCandidate && leaderVoteMutation.mutate(selectedLeaderCandidate)}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--profile-primary)] px-5 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {leaderVoteMutation.isPending ? 'Menyimpan...' : 'Simpan Pilihan Ketua'} <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* GROUP INFO */}
            {isGroupPinned && (
              <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-[color:var(--profile-primary)] text-white rounded-lg flex items-center justify-center shadow-lg shadow-black/10">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[color:var(--profile-text)] uppercase tracking-tight leading-none mb-1">{groupLocation}</h3>
                    <p className="text-xs font-bold text-[color:var(--profile-muted)] uppercase tracking-widest">{groupName} • {(group?.code as string) || ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[color:var(--profile-soft)] rounded-lg text-[color:var(--profile-muted)]"><UserCheck size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-0.5 block">Dosen Pembimbing</span>
                      <span className="text-xs font-bold text-[color:var(--profile-text)] uppercase">{dplName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[color:var(--profile-soft)] rounded-lg text-[color:var(--profile-muted)]"><Users size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-0.5 block">Ketua Kelompok</span>
                      <span className="text-xs font-bold text-[color:var(--profile-text)] uppercase">{leaderName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[color:var(--profile-soft)] rounded-lg text-[color:var(--profile-muted)]"><MapPin size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest mb-0.5 block">Wilayah / Desa</span>
                      <span className="text-xs font-bold text-[color:var(--profile-text)] uppercase">{groupLocation}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[color:var(--profile-surface)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-[color:var(--profile-text)] uppercase tracking-widest mb-4 flex items-center gap-2">
                <LayoutGrid size={16} className="text-[color:var(--profile-primary)]" /> Menu Navigasi
              </h3>
              {!showKknTools ? (
                <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-4 text-xs font-semibold text-[color:var(--profile-warning-text)]">
                  {isAwaitingPlacement
                    ? 'Pendaftaran sudah disetujui. Fitur KKN dibuka bertahap setelah plotting kelompok dan fase kegiatan sesuai.'
                    : 'Fitur KKN seperti Logbook, Program Kerja, Posko, Laporan Akhir, dan Sertifikat akan dibuka setelah pendaftaran disetujui dan fase sesuai.'}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran'} className="rounded-lg bg-[color:var(--profile-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[color:var(--profile-primary-hover)]">{registration ? 'Cek Status' : 'Daftar KKN'}</Link>
                    <Link href="/profil" className="rounded-lg bg-[color:var(--profile-surface)] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[color:var(--profile-warning-text)] ring-1 ring-[color:var(--profile-border)] hover:bg-[color:var(--profile-soft)]">Lengkapi Profil</Link>
                  </div>
                </div>
              ) : (
              <div className="grid gap-2">
                {dashboardNavItems.map((item) => {
                  const locked = !isPhaseAtLeast(item.minPhase);
                  const content = (
                    <>
                      <div className={clsx('p-2 rounded-md transition-all', locked ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-muted)]' : 'bg-[color:var(--profile-soft)] text-[color:var(--profile-muted)] group-hover:bg-[color:var(--profile-primary)] group-hover:text-white')}>
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className={clsx('block text-xs font-bold uppercase tracking-tight transition-colors', locked ? 'text-[color:var(--profile-muted)]' : 'text-[color:var(--profile-text)] group-hover:text-[color:var(--profile-text)]')}>{item.label}</span>
                        {locked && <span className="block text-[10px] font-semibold text-[color:var(--profile-muted)] normal-case">Terkunci — {item.lockReason}</span>}
                      </div>
                      {locked ? <ShieldCheck size={14} className="ml-auto text-[color:var(--profile-muted)]" /> : <ArrowRight size={14} className="ml-auto text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-primary)] group-hover:translate-x-1 transition-all" />}
                    </>
                  );

                  if (locked) {
                    return (
                      <div key={item.href} title={item.lockReason} className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)]/70 p-3 opacity-80">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-[color:var(--profile-border)] hover:bg-[color:var(--profile-soft)] transition-all group">
                      {content}
                    </Link>
                  );
                })}
              </div>
              )}
            </div>

            <div className="bg-[color:var(--profile-soft)] ring-1 ring-[color:var(--profile-border)] rounded-xl p-6">
              <div className="flex items-center gap-2 text-[color:var(--profile-text)] mb-4">
                <Lightbulb size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Informasi Penting</span>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-5 w-5 bg-[color:var(--profile-primary)] text-white rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                  <p className="text-xs font-semibold text-[color:var(--profile-text)] leading-relaxed">{isPhaseAtLeast('execution') ? 'Pastikan Logbook diisi setiap hari paling lambat pukul 23:59 WIB.' : 'Logbook dibuka saat fase pelaksanaan KKN.'}</p>
                </li>
                <li className="flex gap-3">
                  <div className="h-5 w-5 bg-[color:var(--profile-primary)] text-white rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                  <p className="text-xs font-semibold text-[color:var(--profile-text)] leading-relaxed">Minimal {minLogbook} laporan harian yang divalidasi DPL untuk syarat kelulusan.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
