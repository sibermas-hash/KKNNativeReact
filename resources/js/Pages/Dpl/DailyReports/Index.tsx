import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { route } from 'ziggy-js';

interface ReportRow {
 id: number;
 date: string;
 title: string;
 status: string;
 student: {
 name: string;
 nim: string;
 };
 group: {
 name: string;
 };
}

interface Props {
 reports: {
 data: ReportRow[];
 links?: Array<{ url: string | null; label: string; active: boolean }>;
 };
 filters: {
 status?: string;
 };
}

export default function DplDailyReportsIndex({ reports, filters }: Props) {
 const handleApproveAll = () => {
 if (window.confirm('Setujui semua laporan harian yang masih diajukan?')) {
 router.post(route('dpl.daily-reports.approve-all'));
 }
 };

 return (
 <AppLayout title="Laporan Harian">
 <Head title="Laporan Harian DPL" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Review Laporan Harian</h1>
 <p className="mt-2 text-sm text-slate-500">
 Tinjau laporan harian mahasiswa, setujui, atau kirim kembali untuk revisi.
 </p>
 </div>
 <button
 type="button"
 onClick={handleApproveAll}
 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
 >
 Setujui Semua yang Diajukan
 </button>
 </div>
 </section>

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <p className="text-sm text-slate-500">{reports.data.length} laporan pada halaman ini.</p>
 <div>
 <label htmlFor="status" className="mr-3 text-sm text-slate-500">Status</label>
 <select
 id="status"
 value={filters.status ?? ''}
 onChange={(event) => {
 router.get('/dpl/daily-reports', { status: event.target.value || undefined }, { preserveState: true });
 }}
 className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 >
 <option value="">Semua status</option>
 <option value="submitted">Diajukan</option>
 <option value="disetujui">Disetujui</option>
 <option value="revisi">Revisi</option>
 </select>
 </div>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Tanggal</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Judul</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {reports.data.length > 0 ? (
 reports.data.map((report) => (
 <tr key={report.id}>
 <td className="px-6 py-4 text-sm text-slate-600">{report.date}</td>
 <td className="px-6 py-4 text-sm font-medium text-slate-800">{report.title}</td>
 <td className="px-6 py-4">
 <p className="text-sm text-slate-800">{report.student.name}</p>
 <p className="text-xs text-slate-500">{report.student.nim}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">{report.group.name}</td>
 <td className="px-6 py-4">
 <StatusBadge status={report.status} />
 </td>
 <td className="px-6 py-4 text-right">
 <Link href={`/dpl/daily-reports/${report.id}`} className="text-sm font-medium text-primary hover:underline">
 Tinjau
 </Link>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
 Tidak ada laporan yang sesuai dengan filter saat ini.
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
