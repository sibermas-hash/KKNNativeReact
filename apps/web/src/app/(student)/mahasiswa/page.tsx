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
  GraduationCap, ShieldCheck, Activity, Send,
} from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '@/components/ui/shared';

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
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);


  

  const { data, isLoading, isError, error } = useQuery<Record<string, unknown> | null>({
    queryKey: QUERY_KEYS.student.dashboard,
    queryFn: () => studentApi.dashboard() as unknown as Promise<Record<string, unknown> | null>,
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
  const periodName = (activePeriod?.name as string) || 'Periode KKN';
  // REGULER-005 fix: jenis KKN dari response dashboard (periode.jenis_*)
  const periodData = registration?.period as { jenis?: string; jenis_code?: string; jenis_color?: string } | null | undefined;
  const jenisKknLabel = periodData?.jenis || '';
  const jenisKknCode = periodData?.jenis_code || '';
  // Audit F-13 fix: ambil dari backend SystemSetting (key `min_daily_reports`, default 30).
  const minLogbook = Number(data?.min_daily_reports) || 30;
  const phaseOrder = ['upcoming', 'registration', 'placement', 'execution', 'grading', 'finished'];
  const rawPhaseRank = phaseOrder.indexOf(String(currentPhase || activePeriod?.current_phase || 'upcoming'));
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
    setShowTelegramPopup(true);

  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    if (registration?.id && !registration.notification_shown) {
      notificationMutation.mutate(registration.id as number);
    }
  }, [notificationMutation, registration?.id, registration?.notification_shown]);

  const handleCloseTelegramPopup = useCallback(() => {
    setShowTelegramPopup(false);
  }, []);


  // Escape key handler for modal accessibility
  useEffect(() => {
    if (!showPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClosePopup(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClosePopup, showPopup]);

  useEffect(() => {
    if (!showTelegramPopup || showPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseTelegramPopup(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCloseTelegramPopup, showPopup, showTelegramPopup]);

  if (isError) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-rose-600" />
          <h2 className="text-lg font-black uppercase tracking-tight text-rose-900">Dashboard gagal dimuat</h2>
          <p className="mt-2 text-sm font-semibold text-rose-700">
            Sesi/API bermasalah. Silakan refresh halaman atau login ulang.
          </p>
          <p className="mt-2 text-[11px] text-rose-500">{String((error as Error)?.message || '')}</p>
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
              <div className={clsx('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6', isApproved ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]' : 'bg-rose-50 text-rose-600')}>
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
                  <div>
                    <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Catatan Penolakan</p>
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

      {showTelegramPopup && !showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="telegram-popup-title">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 ring-1 ring-black/5">
            <button
              type="button"
              onClick={handleCloseTelegramPopup}
              aria-label="Tutup popup Telegram"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              ×
            </button>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-sky-50 text-sky-600">
                <Send size={32} />
              </div>
              <h2 id="telegram-popup-title" className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Bergabung ke Grup Telegram
              </h2>
              <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                Seluruh mahasiswa KKN wajib bergabung ke grup Telegram resmi SIBERMAS untuk menerima informasi, pengumuman, dan koordinasi terbaru.
              </p>
              <div className="rounded-lg bg-sky-50 p-4 text-sm font-bold text-sky-900 ring-1 ring-sky-100">
                t.me/sibermasuinsaizu
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCloseTelegramPopup}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Nanti Saja
              </button>
              <a href="https://t.me/sibermasuinsaizu" target="_blank" rel="noopener noreferrer" onClick={handleCloseTelegramPopup} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-900/10 transition hover:bg-sky-700 active:scale-[0.98]">
                Gabung Sekarang <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--profile-border)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[color:var(--profile-soft)]0 animate-pulse" />
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
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
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
              <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden shadow-xl">
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
                    <p className="text-sm font-medium text-[color:var(--profile-muted)] max-w-xl leading-relaxed">
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
                    className="inline-flex h-12 px-8 bg-[color:var(--profile-primary)] hover:bg-[color:var(--profile-soft)]0 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all items-center gap-3 active:scale-95 shadow-lg shadow-black/10"
                  >
                    {registration ? 'Cek Detail Status' : 'Mulai Pendaftaran'} <ArrowRight size={16} />
                  </Link>
                </div>
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
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
                  Fitur KKN seperti Logbook, Program Kerja, Posko, Laporan Akhir, dan Sertifikat akan dibuka setelah pendaftaran disetujui dan fase sesuai.
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran'} className="rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-700">{registration ? 'Cek Status' : 'Daftar KKN'}</Link>
                    <Link href="/profil" className="rounded-lg bg-[color:var(--profile-surface)] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100">Lengkapi Profil</Link>
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
                  <p className="text-xs font-semibold text-[color:var(--profile-text)] leading-relaxed">Pastikan Logbook diisi setiap hari paling lambat pukul 23:59 WIB.</p>
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
