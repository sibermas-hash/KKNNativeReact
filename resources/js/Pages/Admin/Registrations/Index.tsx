import { Link, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 Filter,
 IdCard,
 ShieldCheck,
 
 Cpu,
 Fingerprint,
 ChevronRight,
 Activity,
} from 'lucide-react';

interface RegData {
 id: number;
 status: string;
 registration_date: string;
 student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string } };
 period: { name: string };
 group: { name: string } | null;
}

interface PaginatedData {
 data: RegData[];
 meta?: PaginationMeta;
 links?: { prev: string | null; next: string | null };
}

interface Props extends PageProps {
 registrations: PaginatedData;
 filters: { status?: string };
}

export default function RegistrationsIndex({ registrations, filters }: Props) {
 const statusFilter = useForm({ status: filters.status ?? '' });
 const statuses = [
 { value: '', label: 'Semua Status' },
 { value: 'pending', label: 'Menunggu Verifikasi' },
 { value: 'document_submitted', label: 'Dokumen Terkirim' },
 { value: 'approved', label: 'Disetujui' },
 { value: 'rejected', label: 'Ditolak' },
 ];

 function handleFilter(status: string) {
 statusFilter.setData('status', status);
 statusFilter.get('/admin/registrations', { preserveState: true });
 }

 return (
 <AppLayout title="Verifikasi Pendaftaran KKN">
 <Head title="Manajemen Pendaftaran" />
 
 <div className="space-y-10 pb-16">
 {/* 
 Emerald Premium Header 
 Refining from basic header to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
 <Activity className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 REGISTRATION_GATEWAY_AUDIT_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Audit <span className="text-emerald-300">Registrasi</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Filter utama otorisasi permohonan pendaftaran mahasiswa peserta KKN berdasarkan validasi dokumen akademik yang telah diunggah dalam sistem integrasi UIN SAIZU.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stattransition-transform">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
 <IdCard className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-emerald-200/60 block mb-1.5">Antrean Masuk</span>
 <span className="text-2xl font-semibold text-white">{registrations.meta?.total || 0} Records</span>
 </div>
 </div>
 
 <div className="relative group w-64">
 <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
 <Filter className="h-4 w-4 text-emerald-300" />
 </div>
 <FormSelect
 options={statuses}
 value={filters.status ?? ''}
 onChange={(e) => handleFilter(e.target.value)}
 label=""
 className="pl-14 pr-6 py-2 bg-white border border-transparent rounded-lg text-xs font-semibold text-slate-900 focus:border-emerald-500/50 focus:ring-0cursor-pointer appearance-none"
 />
 </div>
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-6 py-6 text-left text-xs text-sm text-slate-400">Identitas Mahasiswa</th>
 <th className="px-6 py-6 text-left text-xs text-sm text-slate-400">Program Studi</th>
 <th className="px-6 py-6 text-center text-xs text-sm text-slate-400 whitespace-nowrap">Periode</th>
 <th className="px-6 py-6 text-center text-xs text-sm text-slate-400">Status Verifikasi</th>
 <th className="px-6 py-6 text-right text-xs text-sm text-slate-400">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 text-slate-700">
 {(registrations.data ?? []).map((reg) => (
 <tr key={reg.id} className="group hover:bg-slate-50/50">
 <td className="px-6 py-6">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-sm text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary">
 {reg.student.name.charAt(0)}
 </div>
 <div className="flex flex-col">
 <span className="text-[14px] text-sm text-slate-900 group-hover:text-primary transition-colors ">
 {reg.student.name}
 </span>
 <div className="flex items-center gap-2 mt-1.5">
 <span className="text-[10px] font-medium text-slate-400 ">
 NIM: {reg.student.nim}
 </span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center gap-2">
 <div className="h-3 w-1 bg-primary/30 rounded-lg" />
 <span className="text-[11px] text-sm text-slate-700 ">
 {reg.student.program?.name ?? 'Prodi Belum Diatur'}
 </span>
 </div>
 <span className="text-[9px] text-sm text-slate-400 ml-3 truncate max-w-[200px]">
 {reg.student.faculty?.name || 'Fakultas Belum Diatur'}
 </span>
 </div>
 </td>
 <td className="px-6 py-6 text-center">
 <div className="inline-flex px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg group-hover:bg-white
 <span className="text-[10px] text-sm text-slate-600 ">
 {reg.period.name}
 </span>
 </div>
 </td>
 <td className="px-6 py-6 text-center">
 <StatusBadge status={reg.status} className="px-4 py-1.5 rounded-xl text-[9px] text-sm " />
 </td>
 <td className="px-6 py-6 text-right">
 <div className="flex justify-endx-2 group-hover:translate-x-0">
 <Link
 href={`/admin/registrations/${reg.id}`}
 className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-primary/50 hover:text-primary text-slate-400 rounded-xl text-xs text-sm group/btn"
 >
 Detail
 <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </Link>
 </div>
 </td>
 </tr>
 ))}
 {(registrations.data ?? []).length === 0 && (
 <tr>
 <td colSpan={5} className="px-6 py-24 text-center">
 <div className="flex flex-col items-center gap-4 opacity-50">
 <div className="p-8 bg-slate-50 rounded-lg">
 <ShieldCheck className="h-12 w-12 text-slate-200" />
 </div>
 <p className="text-[10px] text-sm text-slate-500">Tidak ada antrean pendaftaran saat ini</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 {registrations.meta && (
 <div className="px-6 py-6 border-t border-slate-200 bg-slate-50/50">
 <Pagination meta={registrations.meta} />
 </div>
 )}
 </div>

 {/* Professional Governance Footer */}
 <div className="p-10 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-primary/10 rounded-xl border border-primary">
 <Zap className="h-5 w-5 text-primary" />
 </div>
 <h4 className="text-[11px] text-sm text-slate-300 ">Pedoman Verifikasi Pendaftaran</h4>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-normal max-w-4xl opacity-50">
 Verifikasi pendaftaran mahasiswa merupakan filter utama dalam ekosistem KKN. 
 Setiap pendaftaran yang telah disetujui akan secara otomatis dialokasikan ke dalam pembentukan kelompok dan unit posko strategis. 
 Pastikan validasi NIM dan Prodi telah sesuai dengan basis data akademik universitas sebelum melakukan persetujuan final.
 </p>
 </div>
 <div className="flex flex-col items-end gap-4 shrink-0 border-l border-slate-800 pl-10">
 <div className="flex items-center gap-2">
 <div className="h-2 w-2 rounded-lg bg-primary" />
 <span className="text-[10px] text-sm text-slate-100 ">Status: Sinkron Aktif</span>
 </div>
 <div className="flex gap-4">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600">
 <Fingerprint className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
