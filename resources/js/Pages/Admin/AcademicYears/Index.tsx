import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { route } from 'ziggy-js';

interface AcademicYear {
 id: number;
 year: string;
 is_active: boolean;
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

interface Props {
 academicYears: PaginationPayload<AcademicYear>;
 filters: { search?: string };
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

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
 const [search, setSearch] = useState(filters.search ?? '');
 const form = useForm({
 year: '',
 is_active: false,
 });

 useEffect(() => {
 const timer = window.setTimeout(() => {
 if (search !== (filters.search ?? '')) {
 router.get(route('admin.academic-years.index'), { search: search || undefined }, { preserveState: true, replace: true });
 }
 }, 300);

 return () => window.clearTimeout(timer);
 }, [filters.search, search]);

 const paginationMeta = resolvePaginationMeta(academicYears);
 const rows = academicYears.data ?? [];

 const submit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post(route('admin.academic-years.store'), {
 preserveScroll: true,
 onSuccess: () => form.reset(),
 });
 };

 const toggleStatus = (year: AcademicYear) => {
 if (!window.confirm(`Ubah status tahun akademik "${year.year}"?`)) {
 return;
 }

 router.patch(
 route('admin.academic-years.update', year.id),
 { year: year.year, is_active: !year.is_active },
 { preserveScroll: true },
 );
 };

 const destroy = (year: AcademicYear) => {
 if (!window.confirm(`Hapus tahun akademik "${year.year}"?`)) {
 return;
 }

 router.delete(route('admin.academic-years.destroy', year.id), { preserveScroll: true });
 };

 return (
 <AppLayout title="Tahun Akademik">
 <Head title="Tahun Akademik" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Tahun Akademik</h1>
 <p className="mt-2 text-sm text-slate-500">
 Kelola referensi tahun akademik yang dipakai pada periode KKN.
 </p>
 </div>
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
 Total data: <span className="font-semibold text-slate-900">{paginationMeta?.total ?? rows.length}</span>
 </div>
 </div>
 </section>

 <div className="grid gap-6 lg:grid-cols-3">
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Tambah Tahun Akademik</h2>
 <form onSubmit={submit} className="mt-6 space-y-4">
 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Tahun</label>
 <input
 type="text"
 placeholder="2026/2027"
 value={form.data.year}
 onChange={(event) => form.setData('year', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
 />
 {form.errors.year && <p className="mt-2 text-xs text-rose-600">{form.errors.year}</p>}
 </div>

 <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
 <input
 type="checkbox"
 checked={form.data.is_active}
 onChange={(event) => form.setData('is_active', event.target.checked)}
 className="rounded border-slate-300 text-primary focus:ring-primary"
 />
 Jadikan aktif setelah disimpan
 </label>

 <button
 type="submit"
 disabled={form.processing}
 className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan tahun akademik'}
 </button>
 </form>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-2">
 <div className="border-b border-slate-200 px-6 py-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">Daftar Tahun Akademik</h2>
 <p className="mt-1 text-sm text-slate-500">Cari dan ubah status tahun akademik yang sudah ada.</p>
 </div>
 <input
 type="search"
 placeholder="Cari tahun akademik..."
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tahun</th>
 <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
 <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {rows.length > 0 ? (
 rows.map((year) => (
 <tr key={year.id}>
 <td className="px-6 py-4 text-sm font-medium text-slate-900">{year.year}</td>
 <td className="px-6 py-4">
 <span className={year.is_active ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'}>
 {year.is_active ? 'Aktif' : 'Tidak aktif'}
 </span>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-end gap-3">
 <button
 type="button"
 onClick={() => toggleStatus(year)}
 className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
 </button>
 <button
 type="button"
 onClick={() => destroy(year)}
 className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
 >
 Hapus
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada data tahun akademik.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {paginationMeta && (
 <div className="border-t border-slate-200 px-6 py-4">
 <Pagination meta={paginationMeta} />
 </div>
 )}
 </section>
 </div>
 </div>
 </AppLayout>
 );
}
