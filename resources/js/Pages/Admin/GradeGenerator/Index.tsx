import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';

interface Period {
 id: number;
 name: string;
 grading_start?: string | null;
 grading_end?: string | null;
}

interface Group {
 id: number;
 period_id: number;
 code: string;
 name: string;
 desa: string;
 kecamatan: string;
 kabupaten: string;
 dpl: string;
}

interface Props {
 periods: Period[];
 groups: Group[];
}

export default function GradeGeneratorIndex({ periods, groups }: Props) {
 const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

 const activeGroups = useMemo(() => {
 if (!selectedPeriodId) {
 return groups;
 }

 return groups.filter((group) => String(group.period_id) === selectedPeriodId);
 }, [groups, selectedPeriodId]);

 const selectedPeriod = periods.find((period) => String(period.id) === selectedPeriodId) ?? null;

 return (
 <AppLayout title="Generator Nilai">
 <Head title="Generator Nilai" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Generator Nilai</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Halaman ini dipakai untuk memilih kelompok yang akan diproses atau diekspor ke blanko nilai.
 Gunakan filter periode untuk mempersempit daftar kelompok yang sedang dinilai.
 </p>
 </div>

 <div className="grid gap-3 text-sm text-slate-600">
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
 Total kelompok: <span className="font-semibold text-slate-900">{activeGroups.length}</span>
 </div>
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
 Periode aktif: <span className="font-semibold text-slate-900">{selectedPeriod?.name ?? 'Semua periode'}</span>
 </div>
 </div>
 </div>
 </section>

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">Filter Periode</h2>
 <p className="mt-1 text-sm text-slate-500">Pilih periode untuk memfokuskan kelompok yang sedang diproses.</p>
 </div>

 <div className="flex flex-col gap-3 sm:flex-row">
 <select
 value={selectedPeriodId}
 onChange={(event) => setSelectedPeriodId(event.target.value)}
 className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
 >
 <option value="">Semua periode</option>
 {periods.map((period) => (
 <option key={period.id} value={period.id}>
 {period.name}
 </option>
 ))}
 </select>

 <a
 href={selectedPeriodId ? route('admin.grade-generator.export-zip', { period_id: selectedPeriodId }) : route('admin.grade-generator.export-zip')}
 className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh bundel ZIP
 </a>
 </div>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Daftar Kelompok</h2>
 <p className="mt-1 text-sm text-slate-500">
 Gunakan aksi di setiap kelompok untuk membuka input nilai manual atau mengunduh blanko nilai.
 </p>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lokasi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">DPL</th>
 <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {activeGroups.length > 0 ? (
 activeGroups.map((group) => (
 <tr key={group.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-semibold text-slate-900">{group.name}</p>
 <p className="mt-1 text-xs text-slate-500">Kode: {group.code}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-700">
 {group.desa}, {group.kecamatan}, {group.kabupaten}
 </td>
 <td className="px-6 py-4 text-sm text-slate-700">{group.dpl || '-'}</td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap justify-end gap-3">
 <Link
 href={`${route('admin.grades.index')}?group_id=${group.id}`}
 className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Input nilai
 </Link>
 <a
 href={route('admin.grade-generator.export', group.id)}
 className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh Excel
 </a>
 <a
 href={route('admin.grade-generator.export-pdf', group.id)}
 className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh PDF
 </a>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
 Tidak ada kelompok yang sesuai dengan filter periode.
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
