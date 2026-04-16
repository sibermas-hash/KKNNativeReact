import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
 Calendar,
 Search,
 Plus,
 Trash2,
 Power,
 PowerOff,
 CheckCircle2,
 Database,
 RefreshCw,
 LibraryBig
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
 path?: string;
}

interface Props {
 academicYears: PaginationPayload<AcademicYear>;
 filters: { search?: string };
}

function resolvePaginationMeta(payload: PaginationPayload<unknown>): PaginationMeta | null {
 if (payload.meta) return payload.meta;
 if (typeof payload.last_page === 'number' && Array.isArray(payload.links)) {
 return {
 current_page: payload.current_page ?? 1,
 last_page: payload.last_page,
 per_page: payload.per_page ?? payload.data.length,
 total: payload.total ?? payload.data.length,
 from: payload.from ?? null,
 to: payload.to ?? null,
 links: payload.links,
 path: payload.path ?? '',
 };
 }
 return null;
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
 const [search, setSearch] = useState(filters.search ?? '');
 const [confirmDialog, setConfirmDialog] = useState<{
 open: boolean;
 title: string;
 message: string;
 onConfirm: () => void;
 confirmVariant: 'primary' | 'danger';
 confirmLabel: string;
 }>({
 open: false,
 title: '',
 message: '',
 onConfirm: () => {},
 confirmVariant: 'primary',
 confirmLabel: '',
 });

 const form = useForm({
 year: '',
 is_active: false,
 });

 useEffect(() => {
 const timer = window.setTimeout(() => {
 if (search !== (filters.search ?? '')) {
 router.get(
 '/admin/tahun-akademik',
 { search: search || undefined },
 { preserveState: true, replace: true },
 );
 }
 }, 300);
 return () => window.clearTimeout(timer);
 }, [filters.search, search]);

 const paginationMeta = resolvePaginationMeta(academicYears);
 const rows = academicYears.data ?? [];

 const submit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/admin/tahun-akademik', {
 preserveScroll: true,
 onSuccess: () => form.reset(),
 });
 };

 const toggleStatus = (year: AcademicYear) => {
 setConfirmDialog({
 open: true,
 title: 'Ubah Status',
 message: `Tahun akademik "${year.year}" akan diubah statusnya. Lanjutkan?`,
 confirmVariant: 'primary',
 confirmLabel: 'Ya, Ubah Status',
 onConfirm: () => {
 router.patch(
 `/admin/tahun-akademik/${year.id}`,
 { year: year.year, is_active: !year.is_active },
 {
 preserveScroll: true,
 onSuccess: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
 },
 );
 },
 });
 };

 const destroy = (year: AcademicYear) => {
 setConfirmDialog({
 open: true,
 title: 'Hapus Tahun Akademik',
 message: `Data "${year.year}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
 confirmVariant: 'danger',
 confirmLabel: 'Hapus',
 onConfirm: () => {
 router.delete(`/admin/tahun-akademik/${year.id}`, {
 preserveScroll: true,
 onSuccess: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
 });
 },
 });
 };

  return (
    <>
 <Head title="Data Tahun Akademik" />

 <ConfirmDialog
 open={confirmDialog.open}
 title={confirmDialog.title}
 message={confirmDialog.message}
 confirmVariant={confirmDialog.confirmVariant}
 confirmLabel={confirmDialog.confirmLabel}
 onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
 onConfirm={confirmDialog.onConfirm}
 />

 <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans">
 
 {/* HEADER SECTION */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <LibraryBig size={16} className="text-emerald-600" />
 <span className="text-sm font-medium text-gray-500">Data Master Sistem</span>
 </div>
 <h1 className="text-2xl font-bold text-gray-900 leading-tight">Manajemen Tahun Akademik</h1>
 </div>
 
 <div className="flex items-center gap-4 shrink-0">
 <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-3">
 <Database size={18} className="text-emerald-600" />
 <div className="flex flex-col">
 <span className="text-xs font-medium text-gray-500">Total Terdaftar</span>
 <span className="text-sm font-semibold text-gray-900">{(paginationMeta?.total || 0).toLocaleString()} Data</span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* PANEL TAMBAH DATA */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
 <div className="flex items-center gap-3 mb-6">
 <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
 <Plus size={20} strokeWidth={2.5} />
 </div>
 <div>
 <h2 className="text-base font-semibold text-gray-900">Tambah Tahun Akademik</h2>
 <p className="text-xs text-gray-500 mt-0.5">Daftarkan formasi tahun ajaran baru.</p>
 </div>
 </div>

 <form onSubmit={submit} className="space-y-5">
 <div className="space-y-2">
 <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700">
 Tahun Akademik
 </label>
 <input
 id="academic-year"
 type="text"
 placeholder="Contoh: 2026/2027"
 value={form.data.year}
 onChange={(event) => form.setData('year', event.target.value)}
 className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
 />
 {form.errors.year && (
 <p className="text-xs font-medium text-rose-500 mt-1">{form.errors.year}</p>
 )}
 </div>

 <div className="flex items-start gap-3 pt-2">
 <div className="flex items-center h-5">
 <input
 id="is_active"
 type="checkbox"
 checked={form.data.is_active}
 onChange={(e) => form.setData('is_active', e.target.checked)}
 className="w-4 h-4 text-emerald-600 bg-white border-gray-300 border-2 rounded focus:ring-emerald-500 cursor-pointer"
 />
 </div>
 <div className="flex flex-col">
 <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
 Jadikan Aktif
 </label>
 <p className="text-xs text-gray-500">Otomatis diatur sebagai tahun ajaran berjalan.</p>
 </div>
 </div>

 <button
 type="submit"
 disabled={form.processing}
 className="w-full h-10 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-4"
 >
 {form.processing ? (
 <RefreshCw size={18} className="animate-spin" />
 ) : (
 <CheckCircle2 size={18} />
 )}
 Simpan Data
 </button>
 </form>
 </div>
 </div>

 {/* PANEL DAFTAR DATA */}
 <div className="lg:col-span-2">
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-white border border-gray-200 text-gray-500 rounded flex items-center justify-center shadow-sm">
 <Calendar size={16} />
 </div>
 <h3 className="text-sm font-semibold text-gray-800">Daftar Tahun Akademik</h3>
 </div>
 <div className="relative w-full sm:w-64">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 placeholder="Cari tahun..."
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tahun Akademik</th>
 <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500">Status</th>
 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500">Aksi</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {rows.length > 0 ? (
 rows.map((year) => (
 <tr key={year.id} className="hover:bg-gray-50 transition-colors group">
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <span className="text-sm font-semibold text-gray-900">{year.year}</span>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-center">
 <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", year.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800")}>
 {year.is_active ? 'Aktif' : 'Tidak Aktif'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => toggleStatus(year)}
 className={clsx("px-3 py-1.5 rounded-md text-xs font-medium transition-colors border", year.is_active ? "bg-white text-gray-600 border-gray-300 hover:bg-gray-50" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100")}
 >
 {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
 </button>
 <button
 onClick={() => destroy(year)}
 className="p-1.5 text-gray-400 hover:text-rose-600 bg-white border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-md transition-colors"
 title="Hapus"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
 <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" strokeWidth={1} />
 Tidak ada data yang ditemukan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {paginationMeta && (
 <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 mt-auto flex items-center justify-between">
 <span className="text-xs text-gray-500">
 Menampilkan <strong>{rows.length}</strong> baris
 </span>
 <Pagination meta={paginationMeta} />
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
    </>
  );
}

AcademicYearsIndex.layout = (page: React.ReactNode) => (
  <AppLayout title="Data Tahun Akademik">{page}</AppLayout>
);
