import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface WorkProgramData {
 id: number;
 title: string;
 status: string;
 submitted_at: string | null;
 kelompok?: {
 nama_kelompok?: string | null;
 lokasi?: {
 full_name?: string | null;
 village_name?: string | null;
 } | null;
 } | null;
 group?: {
 name: string;
 location?: {
 name?: string;
 } | null;
 };
}

interface Props extends PageProps {
 workPrograms: {
 data: WorkProgramData[];
 };
 filters: {
 status?: string;
 };
}

export default function AdminWorkProgramsIndex({ workPrograms, filters }: Props) {
 const handleFilterChange = (value: string) => {
 router.get(
 '/admin/reports/work-programs',
 { status: value || undefined },
 { preserveState: true, preserveScroll: true, replace: true },
 );
 };

 const rows = workPrograms.data ?? [];

 return (
 <AppLayout title="Program Kerja">
 <Head title="Arsip Program Kerja" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Arsip Program Kerja</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau program kerja yang diajukan kelompok untuk kebutuhan review dan audit.
 </p>
 </div>

 <div className="w-full max-w-xs">
 <FormSelect
 value={filters.status ?? ''}
 onChange={(event) => handleFilterChange(event.target.value)}
 options={[
 { value: '', label: 'Semua status' },
 { value: 'draft', label: 'Draf' },
 { value: 'submitted', label: 'Diajukan' },
 { value: 'approved', label: 'Disetujui' },
 { value: 'revision', label: 'Perlu revisi' },
 { value: 'rejected', label: 'Ditolak' },
 { value: 'completed', label: 'Selesai' },
 ]}
 />
 </div>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Daftar Program Kerja</h2>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Judul
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Kelompok
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Lokasi
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Diajukan
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Status
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {rows.length > 0 ? (
 rows.map((program) => (
 <tr key={program.id}>
 <td className="px-6 py-4 text-sm font-medium text-slate-900">{program.title}</td>
 <td className="px-6 py-4 text-sm text-slate-700">
 {program.group?.name || program.kelompok?.nama_kelompok || '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {program.group?.location?.name ||
 program.kelompok?.lokasi?.full_name ||
 program.kelompok?.lokasi?.village_name ||
 '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">{program.submitted_at || '-'}</td>
 <td className="px-6 py-4">
 <StatusBadge status={program.status} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada program kerja pada filter ini.
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
