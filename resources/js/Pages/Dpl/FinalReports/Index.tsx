import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { FileText, Calendar, Users, ArrowRight } from 'lucide-react';

interface FinalReportRow {
 id: number;
 title: string;
 status: string;
 submitted_at?: string | null;
 review_notes?: string | null;
 mahasiswa?: {
 nama?: string | null;
 nim?: string | null;
 } | null;
 kelompok?: {
 nama_kelompok?: string | null;
 } | null;
}

interface Props extends PageProps {
 reports: {
 data: FinalReportRow[];
 };
 filters: {
 status?: string;
 };
}

export default function DplFinalReportsIndex({ reports }: Props) {
 const rows = reports?.data ?? [];

 return (
 <AppLayout title="Laporan Akhir Mahasiswa">
 <Head title="Laporan Akhir Mahasiswa" />

 <div className="space-y-8 pb-16">
 <div className="rounded-lg border border-slate-200 bg-white p-8
 <div className="flex items-start justify-between gap-6">
 <div className="space-y-3">
 <p className="text-[11px] font-semibold text-slate-400">
 DPL Final Report Desk
 </p>
 <h1 className="text-3xl font-semibold text-slate-900">
 Laporan Akhir Mahasiswa
 </h1>
 <p className="max-w-2xl text-sm font-medium leading-normal text-slate-500">
 Halaman ini menampilkan laporan akhir mahasiswa dari kelompok yang Anda dampingi.
 Anda dapat membuka detail laporan untuk meninjau isi, status, dan catatan review.
 </p>
 </div>

 <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-right">
 <p className="text-[10px] font-semibold text-slate-400">
 Total Laporan
 </p>
 <p className="mt-1 text-2xl font-semibold text-slate-900">
 {rows.length}
 </p>
 </div>
 </div>
 </div>

 <div className="overflow-hiddenrounded-lg border border-slate-200 bg-white
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-100">
 <thead className="bg-slate-50/80">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400">
 Laporan
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400">
 Mahasiswa
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400">
 Kelompok
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400">
 Status
 </th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400">
 Aksi
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {rows.length > 0 ? rows.map((report) => (
 <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
 <td className="px-6 py-5 align-top">
 <div className="flex items-start gap-4">
 <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-500">
 <FileText className="h-5 w-5" />
 </div>
 <div className="space-y-2">
 <p className="text-sm font-semibold text-slate-900">
 {report.title}
 </p>
 <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
 <Calendar className="h-3.5 w-3.5" />
 <span>{report.submitted_at ?? 'Belum tercatat'}</span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-5 align-top">
 <div className="space-y-1">
 <p className="text-sm text-sm text-slate-900">
 {report.mahasiswa?.nama ?? '-'}
 </p>
 <p className="text-xs font-medium text-slate-500">
 {report.mahasiswa?.nim ?? '-'}
 </p>
 </div>
 </td>
 <td className="px-6 py-5 align-top">
 <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-sm text-slate-700">
 <Users className="h-4 w-4 text-slate-400" />
 <span>{report.kelompok?.nama_kelompok ?? '-'}</span>
 </div>
 </td>
 <td className="px-6 py-5 align-top">
 <StatusBadge status={report.status} />
 </td>
 <td className="px-6 py-5 align-top text-right">
 <Link
 href={`/dpl/final-reports/${report.id}`}
 className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
 >
 Detail
 <ArrowRight className="h-4 w-4" />
 </Link>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
 Belum ada laporan akhir yang masuk untuk kelompok yang Anda dampingi.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
