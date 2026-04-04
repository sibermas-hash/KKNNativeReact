import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, StatusBadge } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import type { PageProps } from '@/types';

interface ReportData {
 id: number;
 date: string;
 title: string;
 status: string;
 review_notes?: string | null;
}

interface PaginationPayload<T> {
 data: T[];
 meta?: PaginationMeta;
 current_page?: number;
 last_page?: number;
 per_page?: number;
 total?: number;
 from?: number | null;
 to?: number | null;
 links?: PaginationMeta['links'];
}

interface Props extends PageProps {
 reports: PaginationPayload<ReportData>;
 isWorkshopPassed?: boolean;
}

function resolvePaginationMeta(payload: PaginationPayload<unknown>): PaginationMeta | null {
 if (payload.meta) {
 return payload.meta;
 }

 if (typeof payload.last_page === 'number' && Array.isArray(payload.links)) {
 return {
 current_page: payload.current_page ?? 1,
 last_page: payload.last_page,
 per_page: payload.per_page ?? payload.data.length,
 total: payload.total ?? payload.data.length,
 from: payload.from ?? null,
 to: payload.to ?? null,
 links: payload.links,
 };
 }

 return null;
}

export default function StudentDailyReportsIndex({ reports, isWorkshopPassed = true }: Props) {
 const rows = reports.data ?? [];
 const paginationMeta = resolvePaginationMeta(reports);

 return (
 <AppLayout title="Laporan Harian">
 <Head title="Laporan Harian" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Laporan Harian</h1>
 <p className="mt-2 text-sm text-slate-500">
 Kelola laporan kegiatan harian Anda dan pantau status verifikasi dari DPL.
 </p>
 </div>

 <div className="flex gap-3">
 <Link
 href="/student/daily-reports/download-compilation"
 className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh kompilasi
 </Link>
 <Link
 href="/student/daily-reports/create"
 className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
 >
 Buat laporan
 </Link>
 </div>
 </div>
 </section>

 {!isWorkshopPassed && (
 <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
 Anda wajib lulus pembekalan sebelum dapat mengirim laporan harian.
 </section>
 )}

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Riwayat Laporan</h2>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Tanggal
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Judul
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Catatan
 </th>
 <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
 Aksi
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {rows.length > 0 ? (
 rows.map((report) => (
 <tr key={report.id}>
 <td className="px-6 py-4 text-sm text-slate-700">{report.date}</td>
 <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.title}</td>
 <td className="px-6 py-4">
 <StatusBadge status={report.status} />
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {report.review_notes || '-'}
 </td>
 <td className="px-6 py-4 text-right">
 <Link
 href={`/student/daily-reports/${report.id}/edit`}
 className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Ubah
 </Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada laporan harian.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {paginationMeta && (
 <div className="px-6 py-4">
 <Pagination meta={paginationMeta} />
 </div>
 )}
 </section>
 </div>
 </AppLayout>
 );
}
