import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    FileCheck, 
    Filter, 
    Search, 
    Zap, 
    Layers, 
    Users, 
    Calendar, 
    Activity, 
    ArrowRight, 
    Database, 
    Globe, 
    Binary, 
    Fingerprint, 
    ShieldCheck, 
    Navigation,
    LayoutDashboard,
    Clock,
    Target,
    FileText,
    Key,
    IdCard,
    ChevronRight,
    SearchCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface FinalReportData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    mahasiswa?: {
        nama?: string | null;
        nim?: string | null;
    } | null;
    kelompok?: {
        nama_kelompok?: string | null;
    } | null;
}

interface PaginationData<T> {
    data: T[];
}

interface Props extends PageProps {
    reports: PaginationData<FinalReportData>;
    filters: {
        status?: string;
    };
}

const statusOptions = [
    { value: '', label: 'SEMUA STATUS_ARSIP' },
    { value: 'submitted', label: 'STATUS: SUBMITTED / DIAJUKAN' },
    { value: 'reviewed', label: 'STATUS: REVIEW / PROSES' },
    { value: 'disetujui', label: 'STATUS: APPROVED / SETUJU' },
    { value: 'revisi', label: 'STATUS: REVISION / REVISI' },
];

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
    const rows = reports.data ?? [];

    const handleFilterChange = (value: string) => {
        router.get(
            '/admin/laporan/akhir',
            { status: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    return (
        <AppLayout title="Otoritas Arsip Laporan Akhir">
            <Head title="Laporan Akhir | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL: SIERRA ARCHIVE SYSTEM */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Final Report Registry Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            ARSIP <span className="text-emerald-500">LAPORAN AKHIR</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <FileCheck size={12} className="text-emerald-500" />
                             Otoritas verifikasi dokumen akhir, audit pencapaian misi, dan validasi kelulusan administratif unit.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">TOTAL ARCHIVE DATA</span>
                               <div className="flex items-center gap-3">
                                   <FileText size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{rows.length} REPORTS REGISTERED</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                     {/* TOOLBAR TACTICAL */}
                     <div className="bg-white border border-emerald-100 p-8 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all flex flex-col md:flex-row items-center gap-12">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        <div className="relative group flex-1 w-full relative z-10 flex items-center bg-emerald-50/30 border border-emerald-50 hover:border-emerald-500 transition-all shadow-inner px-8 py-5">
                            <Filter className="w-5 h-5 text-emerald-200 mr-6" />
                            <div className="flex-1 flex flex-col mt-1">
                                <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest mb-1 italic leading-none">Filter Status Audit</span>
                                <select 
                                    value={filters.status ?? ''}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-black italic text-emerald-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Zap className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity relative z-10">
                            <Activity size={18} className="text-emerald-500 animate-pulse" />
                            ARCHIVE_SYSTEM_READY
                        </div>
                    </div>

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Database size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Indeks Laporan Akhir</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Rekaman Dokumen Penyelesaian KKN</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                REPOSITORY FEED
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">DOKUMEN & IDENTITAS LAPORAN</th>
                                        <th className="px-10 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">ENTITAS MAHASISWA</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">UNIT KELOMPOK</th>
                                        <th className="px-8 py-8 text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic text-center">TIMESTAMP UNGGAH</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">STATUS AUDIT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50">
                                    {rows.length > 0 ? (
                                        rows.map((report, idx) => (
                                            <tr key={report.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                                <td className="px-12 py-8">
                                                     <div className="flex flex-col gap-1.5 group-hover/row:translate-x-2 transition-transform">
                                                        <span className="text-[13px] font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">{report.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint size={10} className="text-emerald-100" />
                                                            <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest italic leading-none">ARCHIVE_ID: #{report.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 bg-emerald-950 text-emerald-400 flex items-center justify-center font-black text-sm italic shadow-xl group-hover/row:scale-110 group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 uppercase">
                                                            {report.mahasiswa?.nama?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-black text-emerald-950 uppercase italic tracking-widest uppercase leading-none">{report.mahasiswa?.nama || '-'}</span>
                                                            <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest italic uppercase leading-none tabular-nums">DATA_NIM: {report.mahasiswa?.nim || '-'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-center uppercase">
                                                    <div className="inline-flex h-12 flex-col items-center justify-center px-6 bg-white border border-emerald-50 text-[10px] font-black text-emerald-950 uppercase tracking-widest tabular-nums group-hover/row:border-emerald-500 transition-all shadow-sm">
                                                        <Layers size={12} className="text-emerald-300 mb-1" />
                                                        {report.kelompok?.nama_kelompok || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-center text-[10px] font-black text-emerald-950 tabular-nums uppercase">
                                                     <div className="flex flex-col items-center gap-1 group-hover/row:scale-110 transition-transform">
                                                        <Clock size={12} className="text-emerald-200" />
                                                        {report.submitted_at || '-'}
                                                     </div>
                                                </td>
                                                <td className="px-12 py-8 text-right pr-12">
                                                    <div className="flex items-center justify-end group-hover/row:translate-x-2 transition-transform">
                                                        <StatusBadge status={report.status} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-12 py-56 text-center opacity-20">
                                                <div className="flex flex-col items-center gap-8">
                                                    <Binary className="h-24 w-24 text-emerald-950" strokeWidth={1} />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-emerald-950">ARSIP LAPORAN AKHIR NIHIL</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-12 py-10 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between bg-emerald-50/10 gap-8 italic mt-1 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-emerald-950 shadow-lg">
                                    <SearchCheck size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Operational Repository Feed</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Berkas Terdeteksi: {rows.length} Dokumen</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.5em] italic opacity-50">
                                VERIFIED ARCHIVE SYSTEM
                            </div>
                        </div>
                    </div>

                    {/* SECURITY FOOTER MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                             <div className="space-y-8 flex-1">
                                 <div className="flex items-center gap-8">
                                    <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
                                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Integritas Dokumen Akhir</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Seluruh laporan akhir yang tersimpan dalam arsip ini telah melewati protokol validasi akademik. 
                                            Otorisasi final pada laporan ini bersifat kritikal untuk penerbitan sertifikat kompetensi unit dan penyelesaian administrasi kelulusan KKN.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">REPORT_ARCHIVE_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL ARCHIVE COMMAND</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
