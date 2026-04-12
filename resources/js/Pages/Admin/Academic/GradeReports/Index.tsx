import { type FormEvent, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Download,
    FileSpreadsheet,
    GraduationCap,
    Lock,
    Search,
    ShieldCheck,
    Users,
    Activity,
    Database,
    Binary,
    Zap,
    Cpu,
    Fingerprint,
    Target,
    Layers,
    Globe,
    ChevronRight,
    ArrowRight,
    Filter,
    RefreshCw,
    AlertTriangle,
    Archive,
    CheckCircle2,
    FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/ui';

interface StudentGrade {
    id: number;
    score_id: number | null;
    nim: string;
    name: string;
    group_name: string;
    kelompok_id: number;
    final_grade_letter: string | null;
    final_grade_value: number | null;
    is_locked: boolean;
    fakultas?: string | null;
    prodi?: string | null;
    can_finalize?: boolean;
}

interface Props {
    scores: StudentGrade[];
    stats: {
        total_students: number;
        graded_count: number;
        locked_count: number;
        average_value: number;
    } | null;
    filters: {
        search?: string | null;
        period_id?: number | string | null;
        faculty_id?: number | string | null;
        kelompok_id?: number | string | null;
        huruf?: string | null;
    };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
    lockedFaculty?: { id: number; name: string } | null;
    canExport: boolean;
    canFinalizeMass: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function RekapNilaiIndex({
    scores,
    stats,
    filters,
    periods,
    faculties,
    lockedFaculty,
    canExport,
    canFinalizeMass,
}: Props) {
    const [search, setSearch] = useState(filters.search ? String(filters.search) : '');
    const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id ? String(filters.faculty_id) : '');
    const [huruf, setHuruf] = useState(filters.huruf ? String(filters.huruf) : '');
    const [certProgress, setCertProgress] = useState<{
        status: 'idle' | 'processing' | 'completed' | 'failed';
        progress: number;
        processed: number;
        total: number;
        download_url?: string;
    }>({ status: 'idle', progress: 0, processed: 0, total: 0 });

    useEffect(() => {
        let interval: any;
        if (certProgress.status === 'processing') {
            interval = setInterval(() => {
                fetch(route('admin.grade-reports.progres-sertifikat', { period_id: periodId }))
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            setCertProgress(prev => ({
                                ...prev,
                                status: data.status,
                                progress: data.progress || 0,
                                processed: data.processed || 0,
                                total: data.total || 0,
                                download_url: data.download_url
                            }));
                        }
                    });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [certProgress.status, periodId]);

    useEffect(() => {
        setSearch(filters.search ? String(filters.search) : '');
        setPeriodId(filters.period_id ? String(filters.period_id) : '');
        setFacultyId(filters.faculty_id ? String(filters.faculty_id) : '');
        setHuruf(filters.huruf ? String(filters.huruf) : '');
    }, [filters.faculty_id, filters.huruf, filters.period_id, filters.search]);

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(
            route('admin.grade-reports.index'),
            {
                search: search || undefined,
                period_id: periodId || undefined,
                faculty_id: lockedFaculty ? lockedFaculty.id : facultyId || undefined,
                huruf: huruf || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setHuruf('');
        const nextPeriodId = periods[0] ? String(periods[0].id) : '';
        setPeriodId(nextPeriodId);
        if (!lockedFaculty) setFacultyId('');
        router.get(
            route('admin.grade-reports.index'),
            { period_id: nextPeriodId || undefined, faculty_id: lockedFaculty ? lockedFaculty.id : undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleFinalize = (scoreId: number) => {
        if (confirm('Finalisasi nilai mahasiswa ini?')) {
            router.patch(route('admin.grade-reports.finalisasi', scoreId), {}, { preserveScroll: true });
        }
    };

    const handleBulkFinalize = () => {
        if (!periodId) return;
        if (confirm('Finalisasi massal untuk nilai yang sudah lengkap pada periode ini?')) {
            router.post(route('admin.grade-reports.finalisasi-massal'), { period_id: periodId }, { preserveScroll: true });
        }
    };

    const exportWithPath = (path: 'ekspor' | 'ekspor-ledger') => {
        if (!periodId) return;
        const params = new URLSearchParams();
        params.set('period_id', periodId);
        if (lockedFaculty) params.set('faculty_id', String(lockedFaculty.id));
        else if (facultyId) params.set('faculty_id', facultyId);
        if (search) params.set('search', search);
        if (huruf) params.set('huruf', huruf);
        const exportRoute = path === 'ekspor' ? route('admin.grade-reports.ekspor') : route('admin.grade-reports.ekspor-ledger');
        window.location.href = `${exportRoute}?${params.toString()}`;
    };

    const handleBulkCertificates = () => {
        if (!periodId) { alert('Pilih periode terlebih dahulu.'); return; }
        if (confirm('Mulai pembuatan sertifikat massal di latar belakang? Fitur ini akan memproses seluruh mahasiswa yang nilainya sudah difinalisasi.')) {
            setCertProgress({ status: 'processing', progress: 0, processed: 0, total: 0 });
            router.post(route('admin.grade-reports.sertifikat-massal'), { period_id: periodId, faculty_id: facultyId || undefined }, { preserveScroll: true });
        }
    };

    return (
        <AppLayout title="Evaluation Audit Hub">
            <Head title="Rekap Nilai | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Final Grade Evaluation Hub</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Evaluation <span>Audit.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pusat rekapitulasi nilai akhir. <br />
                            <span className="text-slate-900 not-italic">Oversight terhadap performa akademik mahasiswa, finalisasi ledger nilai, dan pemrosesan sertifikat massal.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                         {canExport && (
                             <div className="flex gap-2">
                                <Button
                                    onClick={() => exportWithPath('ekspor')}
                                    className="h-20 px-8 bg-white border border-slate-100 text-slate-900 font-black rounded-3xl shadow-xl transition-all flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] active:scale-95 group"
                                >
                                    <FileSpreadsheet size={18} className="text-emerald-500" />
                                    Export Ledger
                                </Button>
                             </div>
                         )}
                         {canFinalizeMass && (
                            <Button
                                onClick={handleBulkFinalize}
                                className="h-20 px-8 bg-slate-900 text-white font-black rounded-3xl shadow-2xl transition-all flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] active:scale-95 group"
                            >
                                <ShieldCheck size={18} className="text-emerald-500" />
                                Bulk Finalize
                            </Button>
                         )}
                         <Button
                            onClick={handleBulkCertificates}
                            disabled={certProgress.status === 'processing'}
                            className="h-20 px-8 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl transition-all flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] active:scale-95 group"
                        >
                            <AnimatePresence mode="wait">
                                {certProgress.status === 'processing' ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <GraduationCap size={18} />
                                )}
                            </AnimatePresence>
                            {certProgress.status === 'processing' ? `MEMPROSES...` : 'BUAT SERTIFIKAT'}
                        </Button>
                    </div>
                </motion.div>

                {/* --- PROGRESS OVERLAY --- */}
                <AnimatePresence>
                    {certProgress.status === 'processing' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                <RefreshCw size={150} className="animate-spin duration-slow" />
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                                <div className="space-y-4">
                                     <div className="flex items-center gap-4 text-emerald-500">
                                          <Activity size={20} className="animate-pulse" />
                                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Pemrosesan Tugas Asinkron</span>
                                     </div>
                                     <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Casting Certification Vault</h3>
                                     <p className="text-slate-400 font-bold uppercase tracking-tight italic opacity-80 leading-relaxed max-w-xl">
                                         Sistem sedang merangkai file PDF ke dalam arsip ZIP di latar belakang. Tetap berada di halaman ini untuk menerima tautan unduhan.
                                     </p>
                                </div>
                                <div className="flex flex-col items-end gap-6 min-w-[300px]">
                                     <div className="flex items-center gap-6">
                                          <span className="text-6xl font-black text-emerald-500 italic tracking-tighter tabular-nums">{certProgress.progress}%</span>
                                          <div className="flex flex-col items-start leading-none gap-1">
                                               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Progress</span>
                                               <span className="text-[12px] font-black text-emerald-400 uppercase tracking-wider tabular-nums font-mono">{certProgress.processed} / {certProgress.total}</span>
                                          </div>
                                     </div>
                                     <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                          <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${certProgress.progress}%` }}
                                              className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                          />
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- DOWNLOAD VICTORY BAR --- */}
                <AnimatePresence>
                    {certProgress.status === 'completed' && certProgress.download_url && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-600 rounded-[3.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-emerald-500/20"
                        >
                            <div className="flex items-center gap-8">
                                <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-3xl border border-white/20 shadow-2xl">
                                    <ShieldCheck size={40} className="text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Protocol Complete: Archive Ready</h4>
                                    <p className="text-emerald-50 text-[11px] font-black uppercase tracking-widest opacity-80 decoration-white/20 underline underline-offset-4">Vault package successfully generated and encrypted.</p>
                                </div>
                            </div>
                            <a 
                                href={certProgress.download_url} 
                                target="_blank" rel="noopener noreferrer" 
                                className="h-20 px-12 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] flex items-center gap-6 uppercase tracking-[0.3em] hover:bg-white hover:text-emerald-700 transition-all shadow-2xl active:scale-95 group"
                            >
                                <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                                DOWNLOAD ARCHIVE (ZIP)
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                {stats && (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <MetricCard label="Operation Total" value={stats.total_students.toLocaleString()} icon={Users} color="emerald" desc="Total registered personnel" />
                        <MetricCard label="Grading Completed" value={stats.graded_count.toLocaleString()} icon={Activity} color="emerald" desc="Evaluated missions recorded" />
                        <MetricCard label="Locked Vaults" value={stats.locked_count.toLocaleString()} icon={Lock} color="emerald" desc="Finalized ledger entries" />
                        <MetricCard label="Mean Performance" value={stats.average_value.toFixed(2)} icon={BarChart3} color="emerald" desc="Global average score vector" />
                    </motion.div>
                )}

                {/* --- COMMAND FILTER BOARD --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-6 shadow-sm space-y-6">
                    <div className="flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="SEARCH BY NIM / NAME / FACULTY / PROGRAM / GROUP..."
                                className="w-full h-18 pl-20 pr-8 bg-slate-50 border-none rounded-[1.75rem] text-[11px] font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-200 uppercase tracking-widest"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 xl:w-[800px]">
                            <FilterSelect 
                                value={periodId} 
                                onChange={(e) => setPeriodId(e.target.value)} 
                                icon={Target} 
                                label="Session Node"
                                options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                placeholder="SELECT SESSION"
                            />
                            {lockedFaculty ? (
                                <div className="h-18 px-10 bg-slate-900 border border-slate-800 rounded-[1.75rem] flex items-center gap-6 shadow-xl relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform">
                                          <Building2 size={60} />
                                     </div>
                                     <Globe size={16} className="text-emerald-500" />
                                     <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] leading-none mb-1">Vector Locked</span>
                                          <span className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">{lockedFaculty.name}</span>
                                     </div>
                                </div>
                            ) : (
                                <FilterSelect 
                                    value={facultyId} 
                                    onChange={(e) => setFacultyId(e.target.value)} 
                                    icon={Building2} 
                                    label="Faculty Origin"
                                    options={faculties.map(f => ({ value: String(f.id), label: f.name }))}
                                    placeholder="ALL FACULTIES"
                                />
                            )}
                            <FilterSelect 
                                value={huruf} 
                                onChange={(e) => setHuruf(e.target.value)} 
                                icon={Binary} 
                                label="Grade Vector"
                                options={['A','B','C','D','E'].map(h => ({ value: h, label: h }))}
                                placeholder="ALL GRADES"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-50">
                        <div className="flex gap-4">
                            <Button 
                                onClick={applyFilters}
                                className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] active:scale-95 shadow-xl shadow-slate-200"
                            >
                                <Search size={14} className="text-emerald-500" />
                                EXECUTE FILTER
                            </Button>
                            <button 
                                onClick={resetFilters}
                                className="h-14 px-10 bg-white border border-slate-100 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:text-rose-500 transition-all active:scale-95"
                            >
                                RESET PARAMS
                            </button>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 text-slate-300">
                             <Fingerprint size={16} />
                             <span className="text-[10px] font-bold uppercase tracking-[0.3em] italic opacity-50">Filter state synchronized with kernel</span>
                        </div>
                    </div>
                </motion.div>

                {/* --- EVALUATION LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Layers size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Audit stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Global Performance Ledger</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Meta</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {scores.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Mahasiswa Node</th>
                                    <th className="px-12 py-8">Institutional Matrix</th>
                                    <th className="px-12 py-8">Squad Assignment</th>
                                    <th className="px-12 py-8 text-center">Score Vector</th>
                                    <th className="px-12 py-8 text-center">Protocol Status</th>
                                    <th className="px-12 py-8 text-right">Kernel Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {scores.length > 0 ? (
                                    scores.map((grade) => (
                                        <tr key={grade.score_id ?? `${grade.kelompok_id}-${grade.id}`} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-12 py-10">
                                                <div className="flex flex-col gap-1.5 leading-none">
                                                    <span className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight uppercase italic">{grade.name}</span>
                                                    <div className="flex items-center gap-3">
                                                         <div className={clsx("h-1.5 w-1.5 rounded-full transition-all", grade.is_locked ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                                         <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase italic">{grade.nim}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex flex-col gap-1.5">
                                                     <div className="flex items-center gap-2">
                                                          <Globe size={11} className="text-emerald-500/50" />
                                                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{grade.fakultas || 'NULL'}</span>
                                                     </div>
                                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] italic ml-4">{grade.prodi || 'UNSPECIFIED'}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-950 text-white rounded-xl text-[9px] font-black tracking-[0.2em] italic shadow-xl shadow-slate-200 group-hover:bg-emerald-600 transition-colors uppercase truncate max-w-[180px]">
                                                    <Target size={12} className="text-emerald-500" />
                                                    {grade.group_name}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter font-mono italic">
                                                        {grade.final_grade_value !== null ? grade.final_grade_value.toFixed(2) : '0.00'}
                                                    </span>
                                                    <div className={clsx(
                                                        "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all",
                                                        grade.final_grade_letter === 'A' ? "bg-emerald-600 text-white" :
                                                        grade.final_grade_letter === 'B' ? "bg-slate-900 text-emerald-500" :
                                                        grade.final_grade_letter ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-200"
                                                    )}>
                                                        {grade.final_grade_letter || 'PENDING'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {grade.is_locked ? (
                                                        <span className="inline-flex h-8 items-center px-6 bg-slate-900 text-emerald-500 rounded-2xl text-[9px] font-black tracking-[0.25em] shadow-xl italic">
                                                            LOCKED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex h-8 items-center px-6 bg-white text-slate-300 rounded-2xl text-[9px] font-black tracking-[0.25em] border border-slate-100 italic">
                                                            DRAFT
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    {grade.can_finalize && !grade.is_locked && grade.score_id ? (
                                                        <button
                                                            onClick={() => handleFinalize(grade.score_id as number)}
                                                            className="h-12 px-8 bg-slate-900 text-white border border-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 gap-3 italic"
                                                        >
                                                            <Lock size={14} strokeWidth={2.5} />
                                                            EXECUTE_LOCK
                                                        </button>
                                                    ) : (
                                                        <div className="h-12 px-8 bg-slate-50 border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic cursor-default">
                                                            {grade.is_locked ? 'AUDIT_SECURED' : 'UNSTABLE_STATE'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Archive size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Evaluation Ledger Null</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO EVALUATION ENTRIES DETECTED IN MONITORING PIPELINE.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hall HAL. Evaluation Stream Ledger Active</span>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 text-slate-300">
                                  <Users size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">{scores.length.toLocaleString()} ENTRIES RECORDED</span>
                             </div>
                        </div>
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <GraduationCap className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Graduation Oversight</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Immutable Grade Synchronization</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Rekapitulasi nilai adalah pusat verifikasi akhir keberhasilan KKN. Nilai yang difinalisasi bersifat permanen dan akan langsung diintegrasikan ke dalam database sertifikat akademik mahasiswa.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <ShieldCheck size={28} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Evaluation Integrity Enforced</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}

function FilterSelect({ value, onChange, icon: Icon, label, options, placeholder }: { value: string, onChange: (e: any) => void, icon: any, label: string, options: Array<{value: string, label: string}>, placeholder: string }) {
    return (
        <div className="h-18 px-10 bg-slate-50 border border-slate-100 rounded-[1.75rem] flex items-center gap-6 shadow-sm relative overflow-hidden group/f hover:border-emerald-500/30 transition-all">
             <Icon size={16} className="text-emerald-500" />
             <div className="flex flex-col flex-1">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] leading-none mb-1">{label}</span>
                  <select 
                    value={value} 
                    onChange={onChange}
                    className="w-full bg-transparent border-none p-0 text-[10px] font-black text-slate-700 focus:ring-0 outline-none uppercase tracking-wider appearance-none cursor-pointer"
                  >
                        <option value="">{placeholder}</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
             </div>
             <ChevronRight size={14} className="text-slate-200 rotate-90" />
        </div>
    );
}
