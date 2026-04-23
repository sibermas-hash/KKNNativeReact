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
  CheckCircle2,
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
  GraduationCap,
  ShieldCheck,
  Activity
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
import { motion, AnimatePresence } from 'framer-motion';
import StatusTag from '@/Components/Premium/StatusTag';

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
  const groupName = registration?.group?.name || 'Belum Ditentukan';
  const groupLocation = registration?.group?.location?.name || '-';
  const dplName = registration?.group?.lecturer?.name || 'Belum Ditentukan';
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
    { id: 1, label: 'Registrasi', done: isApproved, active: isPending || !registration },
    { id: 2, label: 'Persiapan', done: workProgramCount > 0, active: isApproved && workProgramCount === 0 },
    { id: 3, label: 'Pelaksanaan', done: dailyReportCount >= (registration?.period?.min_logbook ?? 30), active: workProgramCount > 0 && dailyReportCount < (registration?.period?.min_logbook ?? 30) },
    { id: 4, label: 'Pelaporan', done: !!finalReport, active: dailyReportCount >= (registration?.period?.min_logbook ?? 30) && !finalReport },
    { id: 5, label: 'Penilaian', done: grade?.is_finalized, active: !!finalReport && !grade?.is_finalized },
  ];

  const progressPercent = Math.floor(
    (phases.filter((p) => p.done).length / phases.length) * 100,
  );

  return (
    <ErrorBoundary>
      <AppLayout title="Dashboard Mahasiswa">
        <Head title="Beranda Mahasiswa" />

        {/* POPUP NOTIFICATION */}
        <AnimatePresence>
          {showPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 border ring-1 ring-slate-200">
                <div className="text-center">
                  <div className={clsx("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6", isApproved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
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
                            <p className="text-sm font-bold text-slate-900 leading-tight">{groupLocation}</p>
                            <p className="text-xs text-slate-500 font-medium">{groupName}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Users size={16} className="text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Dosen Pembimbing</p>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{dplName}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Catatan Penolakan</p>
                        <p className="text-sm font-bold text-slate-900 italic leading-relaxed">"{registration?.rejection_reason || 'Periksa kembali kelengkapan berkas Anda.'}"</p>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={handleClosePopup} className="w-full mt-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]">
                  Selesai & Mengerti
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 pb-12">
          
          {/* COMPACT HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Sistem Informasi KKN</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Halo, {auth.user.name.split(' ')[0]}. 👋</h1>
            </div>
            
            <div className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-lg px-4 py-3">
              <div className="flex flex-col border-r border-slate-100 pr-4">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Status Registrasi</span>
                <StatusTag status={registration?.status || 'unregistered'} />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Tahun Akademik</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{periodName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PROGRESS BAR COMPACT */}
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Target size={16} className="text-emerald-600" /> Milestone Pengabdian
                  </h3>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded tracking-tighter">{progressPercent}% COMPLETED</span>
                </div>
                
                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="bg-emerald-600 h-full rounded-full" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {phases.map((phase) => (
                    <div key={phase.id} className={clsx(
                      "p-3 rounded-lg border-l-4 transition-all flex flex-col gap-1",
                      phase.done ? "bg-emerald-50/50 border-emerald-500" : phase.active ? "bg-white border-slate-300 ring-1 ring-inset ring-slate-100" : "bg-slate-50/50 border-slate-200 opacity-60"
                    )}>
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-slate-400">0{phase.id}</span>
                         {phase.done && <CheckCircle2 size={12} className="text-emerald-600" />}
                      </div>
                      <span className={clsx("text-[10px] font-black uppercase tracking-tight", phase.done ? "text-emerald-900" : "text-slate-600")}>{phase.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STATS & METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CompactStat 
                  icon={ClipboardList} 
                  label="Logbook Harian" 
                  value={dailyReportCount} 
                  suffix={`/ ${registration?.period?.min_logbook ?? 30} Laporan`}
                  color="emerald"
                />
                <CompactStat 
                  icon={ScrollText} 
                  label="Laporan Akhir" 
                  value={finalReport ? 'TERSEDIA' : 'BELUM ADA'} 
                  suffix={finalReport ? 'Dokumen Terkunci' : 'Segera Unggah'}
                  color="blue"
                />
              </div>

              {/* ACTION CALLOUT FOR UNAPPROVED */}
              {!isApproved && (
                <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute right-0 top-0 p-8 opacity-10 rotate-12 -mr-10 -mt-10"><GraduationCap size={160} /></div>
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">
                        {isRejected ? 'Perbaikan Berkas Diperlukan' : isPending ? 'Audit Pendaftaran Berjalan' : 'Belum Terdaftar?'}
                      </h3>
                      <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
                        {isRejected ? `Alasan: "${registration?.rejection_reason}"` : isPending ? 'Sistem sedang meninjau berkas Anda. Mohon tunggu hingga admin atau DPL memberikan validasi status.' : 'Daftarkan diri Anda sekarang untuk mengikuti program KKN Periode 2026/2027.'}
                      </p>
                    </div>
                    <Link 
                      href={registration ? route('student.registration.status') : '/mahasiswa/daftar'} 
                      className="inline-flex h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all items-center gap-3 active:scale-95 shadow-lg shadow-emerald-600/20"
                    >
                      {registration ? 'Cek Detail Status' : 'Mulai Pendaftaran'} <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}

              {/* GROUP INFO IF PINNED */}
              {isGroupPinned && (
                <div className="bg-white ring-1 ring-slate-200 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{groupLocation}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{groupName} • {registration?.group?.code}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <InfoItem label="Dosen Pembimbing" value={dplName} icon={UserCheck} />
                    <InfoItem label="Ketua Kelompok" value="Sedang Ditentukan" icon={Users} />
                    <InfoItem label="Wilayah / Desa" value={groupLocation} icon={MapPin} />
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR WIDGETS */}
            <div className="lg:col-span-4 space-y-6">
              {/* MENU UTAMA */}
              <div className="bg-white ring-1 ring-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <LayoutGrid size={16} className="text-emerald-600" /> Menu Navigasi
                </h3>
                <div className="grid gap-2">
                  <NavButton href={route('student.laporan-harian.index')} icon={ClipboardList} label="Logbook Harian" />
                  <NavButton href={route('student.program-kerja.index')} icon={Presentation} label="Program Kerja" />
                  <NavButton href={route('student.posko.index')} icon={MapPin} label="Detail Posko" />
                  <NavButton href={route('student.laporan-akhir.index')} icon={ScrollText} label="Laporan Akhir" />
                  <NavButton href={route('student.rekapitulasi.index')} icon={Activity} label="Rekapitulasi Nilai" />
                </div>
              </div>

              {/* ANNOUNCEMENT / TIPS */}
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
      </AppLayout>
    </ErrorBoundary>
  );
}

// ── Shared UI Components ───────────────────────────────────────────

function CompactStat({ icon: Icon, label, value, suffix, color }: any) {
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-xl p-5 flex items-center gap-5 shadow-sm">
      <div className={clsx("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-slate-900 tabular-nums">{value}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Icon size={16} /></div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-xs font-bold text-slate-900 uppercase leading-tight">{value}</span>
      </div>
    </div>
  );
}

function NavButton({ href, icon: Icon, label }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
      <div className="p-2 bg-slate-50 text-slate-400 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-all"><Icon size={16} /></div>
      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-900 transition-colors uppercase tracking-tight">{label}</span>
      <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
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
