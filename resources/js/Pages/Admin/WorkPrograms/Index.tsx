import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
 Flag,
 Users,
 MapPin,
 Calendar,
 Search,
 Filter,
 FileText,
 Info,
 Activity,
 Briefcase,
 Fingerprint,
 ShieldCheck,
} from 'lucide-react';
import { Head } from '@inertiajs/react';

interface WorkProgramData {
 id: number;
 title: string;
 status: string;
 submitted_at: string | null;
 group: { name: string; location?: { name: string } };
}

interface Props extends PageProps {
 workPrograms: { data: WorkProgramData[] };
 filters: { status?: string };
}

export default function AdminWorkProgramsIndex({ workPrograms, filters }: Props) {
 const onFilterChange = (value: string) => {
 const next = value ? `/admin/reports/work-programs?status=${value}` : '/admin/reports/work-programs';
 window.location.href = next;
 };

 return (
 <AppLayout title="Arsip Program Kerja">
 <Head title="Repositori Program Kerja" />
 
 <div className="space-y-8 pb-24">
 {/* 
 Emerald Premium Header 
 Refining from basic header to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-6 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <Briefcase className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-xs font-semibold text-emerald-100 ">
 _ORCHESTRATOR_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Arsip <span className="text-emerald-300">Program Kerja</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Repositori inisiatif strategis, manajemen pelaporan draf, dan orkestrasi program pengabdian mahasiswa dalam ekosistem KKN UIN SAIZU.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stattransition-transform">
 <div className="p-3 bg-white rounded-lg text-primary ">
 <Activity className="h-6 w-6" />
 </div>
 <div>
 <span className="text-xs font-semibold text-emerald-200/60 block mb-1.5">Total Inisiatif</span>
 <span className="text-xl font-semibold text-white ">{workPrograms.data?.length || 0} PROGJA</span>
 </div>
 </div>
 </div>
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div className="relative group max-w-lg w-full">
 <Search className="absolute left-6 top-1/2 -/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
 <input
 placeholder="Cari program kerja, judul, atau kelompok..."
 className="w-full h-15 pl-14 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-primary/50
 />
 </div>

 <div className="flex items-center gap-5">
 <div className="p-3.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg group flex items-center gap-4">
 <Filter className="h-4.5 w-4.5  transition-colors" />
 </div>
 <FormSelect
 options={[
 { value: '', label: 'Semua Status Program' },
 { value: 'submitted', label: 'Status: Diajukan' },
 { value: 'approved', label: 'Status: Terverifikasi' },
 { value: 'revision', label: 'Status: Perlu Revisi' },
 { value: 'draft', label: 'Status: Draft' },
 ]}
 value={filters.status ?? ''}
 onChange={(e) => onFilterChange(e.target.value)}
 className="bg-white border-slate-200 text-xs text-sm text-slate-600 w-64 h-15 rounded-lg focus:border-primary/50 px-6 cursor-pointer"
 />
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-6 py-6 text-left text-xs text-sm text-slate-400">Nama Program & ID</th>
 <th className="px-6 py-6 text-left text-xs text-sm text-slate-400">Unit Kelompok</th>
 <th className="px-6 py-6 text-left text-xs text-sm text-slate-400">Lokasi Penugasan</th>
 <th className="px-6 py-6 text-center text-xs text-sm text-slate-400">Waktu Pengajuan</th>
 <th className="px-6 py-6 text-right text-xs text-sm text-slate-400">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {workPrograms.data?.length > 0 ? workPrograms.data?.map((p) => (
 <tr key={p.id} className="group/row hover:bg-slate-50/20">
 <td className="px-6 py-3">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/row:bg-primary group-hover/row:text-whitefont-semibold">
 <Flag className="h-5.5 w-5.5" />
 </div>
 <div className="flex flex-col gap-1.5 truncate max-w-sm">
 <span className="text-sm font-semibold text-slate-900 group-hover/row:text-primary transition-colors leading-normal truncate">{p.title}</span>
 <span className="text-xs text-sm text-slate-300">Entry ID: #{p.id.toString().padStart(4, '0')}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover/row:bg-primary/10 group-hover/row:text-primary">
 <Users className="h-4 w-4" />
 </div>
 <span className="text-sm text-slate-700 ">{p.group?.name}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-2 text-xs text-sm text-slate-400 group-hover/row:text-slate-600 transition-colors">
 <MapPin className="h-3.5 w-3.5 group-hover/row:opacity-100 transition-opacity" />
 <span className="truncate max-w-[150px]">{p.group?.location?.name ?? 'Belum Diatur'}</span>
 </div>
 </td>
 <td className="px-6 py-3 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
 <Calendar className="h-3 w-3 text-slate-400" />
 <span className="text-xs font-semibold text-slate-700">{p.submitted_at ?? '--'}</span>
 </div>
 </td>
 <td className="px-6 py-3 text-right">
 <StatusBadge status={p.status} className="px-4 py-1.5 rounded-lg text-xs text-sm border-none />
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-6 py-24 text-center">
 <div className="flex flex-col items-center gap-5">
 <div className="p-10 bg-slate-50 rounded-lg border border-slate-200
 <FileText className="h-12 w-12 text-slate-200" />
 </div>
 <p className="text-sm text-slate-400">Belum ada program kerja yang diajukan</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Tactical Footer Monitor */}
 <div className="p-10 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheck className="h-5.5 w-5.5 text-primary" />
 </div>
 <h4 className="text-sm font-semibold text-white ">TATA_KELOLA_INISIATIF_STRATEGIS</h4>
 </div>
 <p className="text-sm text-slate-400 text-sm leading-normal max-w-4xl">
 Seluruh Program Kerja (PROGJA) yang terdaftar merepresentasikan rencana aksi strategis unit KKN. 
 Setiap pengajuan wajib divalidasi oleh Dosen Pembimbing Lapangan (DPL) sebelum diarsipkan sebagai basis 
 evaluasi integritas pengabdian mahasiswa dalam ekosistem KKN UIN SAIZU.
 </p>
 </div>
 <div className="flex flex-col items-end gap-3 shrink-0 border-l border-slate-800 pl-10">
 <div className="flex items-center gap-2 mb-2">
 <div className="h-2 w-2 rounded-lg bg-emerald-500 />
 <span className="text-xs font-semibold text-slate-100 ">DATA_INTEGRITY_VERIFIED</span>
 </div>
 <div className="flex gap-4">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 transition-colors hover:text-primary
 <Info className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 transition-colors hover:text-primary
 <Fingerprint className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="text-center pt-8">
 <p className="text-xs font-semibold text-slate-300 ">
 Strategic Initiative Archive • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
