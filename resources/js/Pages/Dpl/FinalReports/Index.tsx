import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

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

interface Props {
 reports: {
 data: FinalReportRow[];
 };
}

export default function DplFinalReportsIndex({ reports }: Props) {
 const rows = reports.data ?? [];

 return (
 <AppLayout title="Laporan Akhir">
 <Head title="Laporan Akhir Mahasiswa" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-gray-900">Laporan Akhir Mahasiswa</h1>
 <p className="mt-2 text-sm text-gray-500">
 Dokumen laporan akhir dari kelompok yang Anda dampingi.
 </p>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Laporan</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {rows.length > 0 ? (
 rows.map((report) => (
 <tr key={report.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-gray-900">{report.title}</p>
 <p className="text-xs text-gray-500">{report.submitted_at ?? 'Belum tercatat'}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm text-gray-800">{report.mahasiswa?.nama ?? '-'}</p>
 <p className="text-xs text-gray-500">{report.mahasiswa?.nim ?? '-'}</p>
 </td>
 <td className="px-6 py-4 text-sm text-gray-600">{report.kelompok?.nama_kelompok ?? '-'}</td>
 <td className="px-6 py-4">
 <StatusBadge status={report.status} />
 </td>
 <td className="px-6 py-4 text-right">
 <Link href={`/dpl/final-reports/${report.id}`} className="text-sm font-medium text-primary hover:underline">Detail</Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
 Belum ada laporan akhir yang masuk.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </section>
 </div>
 </AppLayout>
 );
}
