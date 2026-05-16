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
  ScrollText, LayoutGrid, UserCheck, Users, Lightbulb,
  GraduationCap, ShieldCheck, Activity,
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

  

  const { data, isLoading } = useQuery<Record<string, unknown> | null>({
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
  const phaseOrder = ['pre_registration', 'registration', 'placement', 'execution', 'grading', 'finished'];
  const phaseRank = phaseOrder.indexOf(String(currentPhase || activePeriod?.current_phase || 'pre_registration'));
  const isPhaseAtLeast = (phase: string) => phaseRank >= phaseOrder.indexOf(phase);
  const dashboardNavItems = [
    { href: '/mahasiswa/laporan-harian', icon: ClipboardList, label: 'Logbook Harian', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
    { href: '/mahasiswa/program-kerja', icon: Presentation, label: 'Program Kerja', minPhase: 'execution', lockReason: 'Aktif saat fase pelaksanaan KKN.' },
    { href: '/mahasiswa/posko', icon: MapPin, label: 'Detail Posko', minPhase: 'placement', lockReason: 'Aktif setelah fase penempatan.' },
    { href: '/mahasiswa/laporan-akhir', icon: ScrollText, label: 'Laporan Akhir', minPhase: 'grading', lockReason: 'Aktif saat fase pelaporan/penilaian.' },
    { href: '/mahasiswa/sertifikat', icon: Activity, label: 'Sertifikat & Nilai', minPhase: 'grading', lockReason: 'Aktif setelah penilaian dibuka.' },
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

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 border ring-1 ring-slate-200">
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Sistem Informasi KKN</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {user?.name?.split(' ')[0] || 'Mahasiswa'}.
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-lg px-4 py-3">
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Status Registrasi</span>
              <StatusBadge status={registration?.status as string || 'unregistered'} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Tahun Akademik</span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{periodName}</span>
              {jenisKknLabel && (
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight mt-0.5">
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
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm overflow-hidden relative">
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
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-5 flex items-center gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Logbook Harian</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{dailyReportCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">/ {minLogbook} Laporan</span>
                  </div>
                </div>
              </div>
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-5 flex items-center gap-5 shadow-sm">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                  <ScrollText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Laporan Akhir</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-900">{finalReport ? 'TERSEDIA' : 'BELUM ADA'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{finalReport ? 'Dokumen Terkunci' : 'Segera Unggah'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION CALLOUT */}
            {!isApproved && (
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
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{groupLocation}</h3>
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
            <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <LayoutGrid size={16} className="text-emerald-600" /> Menu Navigasi
              </h3>
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
