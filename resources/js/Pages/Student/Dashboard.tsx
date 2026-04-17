import { Link, Head, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
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
  status: string;
  notes?: string | null;
  rejection_reason?: string | null;
  period?: {
    id: number;
    name: string;
    min_logbook: number;
  };
  group?: {
    id: number;
    name: string;
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

  const studentFirstName = student?.name?.split(' ')?.[0] ?? 'Mahasiswa';

  const phases = [
    {
      id: 1,
      label: 'Pendaftaran',
      desc: 'Registrasi Unit',
      isCompleted: isApproved,
      isActive: !registration || isPending,
    },
    {
      id: 2,
      label: 'Persiapan',
      desc: 'Program Kerja',
      isCompleted: workProgramCount > 0,
      isActive: isApproved && workProgramCount === 0,
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

        <div className="space-y-4">
          {/* --- WELCOME CARD --- */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-100">
                {studentFirstName.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  Halo, <span className="text-emerald-600">{studentFirstName}!</span>
                </h1>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  NIM: {student.nim || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 uppercase leading-none mb-1">
                  Status Keanggotaan
                </p>
                <p className="text-sm font-bold text-gray-900 uppercase">
                  {isApproved
                    ? 'Peserta Aktif'
                    : isPending
                      ? 'Dalam Verifikasi'
                      : isRejected
                        ? 'Perlu Perbaikan'
                        : 'Belum Terdaftar'}
                </p>
              </div>
              <div
                className={clsx(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-gray-900',
                )}
              >
                {isApproved ? <BadgeCheck size={16} /> : <Lock size={16} />}
              </div>
            </div>
          </motion.div>

          {/* --- PROGRESS TIMELINE --- */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Target size={16} />
                </div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
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
                        ? 'bg-emerald-50 border-gray-200'
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
                            ? 'bg-emerald-100 text-gray-700'
                            : 'bg-slate-200 text-gray-900',
                      )}
                    >
                      {phase.isCompleted ? <CheckCircle size={12} /> : phase.id}
                    </div>
                    <div>
                      <p
                        className={clsx(
                          'text-sm font-bold leading-none mb-0.5',
                          phase.isActive || phase.isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-900',
                        )}
                      >
                        {phase.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 uppercase">
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
              <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-gray-200">
                <MapPin size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                  {isRejected
                    ? 'Perbaikan Data Diperlukan'
                    : isPending
                      ? 'Sedang Memverifikasi Berkas'
                      : 'Mulai Pendaftaran KKN'}
                </h3>
                <p className="text-xs text-gray-900 max-w-md mx-auto leading-relaxed">
                  {isRejected
                    ? registration?.rejection_reason || 'Mohon periksa kembali dokumen.'
                    : isPending
                      ? 'Dokumen Anda sedang dalam antrean verifikasi.'
                      : 'Lengkapi profil untuk mendaftar.'}
                </p>
              </div>
              <Link
                href={route('student.registration.create')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider"
              >
                {isRejected ? 'Ubah Pendaftaran' : isPending ? 'Lihat Detail' : 'Daftar Sekarang'}
                <ArrowRight size={14} />
              </Link>
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
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-gray-200">
                        <BadgeCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-600 font-semibold uppercase text-xs mb-0.5">
                          Nilai Sertifikasi
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {grade.letter}{' '}
                          <span className="text-sm font-bold text-gray-900">
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
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 font-semibold uppercase text-xs mb-4 flex items-center gap-2">
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

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 font-semibold uppercase text-xs mb-3">
                    Informasi
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm font-semibold text-gray-600 leading-tight">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p>Logbook wajib divalidasi DPL dalam 72 jam.</p>
                    </div>
                    <div className="flex gap-2 text-sm font-semibold text-gray-600 leading-tight">
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
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
      <div
        className={clsx(
          'h-10 w-10 rounded-lg flex items-center justify-center border',
          colors[color],
        )}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 font-semibold uppercase text-xs leading-none mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: DashboardQuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-emerald-50 text-gray-600 hover:text-gray-700 transition-all group font-bold text-sm uppercase"
    >
      <Icon size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
      {label}
      <ArrowRight
        size={12}
        className="ml-auto text-slate-200 group-hover:text-[#1a7a4a] transition-all group-hover:translate-x-1"
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
