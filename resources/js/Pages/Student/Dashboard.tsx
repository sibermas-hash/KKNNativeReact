import { Link, Head, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    type LucideIcon,
    Calendar,
    MapPin,
    UploadCloud,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    Info,
    Rocket,
    Lock,
    Zap,
    Beaker,
    ClipboardList,
    CheckCircle,
    Activity,
    ChevronRight,
    Presentation,
    BadgeCheck,
    UserCircle,
    Target,
    ScrollText,
    Download,
    Layers,
    AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PageProps, Student } from '@/types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

interface Registration {
    status: 'menunggu' | 'disetujui' | 'ditolak' | 'pending' | 'approved' | 'rejected' | 'verifikasi_pusat' | 'completed' | 'gugur' | 'dismissed';
    notes?: string | null;
    rejection_reason?: string | null;
    revision_count?: number;
    last_rejected_at?: string | null;
    resubmitted_at?: string | null;
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

interface FinalReport {
    id?: number;
    status?: string;
}

interface Grade {
    id: number;
    score?: number;
    letter?: string;
    is_finalized?: boolean;
}

interface Props {
    student: Student;
    registration: Registration | null;
    dailyReportCount: number;
    workProgramCount: number;
    finalReport: FinalReport | null;
    grade: Grade | null;
}

export default function StudentDashboard({ student, registration, dailyReportCount, workProgramCount, finalReport, grade }: Props) {
    const { auth } = usePage<PageProps>().props;
    const normalizedRegistrationStatus = normalizeRegistrationStatus(registration?.status);
    const isApproved = ['approved', 'verifikasi_pusat', 'completed'].includes(normalizedRegistrationStatus);
    const isPending = normalizedRegistrationStatus === 'pending';
    const isRejected = normalizedRegistrationStatus === 'rejected';
    const isGroupPinned = isApproved && Boolean(registration?.group);
    const studentFirstName = student?.name?.split(' ')?.[0] ?? auth.user?.name?.split(' ')?.[0] ?? 'Mahasiswa';

    // Alur Pelaksanaan KKN (Modernized SOP View)
    // Tahap 2 (Pembekalan) kini dilewati sistem karena dilakukan manual oleh LPPM
    const phases = [
        { id: 1, label: 'Penempatan', desc: 'Registrasi Unit', icon: Rocket, isCompleted: isApproved, isActive: !registration || isPending },
        { id: 2, label: 'Persiapan', desc: 'Progker Lapangan', icon: Beaker, isCompleted: workProgramCount > 0, isActive: isApproved && workProgramCount === 0 },
        { id: 3, label: 'Pelaksanaan', desc: 'Laporan Harian', icon: ClipboardList, isCompleted: dailyReportCount >= (registration?.period?.min_logbook ?? 30), isActive: workProgramCount > 0 && dailyReportCount < (registration?.period?.min_logbook ?? 30) },
        { id: 4, label: 'Pelaporan', desc: 'Berkas Akhir', icon: UploadCloud, isCompleted: !!finalReport, isActive: dailyReportCount >= (registration?.period?.min_logbook ?? 30) && !finalReport },
        { id: 5, label: 'Kelulusan', desc: 'Sertifikasi', icon: BadgeCheck, isCompleted: grade?.is_finalized, isActive: !!finalReport && !grade?.is_finalized }
    ];

    const activePhaseIndex = phases.findIndex(p => p.isActive);
    const currentPhase = activePhaseIndex !== -1 ? phases[activePhaseIndex] : (phases.every(p => p.isCompleted) ? phases[4] : phases[0]);

    const isProfileIncomplete = !auth.user?.mahasiswa?.health_certificate_path || 
                               !auth.user?.mahasiswa?.parent_permission_path ||
                               !auth.user?.mahasiswa?.nik;

    return (
        <ErrorBoundary>
            <AppLayout>
                <Head title="Portal Mahasiswa | KKN UIN Saizu" />

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-12 pb-24"
                >
                    <AnimatePresence>
                        {isProfileIncomplete && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-rose-50 border-b border-rose-100 px-8 py-4 -mt-10 mb-10 -mx-10 rounded-t-[3rem] backdrop-blur-xl">
                                    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 text-rose-600">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-rose-200/20 rounded-lg">
                                                <AlertTriangle size={18} className="animate-pulse" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] leading-tight">
                                                Profil pendaftaran belum lengkap (Berkas/NIK). Segera perbaiki di pengaturan profil.
                                            </span>
                                        </div>
                                        <Link 
                                            href={route('profile.show')} 
                                            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-rose-200 transition-all active:scale-95"
                                        >
                                            Lengkapi Sekarang
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                
                    <motion.div variants={itemVariants}>
                        <div className="bg-white rounded-[3rem] p-12 lg:p-14 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-24 opacity-[0.02] rotate-[15deg] pointer-events-none transition-transform duration-1000 group-hover:rotate-0">
                                <GraduationCap size={280} className="text-emerald-900" />
                            </div>

                            <div className="flex items-center gap-10 relative z-10">
                                <motion.div 
                                    whileHover={{ scale: 1.05, rotate: -3 }}
                                    className="relative"
                                >
                                    <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-600/20 flex items-center justify-center text-4xl font-black text-white ">
                                        {studentFirstName.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                        <div className={clsx("h-4 w-4 rounded-full", isApproved ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" : "bg-amber-400")} />
                                    </div>
                                </motion.div>

                                <div className="space-y-3">
                                     <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                         <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                                             Halo, <span className="text-emerald-600">{studentFirstName}!</span>
                                         </h1>
                                         <span className="w-fit px-4 py-1.5 bg-emerald-50 text-[10px] font-black text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-[0.2em]">Mahasiswa Aktif</span>
                                     </div>
                                     <div className="flex flex-wrap items-center gap-5">
                                        <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4 text-emerald-400/60" />
                                            NIM <span className="text-slate-900 font-black">{student.nim || '-'}</span>
                                        </div>
                                        <span className="hidden sm:block text-slate-200">/</span>
                                        <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                                            <Activity className="w-4 h-4 text-emerald-400/60" />
                                            STATUS <span className="text-emerald-600 font-black decoration-emerald-200 decoration-2 underline-offset-4 underline">{isPending ? 'PENGECEKAN' : 'AKTIF'}</span>
                                        </div>
                                     </div>
                                </div>
                            </div>

                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="relative z-10"
                            >
                                <div className="bg-slate-50/50 backdrop-blur-sm px-10 py-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-8 shadow-sm">
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Otoritas Penempatan</span>
                                        <span className={clsx(
                                            "text-sm font-black uppercase tracking-tighter ",
                                            isApproved ? "text-emerald-600" : isRejected ? "text-rose-500" : "text-amber-500"
                                        )}>
                                            {isApproved ? 'TERVERIFIKASI' : isPending ? 'DALAM ANTREAN' : isRejected ? 'PERLU REVISI' : 'TIDAK TERDAFTAR'}
                                        </span>
                                    </div>
                                    <div className={clsx(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm",
                                        isApproved
                                            ? "bg-emerald-600 text-white border-white"
                                            : isRejected
                                                ? "bg-white text-rose-500 border-rose-100"
                                                : "bg-white text-amber-500 border-amber-500/20"
                                    )}>
                                        {isApproved ? <BadgeCheck className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* --- PHASE TRACKER (DYNAMIC PROGRESSION) --- */}
                    <motion.div variants={itemVariants}>
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/20 to-transparent pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-16 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-100">
                                        <Target size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.25em]">Timeline Pelaksanaan</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1 opacity-70">Standar Operasional KKN 2026/2027</p>
                                    </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-3">
                                    <div className="h-1.5 w-64 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(phases.filter(p => p.isCompleted).length / phases.length) * 100}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="h-full bg-emerald-600" 
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-600 tracking-tighter">
                                        {Math.floor((phases.filter(p => p.isCompleted).length / phases.length) * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4 px-4">
                                <div className="absolute top-11 left-12 right-12 h-0.5 bg-slate-50 hidden md:block" />
                                
                                {phases.map((phase, idx) => {
                                    const Icon = phase.icon;
                                    return (
                                        <div key={idx} className="relative z-10 flex-1 flex flex-col items-center text-center group/phase">
                                            <motion.div 
                                                whileHover={{ y: -8, scale: 1.05 }}
                                                className={clsx(
                                                    "h-22 w-22 rounded-[2.5rem] flex items-center justify-center transition-all border-8 shadow-sm relative",
                                                    phase.isCompleted ? "bg-emerald-600 border-white text-white rotate-0" :
                                                    phase.isActive ? "bg-white border-emerald-500/10 text-emerald-600 ring-4 ring-emerald-50" :
                                                    "bg-slate-50 border-white text-slate-300"
                                                )}
                                            >
                                                {phase.isCompleted 
                                                    ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="w-9 h-9" /></motion.div> 
                                                    : <Icon className="w-9 h-9" />}
                                                
                                                {phase.isActive && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                                                    </span>
                                                )}
                                            </motion.div>
                                            <div className="mt-8 space-y-2 px-2">
                                                <p className={clsx(
                                                    "text-[11px] font-black uppercase tracking-[0.2em] leading-none",
                                                    phase.isActive ? "text-emerald-600" : phase.isCompleted ? "text-emerald-900" : "text-slate-400"
                                                )}>
                                                    {phase.label}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-tight leading-relaxed max-w-[120px] mx-auto opacity-80 uppercase">{phase.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* --- ABCD METHODOLOGY (EDITORIAL STYLE) --- */}
                    {isApproved && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-slate-900 rounded-[3.5rem] p-12 lg:p-16 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                                <div className="absolute -bottom-12 -left-12 opacity-5 pointer-events-none">
                                    <Layers size={320} className="rotate-12" />
                                </div>
                                
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 relative z-10">
                                    <div className="space-y-10 flex-1">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                                <Layers size={30} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-1">Methodology</h3>
                                                <p className="text-3xl font-black tracking-tighter uppercase leading-none">Asset Based Community Development</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {[
                                                { l: 'DISCOVERY', status: dailyReportCount >= 7 ? 'DONE' : 'NEXT' },
                                                { l: 'DREAM', status: dailyReportCount >= 14 ? 'DONE' : (dailyReportCount >= 7 ? 'ACTIVE' : 'LOCKED') },
                                                { l: 'DESIGN', status: dailyReportCount >= 14 ? 'DONE' : 'LOCKED' },
                                                { l: 'DEFINE', status: dailyReportCount >= 21 ? 'DONE' : 'LOCKED' },
                                                { l: 'DESTINY', status: dailyReportCount >= 28 ? 'DONE' : 'LOCKED' },
                                            ].map((stage, i) => (
                                                <motion.div 
                                                    key={i}
                                                    whileHover={{ scale: 1.02 }}
                                                    className={clsx(
                                                        "px-5 py-5 border-2 rounded-[2rem] flex flex-col gap-2 transition-all backdrop-blur-sm",
                                                        stage.status === 'DONE' ? "bg-emerald-600/10 border-emerald-600/40" :
                                                        stage.status === 'ACTIVE' ? "bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-600/20" :
                                                        "bg-white/5 border-white/5 opacity-40"
                                                    )}
                                                >
                                                    <span className={clsx(
                                                        "text-[9px] font-black tracking-[0.3em] uppercase",
                                                        stage.status === 'ACTIVE' ? "text-white" : "text-emerald-500"
                                                    )}>
                                                        {stage.l}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-wide uppercase opacity-70">
                                                        {stage.status}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] leading-relaxed max-w-2xl opacity-70">
                                            ABCD fokus pada penemuan aset lokal desa. KKN Angkatan ke-56 wajib mengimplementasikan seluruh tahapan ini untuk mencapai transformasi masyarakat yang berkelanjutan.
                                        </p>
                                    </div>
                                    
                                    <div className="lg:w-56 aspect-square bg-white/5 border border-white/10 rounded-[4rem] flex flex-col items-center justify-center gap-3 text-center transition-transform duration-700">
                                        <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Metrics</span>
                                        <span className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                                            {Math.min(100, Math.floor((dailyReportCount / 28) * 100))}
                                        </span>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">% Completed</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {!isGroupPinned ? (
                            /* PHASE 1: REGISTRATION FOCUS */
                            <motion.section 
                                key="registration"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[4rem] border-2 border-slate-100 p-20 lg:p-32 text-center group transition-all duration-700 hover:shadow-2xl hover:shadow-slate-100"
                            >
                                <motion.div 
                                    className="relative inline-block mb-12"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] opacity-100" />
                                    <MapPin className={clsx("h-28 n-28 relative z-10", isPending ? "text-amber-400" : "text-emerald-600")} />
                                </motion.div>
                                
                                <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tighter uppercase">
                                    {isRejected ? 'Perbaikan Data Diperlukan' : isPending ? 'Sedang Verifikasi' : 'Inisiasi Penempatan'}
                                </h3>
                                <p className="text-slate-400 font-bold text-sm mb-14 max-w-xl mx-auto leading-loose uppercase tracking-[0.05em] opacity-80">
                                    {isRejected
                                        ? registration?.rejection_reason || 'Admin menemukan ketidaksesuaian pada dokumen Anda. Segera perbaiki agar sistem dapat memproses penempatan.'
                                        : isPending 
                                        ? 'Sistem sedang memvalidasi berkas pendaftaran Anda. Penempatan kelompok dilakukan otomatis berdasarkan kuota dan domisili.' 
                                        : 'Database pendaftaran Anda belum terisi. Segera lengkapi berkas dan NIK di menu profil untuk memulai pendaftaran.'}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                    <Link
                                        href={route('student.registration.create')}
                                        className="group inline-flex items-center gap-8 px-14 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[14px] tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-300 active:scale-95 uppercase"
                                    >
                                        {isRejected ? 'REVISI DATA SEKARANG' : isPending ? 'PANTAU STATUS' : 'MULAI PENDAFTARAN'}
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-3 transition-transform" />
                                    </Link>
                                </div>
                            </motion.section>
                        ) : (
                            /* PHASE 2: ACTIVE DEPLOYMENT */
                            <motion.div 
                                key="deployment"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start"
                            >
                                <div className="lg:col-span-2 space-y-12">
                                    <section className="bg-emerald-700 rounded-[4rem] p-12 lg:p-16 text-white relative overflow-hidden group shadow-2xl shadow-emerald-100">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-6 group-hover:rotate-0 transition-transform duration-1000">
                                            <MapPin size={300} strokeWidth={1} />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                                            <div className="space-y-10 flex-1">
                                                <div className="flex items-center gap-4 border-b border-white/10 pb-6 w-fit">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-300">Operational Zone</h3>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase">
                                                        {registration?.group?.location?.name ?? 'Lokasi Pending'}
                                                    </h2>
                                                    <div className="flex flex-wrap items-center gap-5">
                                                        <span className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-[11px] font-black tracking-[0.25em] uppercase">
                                                            UNIT ID {registration?.group?.name}
                                                        </span>
                                                        <span className="px-6 py-2.5 bg-emerald-900/30 border border-emerald-500/30 rounded-2xl text-[11px] font-black tracking-[0.25em] uppercase text-emerald-200">
                                                            SINKRON: {new Date().toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto space-y-8 min-w-[280px] bg-black/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
                                                 <div className="space-y-6">
                                                      <div className="flex gap-6 items-center">
                                                          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
                                                              <UserCircle size={28} strokeWidth={1.5} />
                                                          </div>
                                                          <div className="min-w-0">
                                                              <p className="text-[10px] font-black text-emerald-300/60 uppercase tracking-[0.2em] mb-1">DPL In Charge</p>
                                                              <p className="text-sm font-black uppercase tracking-tight truncate">{registration?.group?.lecturer?.name ?? 'Assigned Soon'}</p>
                                                          </div>
                                                      </div>
                                                      <div className="flex gap-6 items-center">
                                                          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
                                                              <Calendar size={28} strokeWidth={1.5} />
                                                          </div>
                                                          <div>
                                                              <p className="text-[10px] font-black text-emerald-300/60 uppercase tracking-[0.2em] mb-1">Active Cycle</p>
                                                              <p className="text-sm font-black uppercase tracking-tight truncate">{registration?.period?.name}</p>
                                                          </div>
                                                      </div>
                                                 </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <StatCard
                                            title="Volume Laporan"
                                            value={dailyReportCount}
                                            unit="LOGS"
                                            icon={ClipboardList}
                                            color="emerald"
                                            description="Aktivitas harian terverifikasi DPL"
                                        />
                                        <StatCard
                                            title="Produk Luaran"
                                            value={finalReport ? 'VERIFIED' : 'PENDING'}
                                            unit="STATUS"
                                            icon={UploadCloud}
                                            color={finalReport ? 'emerald' : 'slate'}
                                            description="Integrasi laporan akhir kelompok"
                                        />
                                        
                                        <AnimatePresence>
                                            {grade?.is_finalized && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="md:col-span-2"
                                                >
                                                    <div className="bg-emerald-600 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-emerald-200 group/cert overflow-hidden relative border-2 border-emerald-400">
                                                        <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12 translate-x-1/4 group-hover/cert:rotate-0 transition-transform duration-1000">
                                                            <BadgeCheck size={260} strokeWidth={1} />
                                                        </div>
                                                        <div className="flex items-center gap-10 relative z-10 w-full">
                                                            <div className="h-24 w-24 rounded-[2rem] bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center text-white shadow-inner">
                                                                <ScrollText size={40} strokeWidth={1.5} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Credential Verification</h4>
                                                                <p className="text-[12px] font-black text-emerald-100 uppercase tracking-[0.25em] opacity-80">
                                                                    GRADE: {grade.letter} &bull; SCORE: {grade.score?.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <a 
                                                                href={route('student.certificate.download', grade.id)}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="ml-auto px-12 py-6 bg-white text-emerald-700 rounded-3xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-4"
                                                            >
                                                                Download Cert
                                                                <Download size={22} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <section className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.02)] space-y-10">
                                        <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                            <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                                                < Zap className="h-6 w-6" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Quick Actions</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1 opacity-70">Main Terminal</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {[
                                                { href: route('student.laporan-harian.index'), icon: ClipboardList, label: 'Daily Logs', desc: 'Activity input', status: 'OPEN' },
                                                { href: route('student.program-kerja.index'), icon: Presentation, label: 'Work Program', desc: 'Project design', status: workProgramCount > 0 ? 'FILLER' : 'INIT' },
                                                { href: route('student.posko.index'), icon: MapPin, label: 'Base Camp', desc: 'Location tags', status: 'SYNC' },
                                                { href: route('student.laporan-akhir.index'), icon: UploadCloud, label: 'Products', desc: 'Final upload', status: finalReport ? 'VERIFIED' : 'READY' }
                                            ].map((action, i) => (
                                                <Link
                                                    key={i}
                                                    href={action.href}
                                                    className="flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-slate-50 transition-all hover:bg-slate-50 hover:border-emerald-500/20 group hover:shadow-xl hover:shadow-slate-100"
                                                >
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:text-emerald-700 group-hover:bg-white group-hover:border-emerald-500/20 transition-all">
                                                        <action.icon size={26} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors ">{action.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 opacity-70 uppercase tracking-widest">{action.desc}</p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden group shadow-xl">
                                        <div className="absolute -top-4 -right-4 text-white/5 rotate-12">
                                            <ShieldCheck size={140} />
                                        </div>
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-3 mb-10">
                                            Security & Policy
                                        </h3>
                                        
                                        <div className="space-y-10 relative z-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-emerald-400">
                                                    <Lock size={14} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Verification</span>
                                                </div>
                                                <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                                    Logs must be validated by DPL within H+3 of field activities.
                                                </p>
                                            </div>
                                            <div className="h-px bg-white/5" />
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-emerald-400">
                                                    <ShieldCheck size={14} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Insurance Coverage</span>
                                                </div>
                                                <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                                    Protected by BPJS Ketenagakerjaan for KKN Cycle 2026/2027.
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <footer className="text-center pt-24 opacity-30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                            UIN SAIFUDDIN ZUHRI &bull; DIGITAL PORTAL &bull; 56TH GENERATION
                        </p>
                    </footer>
                </motion.div>
            </AppLayout>
        </ErrorBoundary>
    );
}

function normalizeRegistrationStatus(status?: Registration['status'] | null): 'approved' | 'pending' | 'rejected' | 'unknown' {
    if (!status) return 'unknown';
    const s = status.toLowerCase();
    if (['approved', 'disetujui', 'verifikasi_pusat', 'completed'].includes(s)) return 'approved';
    if (['pending', 'menunggu'].includes(s)) return 'pending';
    if (['rejected', 'ditolak', 'gugur'].includes(s)) return 'rejected';
    return 'unknown';
}

interface StatCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: LucideIcon;
    color: 'emerald' | 'slate';
    description?: string;
}

function StatCard({ title, value, unit, icon: Icon, color, description }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="bg-white border border-slate-100 rounded-[3rem] p-10 transition-all hover:bg-slate-900 group relative overflow-hidden shadow-sm"
        >
            <div className="absolute -top-2 -right-2 text-slate-100 group-hover:text-emerald-500/10 transition-colors pointer-events-none">
                <Icon size={140} strokeWidth={1} />
            </div>

            <div className={clsx(
                "h-14 w-14 rounded-2xl flex items-center justify-center mb-8 border transition-all",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white" : "bg-slate-50 text-slate-400 border-slate-100 group-hover:border-slate-800"
            )}>
                <Icon className="h-7 w-7" strokeWidth={2.5} />
            </div>
            
            <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover:text-emerald-500 transition-colors">{title}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden group-hover:block transition-all">{description}</p>
                </div>
                <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-black text-slate-900 group-hover:text-white transition-colors tracking-tighter leading-none">{value}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-500 transition-colors">{unit}</span>
                </div>
            </div>
        </motion.div>
    );
}
