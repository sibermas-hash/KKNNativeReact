import { Head, router, Link, Deferred } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { 
 FileCheck, 
 Filter, 
 FileText, 
 Layers, 
 CheckCircle2, 
 Database, 
 ShieldCheck, 
 Cpu, 
 ArrowUpRight,
 Archive,
 ChevronRight,
 SearchCode,
 FileSearch,
 Activity,
 Loader2
} from 'lucide-react';
import { route } from 'ziggy-js';

interface FinalReportData {
 id: number;
 title: string;
 status: string;
 submitted_at: string | null;
 mahasiswa?: { nama?: string | null; nim?: string | null; } | null;
 kelompok?: { nama_kelompok?: string | null; } | null;
}

interface Props extends PageProps {
 reports?: {
 data: FinalReportData[];
 meta: PaginationMeta;
 };
 filters: { status?: string; };
}

const statusOptions = [
 { value: '', label: 'SEMUA STATUS' },
 { value: 'submitted', label: 'DIKIRIM (PENDING)' },
 { value: 'reviewed', label: 'MENUNGGU REVIEW' },
 { value: 'disetujui', label: 'DISETUJUI (VERIFIED)' },
 { value: 'revisi', label: 'REVISI (NEED FIX)' },
];

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
 const rows = reports?.data ?? [];

 const handleFilterChange = (value: string) => {
 router.get('/admin/laporan/akhir', { status: value || undefined }, { preserveState: true, replace: true });
 };

 return (
 <AppLayout title="Audit Repositori Laporan Mahasiswa">
 <Head title="Repositori Laporan"/>

 <div className="max-w-[1500px] mx-auto space-y-8 pb-20 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
 
 {/* --- COMPACT PREMIUM HEADER --- */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-[#1a7a4a]">
 <Archive size={16} />
 <span className="text-xs font-semibold opacity-70">Arsip Produk Akademik</span>
 </div>
 <div className="space-y-1">
 <h1 className="text-3xl font-semibold text-emerald-950 er leading-none">
 Repositori <span className="text-[#1a7a4a]">Laporan.</span>
 </h1>
 <p className="text-xs font-bold text-emerald-800 leading-none">
 Audit Integritas Luaran Pengabdian & Validasi Kelulusan Akhir
 </p>
 </div>
 </div>
 
 <div className="shrink-0">
 <Deferred data="reports"fallback={<div className="h-14 w-48 bg-gray-50 animate-pulse rounded-xl"/>}>
 <div className="h-14 px-6 bg-white border border-emerald-50 rounded-xl flex items-center gap-6 shadow-sm">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-emerald-800 leading-none mb-1">Populasi Arsip</span>
 <span className="text-lg font-semibold text-emerald-950 tabular-nums leading-none">{(reports?.meta.total || 0).toLocaleString('id-ID')} BERKAS</span>
 </div>
 <div className="w-px h-8 bg-[#e8f5ee]"/>
 <FileCheck size={20} className="text-[#1a7a4a]"/>
 </div>
 </Deferred>
 </div>
 </div>

 {/* --- STATS STRIP COMPACT --- */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <CompactMetric label="Audit Data"value="VALIDATED"icon={ShieldCheck} />
 <CompactMetric label="Aturan SOP"value="STANDAR"icon={CheckCircle2} />
 <CompactMetric label="Node Arsip"value="AKTIF"icon={Database} />
 <CompactMetric label="Sikkk Sinyal"value="REAL-TIME"icon={Activity} />
 </div>

 {/* --- DATA TABLE SECTION --- */}
 <section className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col">
 {/* FILTER BAR COMPACT */}
 <div className="px-6 py-4 bg-white border-b border-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-white rounded-xl border border-emerald-50 flex items-center justify-center text-[#1a7a4a] shadow-xs">
 <FileSearch size={20} strokeWidth={2.5} />
 </div>
 <h3 className="text-xs font-semibold text-emerald-950">Pusat Validasi Dokumen</h3>
 </div>

 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:w-64 group">
 <select 
 value={filters.status ?? ''}
 onChange={(e) => handleFilterChange(e.target.value)}
 className="w-full h-10 pl-4 pr-10 bg-white border border-emerald-50 rounded-xl text-xs font-semibold text-emerald-950 focus:border-[#1a7a4a] outline-none transition-all appearance-none shadow-xs"
 >
 {statusOptions.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-800 rotate-90 pointer-events-none"/>
 </div>
 <button className="h-10 w-10 bg-white border border-gray-300 text-emerald-950 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
 <Filter size={16} strokeWidth={3} />
 </button>
 </div>
 </div>

 <Deferred data="reports"fallback={
 <div className="flex flex-col items-center justify-center py-32 bg-white">
 <Loader2 size={32} className="text-[#1a7a4a] animate-spin mb-4"/>
 <span className="text-xs font-semibold text-emerald-950 animate-pulse">Sinkronisasi Database...</span>
 </div>
 }>
 <div className="overflow-x-auto">
 <table className="min-w-full text-left whitespace-nowrap">
 <thead className="bg-gray-50 text-emerald-950 border-b border-emerald-50/50">
 <tr>
 <th className="px-6 py-3.5 text-xs font-semibold">Identitas Berkas</th>
 <th className="px-5 py-3.5 text-xs font-semibold">Kontributor</th>
 <th className="px-5 py-3.5 text-center text-xs font-semibold">Unit / Kelompok</th>
 <th className="px-6 py-3.5 text-right text-xs font-semibold">Validasi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]/50">
 {rows.length === 0 ? (
 <EmptyState />
 ) : (
 rows.map((report) => (
 <tr key={report.id} className="group hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-white border border-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center group-hover:bg-[#16a34a] group-hover:text-white group-hover:border-emerald-600 transition-all shadow-xs">
 <FileText size={18} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 leading-tight group-hover:text-emerald-800 transition-colors max-w-[350px] truncate mb-1">{report.title}</span>
 <span className="text-xs font-semibold text-emerald-800 font-mono">DOCID: #{report.id.toString().padStart(5, '0')}</span>
 </div>
 </div>
 </td>
 <td className="px-5 py-4">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-emerald-950 leading-none mb-1.5">{report.mahasiswa?.nama || '-'}</span>
 <span className="text-xs font-semibold text-emerald-800 font-mono er italic">NIM: {report.mahasiswa?.nim || '-'}</span>
 </div>
 </td>
 <td className="px-5 py-4 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-50 rounded-lg group-hover:border-gray-300 transition-all shadow-xs">
 <Layers size={12} className="text-[#1a7a4a]"/>
 <span className="text-xs font-semibold text-[#1f2937] truncate max-w-[120px]">{report.kelompok?.nama_kelompok || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-5">
 <StatusBadge status={report.status} className="scale-90"/>
 <Link 
 href={route('admin.laporan.akhir.show', report.id)}
 className="h-8 px-4 bg-white border border-emerald-50 text-emerald-950 hover:bg-[#16a34a] hover:text-white hover:border-emerald-600 rounded-lg text-xs font-semibold transition-all active:scale-90 shadow-xs flex items-center gap-2"
 >
 AUDIT <ArrowUpRight size={12} strokeWidth={3} />
 </Link>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* PAGINATION COMPACT */}
 <div className="px-6 py-4 border-t border-emerald-50 bg-white flex items-center justify-between">
 <span className="text-xs font-semibold text-[#1a7a4a]">
 Entry <strong className="text-emerald-950 underline decoration-emerald-200">#{reports?.meta.from || 0}-{reports?.meta.to || 0}</strong> of <strong className="text-emerald-950">{(reports?.meta.total || 0).toLocaleString('id-ID')}</strong> Document Nodes
 </span>
 {reports && <Pagination meta={reports.meta} />}
 </div>
 </Deferred>
 </section>

 {/* --- COMPACT GOVERNANCE FOOTER --- */}
 <div className="bg-white rounded-xl p-8 text-emerald-950 relative overflow-hidden shadow-sm border border-emerald-50 group/governance">
 <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 -mr-16 -mt-16 pointer-events-none">
 <Cpu size={300} strokeWidth={0.5} className="text-[#1a7a4a]"/>
 </div>
 <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-50">
 <ShieldCheck size={32} className="text-[#1a7a4a]"/>
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-semibold leading-none text-emerald-950">Protokol Integritas Akademik</h3>
 <p className="text-xs font-semibold text-emerald-800 leading-none">Audit Tahunan KKN - LPPM UIN Saizu</p>
 <p className="text-xs font-bold text-emerald-800 leading-relaxed max-w-2xl mt-2 line-clamp-2">
 Validasi otomasi terhadap luaran pengabdian menjamin kualitas kontribusi institusional. Setiap dokumen yang disahkan menjadi basis data legal kelulusan.
 </p>
 </div>
 </div>
 <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-emerald-50">
 <div className="h-1.5 w-1.5 bg-[#16a34a] rounded-full animate-pulse shadow-[0_0_8px_#10b981]"/>
 <span className="text-xs font-semibold text-[#1a7a4a]">Audit Mode: ACTIVE</span>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function CompactMetric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
 return (
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-300 transition-all group overflow-hidden">
 <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border bg-gray-50 text-[#1a7a4a] border-emerald-50 group-hover:scale-110 group-hover:rotate-3 transition-transform">
 <Icon size={18} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-emerald-800 mb-1">{label}</span>
 <span className="text-sm font-semibold text-emerald-950 group-hover:text-[#1a7a4a] transition-colors">{value}</span>
 </div>
 </div>
 );
}

function EmptyState() {
 return (
 <tr>
 <td colSpan={10} className="px-10 py-24 text-center">
 <div className="flex flex-col items-center justify-center gap-3">
 <div className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-800 mb-2">
 <SearchCode size={32} strokeWidth={1.5} />
 </div>
 <span className="text-xs font-semibold text-emerald-950">Repositori Nihil</span>
 <p className="text-xs font-semibold text-emerald-800 opacity-40">Tidak ditemukan arsip laporan untuk parameter saat ini.</p>
 </div>
 </td>
 </tr>
 );
}
