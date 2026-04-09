import { Link, Head, usePage } from '@inertiajs/react';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import AppLayout from '@/Layouts/AppLayout';
import {
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
    Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import type { PageProps } from '@/types';

interface Student {
    id?: number;
    name: string;
}

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
    workshopRegistered: boolean;
    finalReport: FinalReport | null;
    grade: Grade | null;
}

export default function StudentDashboard({ student, registration, dailyReportCount, workProgramCount, workshopRegistered, finalReport, grade }: Props) {
    const { auth } = usePage<PageProps>().props;
    const normalizedRegistrationStatus = normalizeRegistrationStatus(registration?.status);
    const isApproved = ['approved', 'verifikasi_pusat', 'completed'].includes(normalizedRegistrationStatus);
    const isPending = normalizedRegistrationStatus === 'pending';
    const isRejected = normalizedRegistrationStatus === 'rejected';
    const isGroupPinned = isApproved && Boolean(registration?.group);
    const studentFirstName = student?.name?.split(' ')?.[0] ?? auth.user?.name?.split(' ')?.[0] ?? 'Mahasiswa';

    // Alur Pelaksanaan KKN (Modernized SOP View)
    const phases = [
        { id: 1, label: 'Penempatan', desc: 'Registrasi Unit', icon: Rocket, isCompleted: isApproved, isActive: !registration || isPending },
        { id: 2, label: 'Pembekalan', desc: 'Metode & Teknis', icon: Presentation, isCompleted: isApproved && workshopRegistered, isActive: isApproved && !workshopRegistered },
        { id: 3, label: 'Persiapan', desc: 'Progker Lapangan', icon: Beaker, isCompleted: workshopRegistered && workProgramCount > 0, isActive: workshopRegistered && workProgramCount === 0 },
        { id: 4, label: 'Pelaksanaan', desc: 'Laporan Harian', icon: ClipboardList, isCompleted: dailyReportCount >= (registration?.period?.min_logbook ?? 30), isActive: workProgramCount > 0 && dailyReportCount < (registration?.period?.min_logbook ?? 30) },
        { id: 5, label: 'Pelaporan', desc: 'Berkas Akhir', icon: UploadCloud, isCompleted: !!finalReport, isActive: dailyReportCount >= (registration?.period?.min_logbook ?? 30) && !finalReport },
        { id: 6, label: 'Evaluasi', desc: 'Sertifikasi', icon: BadgeCheck, isCompleted: grade?.is_finalized, isActive: !!finalReport && !grade?.is_finalized }
    ];

    const activePhaseIndex = phases.findIndex(p => p.isActive);
    const currentPhase = activePhaseIndex !== -1 ? phases[activePhaseIndex] : (phases.every(p => p.isCompleted) ? phases[5] : phases[0]);

    return (
        <ErrorBoundary>
            <AppLayout>
                <Head title="Portal Mahasiswa | KKN UIN Saizu" />
            
            <div className="space-y-10 pb-20">
                {/* --- OPERATIONAL HEADER (PREMIUM WHITE) --- */}
                <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
                        <GraduationCap size={200} className="text-emerald-600" />
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-600/20 flex items-center justify-center text-3xl font-black text-white italic">
                                {studentFirstName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                <div className={clsx("h-3 w-3 rounded-full", isApproved ? "bg-emerald-500 animate-pulse" : "bg-amber-400")} />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                 <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight italic uppercase">
                                     Halo, <span className="text-emerald-600 not-italic">{studentFirstName}!</span>
                                 </h1>
                                 <span className="px-3 py-1 bg-emerald-50 text-[10px] font-black text-emerald-600 rounded-lg border border-emerald-100 uppercase tracking-widest hidden sm:block">Status Aktif</span>
                             </div>
                             <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-100" />
                                Progres Tahap: <span className="text-slate-900 decoration-emerald-400 underline underline-offset-4 decoration-4">{isPending ? 'Pengecekan Berkas' : currentPhase.label.toUpperCase()}</span>
                             </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-slate-50 px-8 py-5 rounded-[2rem] border border-slate-100 flex items-center gap-8 group/status cursor-default hover:bg-white hover:border-emerald-500/20 transition-all">
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Otoritas Penempatan</span>
                                <span className={clsx(
                                    "text-sm font-black uppercase tracking-tight italic",
                                    isApproved ? "text-emerald-600" : isRejected ? "text-rose-500" : "text-amber-500"
                                )}>
                                    {isApproved ? 'Terverifikasi' : isPending ? 'Menunggu' : isRejected ? 'Perlu Revisi' : 'Belum Terdaftar'}
                                </span>
                            </div>
                            <div className={clsx(
                                "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all",
                                isApproved
                                    ? "bg-white text-emerald-500 border-emerald-100 group-hover/status:bg-emerald-600 group-hover/status:text-white"
                                    : isRejected
                                        ? "bg-white text-rose-500 border-rose-100"
                                        : "bg-white text-amber-500 border-amber-100"
                            )}>
                                {isApproved ? <BadgeCheck className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PHASE TRACKER (HIGH VELOCITY VIZ) --- */}
                <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <Target size={20} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] italic">Timeline Pelaksanaan</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SOP Operasional KKN 2026/2027</p>
                            </div>
                        </div>
                        <div className="h-1 lg:w-64 bg-slate-100 rounded-full overflow-hidden hidden lg:block">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(phases.filter(p => p.isCompleted).length / phases.length) * 100}%` }} />
                        </div>
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4">
                        {/* Desktop Connecting Line */}
                        <div className="absolute top-10 left-10 right-10 h-[2px] bg-slate-50 hidden md:block" />
                        
                        {phases.map((phase, idx) => {
                            const Icon = phase.icon;
                            return (
                                <div key={idx} className="relative z-10 flex-1 flex flex-col items-center text-center group/phase cursor-default">
                                    <div className={clsx(
                                        "h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all border-8 shadow-sm",
                                        phase.isCompleted ? "bg-emerald-600 border-white text-white rotate-0" :
                                        phase.isActive ? "bg-white border-emerald-500/20 text-emerald-600 animate-in zoom-in duration-500" :
                                        "bg-slate-50 border-white text-slate-300 -rotate-3"
                                    )}>
                                        {phase.isCompleted ? <CheckCircle className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                                    </div>
                                    <div className="mt-8 space-y-2">
                                        <p className={clsx(
                                            "text-xs font-black uppercase tracking-widest italic leading-none",
                                            phase.isActive ? "text-emerald-600" : phase.isCompleted ? "text-emerald-800" : "text-slate-400"
                                        )}>
                                            {phase.label}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-tight leading-relaxed px-4">{phase.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- ABCD METHODOLOGY VIZ (PREMIUM UPGRADE) --- */}
                {isApproved && (
                    <div className="bg-emerald-950 rounded-[3rem] p-12 lg:p-16 text-white border-x-8 border-emerald-500 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 relative z-10">
                            <div className="space-y-8 flex-1">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-emerald-600 rounded-3xl shadow-2xl shadow-emerald-600/30">
                                        <Layers size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-emerald-400 italic">ABCD Methodology</h3>
                                        <p className="text-xl font-black italic tracking-tighter uppercase mt-1">Asset Based Community Development</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { l: 'DISCOVERY', status: dailyReportCount >= 7 ? 'COMPLETED' : 'ONGOING' },
                                        { l: 'DREAM', status: dailyReportCount >= 14 ? 'COMPLETED' : (dailyReportCount >= 7 ? 'ONGOING' : 'PENDING') }, // Week 2
                                        { l: 'DESIGN', status: dailyReportCount >= 14 ? 'COMPLETED' : 'LOCKED' }, // Week 2
                                        { l: 'DEFINE', status: dailyReportCount >= 21 ? 'COMPLETED' : 'LOCKED' }, // Week 3
                                        { l: 'DESTINY', status: dailyReportCount >= 28 ? 'COMPLETED' : 'LOCKED' }, // Week 4
                                    ].map((stage, i) => (
                                        <div 
                                            key={i}
                                            className={clsx(
                                                "px-6 py-3 border rounded-2xl flex flex-col gap-1 transition-all",
                                                stage.status === 'COMPLETED' ? "bg-emerald-600/20 border-emerald-500/50" :
                                                stage.status === 'ONGOING' ? "bg-white/10 border-white/20 animate-pulse" :
                                                "bg-slate-900/50 border-slate-800 opacity-40 grayscale"
                                            )}
                                        >
                                            <span className="text-[10px] font-black tracking-widest italic">{stage.l}</span>
                                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">{stage.status}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-emerald-200/40 uppercase tracking-widest leading-relaxed max-w-2xl italic">
                                    Metodologi ABCD berfokus pada penemuan dan pemanfaatan aset lokal desa untuk pemberdayaan masyarakat yang berkelanjutan. KKN Angkatan ke-56 wajib mengimplementasikan seluruh tahapan ini.
                                </p>
                            </div>
                            
                            <div className="lg:w-48 h-48 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-center group-hover:scale-105 transition-transform duration-700">
                                <span className="text-[10px] font-black text-emerald-400 tracking-[0.3em] italic uppercase">Method Progress</span>
                                <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums">
                                    {Math.min(100, Math.floor((dailyReportCount / 28) * 100))}%
                                </span>
                                <div className="h-1 w-20 bg-emerald-500/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (dailyReportCount / 28) * 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MAIN OPERATIONAL AREA --- */}
                {!isGroupPinned ? (
                    /* PHASE 1: BOOTSTRAPPING (Registration Focus) */
                    <section className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-20 lg:p-32 text-center group hover:bg-slate-50/50 hover:border-emerald-500/20 transition-all duration-700">
                        <div className="relative inline-block mb-10 translate-y-0 group-hover:-translate-y-4 transition-transform duration-500">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <MapPin className={clsx("h-24 w-24 relative z-10", isPending ? "text-amber-300" : "text-slate-200 group-hover:text-emerald-500")} />
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">
                            {isRejected ? 'Pendaftaran Perlu Perbaikan' : isPending ? 'Verifikasi Berkas' : 'Inisiasi Penempatan'}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm mb-12 max-w-lg mx-auto italic leading-relaxed">
                            {isRejected
                                ? registration?.rejection_reason || 'Admin menolak pendaftaran Anda dan meminta perbaikan data atau dokumen sebelum diajukan kembali.'
                                : isPending 
                                ? 'Sistem sedang memproses data pilihan kelompok Anda. Koordinasi tim IT LPPM biasanya memakan waktu 1x24 jam.' 
                                : 'Database belum mendeteksi pendaftaran kelompok untuk NIM Anda. Segera lakukan plotting sebelum periode penempatan ditutup.'}
                        </p>
                        {isRejected && registration?.revision_count ? (
                            <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
                                Riwayat pengajuan ulang: {registration.revision_count} kali
                            </p>
                        ) : null}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                href={route('student.registration.create')}
                                className="group inline-flex items-center gap-6 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-[13px] tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 uppercase"
                                aria-label={isRejected ? 'Perbaiki dan ajukan ulang pendaftaran' : isPending ? 'Pantau progress pendaftaran' : 'Mulai pendaftaran kelompok'}
                            >
                                {isRejected ? 'PERBAIKI & AJUKAN ULANG' : isPending ? 'PANTAU PROGRESS' : 'MULAI PENDAFTARAN'}
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" aria-hidden="true" />
                            </Link>
                        </div>
                    </section>
                ) : (
                    /* PHASE 2: ACTIVE DEPLOYMENT (Operational Excellence) */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:items-start">
                        {/* Deployment Info Cards */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Location Terminal */}
                            <section className="bg-slate-900 rounded-[3rem] p-10 lg:p-14 text-white relative overflow-hidden group border-x-8 border-emerald-600 shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-5 transition-opacity">
                                    <MapPin size={240} className="text-emerald-100" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                                    <div className="space-y-8 flex-1">
                                        <div className="flex items-center gap-4 text-emerald-400">
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 leading-none">Titik Penerjunan</h3>
                                                <p className="text-xs font-black italic text-emerald-400 uppercase tracking-widest">Situs Penempatan Aktif</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none shadow-sm uppercase">
                                                {registration?.group?.location?.name ?? 'Lokasi Belum Ditentukan'}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <span className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black tracking-widest italic uppercase">
                                                    UNIT: {registration?.group?.name}
                                                </span>
                                                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-xl">
                                                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sistem Sinkron</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto h-1 lg:h-40 md:w-[1px] bg-white/5 rounded-full hidden md:block" />

                                    <div className="space-y-8 min-w-[240px]">
                                        <div className="space-y-6">
                                             <div className="flex gap-5 items-center group/lecturer">
                                                 <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover/lecturer:text-emerald-400 transition-colors">
                                                     <UserCircle size={22} />
                                                 </div>
                                                 <div>
                                                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Dosen Pembimbing</p>
                                                     <p className="text-sm font-black italic uppercase tracking-tight">{registration?.group?.lecturer?.name ?? 'Belum Ditugaskan'}</p>
                                                 </div>
                                             </div>
                                             <div className="flex gap-5 items-center">
                                                 <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                                     <Calendar size={20} />
                                                 </div>
                                                 <div>
                                                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Periode Aktif</p>
                                                     <p className="text-sm font-black italic uppercase tracking-tight">{registration?.period?.name}</p>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Telemetry Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <StatCard
                                    title="Total Aktivitas"
                                    value={dailyReportCount}
                                    unit="LAPORAN"
                                    icon={ClipboardList}
                                    color="emerald"
                                />
                                <StatCard
                                    title="Produk Final"
                                    value={finalReport ? 'Terkirim' : 'Belum Ada'}
                                    unit="BERKAS"
                                    icon={UploadCloud}
                                    color={finalReport ? 'emerald' : 'slate'}
                                />
                                <StatCard
                                    title="Indeks Kelayakan"
                                    value={isApproved ? 'Layak' : 'Menunggu'}
                                    unit="TIER"
                                    icon={Activity}
                                    color="emerald"
                                />
                                {grade?.is_finalized && (
                                    <div className="md:col-span-3">
                                        <div className="bg-emerald-600 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-600/30 group/cert overflow-hidden relative border border-emerald-500">
                                            <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 translate-x-1/4 group-hover/cert:rotate-0 transition-transform duration-1000">
                                                <BadgeCheck size={200} className="text-white" />
                                            </div>
                                            <div className="flex items-center gap-8 relative z-10">
                                                <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white">
                                                    <ScrollText size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Sertifikat Kelulusan KKN</h4>
                                                    <p className="text-[11px] font-black text-emerald-100 uppercase tracking-widest leading-none">Otoritas Valid: {grade.letter} • {grade.score?.toFixed(2)} PTS</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={`/certificates/${grade.id}/download`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="relative z-10 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-4"
                                            >
                                                Unduh Sertifikat
                                                <Download size={18} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation / Control Space */}
                        <div className="space-y-10">
                            {/* Quick Action Bento */}
                            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
                                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] italic">Akses Aktivitas</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Operasional</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-5">
                                    {[
                                        { href: route('student.workshops.index'), icon: Presentation, label: 'Pembekalan', desc: 'Materi & Absensi Teknis', status: workshopRegistered ? 'Terdaftar' : 'Belum' },
                                        { href: '/mahasiswa/laporan-harian', icon: ClipboardList, label: 'Log Aktivitas', desc: 'Input laporan harian unit', status: 'BUKA' },
                                        { href: '/mahasiswa/posko', icon: MapPin, label: 'Lokasi Posko', desc: 'Pemetaan koordinat relasi', status: 'MANUAL' },
                                        { href: '/mahasiswa/laporan-akhir', icon: UploadCloud, label: 'Upload Produk', desc: 'Unggah file laporan kolektif', status: finalReport ? 'Terverifikasi' : 'Siap' }
                                    ].map((action, i) => (
                                        <Link
                                            key={i}
                                            href={action.href}
                                            className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white border border-slate-100 transition-all hover:bg-slate-50 hover:border-emerald-500/20 group group-hover:shadow-lg"
                                            aria-label={`${action.label}: ${action.desc}`}
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-white group-hover:border-emerald-500/20 transition-all">
                                                <action.icon size={22} aria-hidden="true" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors italic">{action.label}</p>
                                                    <span className="text-[8px] font-black px-2 py-0.5 bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-md transition-colors">{action.status}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1.5 opacity-80 uppercase tracking-widest truncate">{action.desc}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Informational Alerts */}
                            <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-10 relative overflow-hidden group">
                                <div className="absolute top-4 right-4 text-emerald-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                    <Info size={120} />
                                </div>
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Keamanan & Aturan
                                </h3>
                                
                                <div className="space-y-8 relative z-10">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <Lock size={12} /> Verifikasi Data
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                                            Laporan harian unit WAJIB diperiksa DPL maksimal H+3 penugasan lapangan.
                                        </p>
                                    </div>
                                    <div className="h-[1px] bg-slate-200" />
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500" /> Proteksi Asuransi
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                                            Anda tercover BPJS Ketenagakerjaan selama masa aktif penugasan KKN 2026/2027.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                <div className="text-center pt-20 border-t border-slate-100 italic">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">
                        PUSAT LAYANAN MAHASISWA &bull; UIN SAIFUDDIN ZUHRI &copy; 2026/2027
                    </p>
                </div>
            </div>
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
}

function StatCard({ title, value, unit, icon: Icon, color }: StatCardProps) {
    return (
        <div
            className="bg-white border border-slate-100 rounded-[2rem] p-10 transition-all hover:bg-emerald-600 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2"
            role="article"
            aria-label={`${title}: ${typeof value === 'number' ? value.toLocaleString() : value} ${unit}`}
        >
            <div className="absolute top-4 right-4 text-emerald-500/10 group-hover:text-white/10 transition-colors pointer-events-none" aria-hidden="true">
                <Icon size={100} className="lg:w-24 lg:h-24" />
            </div>

            <div className={clsx(
                "h-12 w-12 rounded-2xl flex items-center justify-center mb-10 border transition-all",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-white group-hover:text-emerald-600" : "bg-slate-50 text-slate-400 border-slate-200"
            )}>
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            
            <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-100 transition-colors italic">{title}</p>
                <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-black text-slate-900 group-hover:text-white transition-colors tracking-tight italic">{value}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-200 transition-colors italic">{unit}</span>
                </div>
            </div>
        </div>
    );
}
