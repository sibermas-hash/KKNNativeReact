import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Calendar, 
    CheckCircle2, 
    FileText, 
    Filter, 
    LayoutGrid, 
    Search, 
    User, 
    ChevronRight,
    Clock,
    AlertCircle,
    ArrowRight,
    MapPin,
    Check
} from 'lucide-react';
import { clsx } from 'clsx';

interface Report {
    id: number;
    date: string;
    title: string;
    status: string;
    student: {
        name: string;
        nim: string;
    };
    group: {
        id: number;
        name: string;
    };
    ai_summary?: string;
    ai_analysis?: {
        summary: string;
        abcd_compliance: number;
        quality_score: number;
        feedback: string;
        tags: string[];
    };
}

interface Group {
    id: number;
    name: string;
    pending_count: number;
}

interface Props {
    reports: {
        data: Report[];
        links: Array<{ name: string; url?: string; icon?: LucideIcon }>;
        total: number;
    };
    groups: Group[];
    filters: {
        status?: string;
        kelompok_id?: string;
    };
}

export default function DailyReportIndex({ reports, groups, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [groupIdFilter, setGroupIdFilter] = useState(filters.kelompok_id || '');

    const handleFilterChange = (status: string, groupId: string) => {
        router.get(route('dpl.daily-reports.index'), { status, kelompok_id: groupId }, {
            preserveState: true,
            replace: true
        });
    };

    const statusColors: Record<string, string> = {
        submitted: 'bg-amber-50 text-amber-700 ring-amber-100',
        approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        revision: 'bg-rose-50 text-rose-700 ring-rose-100',
    };

    const statusLabels: Record<string, string> = {
        submitted: 'Selesai Daftar',
        approved: 'Disetujui',
        revision: 'Perlu Revisi',
    };

    return (
        <AppLayout title="Logbook Mahasisiswa">
            <Head title="Monitoring Logbook | DPL Dashboard" />

            <div className="max-w-[1600px] mx-auto space-y-8 pb-20 font-sans">
                {/* Header Section */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl" />
                    <div className="relative space-y-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-[10px] font-black uppercase tracking-widest ring-1 ring-emerald-200">
                             Monitoring Progres
                        </span>
                        <h1 className="text-4xl font-[900] text-gray-900 tracking-tight">Logbook Mahasiswa</h1>
                        <p className="text-gray-500 font-medium max-w-xl">Pantau dan verifikasi aktivitas harian mahasiswa bimbingan Bapak secara real-time.</p>
                    </div>
                    
                    <div className="relative flex items-center gap-4">
                        <button 
                            className="h-14 px-8 rounded-2xl bg-gray-900 text-white hover:bg-emerald-600 font-black text-sm transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
                            onClick={() => {
                                if(confirm(`Setujui seluruh laporan yang berstatus 'Selesai Daftar' (Antrian) untuk ${groupIdFilter ? 'kelompok ini' : 'semua kelompok Anda'}?`)) {
                                    router.post(route('dpl.daily-reports.approve-all'), {
                                        group_ids: groupIdFilter ? [parseInt(groupIdFilter)] : []
                                    });
                                }
                            }}
                        >
                            <Check size={18} strokeWidth={3} /> Verifikasi Massal
                        </button>
                    </div>
                </div>

                {/* Multi-Group Tabs (Workspace Per Desa) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 ml-4">
                        <MapPin size={16} className="text-gray-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Pilih Wilayah Bimbingan</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 px-2">
                        <button
                            onClick={() => { setGroupIdFilter(''); handleFilterChange(statusFilter, ''); }}
                            className={clsx(
                                "h-16 px-8 rounded-3xl font-black text-sm transition-all flex items-center gap-4 border-2",
                                groupIdFilter === '' 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200" 
                                    : "bg-white border-slate-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-600"
                            )}
                        >
                            <LayoutGrid size={20} /> Antrian Semua Desa
                        </button>
                        
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => { setGroupIdFilter(group.id.toString()); handleFilterChange(statusFilter, group.id.toString()); }}
                                className={clsx(
                                    "h-16 px-8 rounded-3xl font-black text-sm transition-all flex items-center gap-4 border-2 relative",
                                    groupIdFilter === group.id.toString()
                                        ? "bg-gray-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                                        : "bg-white border-slate-100 text-gray-600 hover:border-emerald-200 hover:text-emerald-600 shadow-sm"
                                )}
                            >
                                <div className={clsx(
                                    "p-2 rounded-xl shrink-0 transition-colors",
                                    groupIdFilter === group.id.toString() ? "bg-white/10 text-white" : "bg-slate-50 text-gray-400"
                                )}>
                                    <MapPin size={18} strokeWidth={2.5} />
                                </div>
                                <span className="truncate max-w-[150px]">{group.name}</span>
                                {group.pending_count > 0 && (
                                    <span className="absolute -top-2 -right-2 h-7 min-w-[28px] px-1.5 flex items-center justify-center bg-rose-500 text-white text-[11px] font-black rounded-full ring-4 ring-white shadow-lg animate-in zoom-in duration-300">
                                        {group.pending_count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters & Content Area */}
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                    <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="flex flex-wrap items-center gap-2">
                            {['', 'submitted', 'approved', 'revision'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); handleFilterChange(s, groupIdFilter); }}
                                    className={clsx(
                                        "h-10 px-6 rounded-xl text-xs font-black transition-all",
                                        statusFilter === s 
                                            ? "bg-gray-900 text-white shadow-lg" 
                                            : "bg-white text-gray-400 hover:text-gray-900 hover:bg-white/80 border border-slate-200"
                                    )}
                                >
                                    {s === '' ? 'Semua Status' : statusLabels[s]}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto">
                            <div className="pl-4 text-slate-300"><Search size={18} /></div>
                            <input 
                                type="text" 
                                placeholder="Cari nama mahasiswa..." 
                                className="h-10 border-none bg-transparent text-sm font-bold focus:ring-0 w-full md:w-64 placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu & Judul Kegiatan</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas Mahasiswa</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Wilayah / Desa</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">AI Audit</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reports.data.length > 0 ? reports.data.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center shrink-0">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{report.date.split(' ')[1]}</p>
                                                    <p className="text-sm font-black text-gray-900 leading-none">{report.date.split(' ')[0]}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-extrabold text-gray-900 line-clamp-1">{report.title}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                        <FileText size={12} /> Logbook Entry
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-gray-400 text-xs font-black shrink-0">
                                                    {report.student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{report.student.name}</p>
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{report.student.nim}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-gray-500 text-[10px] font-black uppercase ring-1 ring-slate-200">
                                                <MapPin size={10} strokeWidth={3} /> {report.group.name}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            {report.ai_analysis ? (
                                                <div className="flex flex-col items-center gap-1 group/ai cursor-help relative">
                                                    <div className={clsx(
                                                        "h-8 px-3 rounded-lg flex items-center gap-2 border-2 transition-all",
                                                        report.ai_analysis.abcd_compliance >= 8 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                        report.ai_analysis.abcd_compliance >= 5 ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                        "bg-rose-50 border-rose-100 text-rose-600"
                                                    )}>
                                                        <span className="text-[10px] font-black">{report.ai_analysis.abcd_compliance}/10</span>
                                                        <div className="w-[2px] h-3 bg-current opacity-20" />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">ABCD</span>
                                                    </div>
                                                    
                                                    {/* Tooltip Hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/ai:opacity-100 group-hover/ai:visible transition-all z-20 shadow-2xl">
                                                        <p className="font-black text-emerald-400 mb-1 uppercase tracking-widest">AI Audit Summary</p>
                                                        <p className="font-medium text-slate-300 leading-relaxed mb-2 line-clamp-3">
                                                            {report.ai_analysis.summary}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {report.ai_analysis.tags.slice(0, 2).map((tag, idx) => (
                                                                <span key={idx} className="px-1.5 py-0.5 bg-white/10 rounded-md text-white/50 lowercase">#{tag}</span>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest animate-pulse">Menghitung...</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1",
                                                statusColors[report.status]
                                            )}>
                                                <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[report.status].replace('text-', 'bg-').split(' ')[1])} />
                                                {statusLabels[report.status]}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <Link 
                                                href={route('dpl.daily-reports.show', report.id)}
                                                className="h-11 px-6 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 font-black text-xs transition-all inline-flex items-center gap-2 shadow-sm active:scale-95 group-hover:bg-emerald-50"
                                            >
                                                Periksa <ArrowRight size={14} strokeWidth={3} />
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                                    <Clock size={48} strokeWidth={1} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xl font-black text-slate-300 uppercase tracking-widest leading-none">Antrian Bersih</p>
                                                    <p className="text-sm font-bold text-slate-300">Tidak ada laporan pendaftaran yang menunggu untuk diperiksa.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Full Clean Style */}
                    {reports.total > 15 && (
                        <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Menampilkan <span className="text-gray-900 font-black">{reports.data.length}</span> dari <span className="text-gray-900 font-black">{reports.total}</span> Laporan
                            </p>
                            <div className="flex items-center gap-2">
                                {reports.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={clsx(
                                            "h-10 min-w-[40px] px-3 flex items-center justify-center rounded-xl text-xs font-black transition-all",
                                            link.active ? "bg-gray-900 text-white shadow-lg" : "bg-white border border-slate-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-600"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
