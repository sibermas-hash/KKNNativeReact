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
 Zap,
 Search,
} from 'lucide-react';
import { clsx } from 'clsx';

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
 { value: '', label: 'ALL_STATUS_RECORDS' },
 { value: 'pending', label: 'PENDING_VERIFICATION' },
 { value: 'document_submitted', label: 'DOCS_INTEGRATED' },
 { value: 'approved', label: 'APPROVED_CLEARANCE' },
 { value: 'rejected', label: 'REJECTED_AUDIT' },
 ];

 function handleFilter(status: string) {
 statusFilter.setData('status', status);
 statusFilter.get('/admin/registrations', { preserveState: true });
 }

 return (
 <AppLayout title="Audit Registrasi KKN">
 <Head title="Manajemen Pendaftaran" />
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 REGISTRATION_GATEWAY_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Activity className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Audit <span className="text-primary">Registrasi</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <IdCard className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Antrean_Masuk</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {registrations.meta?.total || 0} RECORDS
 </span>
 </div>
 </div>
 </div>

 <div className="relative group w-64">
 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10 text-emerald-500">
 <Filter className="h-3.5 w-3.5" />
 </div>
 <FormSelect
 options={statuses}
 value={filters.status ?? ''}
 onChange={(e) => handleFilter(e.target.value)}
 className="pl-12 pr-6 py-2.5 bg-white border border-slate-100 rounded-lg text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 />
 </div>
 </div>
 </div>

 {/* Verification Table */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">PERSONNEL_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">FACULTY_PROGRAM</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">TEMPORAL_ID</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">AUDIT_STATUS</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">INITIALIZE_ACTION</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {(registrations.data ?? []).map((reg) => (
 <tr key={reg.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center ">
 {reg.student.name.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {reg.student.name}
 </span>
 <span className="text-[9px] font-semibold text-slate-400 mt-0.5 opacity-50">
 NIM: {reg.student.nim}
 </span>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
 <span className="text-[10px] font-semibold text-slate-900 truncate max-w-[180px]">
 {reg.student.program?.name || 'PROGRAM_UNSET'}
 </span>
 </div>
 <span className="text-[8px] font-semibold text-slate-400 ml-3.5 opacity-50">
 {reg.student.faculty?.name || 'FACULTY_UNDEFINED'}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="inline-flex px-3 py-1.5 bg-white border border-slate-100 rounded-lg ">
 <span className="text-[9px] font-semibold text-slate-900 opacity-75">
 {reg.period.name}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <StatusBadge status={reg.status} className="px-4 py-1.5 rounded-lg text-[8px] font-semibold border-none " />
 </td>
 <td className="px-8 py-6 text-right">
 <Link
 href={`/admin/registrations/${reg.id}`}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-primary transition-all rounded-lg text-[9px] font-semibold group/btn"
 >
 VERIFY_LOG
 <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
 </Link>
 </td>
 </tr>
 ))}
 {(registrations.data ?? []).length === 0 && (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <ShieldCheck className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">ZERO_PENDING_REGISTRATIONS</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 {registrations.meta && (
 <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30">
 <Pagination meta={registrations.meta} />
 </div>
 )}
 </div>

 {/* Operational Governance Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Zap className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">REGISTRATION_VERIFICATION_PROTOCOL_V3</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: SYSTEM_INTEGRITY_SAFE</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Verifikasi registrasi adalah jantung dari mobilisasi personel KKN. 
 Setiap entri yang disetujui akan secara otomatis dijadwalkan untuk penugasan sektor. 
 Lakukan audit NIM dan validasi dokumen dengan presisi operasional maksimal.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">REALTIME_GATEWAY_SYNC</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
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
