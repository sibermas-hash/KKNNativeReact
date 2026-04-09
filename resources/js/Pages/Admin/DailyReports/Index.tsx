import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Filter,
    IdCard,
    List,
    ShieldCheck,
    Calendar,
    Activity,
    Search,
    Fingerprint,
    Cpu,
    SearchCheck,
    Database,
    ChevronRight,
    Clock,
    Binary,
    Zap,
    LayoutDashboard,
    Layers,
    UserCheck,
    ClipboardList,
    Flag,
    FileSearch,
    Key,
    Target,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
    filters: { status?: string; search?: string };
}

function statusLabel(status: string): string {
    const s = status.toLowerCase();
    if (s === 'disetujui' || s === 'approved') return 'TERVERIFIKASI';
    if (s === 'revisi' || s === 'revision') return 'REVISI OPS';
    if (s === 'draf' || s === 'draft') return 'DRAF PEMBUATAN';
    return 'DIAJUKAN SISTEM';
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || status !== (filters.status || '')) {
                router.get('/admin/laporan/harian', { search, status }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, status]);

    return (
        <AppLayout title="Monitoring Laporan Harian Mahasiswa">
            <Head title="Logbook Aktivitas | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS LOGBOOK HARIAN */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Activity Monitoring & Audit Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            LOGBOOK <span className="text-emerald-500">AKTIVITAS HARIAN</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <FileSearch size={12} className="text-emerald-500" />
                             Otorisasi aktivitas lapangan, verifikasi narasi operasional, dan audit integritas data real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">TOTAL LOGS</span>
                               <div className="flex items-center gap-3">
                                   <ClipboardList size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{(reports.data ?? []).length} ENTITAS</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* OPERATIONS TOOLBAR TACTICAL */}
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-8 bg-emerald-50/5 p-2 shadow-inner border border-emerald-50">
                        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="search"
                                    placeholder="CARI IDENTITAS MAHASISWA ATAU NARASI KEGIATAN..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-18 pl-16 pr-8 bg-white border border-emerald-50 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="relative group w-full md:max-w-sm">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Filter size={14} className="text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full h-18 pl-16 pr-12 bg-white border border-emerald-50 text-[10px] font-black italic text-emerald-950 focus:border-emerald-500 outline-none transition-all shadow-inner appearance-none uppercase tracking-widest"
                                >
                                    <option value="">SEMUA STATUS VERIFIKASI</option>
                                    <option value="submitted">STATUS: DIAJUKAN</option>
                                    <option value="disetujui">STATUS: TERVERIFIKASI</option>
                                    <option value="revisi">STATUS: REVISI OPS</option>
                                    <option value="draf">STATUS: DRAF PEMBUATAN</option>
                                </select>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        <div className="hidden xl:flex items-center gap-6 border-l border-emerald-50 pl-8 opacity-40 hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest italic">REAL-TIME DATA FEED</span>
                                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] italic mt-1">SINKRONISASI AKTIF</span>
                            </div>
                            <div className="h-10 w-10 bg-emerald-950 text-emerald-400 flex items-center justify-center shadow-lg">
                                <Activity size={18} className="animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* TACTICAL LEDGER TABLE */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                        <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Operational Activity Ledger</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Registry Aktivitas Harian Unit Mahasiswa</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase italic tracking-widest border border-emerald-100 shadow-inner">
                                MONITORING STATUS VERIFIKASI
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/10 border-b border-emerald-100">
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">TANGGAL OPS</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">NARASI KEGIATAN</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">IDENTITAS PERSONEL</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">OKUPANSI UNIT</th>
                                        <th className="px-10 py-5 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest italic pr-12">STATUS VERIFIKASI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {(reports.data ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-56 text-center">
                                                <div className="inline-flex flex-col items-center gap-6 opacity-20 capitalize">
                                                    <Activity size={64} strokeWidth={1} className="text-emerald-950" />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                        DATABASE AKTIVITAS KOSONG
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        (reports.data ?? []).map((report) => (
                                            <tr key={report.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-12 w-12 bg-white border border-emerald-100 text-emerald-200 flex items-center justify-center shadow-sm group-hover/row:bg-emerald-950 group-hover/row:text-white transition-all">
                                                            <Calendar size={18} strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-[12px] font-black text-emerald-950 uppercase tracking-tighter tabular-nums italic leading-none truncate">
                                                            {report.date.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight italic group-hover/row:text-emerald-600 transition-colors truncate max-w-[400px]">
                                                            {report.title}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-[0.2em] italic">ENTRY_ID: #{report.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-10 w-10 bg-emerald-50 text-emerald-950 border border-emerald-100 flex items-center justify-center font-black text-[10px] italic group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all">
                                                            {report.student?.name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight italic leading-tight group-hover/row:text-emerald-600 transition-colors">
                                                                {report.student?.name}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-1 italic">NIM.{report.student?.nim}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                     <div className="flex justify-center items-center gap-3">
                                                         <MapPin size={10} className="text-emerald-500" />
                                                         <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest italic">{report.group?.name}</span>
                                                     </div>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex justify-end gap-6 items-center">
                                                        <div className={clsx(
                                                            "px-4 py-2 text-[8px] font-black uppercase tracking-[0.3em] italic border shadow-sm transition-all",
                                                            (report.status.toLowerCase() === 'disetujui' || report.status.toLowerCase() === 'approved') && "bg-emerald-950 text-white border-emerald-900 shadow-emerald-900/10",
                                                            (report.status.toLowerCase() === 'revisi' || report.status.toLowerCase() === 'revision') && "bg-amber-50 text-amber-700 border-amber-100",
                                                            (report.status.toLowerCase() === 'draf' || report.status.toLowerCase() === 'draft') && "bg-white text-emerald-300 border-emerald-50 italic opacity-60",
                                                            (report.status.toLowerCase() === 'diajukan' || report.status.toLowerCase() === 'submitted') && "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        )}>
                                                            {statusLabel(report.status)}
                                                        </div>
                                                        <Link 
                                                            href={`/admin/laporan/harian/${report.id}`}
                                                            className="h-10 w-10 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-300"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-10 py-8 border-t border-emerald-50 bg-emerald-50/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 italic font-black">
                                     <div className="p-2 bg-emerald-950 text-emerald-500 shadow-lg">
                                        <Database size={14} strokeWidth={2.5} />
                                     </div>
                                     <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Otoritas Registry Logbook: {(reports.data ?? []).length} Entitas Terpantau</span>
                                </div>
                                <div className="flex items-center gap-6">
                                     <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">PAGES CONTROL</span>
                                     <div className="h-px w-12 bg-emerald-50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECURITY FOOTER TACTICAL */}
                    <div className="bg-emerald-950 p-12 flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                        
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="p-5 bg-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.2)] rotate-3">
                                <ShieldCheck size={40} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase leading-none mb-3 text-nowrap">PUSAT AUDIT AKTIVITAS</h4>
                                <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.3em] italic leading-relaxed max-w-3xl">
                                    LOGBOOK HARIAN ADALAH RANTAI BUKTI OPERASIONAL UTAMA. SELURUH ENTITAS AKTIVITAS DISINKRONISASI MELALUI DECENTRALIZED REGISTRY UNTUK VERIFIKASI OTORITAS TERPUSAT.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 relative z-10">
                            {[Fingerprint, Binary, Database].map((Icon, i) => (
                                <div key={i} className="h-16 w-16 bg-white/5 border border-white/5 flex items-center justify-center text-emerald-500 hover:text-white hover:bg-emerald-600 transition-all cursor-help shadow-2xl group/feat">
                                    <Icon size={24} className="group-hover/feat:scale-110 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6 gap-6 relative group italic">
                         <div className="flex items-center gap-4 opacity-20">
                            <SearchCheck size={18} className="text-emerald-200" />
                            <div className="h-px w-16 bg-emerald-50" />
                            <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.4em] uppercase italic">RECAP_READY</div>
                            <div className="h-px w-16 bg-emerald-50" />
                            <Clock size={18} className="text-emerald-200" />
                         </div>
                         <p className="text-[8px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
                             AUDIT LOGBOOK SELESAI • POS-KKN {new Date().getFullYear()}
                         </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
