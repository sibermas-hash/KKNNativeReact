import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Search,
    Download,
    Lock,
    Unlock,
    ArrowRight,
    BarChart3,
    GraduationCap,
    Calculator,
    ShieldCheck,
    Cpu,
    TrendingUp,
    ScrollText,
    Database,
    Binary,
    Activity,
    Layers,
    SearchCheck,
    Fingerprint,
    Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Badge } from '@/Components/ui';

interface StudentGrade {
    id: number;
    nim: string;
    name: string;
    group_name: string;
    kelompok_id: number;
    final_grade_letter: string | null;
    final_grade_value: number | null;
    is_locked: boolean;
}

interface Props {
    scores: StudentGrade[];
    stats: {
        total_students: number;
        graded_count: number;
        locked_count: number;
        average_value: number;
    };
    filters: {
        search?: string;
        period_id?: number | string;
        faculty_id?: number | string;
        kelompok_id?: number | string;
        huruf?: string;
    };
}

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    index: number;
    trend?: string;
}

export default function RekapNilaiIndex({ scores, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/rekap-nilai', { search }, { preserveState: true });
    };

    const handleLock = (id: number) => {
        if (confirm('PROTOKOL_KEAMANAN: Apakah Anda yakin ingin memfinalisasi nilai personel ini?')) {
            router.patch(`/admin/rekap-nilai/${id}/finalisasi`, {}, {
                preserveScroll: true
            });
        }
    };

    const handleBulkLock = () => {
        if (confirm('OTORISASI_MASSAL: Kunci seluruh nilai yang telah terinput pada periode aktif ini?')) {
            router.post('/admin/rekap-nilai/finalisasi-massal', { period_id: filters.period_id });
        }
    };

    const handleExportLedger = () => {
        const url = `/admin/rekap-nilai/ekspor-ledger?period_id=${filters.period_id || ''}&faculty_id=${filters.faculty_id || ''}`;
        window.location.href = url;
    };

    return (
        <AppLayout title="Academic Grade Aggregator">
            <Head title="Rekapitulasi Nilai" />

            <div className="space-y-10 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic">ACADEMIC_RECAP_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <GraduationCap className="w-10 h-10 text-emerald-600" />
                            REKAP NILAI <span className="text-emerald-600">MAHASISWA</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Konsolidasi metrik evaluasi akademik dan finalisasi ledger nilai secara global.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Rata-rata Global</span>
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{stats.average_value.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-slate-800 relative z-10" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Unit Tervalidasi</span>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{stats.locked_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="DATA_SET_IDENTITIES" value={stats.total_students} icon={Users} index={0} trend="+12% Capacity" />
                    <StatCard label="CONSOLIDATED_SCORES" value={stats.graded_count} icon={Calculator} index={1} trend="Synced" />
                    <StatCard label="SECURITY_FINALIZED" value={stats.locked_count} icon={Lock} index={2} trend="Encrypted" />
                    <StatCard label="AGGREGATED_INDEX" value={stats.average_value.toFixed(1)} icon={BarChart3} index={3} trend="Stable" />
                </div>

                {/* Ops Control Deck */}
                <div className="flex flex-col 2xl:flex-row gap-6 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full max-w-3xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-emerald-600 transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="CARI_PERSONEL (NIM / NAMA / KELOMPOK)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-20 pl-16 pr-8 bg-white border border-slate-200 rounded-[2.5rem] text-sm font-black italic tracking-tight text-slate-950 placeholder:text-slate-200 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                        />
                    </form>

                    <div className="flex flex-wrap gap-4 w-full 2xl:w-auto">
                        <button
                            onClick={handleBulkLock}
                            className="h-20 px-10 bg-slate-950 text-emerald-500 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-600 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group border border-slate-800"
                        >
                            <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            MASAL_FINALISASI_DATABASE
                        </button>
                        <button
                            onClick={handleExportLedger}
                            className="h-20 px-10 bg-white border border-slate-200 text-slate-950 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] italic hover:border-emerald-500 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-4 group"
                        >
                            <Download className="w-5 h-5 text-emerald-600" />
                            EKSPOR_ACADEMIC_LEDGER
                        </button>
                        <button
                            onClick={() => {
                                const url = `/admin/certificates/bulk-download?period_id=${filters.period_id || ''}&faculty_id=${filters.faculty_id || ''}`;
                                window.location.href = url;
                            }}
                            className="h-20 px-10 bg-emerald-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group"
                        >
                            <ScrollText className="w-5 h-5" />
                            MASS_CERTIFICATE_GEN
                        </button>
                    </div>
                </div>

                {/* Main Data Engine */}
                <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative group/table">
                    <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)]">
                                <ScrollText className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">REKAPITULASI_DATA_OTORITAS</h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Sistem sinkronisasi ledger akademik v4.1.0</p>
                            </div>
                        </div>
                        <Badge variant="success" className="px-6 py-2.5 bg-slate-950 text-emerald-500 border-none italic font-black text-[10px] tracking-[0.3em] shadow-lg">
                            DB_STATE: SYNCHRONIZED
                        </Badge>
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Identity Descriptor</th>
                                    <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Unit Sector</th>
                                    <th className="px-12 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Grade Vector</th>
                                    <th className="px-12 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Audit State</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic pr-16">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {scores.length > 0 ? scores.map((grade, idx) => (
                                    <motion.tr 
                                        key={grade.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="group/row hover:bg-slate-50/50 transition-all cursor-default"
                                    >
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-[1.8rem] bg-slate-950 text-emerald-500 border border-slate-800 flex items-center justify-center font-black text-xl italic group-hover/row:scale-110 group-hover/row:rotate-6 transition-all shadow-xl">
                                                    {grade.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-black text-slate-950 group-hover/row:text-emerald-700 transition-colors uppercase italic tracking-tighter truncate leading-tight">{grade.name}</span>
                                                    <span className="text-[10px] font-black text-slate-400 italic mt-1 uppercase tracking-widest">UNIT_NIM: {grade.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm group-hover/row:border-emerald-500/20 transition-all">
                                                <Layers className="w-4 h-4 text-emerald-500/50" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">{grade.group_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={clsx(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-inner border transition-all",
                                                    grade.final_grade_letter ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover/row:scale-125 group-hover/row:bg-emerald-600 group-hover/row:text-white" : "bg-slate-50 text-slate-200 border-slate-100"
                                                )}>
                                                    {grade.final_grade_letter || '---'}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 italic uppercase tabular-nums tracking-tighter">IDX: {grade.final_grade_value ? grade.final_grade_value.toFixed(2) : '0.00'}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <Badge 
                                                variant={grade.is_locked ? 'success' : 'warning'} 
                                                className="px-6 py-2.5 rounded-xl italic font-black text-[9px] uppercase tracking-[0.2em] shadow-sm min-w-[140px] border-none"
                                            >
                                                {grade.is_locked ? 'IDENTITY_LOCKED' : 'DRAFT_STATE'}
                                            </Badge>
                                        </td>
                                        <td className="px-12 py-8 text-right pr-16">
                                            <div className="flex justify-end gap-3 scale-110">
                                                {!grade.is_locked ? (
                                                    <button
                                                        onClick={() => handleLock(grade.id)}
                                                        className="h-12 w-12 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-[1.2rem] transition-all shadow-xl flex items-center justify-center active:scale-90"
                                                        title="Finalisasi Nilai"
                                                    >
                                                        <Unlock className="w-5 h-5 font-black" />
                                                    </button>
                                                ) : (
                                                    <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shadow-lg opacity-60">
                                                        <Lock className="w-5 h-5" />
                                                    </div>
                                                )}
                                                {grade.is_locked && (
                                                    <a 
                                                        href={`/certificates/${grade.id}/download`}
                                                        target="_blank"
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-600/30 rounded-[1.2rem] transition-all shadow-xl flex items-center justify-center active:scale-90"
                                                        title="Unduh Sertifikat"
                                                    >
                                                        <ScrollText className="w-5 h-5" />
                                                    </a>
                                                )}
                                                <Link 
                                                    href={`/admin/kelompok/${grade.kelompok_id}`}
                                                    className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-600/30 rounded-[1.2rem] transition-all shadow-xl flex items-center justify-center active:scale-90 group/btn"
                                                    title="Lihat Detail Kelompok"
                                                >
                                                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                                </Link>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-48 text-center">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="p-10 bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed animate-pulse">
                                                    <Binary className="h-24 w-24 text-slate-200" />
                                                </div>
                                                <p className="font-black text-slate-300 tracking-[0.4em] italic uppercase text-xs">NO_ACADEMIC_DRIVES_DETECTED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Operational Analytics Monitor */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 relative overflow-hidden group shadow-3xl">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.15),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-bounce-slow" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase">Security_Protocol: Grade_Integrity</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Seluruh mutasi data yang terjadi pada ledger nilai akan direkam dalam log audit sistem untuk forensik keamanan akademik. <br/>
                                        <span className="text-emerald-500 underline underline-offset-8 decoration-emerald-500/20">Status: Verifikasi_Aktif_256bit</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-slate-700 opacity-50 hover:opacity-100 transition-opacity">
                            {[Fingerprint, Cpu, SearchCheck, Activity].map((Icon, i) => (
                                <Icon key={i} className="h-10 w-10 hover:text-emerald-500 transition-all cursor-help" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                     <div className="inline-flex items-center justify-center gap-5 text-slate-400 font-black text-[11px] uppercase tracking-[0.6em] italic opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                         <Database className="w-4 h-4 text-emerald-600" />
                         CORE_ACADEMIC_RECAP_UNIT • INTEGRITY_VERIFIED • {new Date().getFullYear()}
                     </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon, index, trend }: StatCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-10 rounded-[3rem] border border-slate-200 flex flex-col gap-8 group hover:border-emerald-500 transition-all shadow-sm hover:shadow-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Icon size={120} />
            </div>
            <div className="flex items-center justify-between relative z-10">
                <div className="p-5 bg-slate-50 rounded-[1.5rem] text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner border border-slate-100 group-hover:border-emerald-500">
                    <Icon className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">{trend}</span>
                    <div className="h-1 w-8 bg-emerald-100 rounded-full mt-1 group-hover:w-16 transition-all" />
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-slate-950 italic tracking-tighter leading-none">{value || 0}</p>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                </div>
            </div>
        </motion.div>
    );
}
