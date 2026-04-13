import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge, Pagination, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Filter,
    Calendar,
    Activity,
    Search,
    ChevronRight,
    Clock,
    MapPin,
    ArrowRight,
    Layers,
    FileText,
    ShieldCheck,
    Zap,
    Users,
    AlertTriangle,
    Eye,
    Target,
    ArrowLeft,
    X,
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: ReportData[]; meta: PaginationMeta };
    filters: { status?: string; search?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleApplyFilters = () => {
        router.get('/admin/laporan/harian', { 
            search: search || undefined, 
            status: status || undefined 
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Logbook Harian Mahasiswa">
            <Head title="Logbook Harian" />

            <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
                {/* --- PREMIUM HEADER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Activity size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Monitoring & Evaluasi Lapangan</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                Logbook <span className="text-emerald-500">Harian.</span>
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                                Portal Monitoring Aktivitas Lapangan dan Verifikasi Kehadiran Mahasiswa
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="h-14 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                                <FileText size={20} className="text-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status Data</span>
                                    <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{reports.meta.total.toLocaleString()} LAPORAN TERINPUT</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* --- FILTER & TABEL --- */}
                <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/20">
                        <div className="flex-1 relative w-full lg:max-w-xl group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} 
                                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300 uppercase tracking-wider" 
                                placeholder="CARI MAHASISWA, NIM, ATAU JUDUL LAPORAN..." 
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <select 
                                    value={status} 
                                    onChange={(e) => { setStatus(e.target.value); router.get('/admin/laporan/harian', { search, status: e.target.value }, { preserveState: true }); }} 
                                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-[11px] font-bold uppercase tracking-widest outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 appearance-none pr-12"
                                >
                                    <option value="">SEMUA STATUS</option>
                                    <option value="submitted">DIKIRIM (PENDING)</option>
                                    <option value="disetujui">DISETUJUI (VERIFIED)</option>
                                    <option value="revisi">REVISI (NEED FIX)</option>
                                    <option value="draf">DRAF (UNSUBMITTED)</option>
                                </select>
                                <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                            <button 
                                onClick={handleApplyFilters} 
                                className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <tr>
                                    <th className="px-10 py-6">Aktivitas Mahasiswa</th>
                                    <th className="px-10 py-6">Data Personel</th>
                                    <th className="px-10 py-6">Unit / Kelompok</th>
                                    <th className="px-10 py-6 text-right">Status Verifikasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reports.data.length > 0 ? (
                                    reports.data.map((r) => (
                                        <tr key={r.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{r.title}</span>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <Calendar size={14} className="text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{r.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[12px] font-bold text-slate-700 uppercase leading-none">{r.student.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">NIM: {r.student.nim}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                                                    <Target size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none truncate max-w-[150px]">{r.group.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-5">
                                                    <span className={clsx('px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all', 
                                                        r.status.toLowerCase() === 'disetujui' || r.status.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                        r.status.toLowerCase() === 'revisi' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                        r.status.toLowerCase() === 'submitted' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                        'bg-slate-50 text-slate-400 border-slate-100')}>
                                                        {r.status === 'disetujui' ? 'VERIFIED' : r.status.toUpperCase()}
                                                    </span>
                                                    <Link 
                                                        href={`/admin/laporan/harian/${r.id}`} 
                                                        className="h-10 px-5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group/btn"
                                                    >
                                                        Lihat Detail
                                                        <ChevronRight size={14} className="opacity-40 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-200">
                                                <Clock size={60} strokeWidth={1} />
                                                <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Belum ada transmisi data hari ini</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
                            Data Hal. {reports.meta.current_page} — {reports.meta.total} entri logbook terdeteksi
                        </span>
                        <Pagination meta={reports.meta} />
                    </div>
                </section>

                {/* --- FOOTER GUIDE --- */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><ShieldCheck size={350} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                                <Activity size={48} className="text-white" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-2xl font-bold uppercase tracking-tight">Otoritas Monitoring Harian</h4>
                                <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
                                    Log harian mahasiswa adalah parameter utama penilaian disiplin dan progres kegiatan di lapangan. Pastikan tim DPL melakukan validasi berkala untuk menjamin autentisitas aktivitas pengabdian.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 opacity-30 text-emerald-400 animate-pulse">
                            <Activity size={32} />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Live Stream Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
