import { useState } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    FileText,
    Search,
    RefreshCw,
    Download,
    CheckCircle2,
    Lock,
    Unlock,
    Filter,
    ArrowRight,
    BarChart3,
    GraduationCap,
    Calculator,
    ShieldCheck,
    Cpu,
    Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface StudentGrade {
    id: number;
    nim: string;
    name: string;
    group_name: string;
    final_grade_letter: string | null;
    final_grade_value: number | null;
    is_locked: boolean;
}

interface Props {
    grades: {
        data: StudentGrade[];
        meta: any;
    };
    stats: {
        total_students: number;
        graded_count: number;
        locked_count: number;
        average_value: number;
    };
    filters: {
        search?: string;
        group_id?: string;
    };
}

export default function RekapNilaiIndex({ grades, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.rekap-nilai.index'), { search }, { preserveState: true });
    };

    const handleLock = (id: number) => {
        if (confirm('Apakah Anda yakin ingin mengunci nilai ini? Nilai yang dikunci tidak dapat diubah oleh personel bimbingan.')) {
            router.patch(route('admin.rekap-nilai.lock', id));
        }
    };

    const handleBulkLock = () => {
        if (confirm('KONFIRMASI_AUDIT: Kunci seluruh nilai yang telah terinput pada periode ini?')) {
            router.post(route('admin.rekap-nilai.bulk-lock'));
        }
    };

    return (
        <AppLayout title="Rekapitulasi Nilai">
            <Head title="Agregator Nilai Peserta" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agregator Nilai Peserta</h1>
                        <p className="text-sm text-slate-500 mt-1">Konsolidasi dan verifikasi hasil evaluasi akademik seluruh unit operasional.</p>
                    </div>
                </div>

                {/* Analytical Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="TOTAL_CANDIDATES" value={stats.total_students} icon={GraduationCap} color="primary" description="PESERTA" />
                    <StatCard label="GRADED_LEDGER" value={stats.graded_count} icon={Calculator} color="emerald" description="TERINPUT" />
                    <StatCard label="LOCKED_RECORDS" value={stats.locked_count} icon={Lock} color="amber" description="DIVERIFIKASI" />
                    <StatCard label="AGGREGATED_AVG" value={stats.average_value.toFixed(1)} icon={BarChart3} color="primary" description="MEAN_SCORE" />
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="SEARCH_GRADE_LEDGER (NIP / NAME / UNIT)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500"
                        />
                    </form>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <button
                            onClick={handleBulkLock}
                            className="flex-1 xl:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold uppercase italic tracking-widest text-[10px] shadow-2xl shadow-slate-900/40 active:scale-95 transition-all hover:bg-emerald-600 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Finalize_All_Records
                        </button>
                        <button className="flex-1 xl:w-auto px-8 py-3.5 bg-white border border-slate-100 text-slate-900 rounded-xl font-bold uppercase italic tracking-widest text-[10px] shadow-sm active:scale-95 transition-all hover:bg-slate-50 flex items-center justify-center gap-3">
                            <Download className="w-4 h-4 text-emerald-600" />
                            Export_Audit_Format
                        </button>
                    </div>
                </div>

                {/* Grade Listing Ledger (Table) */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden relative group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase italic tracking-widest">PERSONNEL_IDENTITY</th>
                                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase italic tracking-widest">ASSIGNED_UNIT</th>
                                    <th className="px-8 py-6 text-center text-[9px] font-black text-slate-400 uppercase italic tracking-widest">GRADE_METRIC</th>
                                    <th className="px-8 py-6 text-center text-[9px] font-black text-slate-400 uppercase italic tracking-widest">STATUS_GOVERNANCE</th>
                                    <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase italic tracking-widest">OPERATIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {grades.data.length > 0 ? grades.data.map((grade) => (
                                    <tr key={grade.id} className="group/row hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 text-primary text-[11px] font-black flex items-center justify-center italic shadow-lg group-hover/row:scale-110 transition-transform">
                                                    {grade.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5 truncate max-w-[200px] group-hover/row:text-primary transition-colors">{grade.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest opacity-50 font-mono">#{grade.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{grade.group_name}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={clsx(
                                                    "text-lg font-black italic italic tracking-tighter leading-none",
                                                    grade.final_grade_letter ? "text-emerald-600" : "text-slate-200"
                                                )}>
                                                    {grade.final_grade_letter || 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase italic tracking-widest opacity-50 italic">VAL: {grade.final_grade_value || '0.0'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={clsx(
                                                "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest shadow-sm border",
                                                grade.is_locked ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {grade.is_locked ? 'VERIFIED_RECORD' : 'AWAITING_LOCK'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 translate-x-2 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all">
                                                {!grade.is_locked ? (
                                                    <button
                                                        onClick={() => handleLock(grade.id)}
                                                        className="p-3 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                                                    >
                                                        <Unlock className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <Link 
                                                    href={route('admin.groups.show', grade.id)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/40 rounded-xl transition-all shadow-sm"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20 italic">
                                                <FileText className="h-12 w-12 text-slate-900" />
                                                <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-[0.4em]">NO_ACADEMIC_RECORDS_REPORTED</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={grades.meta} />
                </div>

                {/* Tactical Verification Footer Monitor */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden group shadow-xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white italic tracking-widest uppercase leading-none">GRADE_GOVERNANCE_PROTOCOL_V3.2</h4>
                                    <p className="text-[10px] font-bold text-emerald-500 italic mt-2 uppercase">STATUS: SYSTEM_WIDE_VERIFICATION_ACTIVE</p>
                                </div>
                            </div>
                            <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75 uppercase">
                                Protokol Verifikasi: Seluruh nilai yang telah dikunci akan terintegrasi secara otomatis ke dalam sistem transkrip kedaulatan data akademik. Pastikan audit internal telah terpenuhi.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
                                <span className="text-[9px] font-black text-slate-100 uppercase italic tracking-widest">GOVERNANCE_SYNC_ACTIVE</span>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                                    <Zap className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, description }: any) {
    const colors: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10',
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    }

    return (
        <div className="bg-white p-8 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg shadow-slate-200/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-slate-900 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform">
                <Icon className="h-32 w-32" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest mb-1 group-hover:text-primary transition-colors">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black italic tracking-tighter leading-none text-slate-900 transition-transform group-hover:translate-x-1">{value}</p>
                    <span className="text-[8px] font-bold text-slate-300 uppercase italic tracking-widest">{description}</span>
                </div>
            </div>
            <div className={clsx('p-4 rounded-2xl border transition-all group-hover:rotate-12 shadow-sm', colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    )
}
