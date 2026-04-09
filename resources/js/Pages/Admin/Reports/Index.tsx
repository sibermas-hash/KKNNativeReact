import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
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
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ReportRow {
    id: number;
    title: string;
    type: string;
    status: string;
    file_name: string;
    submitted_at: string | null;
    user: {
        name: string;
    };
    group: {
        name: string;
        village: string;
    };
}

interface Props {
    reports: {
        data: ReportRow[];
    };
    summary: {
        total_reports: number;
        pending_review: number;
    };
}

const typeLabels: Record<string, string> = {
    final_report: 'Laporan Akhir',
    village_map: 'Peta Desa',
    video_documentation: 'Dokumentasi Video',
    photo_documentation: 'Dokumentasi Foto',
    attendance_sheet: 'Daftar Hadir',
    activity_proposal: 'Rancangan Kegiatan',
    evaluation_report: 'Laporan Evaluasi',
};

export default function ReportsIndex({ reports, summary }: Props) {
    const [search, setSearch] = useState('');

    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return reports.data;
        }

        return reports.data.filter((report) => {
            const haystack = [
                report.title,
                report.type,
                report.user.name,
                report.group.name,
                report.group.village,
                report.file_name,
            ]
            .join(' ')
            .toLowerCase();

            return haystack.includes(keyword);
        });
    }, [reports.data, search]);

    return (
        <AppLayout title="PUSTAKA LAPORAN">
            <Head title="Manajemen Berkas | KKN UIN" />

            <div className="space-y-12 pb-20">
                {/* --- HEADER STATS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                    <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl flex items-center justify-between group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
                             <Layers size={200} className="text-emerald-600" />
                         </div>
                         <div className="space-y-4 relative z-10">
                             <div className="flex items-center gap-4">
                                 <div className="h-4 w-4 bg-emerald-600 rounded-full animate-pulse shadow-xl shadow-emerald-500/20" />
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] italic leading-none">Total berkas</p>
                             </div>
                             <p className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{summary.total_reports}</p>
                         </div>
                         <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-100/5 relative z-10 group-hover:scale-110 transition-transform">
                             <Cpu size={32} />
                         </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl flex items-center justify-between group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity -rotate-12 group-hover:rotate-0 duration-1000">
                             <Activity size={200} className="text-amber-600" />
                         </div>
                         <div className="space-y-4 relative z-10">
                              <div className="flex items-center gap-4">
                                 <div className="h-4 w-4 bg-amber-500 rounded-full animate-[bounce_2s_infinite] shadow-xl shadow-amber-500/20" />
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] italic leading-none">Menunggu tinjauan</p>
                              </div>
                             <p className="text-6xl font-black text-amber-600 tracking-tighter italic leading-none">{summary.pending_review}</p>
                         </div>
                         <div className="h-20 w-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center border border-amber-100 shadow-xl shadow-amber-100/5 relative z-10 group-hover:scale-110 transition-transform">
                             <Activity size={32} />
                         </div>
                    </div>
                </div>

                {/* --- OPERATIONS --- */}
                <div className="flex flex-col xl:flex-row gap-6 items-center justify-between px-2">
                    <div className="relative w-full xl:max-w-4xl group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari judul, NIM, atau lokasi"
                            className="w-full h-20 pl-20 pr-10 bg-white border border-slate-100 rounded-[1.8rem] text-sm font-black text-slate-900 placeholder:text-slate-200 placeholder:italic focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 uppercase tracking-widest transition-all shadow-xl"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <button className="flex-1 xl:w-auto h-20 px-12 bg-slate-900 text-white rounded-[1.8rem] font-black text-[11px] tracking-[0.2em] uppercase italic flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/10 active:scale-95 group">
                            <Filter className="w-5 h-5 opacity-40 group-hover:rotate-90 transition-transform" />
                            Filter lanjutan
                        </button>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-50 overflow-hidden">
                        <div className="h-full w-1/4 bg-emerald-500 animate-[loading_5s_infinite]" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50 font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 italic">
                                    <th className="px-12 py-10">Metode & Identitas Berkas</th>
                                    <th className="px-10 py-10 text-center">Otoritas Pengunggah</th>
                                    <th className="px-10 py-10 text-center">Unit Lokasi</th>
                                    <th className="px-10 py-10 text-center">Integritas Berkas</th>
                                    <th className="px-10 py-10 text-right pr-14">Aksi Kontrol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <tr key={report.id} className="group/row hover:bg-emerald-50/20 transition-all duration-300">
                                            <td className="px-12 py-10">
                                                <div className="flex items-start gap-6">
                                                    <div className="p-4 bg-slate-50 text-slate-300 rounded-[1.2rem] group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex flex-col space-y-2">
                                                        <h4 className="text-base font-black text-slate-900 uppercase italic tracking-tighter group-hover/row:text-emerald-700 transition-colors leading-tight">{report.title}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{report.file_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest italic">{report.user.name}</span>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-xs font-black text-slate-900 uppercase italic tracking-[0.2em]">{report.group.name}</p>
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                                                         <Target size={10} />
                                                         <span className="text-[9px] font-bold uppercase tracking-widest italic">{report.group.village}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{typeLabels[report.type] || report.type}</span>
                                                    <StatusBadge status={report.status} />
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right pr-14">
                                                <div className="flex items-center justify-end gap-3 opacity-30 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-500">
                                                    <Link
                                                        href={`/admin/laporan/${report.id}/unduh`}
                                                        className="inline-flex h-14 px-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest italic hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all active:scale-95 gap-3 shadow-sm hover:shadow-xl hover:shadow-emerald-600/20 shadow-slate-100"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Unduh berkas
                                                    </Link>
                                                    <button className="h-14 w-14 bg-white border border-slate-100 text-slate-300 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all hover:shadow-xl">
                                                         <MoreVertical size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-32 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-10">
                                                <FileSearch className="w-24 h-24 text-slate-400" />
                                                <p className="text-xl font-black text-slate-400 uppercase tracking-[0.5em] italic">Belum ada arsip laporan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- AUDIT FOOTER --- */}
                <div className="bg-slate-900 rounded-[2.5rem] p-12 lg:p-16 flex flex-col md:flex-row md:items-center justify-between gap-12 shadow-2xl relative overflow-hidden group/footer">
                    <div className="absolute top-0 right-0 p-40 opacity-[0.03] group-hover/footer:opacity-[0.08] transition-opacity rotate-45 pointer-events-none">
                         <ShieldCheck size={300} className="text-white" />
                    </div>
                    
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 flex items-center justify-center text-emerald-400 shadow-2xl">
                            <BookOpen size={40} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-xl font-black text-white uppercase italic tracking-widest leading-none">Protokol Verifikasi Akademik</h4>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.2em] leading-relaxed italic max-w-xl opacity-60 group-hover/footer:opacity-100 transition-opacity">Seluruh berkas yang terunggah melewati protokol verifikasi integritas data <br className="hidden md:block"/> berlapis untuk akuntabilitas operasional UIN Saizu.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 relative z-10">
                         <div className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic shadow-xl shadow-emerald-900/50 group-hover/footer:scale-105 transition-transform">
                             Arsip aktif
                         </div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-40">ID sesi: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}} />
        </AppLayout>
    );
}
