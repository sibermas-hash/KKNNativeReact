import { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 GraduationCap,
 Search,
 FileText,
 ShieldCheck,
 Fingerprint,
 Globe,
 Info,
 Cpu,
 Activity,
 Zap
} from 'lucide-react';

interface ProgramWithFaculty extends Omit<Program, 'faculty'> {
 faculty: Faculty;
}

interface Props extends PageProps {
 programs: {
 data: ProgramWithFaculty[];
 links: any[];
 meta: PaginationMeta;
 };
 faculties: Faculty[];
 filters: {
 search?: string;
 };
 syncInfo: {
 mode: 'sync-only';
 source: string;
 last_synced_at?: string | null;
 };
}

export default function ProgramsIndex({ programs, filters, syncInfo }: Props) {
 const [search, setSearch] = useState(filters.search || '');

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/programs', { search }, { preserveState: true, replace: true });
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search, filters.search]);

 return (
 <AppLayout title="Arsip Sektor Akademik">
 <Head title="Manajemen Program Studi" />
 
 <div className="space-y-8 pb-24">
 {/* 
 Emerald Premium Header 
 Refining from heavy black to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-6 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <Cpu className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 ACADEMIC_REGISTRY_UNIT_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Arsip <span className="text-emerald-300">Prodi</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Manajemen unit akademik dalam struktur fakultas. Seluruh data record prodi diselaraskan secara otomatis dengan basis data universitas.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:transition-transform">
 <GraduationCap className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-emerald-200/60 block mb-1.5">Total Unit</span>
 <span className="text-2xl font-semibold text-white">{programs.meta?.total || 0} Sektor</span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:mx-2">
 {/* Input Section (Tactical Reference) */}
 <div className="lg:col-span-1">
 <div className="bg-white rounded-lg p-10 border border-slate-200 sticky top-12 group overflow-hidden">
 <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none ">
 <FileText className="h-64 w-64" />
 </div>

 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-5 border-b border-slate-200 pb-8">
 <div className="p-3 bg-primary rounded-lg text-white
 <Info className="h-6 w-6" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-900 ">Status_Record</h3>
 <p className="text-[10px] font-semibold text-slate-400 mt-2 opacity-50">SINKRONISASI EKSTERNAL</p>
 </div>
 </div>

 <div className="space-y-8">
 <div className="p-6 bg-slate-50 border border-slate-200rounded-lg
 <p className="text-[13px] text-sm text-slate-500 leading-normal">
 Pengelolaan manual dinonaktifkan untuk menjaga integritas relasi data mahasiswa dengan database utama UIN SAIZU.
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6">
 <div className="bg-white border border-slate-200 rounded-lg p-6 group/item hover:border-primary">
 <span className="text-[9px] font-semibold text-slate-300 block mb-2 px-1">Kanal_Sumber_Data</span>
 <div className="flex items-center gap-3">
 <Globe className="h-4 w-4 text-primary" />
 <span className="text-[14px] font-semibold text-slate-900">{syncInfo.source}</span>
 </div>
 </div>
 <div className="bg-white border border-slate-200 rounded-lg p-6 border-l-4 border-l-primary group/item hover:border-primary">
 <span className="text-[9px] font-semibold text-slate-300 block mb-2 px-1">Audit_Sinkronisasi</span>
 <div className="flex items-center gap-3">
 <Activity className="h-4 w-4 text-emerald-500" />
 <span className="text-[14px] font-semibold text-primary">{syncInfo.last_synced_at || 'BELUM_TERCATAT'}</span>
 </div>
 </div>
 </div>

 <div className="space-y-4 pt-4">
 <div className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-lg group/tip hover:bg-emerald-50/30
 <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
 <p className="text-[12px] text-slate-500 text-sm leading-normal pr-2">Pemetaan fakultas digunakan untuk delegasi otoritas admin departemen secara otomatis.</p>
 </div>
 <div className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-lg group/tip hover:bg-primary/5
 <Fingerprint className="h-5 w-5 text-primary shrink-0 mt-0.5" />
 <p className="text-[12px] text-slate-500 text-sm leading-normal pr-2"> Kode unit prodi bersifat absolut dan tervalidasi oleh sistem informasi akademik.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Data List (Tactical Table) */}
 <div className="lg:col-span-2 space-y-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mx-1">
 <div className="relative group flex-1 max-w-xl">
 <Search className="absolute left-6 top-1/2 -/2 h-5 w-5 text-slate-300 group-focus-within:text-primaryz-10" />
 <input
 placeholder="Cari berdasarkan nama sektor prodi..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-16 pr-8 py-2 bg-white border border-slate-200rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-primary/50placeholder:opacity-30"
 />
 </div>
 <div className="flex items-center gap-4 text-slate-400 shrink-0">
 <div className="h-2 w-2 rounded-lg bg-emerald-500" />
 <span className="text-[10px] font-semibold ">STATUS_SYNC: <span className="text-emerald-600">VERIFIED</span></span>
 </div>
 </div>

 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group mx-1">
 <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Identitas_Prodi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Afiliasi_Fakultas</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 pr-14">Mode_Operasi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 bg-white">
 {programs.data.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-6 py-40 text-center">
 <div className="flex flex-col items-center gap-8 opacity-50">
 <div className="p-10 bg-slate-50 rounded-lg border border-slate-200
 <Globe className="h-20 w-20 text-slate-200" />
 </div>
 <p className="text-[12px] font-semibold text-slate-400">SYSTEM_MESSAGE: NO_ACADEMIC_UNIT_DETECTED</p>
 </div>
 </td>
 </tr>
 ) : (
 programs.data.map((p) => (
 <tr key={p.id} className="group/row hover:bg-slate-50/20cursor-default">
 <td className="px-6 py-3">
 <span className="text-[17px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors ">{p.name}</span>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-4">
 <div className="h-7 w-1.5 bg-slate-100 group-hover/row:bg-primaryrounded-lg" />
 <span className="text-[12px] font-semibold text-slate-500 group-hover/row:text-slate-900 transition-colors opacity-50 group-hover:opacity-100">{p.faculty?.name}</span>
 </div>
 </td>
 <td className="px-6 py-3 text-right pr-14">
 <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 group-hover/row:bg-white group-hover/row:text-primary group-hover/row:border-primary">
 <Zap className="w-3.5 h-3.5" />
 SINKRON_READY
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 {programs.meta && (
 <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-200">
 <Pagination meta={programs.meta} />
 </div>
 )}
 </div>

 {/* Tactical Emerald Footer Monitor */}
 <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-1">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheck className="h-7 w-7 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white ">ACADEMIC_SECTOR_PROTOCOL_V3</h4>
 <p className="text-[10px] text-emerald-400 text-sm mt-2 whitespace-nowrap">STATUS: SECURE_CORE_SYNC_ESTABLISHED</p>
 </div>
 </div>
 <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
 Petunjuk Strategis: Program studi merupakan unit granula terkecil dalam sistem distribusi personel KKN. 
 Pastikan mapping fakultas akurat untuk menjamin sinkronisasi pelaporan akademik di seluruh ekosistem digital UIN SAIZU. 
 Record ini bersifat <span className="text-primary font-semibold">Read-Only</span> berbasis otentikasi database pusat.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
 <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
 <span className="text-[11px] font-semibold text-slate-100 ">MONITOR_VERIFIED</span>
 </div>
 <div className="flex gap-5">
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <Fingerprint className="h-7 w-7" />
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
