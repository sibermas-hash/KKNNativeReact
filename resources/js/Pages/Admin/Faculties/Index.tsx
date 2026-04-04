import { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 School,
 Search,
 ShieldCheck,
 Database,
 Fingerprint,
 Building2,
 
 Cpu
} from 'lucide-react';

interface FacultyWithCount {
 id: number;
 code: string;
 name: string;
 programs_count: number;
}

interface Props extends PageProps {
 faculties: {
 data: FacultyWithCount[];
 links: any[];
 meta: PaginationMeta;
 };
 filters: {
 search?: string;
 };
 syncInfo: {
 mode: 'sync-only';
 source: string;
 last_synced_at?: string | null;
 };
}

export default function FacultiesIndex({ faculties, filters, syncInfo }: Props) {
 const [search, setSearch] = useState(filters.search || '');

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/faculties', { search }, { preserveState: true, replace: true });
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search, filters.search]);

 return (
 <AppLayout title="Arsip Sektor Fakultas">
 <Head title="Manajemen Fakultas" />
 
 <div className="space-y-8 pb-24">
 {/* 
 Emerald Premium Header 
 Refining from heavy black to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <School className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 INSTITUTIONAL_FACULTY_REGISTRY_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Direktori <span className="text-emerald-300">Fakultas</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Manajemen basis data fakultas dan unit orkestrasi akademik pada lingkungan universitas UIN SAIZU untuk sinkronisasi orisinalitas data.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:transition-transform">
 <Building2 className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-emerald-200/60 block mb-1.5">Total Sektor</span>
 <span className="text-2xl font-semibold text-white">{faculties.meta?.total || 0} Record</span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:mx-2">
 {/* Form Section / Info Panel */}
 <div className="lg:col-span-1">
 <div className="bg-white rounded-lg p-12 border border-slate-200 sticky top-12 group overflow-hidden">
 <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none ">
 <School className="h-64 w-64" />
 </div>

 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-5 border-b border-slate-200 pb-8">
 <div className="p-3.5 bg-primary rounded-lg text-white
 <Database className="h-6 w-6 stroke-[2.5px]" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-900 ">Master_Registry</h3>
 <p className="text-[10px] font-semibold text-slate-400 mt-2 opacity-50">SUMBER DATA TERMALIDASI</p>
 </div>
 </div>

 <div className="space-y-8">
 <div className="p-8 bg-primary/5 rounded-lg border border-primary/10
 <p className="text-[13px] text-sm text-slate-700 leading-normal opacity-75">
 Data fakultas tetap digunakan secara operasional oleh sistem KKN, namun sumber kebenarannya mengikuti sinkronisasi absolut dari basis data master universitas.
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6">
 <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 group/card hover:bg-white hover:border-primary">
 <span className="block text-[9px] font-semibold text-slate-400 mb-2">Source_Gateway_ID</span>
 <span className="block text-[15px] font-semibold text-slate-900 ">{syncInfo.source}</span>
 </div>

 <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 group/card hover:bg-white hover:border-primary">
 <span className="block text-[9px] font-semibold text-slate-400 mb-2">Last_Sync_Timestamp</span>
 <span className="block text-[15px] font-semibold text-slate-900 ">{syncInfo.last_synced_at || 'PENDING_INITIAL_SYNC'}</span>
 </div>
 </div>

 <div className="space-y-5 pt-4">
 <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-200">
 <div className="p-2 bg-white rounded-lg
 <Zap className="h-4 w-4 text-emerald-500" />
 </div>
 <p className="text-[11px] text-slate-500 text-sm leading-normal opacity-50">
 Intervensi manual dinonaktifkan untuk menjaga integritas relasi antar record fakultas dan program studi.
 </p>
 </div>
 <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-200">
 <div className="p-2 bg-white rounded-lg
 <Fingerprint className="h-4 w-4 text-primary" />
 </div>
 <p className="text-[11px] text-slate-500 text-sm leading-normal opacity-50">
 Mendukung pemetaan otomatis untuk orkestrasi kelompok, monitoring pelaporan, dan audit akademik.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Data Table Section */}
 <div className="lg:col-span-2 space-y-6">
 <div className="relative group max-w-2xl mx-1">
 <Search className="absolute left-6 top-1/2 -/2 w-6 h-6 text-slate-300 group-focus-within:text-primaryz-10" />
 <input
 placeholder="Cari nama atau kode identitas fakultas..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full h-18 pl-16 pr-8 bg-white border border-slate-200rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-primary/50placeholder:opacity-30"
 />
 </div>

 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group mx-1">
 <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50 text-slate-400">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold ">Code_ID</th>
 <th className="px-6 py-3 text-left text-xs font-semibold ">Nomenklatur_Fakultas</th>
 <th className="px-6 py-3 text-center text-xs font-semibold ">Unit_Program</th>
 <th className="px-6 py-3 text-right text-xs font-semibold pr-14">Operasi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 bg-white">
 {faculties.data.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-6 py-40 text-center">
 <div className="flex flex-col items-center gap-6 opacity-50">
 <div className="p-10 bg-slate-50 rounded-lg border border-slate-200
 <Building2 className="h-20 w-20 text-slate-200" />
 </div>
 <p className="text-[12px] font-semibold text-slate-400">SYSTEM_INFO: NO_FACULTY_RECORDS_DETECTED</p>
 </div>
 </td>
 </tr>
 ) : (
 faculties.data.map((f) => (
 <tr key={f.id} className="group/row hover:bg-slate-50/20cursor-default">
 <td className="px-6 py-3">
 <div className="px-5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-primary inline-flex font-semibold text-xs group-hover/row:transition-transform">
 {f.code}
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[15px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors leading-normal 
 </td>
 <td className="px-6 py-3 text-center">
 <div className="inline-flex items-baseline gap-2 px-6 py-3 bg-slate-50 rounded-lg border border-slate-200 group-hover/row:bg-white group-hover/row:border-primary/30 group-hover/row:group-hover/row: group-hover/row:/5">
 <span className="text-xl font-semibold text-slate-900">{f.programs_count}</span>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">PRODI_UNIT</span>
 </div>
 </td>
 <td className="px-6 py-3 text-right pr-14">
 <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-400 group-hover/row:bg-white">
 READ_ONLY_SYNC
 </span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 {faculties.meta && (
 <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-200">
 <Pagination meta={faculties.meta} />
 </div>
 )}
 </div>

 {/* Tactical Emerald Footer Monitor */}
 <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-1">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheck className="h-7 w-7 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white ">STRUCTURAL_GOVERNANCE_PROTOCOL_V3</h4>
 <p className="text-[10px] text-emerald-400 text-sm mt-2 whitespace-nowrap">STATUS: HIERARCHY_INTEGRITY_VERIFIED</p>
 </div>
 </div>
 <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
 Petunjuk Hirarki: Data fakultas merupakan pondasi absolut pemetaan program studi dan klasifikasi personel akademik KKN UIN SAIZU. 
 Sinkronisasi dilakukan secara herarkis untuk menjamin tidak adanya drift data antara <span className="text-primary font-semibold">"Academic Master"</span> dengan registry operasional KKN. 
 Gunakan audit log untuk memantau aktivitas sinkronisasi temporal.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
 <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
 <span className="text-[11px] font-semibold text-slate-100 ">HIERARCHY_OK</span>
 </div>
 <div className="flex gap-5">
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <Cpu className="h-7 w-7" />
 </div>
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <Zap className="h-7 w-7" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
