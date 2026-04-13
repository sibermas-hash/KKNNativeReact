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
    Target,
    ChevronRight,
    ArrowRight,
    Filter,
    RefreshCw,
    Building2,
    Globe,
    Binary
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/ui';
import type { LucideIcon } from '@/types';

interface StudentGrade {
    id: number; score_id: number | null; nim: string; name: string;
    group_name: string; kelompok_id: number; final_grade_letter: string | null;
    final_grade_value: number | null; is_locked: boolean; fakultas?: string | null;
    prodi?: string | null; can_finalize?: boolean;
}

interface Props {
    stats: { total_students: number; graded_count: number; locked_count: number; average_value: number; } | null;
    filters: { search?: string | null; period_id?: number | string | null; faculty_id?: number | string | null; kelompok_id?: number | string | null; huruf?: string | null; };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
    lockedFaculty?: { id: number; name: string } | null;
    canExport: boolean;
    canFinalizeMass: boolean;
}

export default function RekapNilaiIndex({
    scores, stats, filters, periods, faculties, lockedFaculty, canExport, canFinalizeMass,
}: Props) {
    const [search, setSearch] = useState(filters.search ? String(filters.search) : '');
    const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id ? String(filters.faculty_id) : '');
    const [huruf, setHuruf] = useState(filters.huruf ? String(filters.huruf) : '');
    const [certProgress, setCertProgress] = useState<{ status: 'idle' | 'processing' | 'completed' | 'failed'; progress: number; processed: number; total: number; download_url?: string; }>({ status: 'idle', progress: 0, processed: 0, total: 0 });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (certProgress.status === 'processing') {
            interval = setInterval(() => {
                fetch(route('admin.grade-reports.progres-sertifikat', { period_id: periodId }))
                    .then(res => res.json())
                    .then(data => { if (data) setCertProgress(prev => ({ ...prev, status: data.status, progress: data.progress || 0, processed: data.processed || 0, total: data.total || 0, download_url: data.download_url })); });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [certProgress.status, periodId]);

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(route('admin.grade-reports.index'), { search: search || undefined, period_id: periodId || undefined, faculty_id: lockedFaculty ? lockedFaculty.id : facultyId || undefined, huruf: huruf || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleFinalize = (scoreId: number) => {
        if (confirm('Finalisasi nilai mahasiswa ini?')) router.patch(route('admin.grade-reports.finalisasi', scoreId), {}, { preserveScroll: true });
    };

    const handleBulkFinalize = () => {
        if (!periodId) return;
        if (confirm('Finalisasi massal untuk nilai yang sudah lengkap pada periode ini?')) router.post(route('admin.grade-reports.finalisasi-massal'), { period_id: periodId }, { preserveScroll: true });
    };

    const exportWithPath = (path: 'ekspor' | 'ekspor-ledger') => {
        if (!periodId) return;
        const params = new URLSearchParams();
        params.set('period_id', periodId);
        if (lockedFaculty) params.set('faculty_id', String(lockedFaculty.id));
        else if (facultyId) params.set('faculty_id', facultyId);
        if (search) params.set('search', search);
        if (huruf) params.set('huruf', huruf);
        window.location.href = `${path === 'ekspor' ? route('admin.grade-reports.ekspor') : route('admin.grade-reports.ekspor-ledger')}?${params.toString()}`;
    };

    const handleBulkCertificates = () => {
        if (!periodId) return;
        if (confirm('Mulai pembuatan sertifikat massal di latar belakang? Fitur ini akan memproses seluruh mahasiswa yang nilainya sudah difinalisasi.')) {
            setCertProgress({ status: 'processing', progress: 0, processed: 0, total: 0 });
            router.post(route('admin.grade-reports.sertifikat-massal'), { period_id: periodId, faculty_id: facultyId || undefined }, { preserveScroll: true });
        }
    };

    return (
    <AppLayout title="Rekapitulasi Nilai Mahasiswa">
      <Head title="Rekapitulasi Nilai" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <GraduationCap size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Akademik & Penilaian</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Rekap <span className="text-emerald-500">Nilai.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Otoritas Finalisasi Capaian Akademik dan Manajemen Sertifikasi Terpadu Mahasiswa KKN
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {canExport && (
                        <button
                            onClick={() => exportWithPath('ekspor')}
                            className="h-14 px-8 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-3 text-xs font-bold active:scale-95 uppercase tracking-widest"
                        >
                            <FileSpreadsheet size={18} /> EKSPOR NILAI
                        </button>
                    )}
                    {canFinalizeMass && (
                        <button
                            onClick={handleBulkFinalize}
                            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                        >
                            <ShieldCheck size={18} className="text-white" /> FINALISASI MASSAL
                        </button>
                    )}
                    <button
                        onClick={handleBulkCertificates}
                        disabled={certProgress.status === 'processing'}
                        className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider"
                    >
                        {certProgress.status === 'processing' ? <RefreshCw size={18} className="animate-spin" /> : <GraduationCap size={18} />}
                        TERBITKAN SERTIFIKAT
                    </button>
                </div>
            </div>
        </div>

                {/* --- PROGRESS / DOWNLOAD OVERLAY --- */}
                <AnimatePresence>
                    {certProgress.status === 'processing' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-200 border border-white/20">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><RefreshCw size={120} className="animate-spin duration-slow" /></div>
                                <div className="space-y-1 relative z-10">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Processing Certification Vault</h4>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest opacity-80 italic">Generating encrypted student certificates in background corridor.</p>
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <span className="text-4xl font-black text-white italic tabular-nums">{certProgress.progress}%</span>
                                    <div className="h-2 w-32 bg-white/20 rounded-full overflow-hidden border border-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${certProgress.progress}%` }} className="h-full bg-white" /></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {certProgress.status === 'completed' && certProgress.download_url && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                             <div className="bg-emerald-600 rounded-xl p-6 text-white flex items-center justify-between shadow-xl shadow-emerald-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center"><ShieldCheck size={20} /></div>
                                    <span className="text-sm font-black uppercase italic tracking-tight">Certification Archive Ready.</span>
                                </div>
                                <a href={certProgress.download_url} target="_blank" rel="noopener noreferrer" className="h-10 px-6 bg-white text-emerald-600 border border-white/20 rounded-lg font-black text-[9px] flex items-center gap-3 uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all"><Download size={14} /> DOWNLOAD ARCHIVE (ZIP)</a>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- ANALYTICS --- */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricStrip label="Total Personnel" value={stats.total_students} icon={Users} />
                        <MetricStrip label="Graded Missions" value={stats.graded_count} icon={Activity} />
                        <MetricStrip label="Locked Vaults" value={stats.locked_count} icon={Lock} />
                        <MetricStrip label="Mean Performance" value={Number(stats.average_value ?? 0).toFixed(2)} icon={BarChart3} />
                    </div>
                )}

                {/* --- FILTERS & LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50/20 border-b border-slate-50 space-y-4">
                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} placeholder="CARI NIM / NAMA..." className="w-full h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-lg text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200 uppercase tracking-widest font-bold" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <select value={periodId} onChange={(e) => { setPeriodId(e.target.value); router.get(route('admin.grade-reports.index', { period_id: e.target.value })); }} className="h-10 bg-white border border-slate-100 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-emerald-500 min-w-[140px]">
                                    <option value="">SELECT SESSION</option>
                                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} disabled={!!lockedFaculty} className="h-10 bg-white border border-slate-100 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-emerald-500 min-w-[140px] disabled:opacity-50">
                                    <option value="">ALL FACULTIES</option>
                                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <select value={huruf} onChange={(e) => setHuruf(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-emerald-500 min-w-[100px]">
                                    <option value="">ALL GRADES</option>
                                    {['A','B','C','D','E'].map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-2">
                             <Button onClick={() => applyFilters()} className="h-9 px-6 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95">EXECUTE_FILTER</Button>
                             <div className="hidden sm:flex items-center gap-2 opacity-30 italic">
                                <Binary size={14} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Filter state synced with kernel</span>
                             </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Mahasiswa Node</th>
                                    <th className="px-6 py-4">Institutional Matrix</th>
                                    <th className="px-6 py-4">Deployment Squad</th>
                                    <th className="px-6 py-4 text-center">Score Vector</th>
                                    <th className="px-6 py-4 text-center">Protocol Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {scores?.map((grade) => (
                                    <tr key={grade.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 uppercase leading-none italic group-hover:text-emerald-700 transition-colors truncate max-w-[180px]">{grade.name}</span>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1 font-mono italic">NIM: {grade.nim}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase leading-none truncate max-w-[140px]">{grade.fakultas || 'NULL'}</span>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase italic mt-1 leading-none">{grade.prodi || 'UNSPECIFIED'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                             <span className="inline-flex h-6 items-center px-3 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest italic truncate max-w-[150px]">{grade.group_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-slate-900 font-mono tracking-tighter italic tabular-nums leading-none mb-1 group-hover:text-emerald-600 transition-colors">{grade.final_grade_value !== null ? Number(grade.final_grade_value).toFixed(2) : '0.00'}</span>
                                                <div className={clsx('h-6 px-3 flex items-center justify-center rounded-md font-black text-[9px] uppercase tracking-widest', grade.final_grade_letter === 'A' ? 'bg-emerald-600 text-white' : grade.final_grade_letter === 'B' ? 'bg-slate-100 text-emerald-600' : 'bg-slate-50 text-slate-200')}>{grade.final_grade_letter || 'NA'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className={clsx('inline-flex h-7 items-center px-4 rounded-full text-[8px] font-black tracking-widest italic border transition-all', grade.is_locked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100')}>
                                                {grade.is_locked ? 'AUDIT_SECURED' : 'DRAFT_STATE'}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                {grade.can_finalize && !grade.is_locked ? (
                                                    <Button onClick={() => handleFinalize(grade.score_id!)} className="h-8 px-4 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"><Lock size={12} /> EXECUTE_LOCK</Button>
                                                ) : <span className="text-[9px] font-bold text-slate-200 uppercase italic">{grade.is_locked ? 'LOCKED_BY_ADMIN' : 'WAITING_DATA'}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!scores || scores.length === 0) && (
                                    <tr><td colSpan={6} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Metadata buffer null.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Building2 size={200} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><ShieldCheck size={28} /></div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black uppercase tracking-tight leading-none">Immutable Grade Synchronization</h4>
                                <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest leading-relaxed max-w-xl">Rekapitulasi nilai adalah pusat verifikasi akhir keberhasilan KKN. Nilai yang difinalisasi bersifat permanen dan langsung diintegrasikan ke sertifikat akademik.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/40 italic"><Zap size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Integrity Enforced</span></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricStrip({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col relative z-20">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
