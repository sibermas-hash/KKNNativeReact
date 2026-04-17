import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
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
 SearchCode,
 Trophy,
 History,
 Briefcase,
 FilePlus,
 ArrowDownToLine
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { LucideIcon } from '@/types';

interface ReportRow {
 id: number; title: string; type: string; status: string; file_name: string; submitted_at: string | null; user: { name: string; }; group: { name: string; village: string; };
}
interface Props { reports: { data: ReportRow[]; meta?: Record<string, any>; }; summary: { total_reports: number; pending_review: number; }; }

const typeLabels: Record<string, string> = {
 final_report: 'LAPORAN_AKHIR', 
 book_anthology: 'ANTOLOGI_KKN', 
 scholarly_article: 'ARTIKEL_PENGABDIAN', 
 village_map: 'PETA_ASET_DESA', 
 video_documentation: 'DOKUMENTASI_VIDEO', 
 photo_documentation: 'DOKUMENTASI_FOTO', 
 attendance_sheet: 'DAFTAR_HADIR', 
 activity_proposal: 'PROPOSAL_DESIGN', 
 evaluation_report: 'EVALUASI_REFLEKSI',
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
 <AppLayout title="Audit Pustaka Aset Akademik">
 <Head title="Pustaka Laporan"/>

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-gray-900">
 
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-3 text-[#1a7a4a]">
 <Archive size={20} />
 <span className="text-xs font-semibold opacity-80">Digital Asset Vault</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
 <div className="space-y-2">
 <h1 className="text-4xl font-semibold text-gray-900 er leading-none">
 Pustaka <span className="text-[#1a7a4a]">Aset.</span>
 </h1>
 <p className="text-sm font-semibold text-gray-700 leading-relaxed max-w-2xl mt-4">
 Repositori terpusat luaran akademik dan dokumentasi pengabdian masyarakat. Audit seluruh aset digital untuk memastikan kelengkapan portofolio institusi.
 </p>
 </div>
 <div className="shrink-0">
 <div className="h-20 px-10 bg-[#16a34a] border border-[#1a7a4a] rounded-xl flex items-center gap-8 text-white shadow-sm shadow-none">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-gray-700 leading-none mb-2">Total Aset KKN</span>
 <span className="text-2xl font-semibold text-white tabular-nums leading-none">{(summary.total_reports || 0).toLocaleString('id-ID')} FILES</span>
 </div>
 <div className="w-px h-10 bg-white/20"/>
 <Trophy size={28} className="text-white drop-shadow-sm"/>
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS OVERVIEW --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard label="Vault Status"value="ONLINE_SYNC"icon={Zap} desc="Cloud Storage Active"/>
 <MetricCard label="Audit Pending"value={summary.pending_review} icon={Activity} type={summary.pending_review > 0 ? 'warning' : 'success'} desc="Awaiting Verification"/>
 <MetricCard label="Library Node"value="vLIB 2.0"icon={Cpu} desc="Security Architecture"/>
 <MetricCard label="Asset Security"value="SIGNED_OFF"icon={ShieldCheck} desc="Integrity Verified"/>
 </div>

 {/* --- DATA TABLE CARD --- */}
 <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-10 py-10 bg-gray-50 border-b-2 border-gray-200 flex flex-col lg:flex-row items-center justify-between gap-8">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-[#1a7a4a] shadow-sm">
 <Layers size={32} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-xl font-semibold text-gray-900 leading-none mb-1.5">Manifest Komponen Riset</h3>
 <p className="text-xs font-bold text-gray-700 leading-none">Direktori Inventori Produk Akademik KKN</p>
 </div>
 </div>

 <div className="flex items-center gap-4 w-full lg:w-auto">
 <div className="relative flex-1 lg:w-72 group">
 <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#1a7a4a] transition-colors"strokeWidth={3} />
 <input 
 value={search} 
 onChange={e => setSearch(e.target.value)} 
 className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:border-[#1a7a4a] outline-none transition-all placeholder:text-gray-400 shadow-sm"
 placeholder="CARI IDENTIFIER ASET..."
 />
 </div>
 <button className="h-14 w-14 bg-white text-white rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-90 shadow-sm">
 <Filter size={20} strokeWidth={3} />
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[500px]">
 <table className="min-w-full text-left border-collapse whitespace-nowrap">
 <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
 <tr>
 <th className="px-10 py-6 text-xs font-semibold">Identitas Aset Digital</th>
 <th className="px-8 py-6 text-xs font-semibold text-center">Unit / Dosen</th>
 <th className="px-8 py-6 text-xs font-semibold text-center">Kategori Aset</th>
 <th className="px-8 py-6 text-center text-xs font-semibold">Integritas</th>
 <th className="px-10 py-6 text-right text-xs font-semibold">Kontrol Biner</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {filteredReports.length === 0 ? (
 <EmptyState />
 ) : (
 filteredReports.map((report) => (
 <tr key={report.id} className="group hover:bg-gray-50 transition-all font-sans">
 <td className="px-10 py-8">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 bg-white border border-gray-200 text-gray-500 rounded-xl flex items-center justify-center group-hover:bg-[#16a34a] group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
 <FileText size={22} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors max-w-[400px] truncate mb-2">{report.title}</span>
 <span className="text-xs font-semibold text-gray-600 font-mono leading-none">{report.file_name}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-8 text-center text-center">
 <div className="flex flex-col items-center gap-1.5">
 <span className="text-xs font-semibold text-gray-900 leading-none">{report.group.name}</span>
 <span className="text-xs font-semibold text-gray-600">{report.user.name}</span>
 </div>
 </td>
 <td className="px-8 py-8 text-center">
 <span className="inline-flex px-4 py-1.5 bg-white border border-gray-200 text-[#1a7a4a] text-xs font-semibold rounded-xl shadow-sm">
 {typeLabels[report.type] || report.type}
 </span>
 </td>
 <td className="px-8 py-8 text-center">
 <div className="scale-110 flex justify-center">
 <StatusBadge status={report.status} />
 </div>
 </td>
 <td className="px-10 py-8 text-right whitespace-nowrap">
 <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all gap-4">
 <Link 
 href={`/admin/laporan/${report.id}/unduh`}
 className="h-10 px-5 bg-white border border-gray-200 text-gray-900 hover:bg-white hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-3 shadow-sm group-hover:border-gray-300"
 >
 INJECT_ASSET <ArrowDownToLine size={14} strokeWidth={3} />
 </Link>
 <button className="h-10 w-10 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border">
 <MoreVertical size={16} strokeWidth={3} />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* PAGINATION */}
 <div className="px-10 py-8 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
 <span className="text-xs font-semibold text-gray-700">
 Data Halaman <strong className="text-gray-900 text-xs tabular-nums">{reports.meta?.current_page || 1}</strong> Per <strong className="text-gray-900 text-xs tabular-nums">{(summary.total_reports || 0).toLocaleString('id-ID')}</strong> Entitas Pustaka
 </span>
 {reports.meta && <Pagination meta={reports.meta as any} />}
 </div>
 </section>

 {/* --- GOVERNANCE FOOTER --- */}
 <div className="bg-white rounded-xl p-12 text-white relative overflow-hidden shadow-sm border border-emerald-800 group/governance">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
 <BookOpen size={500} strokeWidth={0.5} />
 </div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
 <div className="space-y-6 flex-1">
 <div className="flex items-center gap-6">
 <div className="h-20 w-20 bg-gray-100/50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
 <ShieldCheck size={40} className="text-gray-700"strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-2xl font-semibold leading-none mb-1">Pengawasan Aset Akademis</h3>
 <span className="text-xs font-semibold text-gray-700 opacity-80">Protokol Verifikasi Produk Digital</span>
 </div>
 </div>
 <p className="text-sm font-bold text-gray-700 leading-relaxed max-w-4xl">
 Seluruh berkas yang terunggah dalam pustaka aset ini melewati protokol verifikasi integritas data berlapis untuk akuntabilitas operasional UIN SAIZU. Arsip digital ini merupakan aset intelektual publik yang merepresentasikan kontribusi nyata sivitas akademika dalam pemberdayaan masyarakat.
 </p>
 </div>
 <div className="h-20 w-px bg-white/10 hidden lg:block"/>
 <div className="flex flex-col items-end shrink-0 hidden lg:flex">
 <span className="text-xs font-semibold text-gray-700 mb-1 opacity-60">STORAGE SECURITY</span>
 <span className="text-2xl font-semibold text-white italic er text-gray-700">AMANKAN</span>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, desc, type }: { label: string; value: any; icon: any; desc: string; type?: 'success' | 'warning' }) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-gray-200 transition-all group overflow-hidden relative">
 <div className={clsx(
"h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border",
 type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-gray-50 border-gray-200 text-[#1a7a4a]'
 )}>
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col relative z-20">
 <span className="text-xs font-semibold text-gray-700 leading-none mb-3">{label}</span>
 <span className="text-2xl font-semibold text-gray-900 er leading-none group-hover:text-gray-700 transition-colors mb-1.5">{value}</span>
 <p className="text-xs font-semibold text-gray-600 opacity-60 leading-none">{desc}</p>
 </div>
 </div>
 );
}

function EmptyState() {
 return (
 <tr>
 <td colSpan={10} className="px-10 py-32 text-center">
 <div className="flex flex-col items-center justify-center gap-4">
 <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 mb-2">
 <SearchCode size={48} strokeWidth={1} />
 </div>
 <span className="text-sm font-semibold text-gray-900">Vault Buffer Nihil</span>
 <p className="text-xs font-semibold text-gray-700 leading-none opacity-60">Tidak ditemukan aliran data aset untuk parameter filter saat ini.</p>
 </div>
 </td>
 </tr>
 );
}
