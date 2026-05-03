'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS, PHASE_LABELS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useAuthStore, usePeriodStore } from '@/stores';
import {
  Calendar, MapPin, ArrowRight, ClipboardList, CheckCircle2,
  Presentation, AlertTriangle, BadgeCheck, Lock, Target,
  ScrollText, LayoutGrid, UserCheck, Users, Lightbulb,
  GraduationCap, ShieldCheck, Activity, X,
} from 'lucide-react';
import clsx from 'clsx';

function normalizeStatus(status?: string): 'approved' | 'pending' | 'rejected' | 'unknown' {
  if (!status) return 'unknown';
  const s = status.toLowerCase();
  if (['approved', 'disetujui', 'verifikasi_pusat', 'completed'].includes(s)) return 'approved';
  if (['pending', 'menunggu'].includes(s)) return 'pending';
  if (['rejected', 'ditolak', 'gugur', 'dismissed'].includes(s)) return 'rejected';
  return 'unknown';
}

function StatusTag({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const config = {
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DISETUJUI' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'DITOLAK' },
    unknown: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'BELUM DAFTAR' },
  }[normalized];

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border', config.bg, config.text, config.border)}>
      {normalized === 'approved' && <BadgeCheck size={10} />}
      {normalized === 'pending' && <Lock size={10} />}
      {config.label}
    </span>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { activePeriod, currentPhase } = usePeriodStore();
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);

  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.dashboard,
    queryFn: async () => {
      const res = await endpoints.dashboard();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const notificationMutation = useMutation({
    mutationFn: (id: number) => endpoints.notificationShown(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard }),
  });

  const registration = data?.registration as Record<string, unknown> | null | undefined;
  const group = registration?.group as Record<string, unknown> | null | undefined;
  const grade = data?.grade as Record<string, unknown> | null | undefined;
  const dailyReportCount = (data?.daily_report_count as number) || 0;
  const workProgramCount = (data?.work_program_count as number) || 0;
  const finalReport = data?.final_report as Record<string, unknown> | null | undefined;

  const normalizedStatus = normalizeStatus(registration?.status as string);
  const isApproved = normalizedStatus === 'approved';
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const isGroupPinned = isApproved && !!group;

  const groupName = (group?.name as string) || 'Belum Ditentukan';
  const groupLocation = ((group?.location as Record<string, unknown>)?.name as string) || '-';
  const dplName = ((group?.lecturer as Record<string, unknown>)?.name as string) || 'Belum Ditentukan';
  const periodName = (activePeriod?.name as string) || 'Periode KKN';
  const minLogbook = 30;

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

  const handleClosePopup = () => {
    setShowPopup(false);
    if (registration?.id && !registration.notification_shown) {
      notificationMutation.mutate(registration.id as number);
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 border ring-1 ring-slate-200">
            <div className="text-center">
              <div className={clsx('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6', isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                {isApproved ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
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
              Halo, {user?.name?.split(' ')[0] || 'Mahasiswa'}. 👋
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-lg px-4 py-3">
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Status Registrasi</span>
              <StatusTag status={registration?.status as string || 'unregistered'} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Tahun Akademik</span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{periodName}</span>
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
                      <span className="text-xs font-bold text-slate-900 uppercase">Sedang Ditentukan</span>
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
                {[
                  { href: '/mahasiswa/laporan-harian', icon: ClipboardList, label: 'Logbook Harian' },
                  { href: '/mahasiswa/program-kerja', icon: Presentation, label: 'Program Kerja' },
                  { href: '/mahasiswa/posko', icon: MapPin, label: 'Detail Posko' },
                  { href: '/mahasiswa/laporan-akhir', icon: ScrollText, label: 'Laporan Akhir' },
                  { href: '/mahasiswa/sertifikat', icon: Activity, label: 'Sertifikat & Nilai' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <item.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-900 transition-colors uppercase tracking-tight">{item.label}</span>
                    <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
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
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">Minimal 30 laporan harian yang divalidasi DPL untuk syarat kelulusan.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
