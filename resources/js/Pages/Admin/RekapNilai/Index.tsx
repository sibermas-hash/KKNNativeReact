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
        if (confirm('Apakah Anda yakin ingin mengunci nilai ini? Nilai yang dikunci tidak dapat diubah oleh pembimbing.')) {
            router.patch(route('admin.rekap-nilai.lock', id));
        }
    };

    const handleBulkLock = () => {
        if (confirm('Apakah Anda yakin ingin mengunci seluruh nilai yang telah terinput pada periode ini?')) {
            router.post(route('admin.rekap-nilai.bulk-lock'));
        }
    };

    return (
        <AppLayout title="Rekapitulasi Nilai">
            <Head title="Agregator Nilai" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapitulasi Nilai</h1>
                        <p className="text-sm text-slate-500 mt-1">Konsolidasi dan verifikasi hasil evaluasi akademik mahasiswa KKN.</p>
                    </div>
                </div>

                {/* Analytical Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Mahasiswa" value={stats.total_students} icon={GraduationCap} color="emerald" />
                    <StatCard label="Nilai Terinput" value={stats.graded_count} icon={Calculator} color="slate" />
                    <StatCard label="Terverifikasi" value={stats.locked_count} icon={Lock} color="amber" />
                    <StatCard label="Rata-rata Nilai" value={stats.average_value.toFixed(1)} icon={BarChart3} color="emerald" />
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="Cari NIM, Nama, atau Kelompok..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500 italic"
                        />
                    </form>

                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <button
                            onClick={handleBulkLock}
                            className="flex-1 xl:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xl shadow-slate-900/10 transition-all hover:bg-emerald-600 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Kunci Semua Nilai
                        </button>
                        <button className="flex-1 xl:w-auto px-6 py-3.5 bg-white border border-slate-100 text-slate-900 rounded-xl font-bold text-xs shadow-sm shadow-slate-100/5 transition-all hover:bg-slate-50 flex items-center justify-center gap-3">
                            <Download className="w-4 h-4 text-emerald-600" />
                            Ekspor Ledger
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas Mahasiswa</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Kelompok</th>
                                    <th className="px-8 py-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Metrik Nilai</th>
                                    <th className="px-8 py-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status Audit</th>
                                    <th className="px-8 py-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-12">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {grades.data.length > 0 ? grades.data.map((grade) => (
                                    <tr key={grade.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-primary font-bold text-sm italic shadow-lg  transition-transform">
                                                    {grade.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900  transition-colors truncate max-w-[200px]  mb-1.5">{grade.name}</span>
                                                    <span className="text-sm font-bold text-slate-400 italic">#{grade.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-500 uppercase italic tracking-wider">{grade.group_name}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={clsx(
                                                    "text-lg font-black italic",
                                                    grade.final_grade_letter ? "text-emerald-600" : "text-slate-200"
                                                )}>
                                                    {grade.final_grade_letter || '---'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-300 italic opacity-50 truncate">VAL: {grade.final_grade_value || '0.0'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex justify-center">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight shadow-sm border",
                                                    grade.is_locked ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                    {grade.is_locked ? 'Terkunci' : 'Draft'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right pr-12">
                                            <div className="flex justify-end gap-3 translate-x-2 opacity-0   transition-all">
                                                {!grade.is_locked ? (
                                                    <button
                                                        onClick={() => handleLock(grade.id)}
                                                        className="p-2.5 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                        title="Kunci Nilai"
                                                    >
                                                        <Unlock className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg shadow-sm shadow-emerald-500/10">
                                                        <Lock className="w-4 h-4 shadow-sm" />
                                                    </div>
                                                )}
                                                <Link 
                                                    href={route('admin.groups.show', grade.id)}
                                                    className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 rounded-lg transition-all shadow-sm"
                                                    title="Lihat Detail Group"
                                                >
                                                    <ArrowRight className="w-4 h-4 shadow-sm" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center opacity-20 italic">
                                            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-900" />
                                            <p className="font-bold text-slate-900 tracking-widest ">NO_ACADEMIC_REPORTS_DETECTED</p>
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

                {/* Info Box */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="space-y-3">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                <h4 className="text-sm font-bold text-white uppercase italic tracking-widest">Protocol Integrity Audit</h4>
                            </div>
                            <p className="text-sm text-slate-400 font-medium  max-w-4xl opacity-75 italic">
                                Nilai yang terkunci akan diintegrasikan secara otomatis ke dalam kanal transkrip akademik universitas. Pastikan seluruh input evaluasi dosen pembimbing telah terverifikasi secara internal.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-emerald-500 text-xs font-bold">
                                GOVERNANCE_OK
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    }

    return (
        <div className="bg-white p-8 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-emerald-300 transition-all shadow-sm">
            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 mb-1  transition-colors uppercase italic tracking-widest">{label}</p>
                <p className="text-3xl font-bold text-slate-900 italic tracking-tighter transition-transform  || 0}</p>
            </div>
            <div className={clsx('p-4 rounded-xl border transition-all  colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    )
}
