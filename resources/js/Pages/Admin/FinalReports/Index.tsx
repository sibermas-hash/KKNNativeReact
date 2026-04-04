import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
 FileCheck,
 Filter,
 Users,
 Calendar,
 Search,
 GraduationCap,
 ShieldCheck,
 Fingerprint,
 IdCard,
 FileText,
 Cpu
} from 'lucide-react';
import { router, Head } from '@inertiajs/react';

interface FinalReportData {
 id: number;
 title: string;
 status: string;
 score: string | number | null;
 submitted_at: string | null;
 student: { name: string; nim: string };
 group: { name: string };
}

interface Props extends PageProps {
 reports: { data: FinalReportData[] };
 filters: { status?: string };
}

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
 const onFilterChange = (value: string) => {
 router.get('/admin/reports/final', { status: value }, { preserveState: true });
 };

 return (
 <AppLayout title="Validasi Dokumentasi Akhir">
 <Head title="Validasi Laporan Akhir" />
 
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
 <FileCheck className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 FINAL_ASSET_ORCHESTRATION_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Validasi <span className="text-emerald-300">Laporan</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Verifikasi produk akademik final mahasiswa untuk sinkronisasi nilai akhir dan penerbitan sertifikat kelulusan digital KKN UIN SAIZU.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:transition-transform">
 <FileText className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-emerald-200/60 block mb-1.5">Menunggu Verifikasi</span>
 <span className="text-2xl font-semibold text-white">{reports.data?.length || 0} Record</span>
 </div>
 </div>
 </div>
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:mx-2">
 <div className="relative group flex-1 max-w-2xl">
 <Search className="absolute left-6 top-1/2 -/2 h-5 w-5 text-slate-300 group-focus-within:text-primaryz-10" />
 <input
 placeholder="Cari berdasarkan NIM, Nama, atau Judul Laporan Akhir..."
 className="w-full pl-16 pr-8 py-2 bg-white border border-slate-200rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-primary/50placeholder:opacity-30"
 />
 </div>

 <div className="flex items-center gap-6 shrink-0">
 <div className="flex items-center gap-4 bg-white/50 p-2rounded-lg border border-slate-200
 <div className="p-3.5 bg-white text-slate-400 border border-slate-200 rounded-lg
 <Filter className="h-5 w-5" />
 </div>
 <FormSelect
 options={[
 { value: '', label: 'SEMUA STATUS LAPORAN' },
 { value: 'submitted', label: 'STATUS: TERKIRIM' },
 { value: 'reviewed', label: 'STATUS: SEDANG DITINJAU' },
 { value: 'approved', label: 'STATUS: TERVERIFIKASI' },
 { value: 'revision', label: 'STATUS: PERLU REVISI' },
 ]}
 value={filters.status ?? ''}
 onChange={(e) => onFilterChange(e.target.value)}
 className="bg-transparent border-none text-xs font-semibold text-slate-600 w-64 h-12 focus:ring-0 cursor-pointer px-4 appearance-none"
 />
 </div>
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group lg:mx-2">
 <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Identitas_Dokumen_Final</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Data_Personel</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Unit_Sektor</th>
 <th className="px-6 py-3 text-center text-xs font-semibold text-slate-400">Skor_Audit</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 pr-14">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 bg-white">
 {(reports.data ?? []).length > 0 ? (reports.data ?? []).map((r) => (
 <tr key={r.id} className="group/row hover:bg-slate-50/20cursor-default">
 <td className="px-6 py-3">
 <div className="flex items-start gap-6 min-w-[350px]">
 <div className="h-14 w-14 rounded-lg bg-slate-900 border border-slate-800 text-primary flex items-center justify-center shrink-0 group-hover/row:transition-transform
 <FileCheck className="h-7 w-7" />
 </div>
 <div className="flex flex-col gap-2 min-w-0">
 <span className="text-[17px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors truncate pr-4">
 {r.title}
 </span>
 <div className="flex items-center gap-3 mt-1 px-3 py-1 bg-slate-50 w-fit rounded-lg border border-slate-200">
 <Calendar className="h-3.5 w-3.5 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">Log_Submit: {r.submitted_at ?? 'MENUNGGU_ENTRY'}</span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 text-slate-300 font-semibold text-lg flex items-center justify-center group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary
 {r.student?.name.charAt(0)}
 </div>
 <div className="flex flex-col gap-1.5 min-w-0">
 <span className="text-[14px] font-semibold text-slate-900 truncate group-hover/row:text-primary transition-colors">{r.student?.name}</span>
 <div className="flex items-center gap-2">
 <IdCard className="h-3.5 w-3.5 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 px-2 bg-slate-50 rounded-lg py-0.5 border border-slate-200">NIM: {r.student?.nim}</span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-3 w-fit px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
 <Users className="h-4 w-4 text-primary opacity-50" />
 <span className="text-[12px] font-semibold text-primary group-hover/row:transition-transform">
 {r.group?.name}
 </span>
 </div>
 </td>
 <td className="px-6 py-3 text-center">
 <div className="inline-flex items-center justify-center w-16 h-16rounded-lg bg-slate-50 border border-slate-200 group-hover/row:border-primary/30 group-hover/row:bg-whitetransform group-hover/row: group-hover/row:/10 group-hover/row:">
 <span className="text-xl font-semibold text-slate-900">
 {r.score ?? '--'}
 </span>
 </div>
 </td>
 <td className="px-6 py-8 text-right pr-14">
 <div className="flex justify-end">
 <StatusBadge status={r.status} className="px-6 py-2.5 rounded-lg text-xs font-semibold border-none group-hover/row:transition-transform" />
 </div>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-6 py-40 text-center">
 <div className="flex flex-col items-center gap-6 opacity-50">
 <div className="p-10 bg-slate-50 rounded-lg border border-slate-200
 <GraduationCap className="h-20 w-20 text-slate-200" />
 </div>
 <p className="text-[12px] font-semibold text-slate-400">SYSTEM_INFO: NO_FINAL_REPORTS_SUBMITTED</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Tactical Emerald Footer Monitor */}
 <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-2">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheck className="h-7 w-7 text-primary" />
 </div>
 <h4 className="text-[11px] font-semibold text-white ">FINAL_AUDIT_GOVERNANCE_V3</h4>
 </div>
 <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
 Laporan Akhir merupakan dokumen akademik primer yang akan menentukan status kelulusan KKN mahasiswa UIN SAIZU. 
 Setiap laporan yang memiliki status <span className="text-primary font-semibold">"Approved"</span> akan memicu orkestrasi nilai akhir secara otomatis dan menjadi basis orisinal 
 dalam penerbitan sertifikat digital resmi. Pastikan audit akademik dilakukan secara mendalam sebelum validasi sistem.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
 <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500 />
 <span className="text-[11px] font-semibold text-slate-100 ">ACADEMIC_INTEGRITY_SYNC</span>
 </div>
 <div className="flex gap-5">
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <Fingerprint className="h-7 w-7" />
 </div>
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <Cpu className="h-7 w-7" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="text-center pt-8 opacity-20">
 <p className="text-[9px] font-semibold text-slate-300 ">
 Academic Integrity Monitor • System Registry Ver. 3.2.0 • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
