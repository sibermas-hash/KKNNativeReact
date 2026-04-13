import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Button, Pagination } from '@/Components/ui';
import { 
    FileText, 
    Download, 
    Search, 
    Filter, 
    Layers, 
    Activity, 
    FileCheck,
    Cpu,
    Target,
    BookOpen,
    ArrowUpRight,
    ArrowRight,
    MoreVertical,
    FileSearch,
    ShieldCheck,
    Archive,
    Zap,
    RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from '@/types';
import { clsx } from 'clsx';

interface ReportRow {
    id: number; title: string; type: string; status: string; file_name: string; submitted_at: string | null; user: { name: string; }; group: { name: string; village: string; };
}
interface Props { reports: { data: ReportRow[]; meta?: Record<string, any>; }; summary: { total_reports: number; pending_review: number; }; }

const typeLabels: Record<string, string> = {
    final_report: 'LAPORAN_AKHIR', book_anthology: 'ANTOLOGI_KKN', scholarly_article: 'ARTIKEL_PENGABDIAN', village_map: 'PETA_ASET_DESA', video_documentation: 'DOKUMENTASI_VIDEO', photo_documentation: 'DOKUMENTASI_FOTO', attendance_sheet: 'DAFTAR_HADIR', activity_proposal: 'PROPOSAL_DESIGN', evaluation_report: 'EVALUASI_REFLEKSI',
};

export default function ReportsIndex({ reports, summary }: Props) {
    const [search, setSearch] = useState('');

    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return reports.data;
        return reports.data.filter((report) => {
            const haystack = [report.title, report.type, report.user.name, report.group.name, report.group.village, report.file_name].join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [reports.data, search]);

    return (
        <AppLayout title="Academic Assets">
            <Head title="Pustaka Laporan | SIKKKN" />

            <div className="space-y-4 font-sans text-slate-900">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-base font-black tracking-tight uppercase italic leading-none">Research Component Manifest</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Node / Digital Asset Vault</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-10 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-3">
                            <Archive size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic tabular-nums">{summary.total_reports} Global Assets</span>
                         </div>
                         <div className="h-10 px-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3">
                            <Activity size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 italic tabular-nums">{summary.pending_review} AWAITING_AUDIT</span>
                         </div>
                    </div>
                </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <AssetMetric label="Vault Status" value="ONLINE_SYNC" icon={Zap} />
                    <AssetMetric label="IOPS Status" value="LATENCY_LOW" icon={Activity} />
                    <AssetMetric label="Storage" value="vLIB 2.0" icon={Cpu} />
                    <AssetMetric label="Security" value="SIGNED_OFF" icon={ShieldCheck} />
                </div>

                {/* --- LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                            <Layers size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Research Component Manifest</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="relative w-full md:w-64 group">
                                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-8 pl-8 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:bg-white outline-none transition-all uppercase" placeholder="SEARCH IDENTIFIER..." />
                            </div>
                            <Button className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm shadow-emerald-100">
                                <Filter size={12} /> Filter
                            </Button>
                         </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Asset Identification</th>
                                    <th className="px-6 py-4 text-center">Unit Oversight</th>
                                    <th className="px-6 py-4 text-center">Territory Node</th>
                                    <th className="px-6 py-4 text-center">Integritas Status</th>
                                    <th className="px-6 py-4 text-right">Binary Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"><FileText size={18} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight uppercase italic">{report.title}</span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">{report.file_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{report.user.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{report.group.name}</span>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{report.group.village}</span>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{typeLabels[report.type] || report.type}</span>
                                                <StatusBadge status={report.status} className="scale-75 origin-top" />
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <Link href={`/admin/laporan/${report.id}/unduh`} className="h-8 px-4 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"><Download size={12} /> Inject_Asset</Link>
                                                <button className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-sm"><MoreVertical size={14} /></button>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReports.length === 0 && (
                                    <tr><td colSpan={5} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Library buffer null. Scan keyword missing.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Transmission Nominal • Database Synced.</span>
                        {reports.meta && <Pagination meta={reports.meta} />}
                    </div>
                </section>

                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><BookOpen size={350} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md text-white"><ShieldCheck size={48} strokeWidth={1.5} /></div>
                            <div className="space-y-3">
                                <h4 className="text-2xl font-black uppercase tracking-tight leading-none italic text-white">Academic Asset Oversight</h4>
                                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl italic opacity-80">Seluruh berkas yang terunggah melewati protokol verifikasi integritas data berlapis untuk akuntabilitas operasional UIN Saizu. Arsip digital ini merupakan aset intelektual publik.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AssetMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
