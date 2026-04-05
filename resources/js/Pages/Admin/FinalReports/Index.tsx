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
    IdCard
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
    { value: '', label: 'ALL_DOSSIER_STATES' },
    { value: 'submitted', label: 'SUBMITTED' },
    { value: 'reviewed', label: 'UNDER_REVIEW' },
    { value: 'disetujui', label: 'AUTHORIZED' },
    { value: 'revisi', label: 'REVISION_NEEDED' },
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
        <AppLayout title="Final Dossier Archive">
            <Head title="Laporan Akhir Mahasiswa" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">FINAL_DOSSIER_ARCHIVE_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <FileCheck className="w-10 h-10 text-emerald-600" />
                            LAPORAN <span className="text-emerald-600">AKHIR</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Verifikasi dokumen akhir, audit pencapaian misi, dan otorisasi kelulusan administratif unit.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Total Dossiers</span>
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{rows.length} ARCHIVES</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="relative group w-full lg:max-w-2xl px-6 py-4 bg-white border border-slate-200 rounded-3xl flex items-center gap-6 shadow-sm focus-within:border-emerald-500 focus-within:ring-8 focus-within:ring-emerald-500/5 transition-all">
                        <Filter className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1 flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Filter_Operational_State</span>
                            <select 
                                value={filters.status ?? ''}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-black italic text-slate-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <Zap className="w-5 h-5 text-slate-200" />
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] italic opacity-50">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        SECURE_ARCHIVE_ACCESS_ACTIVE
                    </div>
                </div>

                {/* Tactical Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">DOSSIER_IDENTITY_HASH</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">PERSONNEL_METADATA</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">ASSIGNED_UNIT</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">ARCHIVE_STAMP</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SYSTEM_STATE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.length > 0 ? (
                                    rows.map((report, idx) => (
                                        <motion.tr 
                                            key={report.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                        >
                                            <td className="px-12 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors">{report.title}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">ARCHIVE_ID: #{report.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-950 text-emerald-500 border border-slate-800 flex items-center justify-center font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                                        {report.mahasiswa?.nama?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-700 transition-colors">{report.mahasiswa?.nama || '-'}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 italic mt-1 self-start">ID: {report.mahasiswa?.nim || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all shadow-inner">
                                                        <Layers className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{report.kelompok?.nama_kelompok || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-[11px] font-black text-slate-400 tabular-nums italic">{report.submitted_at || 'NOT_SUBMITTED'}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <StatusBadge status={report.status} />
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <Binary className="w-16 h-16 text-slate-300" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">NO_DOSSIER_RECORDS_DETECTED_IN_SECTOR</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Footer Stamp */}
                <div className="p-12 bg-slate-900 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-500 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                                    <ShieldCheck className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] italic">ARCHIVE_INTEGRITY_SHIELD</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed">Seluruh laporan akhir yang tersimpan dalam arsip ini telah melewati protokol validasi akademik. <br/>Otorisasi final diperlukan untuk penerbitan sertifikat kompetensi unit.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             CORE_ARCHIVE_PROTOCOL_V4 • {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
