import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface FinalReportData {
 id: number;
 title: string;
 status: string;
 submitted_at: string | null;
 mahasiswa?: {
 nama?: string | null;
 nim?: string | null;
 } | null;
 kelompok?: {
 nama_kelompok?: string | null;
 } | null;
}

interface PaginationData<T> {
 data: T[];
}

interface Props extends PageProps {
 reports: PaginationData<FinalReportData>;
 filters: {
 status?: string;
 };
}

const statusOptions = [
 { value: '', label: 'Semua Status' },
 { value: 'submitted', label: 'Terkirim' },
 { value: 'reviewed', label: 'Sedang Ditinjau' },
 { value: 'approved', label: 'Disetujui' },
 { value: 'revision', label: 'Perlu Revisi' },
];

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
 const rows = reports.data ?? [];

 const handleFilterChange = (value: string) => {
 router.get(
 '/admin/reports/final',
 { status: value || undefined },
 { preserveState: true, preserveScroll: true, replace: true }
 );
 };

 return (
 <AppLayout title="Laporan Akhir">
 <Head title="Laporan Akhir Mahasiswa" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Laporan Akhir Mahasiswa</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau dokumen laporan akhir mahasiswa yang sudah diunggah untuk kebutuhan validasi akademik.
 </p>
 </div>

 <div className="w-full max-w-xs">
 <FormSelect
 options={statusOptions}
 value={filters.status ?? ''}
 onChange={(event) => handleFilterChange(event.target.value)}
 className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 />
 </div>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Daftar Laporan</h2>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Judul</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Tanggal Kirim</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {rows.length > 0 ? (
 rows.map((report) => (
 <tr key={report.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{report.title}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-800">{report.mahasiswa?.nama ?? 'Mahasiswa tidak ditemukan'}</p>
 <p className="text-xs text-slate-500">{report.mahasiswa?.nim ?? '-'}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {report.kelompok?.nama_kelompok ?? '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {report.submitted_at ?? '-'}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={report.status} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada laporan akhir yang sesuai dengan filter ini.
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
