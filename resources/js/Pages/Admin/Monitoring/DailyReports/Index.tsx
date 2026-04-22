import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
 Filter,
 Calendar,
 Activity,
 Search,
 ChevronRight,
 Target,
 ShieldCheck,
 Zap,
 Users,
 SearchCode,
 FileSearch,
 RefreshCw,
 FileText
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
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
 <AppLayout title="Audit Logbook Harian Mahasiswa">
 <Head title="Logbook Harian"/>

 <div className="space-y-6 pb-12 font-sans text-emerald-950">
 
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4 pt-6">
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-[#1a7a4a] mb-2">
 <Activity size={16} />
 <span className="text-xs font-bold">Monitoring & Evaluasi</span>
 </div>
 <h1 className="text-3xl font-semibold text-emerald-950 leading-tight">
 Logbook <span className="text-[#1a7a4a]">Harian</span>
 </h1>
 <p className="text-sm font-medium text-emerald-800 leading-relaxed max-w-2xl">
 Audit transmisi aktivitas harian dan kehadiran mahasiswa. Pastikan validitas data pengabdian lapangan.
 </p>
 </div>
 <div className="shrink-0 bg-[#16a34a] rounded-xl px-6 py-4 flex items-center gap-4 text-white shadow-md">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-emerald-800 tracking-wide opacity-90">Total Transmisi</span>
 <span className="text-2xl font-semibold text-white tabular-nums leading-none">{reports.meta.total.toLocaleString('id-ID')}</span>
 </div>
 <div className="w-px h-8 bg-white/30"/>
 <FileText size={20} className="text-emerald-50"/>
 </div>
 </div>
 </div>

 {/* --- STATS OVERVIEW --- */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard label="Audit Aktif"value="REAL-TIME"icon={RefreshCw} desc="Database Utama SIKKKN"/>
 <MetricCard label="Status Sinyal"value="TERINKRIPSI"icon={Zap} desc="Transmisi Aman"/>
 <MetricCard label="Otomasi Audit"value="AKTIF"icon={ShieldCheck} desc="Verifikasi AI"/>
 <MetricCard label="Cakupan Data"value="MENYELURUH"icon={Users} desc="Populasi Global"/>
 </div>

 {/* --- DATA TABLE CARD --- */}
 <section className="bg-white border text-sm border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-6 py-5 bg-gray-50 border-b border-emerald-50 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
 <div className="md:col-span-5 relative group">
 <label className="text-xs font-bold text-emerald-800 tracking-wide mb-1.5 block">Cari Laporan</label>
 <div className="relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-800 group-focus-within:text-[#1a7a4a]"/>
 <input 
 type="text"
 value={search} 
 onChange={(e) => setSearch(e.target.value)} 
 onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} 
 className="w-full h-10 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all placeholder:text-black"
 placeholder="Cari nama, nim, atau judul..."
 />
 </div>
 </div>

 <div className="md:col-span-4 relative">
 <label className="text-xs font-bold text-emerald-800 tracking-wide mb-1.5 block">Status Audit</label>
 <div className="relative">
 <select 
 value={status} 
 onChange={(e) => setStatus(e.target.value)} 
 className="w-full h-10 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all appearance-none"
 >
 <option value="">Semua Status</option>
 <option value="submitted">Dikirim (Pending)</option>
 <option value="disetujui">Disetujui (Verified)</option>
 <option value="revisi">Revisi</option>
 <option value="draf">Draf</option>
 </select>
 <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 rotate-90 pointer-events-none"/>
 </div>
 </div>

 <div className="md:col-span-3">
 <button 
 onClick={handleApplyFilters} 
 className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
 >
 <Filter size={14} strokeWidth={2.5} /> Filter Data
 </button>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full text-left whitespace-nowrap">
 <thead className="bg-gray-50 text-emerald-950 border-b border-emerald-50">
 <tr>
 <th className="px-6 py-3 text-xs font-bold">Aktivitas</th>
 <th className="px-4 py-3 text-xs font-bold">Personel</th>
 <th className="px-4 py-3 text-xs font-bold text-center">Kelompok</th>
 <th className="px-6 py-3 text-right text-xs font-bold">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {reports.data.length === 0 ? (
 <EmptyState />
 ) : (
 reports.data.map((r) => (
 <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1">
 <span className="text-sm font-semibold text-[#1f2937] group-hover:text-emerald-800 max-w-[300px] truncate"title={r.title}>{r.title}</span>
 <div className="flex items-center gap-1.5 text-[#1a7a4a]">
 <Calendar size={12} strokeWidth={2.5} />
 <span className="text-xs font-medium">{r.date}</span>
 </div>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-[#1f2937]">{r.student.name}</span>
 <span className="text-xs font-medium text-[#1a7a4a] font-mono">{r.student.nim}</span>
 </div>
 </td>
 <td className="px-4 py-4 text-center">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-emerald-50 rounded-md text-emerald-800">
 <Target size={12} strokeWidth={2.5} />
 <span className="text-xs font-bold tracking-wide truncate max-w-[120px]">{r.group.name}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-4">
 <StatusBadge status={r.status} />
 <Link 
 href={`/admin/laporan/harian/${r.id}`} 
 className="px-3 py-1.5 hover:bg-[#e8f5ee] text-emerald-800 hover:text-emerald-800 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1"
 >
 Detail <ChevronRight size={12} strokeWidth={3} />
 </Link>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* PAGINATION */}
 <div className="px-6 py-4 border-t border-emerald-50 bg-gray-50 flex items-center justify-between">
 <span className="text-xs font-semibold text-emerald-800">
 Total: <strong className="text-emerald-950">{reports.meta.total}</strong> Laporan
 </span>
 <Pagination meta={reports.meta} />
 </div>
 </section>

 {/* --- GOVERNANCE FOOTER --- */}
 <div className="bg-gray-100 rounded-xl p-6 text-emerald-50 flex items-center shadow-md justify-between gap-6 overflow-hidden relative">
 <div className="flex items-start gap-4 z-10">
 <ShieldCheck size={28} className="text-emerald-800 shrink-0 mt-0.5"/>
 <div>
 <h3 className="text-sm font-bold text-white mb-1 tracking-wide">Audit Trail Logbook</h3>
 <p className="text-xs text-emerald-700 leading-relaxed max-w-3xl">
 Seluruh interaksi laporan dipantau permanen dalam log sistem. DPL diwajibkan memberikan feedback akurat.
 </p>
 </div>
 </div>
 <div className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded border border-emerald-800 shrink-0 hidden sm:block">
 SISTEM AKTIF
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string; value: any; icon: any; desc: string }) {
 return (
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-4 shadow-sm relative">
 <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-[#1a7a4a] bg-gray-50 border border-emerald-50">
 <Icon size={18} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-bold text-[#1a7a4a]">{label}</span>
 <span className="text-lg font-semibold text-emerald-950 leading-tight truncate">{value}</span>
 </div>
 </div>
 );
}

function EmptyState() {
 return (
 <tr>
 <td colSpan={10} className="px-6 py-16 text-center">
 <div className="flex flex-col items-center justify-center gap-3">
 <div className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-800 border border-emerald-50">
 <SearchCode size={28} strokeWidth={1.5} />
 </div>
 <span className="text-sm font-bold text-[#1f2937]">Data Logbook Nihil</span>
 <p className="text-xs text-[#1a7a4a]">Tidak ada data transmisi laporan pada filter sistem saat ini.</p>
 </div>
 </td>
 </tr>
 );
}

