import { Link, Head, usePage, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import AppLayout from '@/Layouts/AppLayout';
import {
  Calendar,
  MapPin,
  UploadCloud,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Presentation,
  Download,
  AlertTriangle,
  BadgeCheck,
  Lock,
  Target,
  ScrollText,
  LayoutGrid,
  X,
  UserCheck,
  Users,
  Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';
import type {
  PageProps,
  Student,
  DashboardStatProps,
  DashboardQuickLinkProps,
  ColorPalette,
  FinalReport,
} from '@/types';
import { motion } from 'framer-motion';

interface Registration {
  id: number;
  status: string;
  notes?: string | null;
  rejection_reason?: string | null;
  notification_shown?: boolean;
  period?: {
    id: number;
    name: string;
    min_logbook: number;
  };
  group?: {
    id: number;
    name: string;
    code: string;
    location?: { name: string };
    lecturer?: { name: string };
  };
}

interface DashboardGrade {
  id: number;
  score: number;
  letter: string;
  is_finalized: boolean;
  is_eligible_certificate: boolean;
}

interface Props {
  student: Student;
  registration: Registration | null;
  dailyReportCount: number;
  workProgramCount: number;
  finalReport: FinalReport | null;
  grade: DashboardGrade | null;
}

export default function StudentDashboard({
  student,
  registration,
  dailyReportCount,
  workProgramCount,
  finalReport,
  grade,
}: Props) {
  const { auth } = usePage<PageProps>().props;
  const normalizedStatus = normalizeStatus(registration?.status);
  const isApproved = normalizedStatus === 'approved';
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const isGroupPinned = isApproved && Boolean(registration?.group);

  const [showPopup, setShowPopup] = useState(false);
  const notificationForm = useForm({});

  const shouldShowPopup = isApproved && registration && !registration.notification_shown;
  const hasGroup = Boolean(registration?.group);
  const groupName = registration?.group?.name || 'Menunggu penugasan';
  const groupLocation = registration?.group?.location?.name || '-';
  const dplName = registration?.group?.lecturer?.name || 'Akan ditentukan';
  const periodName = registration?.period?.name || 'Periode KKN';

  const handleClosePopup = () => {
    setShowPopup(false);
    if (registration?.id && !registration.notification_shown) {
      notificationForm.patch(route('student.notification.shown', registration.id));
    }
  };

  if (shouldShowPopup && !showPopup) {
    setShowPopup(true);
  }

  const phases = [
    {
      id: 1,
      label: isRejected ? 'Pendaftaran' : (isPending ? 'Pendaftaran' : (isApproved ? 'Pendaftaran' : 'Pendaftaran')),
      desc: isRejected ? 'Registrasi Unit - PERBAIKAN' : (isPending ? 'Sedang Diverifikasi' : (isApproved ? 'Terverifikasi' : 'Registrasi Unit')),
      isCompleted: isApproved,
      isActive: isPending || (!registration),
      isLocked: isApproved,
    },
    {
      id: 2,
      label: 'Persiapan',
      desc: 'Program Kerja',
      isCompleted: workProgramCount > 0,
      isActive: isApproved && workProgramCount === 0,
      isLocked: !isApproved,
    },
    {
      id: 3,
      label: 'Pelaksanaan',
      desc: 'Laporan Harian',
      isCompleted: dailyReportCount >= (registration?.period?.min_logbook ?? 30),
      isActive:
        workProgramCount > 0 && dailyReportCount < (registration?.period?.min_logbook ?? 30),
    },
    {
      id: 4,
      label: 'Pelaporan',
      desc: 'Laporan Akhir',
      isCompleted: !!finalReport,
      isActive: dailyReportCount >= (registration?.period?.min_logbook ?? 30) && !finalReport,
    },
    {
      id: 5,
      label: 'Penilaian',
      desc: 'Sertifikasi',
      isCompleted: grade?.is_finalized,
      isActive: !!finalReport && !grade?.is_finalized,
    },
  ];

  const progressPercent = Math.floor(
    (phases.filter((p) => p.isCompleted).length / phases.length) * 100,
  );

  return (
    <ErrorBoundary>
      <AppLayout title="Portal Mahasiswa">
        <Head title="Beranda Mahasiswa" />

        {/* --- APPROVAL/REJECTION POPUP --- */}
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClosePopup} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>

              {isApproved ? (
                <div className="text-center">
                  <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950 mb-4">PENDAFTARAN DITERIMA</h2>
                  <div className="text-left bg-emerald-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase">Periode</p>
                        <p className="text-sm font-semibold text-emerald-950">{periodName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase">Kelompok</p>
                        <p className="text-sm font-semibold text-emerald-950">{groupName}</p>
                        <p className="text-xs text-emerald-700">{groupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase">Dosen Pembimbing Lapangan</p>
                        <p className="text-sm font-semibold text-emerald-950">{dplName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800">Langkah Selanjutnya: Isi Program Kerja</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X size={32} className="text-rose-600" />
                  </div>
                  <h2 className="text-xl font-black text-rose-950 mb-4">PENDAFTARAN DITOLAK</h2>
                  <div className="text-left bg-rose-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-rose-800 uppercase mb-1">Alasan Penolakan</p>
                    <p className="text-sm font-semibold text-rose-950">{registration?.rejection_reason || '-'}</p>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800">Silakan Perbaiki Berkas & Upload Ulang</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleClosePopup}
                className="w-full mt-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-colors"
              >
                {isApproved ? 'Mengerti' : 'Tutup'}
              </button>
            </motion.div>
          </motion.div>
        )}

        <div className="space-y-4">
          {/* --- PROGRESS TIMELINE --- */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Target size={16} />
                </div>
                <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                  Progres Pengabdian
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-600">{progressPercent}%</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="bg-emerald-600 h-1.5 rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {phases.map((phase) => (
                <div key={phase.id} className="relative group">
                  <div
                    className={clsx(
                      'flex flex-col gap-2 p-3 rounded-xl border transition-all text-center md:text-left',
                      phase.isCompleted
                        ? 'bg-emerald-50 border-emerald-50'
                        : phase.isActive
                          ? 'bg-white border-[#f3f4f6]0 shadow-sm'
                          : 'bg-gray-50 border-slate-50',
                    )}
                  >
                    <div
                      className={clsx(
                        'h-6 w-6 mx-auto md:mx-0 rounded-lg flex items-center justify-center text-sm font-bold',
                        phase.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : phase.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-emerald-950',
                      )}
                    >
                      {phase.isCompleted ? <CheckCircle size={12} /> : phase.id}
                    </div>
                    <div>
                      <p
                        className={clsx(
                          'text-sm font-bold leading-none mb-0.5',
                          phase.isActive || phase.isCompleted
                            ? 'text-emerald-950'
                            : 'text-emerald-950',
                        )}
                      >
                        {phase.label}
                      </p>
                      <p className="text-sm font-bold text-emerald-950 uppercase">
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          {!isGroupPinned ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center space-y-4">
              <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-emerald-50">
                <MapPin size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
                  {isRejected
                    ? 'Pendaftaran Ditolak - Perbaikan'
                    : isPending
                      ? 'Pendaftaran Pending'
                      : isApproved
                        ? 'Pendaftaran Diterima'
                        : 'Mulai Pendaftaran KKN'}
                </h3>
                <p className="text-xs font-bold text-emerald-950 max-w-md mx-auto leading-relaxed">
                  {isRejected
                    ? registration?.rejection_reason || 'Mohon periksa kembali dokumen.'
                    : isPending
                      ? 'Dokumen Anda sedang dalam proses verifikasi.'
                      : isApproved
                        ? 'Pendaftaran Anda telah disetujui. Silakan melengkapi Program Kerja.'
                        : 'Lengkapi profil untuk mendaftar.'}
                </p>
              </div>
              {!isApproved && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {registration ? (
                    <Link
                      href={route('student.registration.status')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-lg shadow-lg transition-all uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100"
                    >
                      Periksa Pendaftaran
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      href='/mahasiswa/daftar'
                      className="inline-flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-lg shadow-lg transition-all uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
                    >
                      Daftar Sekarang
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {/* Penempatan Info */}
                <div className="bg-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                    <MapPin size={120} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-emerald-200 text-sm font-bold font-semibold uppercase text-xs mb-1">
                          Lokasi Penempatan
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight uppercase">
                          {registration?.group?.location?.name ?? 'Plotting...'}
                        </h2>
                        <p className="text-emerald-100 font-semibold text-sm mt-0.5 uppercase">
                          Unit: {registration?.group?.name}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-white/20 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-emerald-200 text-sm font-bold uppercase">
                            Dosen Pembimbing
                          </p>
                          <p className="font-bold text-xs truncate max-w-[150px]">
                            {registration?.group?.lecturer?.name ?? '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-emerald-200 text-sm font-bold uppercase">Periode</p>
                          <p className="font-bold text-xs">{registration?.period?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatBox
                    icon={ClipboardList}
                    label="Logbook Harian"
                    value={`${dailyReportCount} Laporan`}
                    color="emerald"
                  />
                  <StatBox
                    icon={ScrollText}
                    label="Laporan Akhir"
                    value={finalReport ? 'Terkirim' : 'Belum Unggah'}
                    color="blue"
                  />
                </div>

                {/* Grade Alert */}
                {grade?.is_finalized && (
                  <div className="bg-white border border-emerald-50 rounded-xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-50">
                        <BadgeCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-600 uppercase text-xs mb-0.5">
                          Nilai Sertifikasi
                        </p>
                        <p className="text-2xl font-bold text-emerald-950">
                          {grade.letter}{' '}
                          <span className="text-sm font-bold text-emerald-950">
                            ({grade.score?.toFixed(2)})
                          </span>
                        </p>
                      </div>
                    </div>
                    <a
                      href={route('student.certificate.download', grade.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white text-sm font-bold rounded-lg hover:bg-emerald-800 transition-all uppercase tracking-wider"
                    >
                      <Download size={14} />
                      Unduh
                    </a>
                  </div>
                )}
              </div>

              {/* Sidebar Menu */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-emerald-50 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-emerald-950 uppercase text-xs mb-4 flex items-center gap-2">
                    <LayoutGrid size={12} className="text-emerald-600" />
                    Navigasi
                  </h3>
                  <div className="flex flex-col gap-1">
                    <QuickLink
                      href={route('student.laporan-harian.index')}
                      icon={ClipboardList}
                      label="Logbook"
                    />
                    <QuickLink
                      href={route('student.program-kerja.index')}
                      icon={Presentation}
                      label="Proker"
                    />
                    <QuickLink href={route('student.posko.index')} icon={MapPin} label="Posko" />
                    <QuickLink
                      href={route('student.laporan-akhir.index')}
                      icon={ScrollText}
                      label="Laporan"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-50">
                  <h3 className="text-sm font-bold text-emerald-950 uppercase text-xs mb-3">
                    Informasi
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm font-bold text-emerald-900 leading-tight">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p>Logbook wajib divalidasi DPL dalam 72 jam.</p>
                    </div>
                    <div className="flex gap-2 text-sm font-bold text-emerald-900 leading-tight">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p>Pastikan NIK data diri sesuai KTP (Biodata).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}

function StatBox({ icon: Icon, label, value, color = 'emerald' }: DashboardStatProps) {
  const colors: ColorPalette = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-emerald-50 p-4 shadow-sm flex items-center gap-4">
      <div
        className={clsx(
          'h-10 w-10 rounded-lg flex items-center justify-center border',
          colors[color],
        )}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-emerald-950 uppercase text-xs leading-none mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-emerald-950">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: DashboardQuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-emerald-50 text-emerald-900 hover:text-emerald-950 transition-all group font-bold text-sm uppercase"
    >
      <Icon size={16} className="text-emerald-200 group-hover:text-emerald-600 transition-colors" />
      {label}
      <ArrowRight
        size={12}
        className="ml-auto text-emerald-100 group-hover:text-emerald-950 transition-all group-hover:translate-x-1"
      />
    </Link>
  );
}

function normalizeStatus(status?: string): 'approved' | 'pending' | 'rejected' | 'unknown' {
  if (!status) return 'unknown';
  const s = status.toLowerCase();
  if (['approved', 'disetujui', 'verifikasi_pusat', 'completed'].includes(s)) return 'approved';
  if (['pending', 'menunggu'].includes(s)) return 'pending';
  if (['rejected', 'ditolak', 'gugur', 'dismissed'].includes(s)) return 'rejected';
  return 'unknown';
}
