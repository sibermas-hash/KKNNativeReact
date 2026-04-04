import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import type { Faculty, PageProps, Program } from '@/types';

interface ProgramWithFaculty extends Omit<Program, 'fakultas'> {
 faculty?: Faculty | null;
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
 programs: PaginationPayload<ProgramWithFaculty>;
 faculties: Faculty[];
 filters: {
 search?: string;
 };
 syncInfo: {
 mode: 'sync-only';
 source: string;
 last_synced_at?: string | null;
 };
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

export default function ProgramsIndex({ programs, filters, syncInfo }: Props) {
 const [search, setSearch] = useState(filters.search ?? '');

 useEffect(() => {
 const timer = window.setTimeout(() => {
 if (search !== (filters.search ?? '')) {
 router.get(
 '/admin/programs',
 { search: search || undefined },
 { preserveState: true, preserveScroll: true, replace: true },
 );
 }
 }, 300);

 return () => window.clearTimeout(timer);
 }, [filters.search, search]);

 const paginationMeta = resolvePaginationMeta(programs);

 return (
 <AppLayout title="Program Studi">
 <Head title="Referensi Program Studi" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Referensi Program Studi</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Data program studi mengikuti sinkronisasi dari master akademik kampus. Modul ini hanya
 bersifat baca-saja untuk menjaga konsistensi data mahasiswa.
 </p>
 </div>

 <div className="grid gap-3 text-sm text-slate-600">
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
 <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
 Sumber data
 </span>
 <span className="mt-1 block font-medium text-slate-900">{syncInfo.source}</span>
 </div>
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
 <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
 Sinkronisasi terakhir
 </span>
 <span className="mt-1 block font-medium text-slate-900">
 {syncInfo.last_synced_at || 'Belum tercatat'}
 </span>
 </div>
 </div>
 </div>
 </section>

 <section className="rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">Daftar Program Studi</h2>
 <p className="mt-1 text-sm text-slate-500">
 Total data pada halaman ini: {paginationMeta?.total ?? programs.data.length} program studi.
 </p>
 </div>

 <div className="w-full max-w-sm">
 <input
 type="cari"
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Cari program studi..."
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
 Kode
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Program studi
 </th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Fakultas
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {programs.data.length > 0 ? (
 programs.data.map((program) => (
 <tr key={program.id}>
 <td className="px-6 py-4 text-sm font-medium text-slate-700">
 {program.code || '-'}
 </td>
 <td className="px-6 py-4 text-sm font-medium text-slate-900">
 {program.name}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 {program.faculty?.name || 'Belum terhubung'}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500">
 Tidak ada data program studi yang sesuai dengan pencarian.
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
