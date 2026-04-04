import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface ReportRow {
 id: number;
 title: string;
 type: string;
 status: string;
 file_name: string;
 submitted_at: string | null;
 user: {
 name: string;
 };
 group: {
 name: string;
 village: string;
 };
}

interface Props {
 reports: {
 data: ReportRow[];
 };
 summary: {
 total_reports: number;
 pending_review: number;
 };
}

const typeLabels: Record<string, string> = {
 final_report: 'Laporan akhir',
 village_map: 'Peta desa',
 video_documentation: 'Dokumentasi video',
 photo_documentation: 'Dokumentasi foto',
 attendance_sheet: 'Daftar hadir',
 activity_proposal: 'Rancangan kegiatan',
 evaluation_report: 'Laporan evaluasi',
};

export default function ReportsIndex({ reports, summary }: Props) {
 const [search, setSearch] = useState('');

 const filteredReports = useMemo(() => {
 const keyword = search.trim().toLowerCase();

 if (!keyword) {
 return reports.data;
 }

 return reports.data.filter((report) => {
 const haystack = [
 report.title,
 report.type,
 report.user.name,
 report.group.name,
 report.group.village,
 report.file_name,
 ]
 .join(' ')
 .toLowerCase();

 return haystack.includes(keyword);
 });
 }, [reports.data, search]);

 return (
 <AppLayout title="Laporan Kegiatan">
 <Head title="Repositori Laporan" />

 <div className="space-y-6">
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm font-medium text-slate-500">Total laporan</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.total_reports}</p>
 </div>
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm font-medium text-slate-500">Menunggu review</p>
 <p className="mt-2 text-3xl font-semibold text-amber-600">{summary.pending_review}</p>
 </div>
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm font-medium text-slate-500">Laporan terfilter</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">{filteredReports.length}</p>
 </div>
 </section>

 <section className="rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Repositori Laporan</h1>
 <p className="mt-1 text-sm text-slate-500">
 Pantau laporan yang diunggah mahasiswa dan unduh berkas yang diperlukan untuk review.
 </p>
 </div>

 <div className="w-full max-w-sm">
 <input
 type="search"
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Cari judul, mahasiswa, atau kelompok..."
 className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 />
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Judul
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Pengunggah
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Kelompok
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Tipe
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Status
 </th>
 <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
 Aksi
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {filteredReports.length > 0 ? (
 filteredReports.map((report) => (
 <tr key={report.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{report.title}</p>
 <p className="mt-1 text-xs text-slate-500">{report.file_name}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-700">{report.user.name}</td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-800">{report.group.name}</p>
 <p className="mt-1 text-xs text-slate-500">{report.group.village}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {typeLabels[report.type] || report.type}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={report.status} />
 </td>
 <td className="px-6 py-4 text-right">
 <Link
 href={`/reports/${report.id}/download`}
 className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh
 </Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
 Tidak ada laporan yang sesuai dengan pencarian.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>
 </div>
 </AppLayout>
 );
}
