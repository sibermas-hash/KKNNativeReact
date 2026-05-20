'use client';
import React from 'react';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { useAuthStore, usePeriodStore } from '@/stores';
import {
  MapPin, ArrowRight, ClipboardList, CheckCircle2, MessageCircle,
  Presentation, AlertTriangle, Target,
  ScrollText, LayoutGrid, UserCheck, Users, Lightbulb, Plane, Star, Image,
  GraduationCap, ShieldCheck, Activity, Award, FileCheck,
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
  const isApprovedWithoutGroup = isApproved && !group;
  const showKknTools = isApproved || isCompleted;

  const groupName = (group?.name as string) || 'Belum Ditentukan';
  const groupLocation = ((group?.location as Record<string, unknown>)?.name as string) || '-';
  const dplName = ((group?.lecturer as Record<string, unknown>)?.name as string) || 'Belum Ditentukan';
  const leader = group?.leader as { name?: string; is_self?: boolean } | null | undefined;
  const leaderName = leader?.name ? (leader.is_self ? `${leader.name} (Anda)` : leader.name) : 'Sedang Ditentukan';
  const periodName = ((registration?.period as { name?: string } | null | undefined)?.name as string) || (activePeriod?.name as string) || 'Periode KKN';
  // REGULER-005 fix: jenis KKN dari response dashboard (periode.jenis_*)
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
    { href: '/mahasiswa/chat', icon: MessageCircle, label: 'Chat Konsultasi', minPhase: 'registration', lockReason: 'Aktif setelah registrasi.' },
    { href: '/mahasiswa/poster', icon: Image, label: 'Poster KKN', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
  ];

  const phaseLabels: Record<string, string> = {
    upcoming: 'Pra-Pendaftaran',
    registration: 'Masa Pendaftaran',
    placement: 'Seleksi & Plotting',
    execution: 'Pelaksanaan KKN',
    grading: 'Penilaian & Pelaporan',
    finished: 'KKN Selesai',
  };

  const effectivePhase = String(currentPhase || activePeriod?.current_phase || 'upcoming');
  const phaseTitle = phaseLabels[effectivePhase] || 'KKN';

  const nextAction = (() => {
    if (isRejected) return { href: '/mahasiswa/cek-pendaftaran', label: 'Upload Ulang Berkas', hint: 'Perbaiki dokumen sesuai catatan admin.', icon: AlertTriangle, tone: 'rose' };
    if (!registration && effectivePhase === 'registration') return { href: '/mahasiswa/pendaftaran', label: 'Daftar KKN Sekarang', hint: 'Pilih jenis KKN dan lengkapi persyaratan.', icon: ClipboardList, tone: 'emerald' };
    if (isPending) return { href: '/mahasiswa/cek-pendaftaran', label: 'Pantau Verifikasi', hint: 'Berkas sedang diperiksa panitia.', icon: ShieldCheck, tone: 'amber' };
    if (isApprovedWithoutGroup || effectivePhase === 'placement') return { href: '/mahasiswa/cek-pendaftaran', label: 'Cek Penempatan', hint: 'Pantau plotting kelompok, lokasi, dan DPL.', icon: MapPin, tone: 'cyan' };
    if (effectivePhase === 'execution') return { href: '/mahasiswa/laporan-harian', label: 'Isi Logbook Hari Ini', hint: `Progress ${dailyReportCount}/${minLogbook} laporan.`, icon: ClipboardList, tone: 'emerald' };
    if (effectivePhase === 'grading') return { href: finalReport ? '/mahasiswa/evaluasi-dpl' : '/mahasiswa/laporan-akhir', label: finalReport ? 'Evaluasi DPL' : 'Unggah Laporan Akhir', hint: 'Selesaikan tahap penilaian KKN.', icon: ScrollText, tone: 'blue' };
    if (effectivePhase === 'finished') return { href: '/mahasiswa/sertifikat', label: 'Unduh Sertifikat', hint: 'Lihat nilai final dan dokumen akhir.', icon: Award, tone: 'violet' };
    return { href: '/profil', label: 'Lengkapi Profil', hint: 'Pastikan biodata dan kontak valid.', icon: UserCheck, tone: 'emerald' };
  })();

  const toneClass: Record<string, { bg: string; text: string; icon: string; button: string; ring: string }> = {
    emerald: { bg: 'from-emerald-600 via-teal-600 to-cyan-600', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700', button: 'bg-white text-emerald-700 hover:bg-emerald-50', ring: 'ring-emerald-100' },
    amber: { bg: 'from-amber-500 via-orange-500 to-yellow-500', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-700', button: 'bg-white text-amber-700 hover:bg-amber-50', ring: 'ring-amber-100' },
    rose: { bg: 'from-rose-600 via-red-500 to-orange-500', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-700', button: 'bg-white text-rose-700 hover:bg-rose-50', ring: 'ring-rose-100' },
    cyan: { bg: 'from-cyan-600 via-sky-600 to-blue-600', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-700', button: 'bg-white text-cyan-700 hover:bg-cyan-50', ring: 'ring-cyan-100' },
    blue: { bg: 'from-blue-600 via-indigo-600 to-violet-600', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-700', button: 'bg-white text-blue-700 hover:bg-blue-50', ring: 'ring-blue-100' },
    violet: { bg: 'from-violet-600 via-purple-600 to-fuchsia-600', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-700', button: 'bg-white text-violet-700 hover:bg-violet-50', ring: 'ring-violet-100' },
  };
  const actionTone = toneClass[nextAction.tone] || toneClass.emerald;

  const journey = [
    { key: 'registration', label: 'Registrasi', icon: ClipboardList },
    { key: 'placement', label: 'Penempatan', icon: MapPin },
    { key: 'execution', label: 'Pelaksanaan', icon: Target },
    { key: 'grading', label: 'Penilaian', icon: Star },
    { key: 'finished', label: 'Selesai', icon: Award },
  ];

  const quickActions = [
    { href: registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran', label: registration ? 'Status Pendaftaran' : 'Daftar KKN', icon: FileCheck, enabled: effectivePhase === 'registration' || effectivePhase === 'placement' || !!registration },
    { href: '/profil', label: 'Profil', icon: UserCheck, enabled: true },
    { href: '/mahasiswa/chat', label: 'Chat Admin', icon: MessageCircle, enabled: effectivePhase !== 'upcoming' },
    { href: '/mahasiswa/posko', label: 'Posko', icon: MapPin, enabled: isPhaseAtLeast('placement') && !!group },
    { href: '/mahasiswa/laporan-harian', label: 'Logbook', icon: ClipboardList, enabled: isPhaseAtLeast('execution') && showKknTools },
    { href: '/mahasiswa/sertifikat', label: 'Sertifikat', icon: Award, enabled: isPhaseAtLeast('grading') && !!grade?.is_eligible_certificate },
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

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    if (registration?.id && !registration.notification_shown) {
      notificationMutation.mutate(registration.id as number);
    }
  }, [notificationMutation, registration?.id, registration?.notification_shown]);

  // Escape key handler for modal accessibility
  useEffect(() => {
    if (!showPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClosePopup(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClosePopup, showPopup]);

  if (isError) {
    return (
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-rose-600" />
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-rose-900">Dashboard gagal dimuat</h2>
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
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-24 sm:pb-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}</div>
      </div>
    );
  }

  return (
    <>
      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="popup-status-title">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-8 border ring-1 ring-slate-200">
            <div className="text-center">
              <div className={clsx('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6', isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                {isApproved ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h2 id="popup-status-title" className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Status Pendaftaran: {isApproved ? 'DISETUJUI' : 'DITOLAK'}
              </h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                {isApproved ? 'Selamat! Anda telah resmi terdaftar sebagai peserta KKN.' : 'Maaf, berkas Anda memerlukan perbaikan.'}
              </p>
              <div className="bg-slate-50 rounded-lg p-5 border text-left space-y-4">
                {isApproved ? (
                  <>
                    <div className="flex gap-3">
                      <MapPin size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Lokasi Penempatan</p>
                        <p className="text-sm font-bold text-slate-900">{groupLocation}</p>
                        <p className="text-xs text-slate-500 font-medium">{groupName}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Dosen Pembimbing</p>
                        <p className="text-sm font-bold text-slate-900">{dplName}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Catatan Penolakan</p>
                    <p className="text-sm font-bold text-slate-900 italic">&ldquo;{String(registration?.rejection_reason || 'Periksa kembali kelengkapan berkas Anda.')}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleClosePopup} className="w-full mt-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]">
              Selesai & Mengerti
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-24 sm:pb-12">
        {/* PREMIUM PHASE HERO */}
        <section className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${actionTone.bg} p-4 sm:p-6 text-white shadow-2xl shadow-emerald-950/10`}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-200/10 blur-3xl" />
          <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur">
                <Activity size={13} /> {phaseTitle}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                  Halo, {user?.name?.split(' ')[0] || 'Mahasiswa'}.
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-white/80">
                  Dashboard ini otomatis mengikuti fase KKN: pendaftaran, plotting, pelaksanaan, penilaian, sampai sertifikat.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={nextAction.href} className={`inline-flex h-12 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl px-5 text-xs font-black uppercase tracking-widest shadow-lg transition active:scale-[0.98] ${actionTone.button}`}>
                  <nextAction.icon size={17} /> {nextAction.label}
                </Link>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/60">Next Action</p>
                  <p className="text-xs font-bold text-white">{nextAction.hint}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/12 p-4 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Status Registrasi</p>
                  <div className="mt-1"><StatusBadge status={registration?.status as string || 'unregistered'} /></div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Periode</p>
                  <p className="max-w-44 truncate text-xs font-black uppercase">{periodName}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/12 p-3 text-center">
                  <p className="text-xl font-black tabular-nums">{dailyReportCount}</p>
                  <p className="text-[9px] font-bold uppercase text-white/60">Logbook</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-3 text-center">
                  <p className="text-xl font-black tabular-nums">{workProgramCount}</p>
                  <p className="text-[9px] font-bold uppercase text-white/60">Proker</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-3 text-center">
                  <p className="text-xl font-black">{grade?.is_finalized ? 'Akhir' : '-'}</p>
                  <p className="text-[9px] font-bold uppercase text-white/60">Nilai</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEY + QUICK ACTIONS */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Alur Fase KKN</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">{phaseTitle}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {journey.map((step) => {
                const rank = phaseOrder.indexOf(step.key);
                const active = step.key === effectivePhase;
                const done = phaseRank > rank;
                return (
                  <div key={step.key} className={clsx('relative rounded-2xl border p-3 transition', active ? 'border-emerald-300 bg-emerald-50 shadow-sm ring-4 ring-emerald-50' : done ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-70')}>
                    <div className={clsx('mb-2 flex h-9 w-9 items-center justify-center rounded-xl', active ? 'bg-emerald-600 text-white' : done ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400')}>
                      <step.icon size={16} />
                    </div>
                    <p className={clsx('text-[10px] font-black uppercase tracking-tight', active ? 'text-emerald-900' : 'text-slate-600')}>{step.label}</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{done ? 'Selesai' : active ? 'Aktif' : 'Terkunci'}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-900">Aksi Cepat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((action) => action.enabled ? (
                <Link key={action.href + action.label} href={action.href} className="group rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50">
                  <action.icon size={17} className="mb-2 text-emerald-600" />
                  <p className="text-[10px] font-black uppercase tracking-tight text-slate-700 group-hover:text-emerald-900">{action.label}</p>
                </Link>
              ) : (
                <div key={action.href + action.label} className="cursor-not-allowed rounded-2xl border border-slate-100 bg-slate-50 p-3 opacity-45">
                  <action.icon size={17} className="mb-2 text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">{action.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* MAIN */}
          <div className="lg:col-span-8 space-y-6">
            {/* PROGRESS */}
            {showKknTools && group && <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 sm:p-6 shadow-sm overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Target size={16} className="text-emerald-600" /> Milestone Pengabdian
                </h3>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded tracking-tighter">
                  {progressPercent}% COMPLETED
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {phases.map((phase) => (
                  <div key={phase.id} className={clsx('p-3 rounded-lg border-l-4 transition-all flex flex-col gap-1', phase.done ? 'bg-emerald-50/50 border-emerald-500' : phase.active ? 'bg-white border-slate-300 ring-1 ring-inset ring-slate-100' : 'bg-slate-50/50 border-slate-200 opacity-60')}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400">0{phase.id}</span>
                      {phase.done && <CheckCircle2 size={12} className="text-emerald-600" />}
                    </div>
                    <span className={clsx('text-[10px] font-black uppercase tracking-tight', phase.done ? 'text-emerald-900' : 'text-slate-600')}>{phase.label}</span>
                  </div>
                ))}
              </div>
            </div>}

            {isApprovedWithoutGroup && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">Pendaftaran Disetujui</h3>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-800">
                      Selamat, pendaftaran KKN Anda sudah disetujui. Penempatan kelompok, lokasi, dan DPL masih menunggu pengaturan panitia.
                    </p>
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Fitur seperti Posko, Logbook, Program Kerja, Laporan Akhir, dan Sertifikat akan aktif setelah penempatan/fase terkait dibuka.
                    </p>
                    <Link href="/mahasiswa/cek-pendaftaran" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700">
                      Lihat Detail Status
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* STATS */}
            {showKknTools && group && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Logbook Harian</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">{dailyReportCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">/ {minLogbook} Laporan</span>
                  </div>
                </div>
              </div>
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                  <ScrollText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Laporan Akhir</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black text-slate-900">{finalReport ? 'TERSEDIA' : 'BELUM ADA'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{finalReport ? 'Dokumen Terkunci' : 'Segera Unggah'}</span>
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
                      {isRejected ? 'Perbaikan Berkas Diperlukan' : isPending ? 'Audit Pendaftaran Berjalan' : 'Belum Terdaftar?'}
                    </h3>
                    <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
                      {isRejected
                        ? `Alasan: "${registration?.rejection_reason}"`
                        : isPending
                          ? 'Sistem sedang meninjau berkas Anda. Mohon tunggu hingga admin atau DPL memberikan validasi status.'
                          : 'Daftarkan diri Anda sekarang untuk mengikuti program KKN.'}
                    </p>
                  </div>
                  <Link
                    href={registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran'}
                    className="inline-flex h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all items-center gap-3 active:scale-95 shadow-lg shadow-emerald-600/20"
                  >
                    {registration ? 'Cek Detail Status' : 'Mulai Pendaftaran'} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* GROUP INFO */}
            {isGroupPinned && (
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{groupLocation}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{groupName} • {(group?.code as string) || ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><UserCheck size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Dosen Pembimbing</span>
                      <span className="text-xs font-bold text-slate-900 uppercase">{dplName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Users size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Ketua Kelompok</span>
                      <span className="text-xs font-bold text-slate-900 uppercase">{leaderName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><MapPin size={16} /></div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Wilayah / Desa</span>
                      <span className="text-xs font-bold text-slate-900 uppercase">{groupLocation}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <LayoutGrid size={16} className="text-emerald-600" /> Menu Navigasi
              </h3>
              {(!showKknTools || isApprovedWithoutGroup) ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
                  {isApprovedWithoutGroup ? 'Pendaftaran Anda sudah disetujui. Menu KKN akan dibuka setelah kelompok/lokasi ditetapkan panitia.' : 'Fitur KKN seperti Logbook, Program Kerja, Posko, Laporan Akhir, dan Sertifikat akan dibuka setelah pendaftaran disetujui dan fase sesuai.'}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={registration ? '/mahasiswa/cek-pendaftaran' : '/mahasiswa/pendaftaran'} className="rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-700">{registration ? 'Cek Status' : 'Daftar KKN'}</Link>
                    <Link href="/profil" className="rounded-lg bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100">Lengkapi Profil</Link>
                  </div>
                </div>
              ) : (
              <div className="grid gap-2">
                {dashboardNavItems.map((item) => {
                  const locked = !isPhaseAtLeast(item.minPhase);
                  const content = (
                    <>
                      <div className={clsx('p-2 rounded-md transition-all', locked ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white')}>
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className={clsx('block text-xs font-bold uppercase tracking-tight transition-colors', locked ? 'text-slate-400' : 'text-slate-700 group-hover:text-emerald-900')}>{item.label}</span>
                        {locked && <span className="block text-[10px] font-semibold text-slate-400 normal-case">Terkunci — {item.lockReason}</span>}
                      </div>
                      {locked ? <ShieldCheck size={14} className="ml-auto text-slate-300" /> : <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />}
                    </>
                  );

                  if (locked) {
                    return (
                      <div key={item.href} title={item.lockReason} className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 opacity-80">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
                      {content}
                    </Link>
                  );
                })}
              </div>
              )}
            </div>

            <div className="bg-emerald-50/50 ring-1 ring-emerald-100 rounded-xl p-6">
              <div className="flex items-center gap-2 text-emerald-800 mb-4">
                <Lightbulb size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Informasi Penting</span>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">Pastikan Logbook diisi setiap hari paling lambat pukul 23:59 WIB.</p>
                </li>
                <li className="flex gap-3">
                  <div className="h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">Minimal {minLogbook} laporan harian yang divalidasi DPL untuk syarat kelulusan.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
