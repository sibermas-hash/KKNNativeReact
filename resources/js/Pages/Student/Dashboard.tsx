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
  const activePhase = (auth as any)?.active_phase ?? 'upcoming';
  const normalizedStatus = normalizeStatus(registration?.status);
  const isApproved = normalizedStatus === 'approved';
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const isGroupPinned = isApproved && Boolean(registration?.group);

  const [showPopup, setShowPopup] = useState(false);
  const notificationForm = useForm({});

  const shouldShowPopup = isApproved && registration && !registration.notification_shown;
  const isGradingOrLater = ['grading', 'finished'].includes(activePhase);
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

        <div className="space-y-6">
          {/* --- TOP BANNER / PLACEMENT INFO --- */}
          {isGroupPinned && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50 flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                  <MapPin size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Penempatan Aktif</span>
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-emerald-950 tracking-tight uppercase">
                    {registration?.group?.location?.name ?? 'Lokasi KKN'}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    {registration?.group?.name} • {registration?.group?.code}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 md:border-l md:border-emerald-50 md:pl-8">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Dosen Pembimbing</span>
                    <span className="text-sm font-bold text-emerald-950">{registration?.group?.lecturer?.name || 'Akan Ditentukan'}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Periode</span>
                    <span className="text-sm font-bold text-emerald-950">{registration?.period?.name}</span>
                 </div>
                 <Link 
                  href={route('student.posko.index')}
                  className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                 >
                   Detail Posko
                 </Link>
              </div>
            </motion.div>
          )}

          {/* --- MAIN GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Content (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Progress Tracker Card */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Progres Pengabdian</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lacak tahapan KKN Anda</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">{progressPercent}%</span>
                </div>

                <div className="w-full bg-emerald-50 rounded-full h-3 mb-10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="bg-emerald-600 h-full rounded-full shadow-[0_0_12px_rgba(5,150,105,0.4)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {phases.map((phase) => (
                    <div 
                      key={phase.id}
                      className={clsx(
                        "flex flex-col gap-3 p-4 rounded-[1.5rem] border-2 transition-all",
                        phase.isCompleted 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                          : phase.isActive
                            ? "bg-white border-emerald-100 text-emerald-950 shadow-sm"
                            : "bg-slate-50 border-transparent text-slate-300"
                      )}
                    >
                      <div className={clsx(
                        "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black",
                        phase.isCompleted ? "bg-white/20" : "bg-emerald-50"
                      )}>
                        {phase.isCompleted ? <CheckCircle size={16} /> : phase.id}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight mb-0.5">{phase.label}</p>
                        <p className={clsx(
                          "text-[9px] font-bold uppercase tracking-widest",
                          phase.isCompleted ? "text-emerald-100" : "text-slate-400"
                        )}>{phase.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Status Section for Unregistered */}
              {!isApproved && (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-emerald-100 flex flex-col items-center">
                   <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-6">
                     <GraduationCap size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-2">
                     {isRejected ? 'Perlu Perbaikan Berkas' : isPending ? 'Menunggu Verifikasi' : 'Siap Berpengabdian?'}
                   </h3>
                   <p className="text-sm font-bold text-slate-500 max-w-sm mb-8 leading-relaxed">
                     {isRejected ? registration?.rejection_reason : 'Lengkapi pendaftaran Anda untuk mendapatkan penempatan kelompok dan mulai aksi nyata.'}
                   </p>
                   {!isApproved && (
                      <Link
                        href={registration ? route('student.registration.status') : '/mahasiswa/daftar'}
                        className="px-10 py-4 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-2xl shadow-emerald-900/20"
                      >
                        {registration ? 'Cek Status' : 'Mulai Daftar'}
                      </Link>
                   )}
                </div>
              )}
            </div>

            {/* Right Content (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Links Widget */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50">
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight mb-6 flex items-center gap-2">
                  <LayoutGrid size={20} className="text-emerald-600" />
                  Menu Utama
                </h3>
                <div className="space-y-2">
                  <PremiumLink href={route('student.laporan-harian.index')} icon={ClipboardList} label="Logbook" desc="Laporan harian KKN" />
                  <PremiumLink href={route('student.program-kerja.index')} icon={Presentation} label="Proker" desc="Target & realisasi" />
                  <PremiumLink href={route('student.posko.index')} icon={MapPin} label="Detail Posko" desc="Info lokasi & DPL" />
                  <PremiumLink href={route('student.laporan-akhir.index')} icon={ScrollText} label="Laporan Akhir" desc="Unggah hasil akhir" />
                </div>
              </div>

              {/* Info Widget */}
              <div className="bg-emerald-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Lightbulb size={120} /></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Pusat Informasi</h3>
                <div className="space-y-4 relative z-10">
                   <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Ketentuan Logbook</p>
                      <p className="text-xs font-medium text-white/70">Minimal 30 laporan harian untuk syarat kelulusan.</p>
                   </div>
                   <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Batas Validasi</p>
                      <p className="text-xs font-medium text-white/70">DPL memiliki waktu 72 jam untuk memvalidasi laporan.</p>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}

function StatBox({ icon: Icon, label, value, color = 'emerald' }: DashboardStatProps) {
  const colors: ColorPalette = {
    emerald: 'bg-white border-emerald-50 text-emerald-600',
    blue: 'bg-white border-blue-50 text-blue-600',
  };
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={clsx(
        "rounded-[2rem] p-6 shadow-sm border-2 flex items-center gap-6 transition-all bg-white",
        color === 'emerald' ? 'border-emerald-50' : 'border-blue-50'
      )}
    >
      <div className={clsx(
        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
      )}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
          {label}
        </p>
        <p className="text-xl font-black text-emerald-950">{value}</p>
      </div>
    </motion.div>
  );
}

function PremiumLink({ href, icon: Icon, label, desc }: { href: string; icon: any; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"
    >
      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-sm transition-all">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-black text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
          {label}
        </span>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600/60 uppercase tracking-wider">
          {desc}
        </span>
      </div>
      <ArrowRight size={16} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
    </Link>
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
