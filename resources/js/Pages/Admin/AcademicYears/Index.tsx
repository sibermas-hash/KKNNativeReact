import { useState, useEffect } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 Calendar,
 Plus,
 Edit2,
 Trash2,
 Search,
 CheckCircle,
 Info
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props extends PageProps {
 academicYears: {
 data: AcademicYear[];
 links: { url: string | null; label: string; active: boolean }[];
 meta: PaginationMeta;
 };
 filters: {
 search?: string;
 };
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
 const [editing, setEditing] = useState<AcademicYear | null>(null);
 const [deleting, setDeleting] = useState<AcademicYear | null>(null);
 const [search, setSearch] = useState(filters.search || '');

 const form = useForm({ year: '', is_active: false });

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/academic-years', { search }, { preserveState: true, replace: true });
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search, filters.search]);

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (editing) {
 form.put(`/admin/academic-years/${editing.id}`, {
 onSuccess: () => { setEditing(null); form.reset(); },
 });
 } else {
 form.post('/admin/academic-years', {
 onSuccess: () => form.reset(),
 });
 }
 }

 function startEdit(ay: AcademicYear) {
 setEditing(ay);
 form.setData({ year: ay.year, is_active: ay.is_active });
 }

 function cancelEdit() {
 setEditing(null);
 form.reset();
 }

 const deleteForm = useForm({});

 function handleDelete() {
 if (!deleting) return;
 deleteForm.delete(`/admin/academic-years/${deleting.id}`, {
 onSuccess: () => setDeleting(null),
 });
 }

 return (
 <AppLayout title="Manajemen Tahun Akademik">
 <Head title="Manajemen Tahun Akademik" />

 <div className="space-y-8 pb-16">
 {/* Minimalist Operational Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 MASTER_ENTITY_MANAGEMENT
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Calendar className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Tahun <span className="text-primary">Akademik</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="text-right">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-1">Total Entitas</span>
 <span className="text-xs font-semibold text-slate-900">
 {academicYears.meta?.total || 0} RECORDS
 </span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Tactical Form Section */}
 <div className="lg:col-span-1">
 <div className="bg-white p-5 border border-slate-100 rounded-lg space-y-6">
 <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
 <div className="p-2 bg-slate-50 rounded-lg text-primary">
 {editing ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
 </div>
 <h3 className="text-[11px] font-semibold text-slate-900">{editing ? 'KOREKSI_DATA' : 'INPUT_TAHUN_BARU'}</h3>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="space-y-2">
 <label className="text-[9px] font-semibold text-slate-400 ml-1">Label Tahun</label>
 <FormInput
 placeholder="CONTOH: 2024/2025"
 value={form.data.year}
 onChange={(e) => form.setData('year', e.target.value)}
 error={form.errors.year}
 label=""
 className="bg-slate-50 border-slate-100 text-sm font-semibold placeholder:text-slate-200 rounded-lg focus:ring-primary/10"
 required
 />
 </div>

 <div
 className={clsx(
 "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all active:scale-95",
 form.data.is_active ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'
 )}
 onClick={() => form.setData('is_active', !form.data.is_active)}
 >
 <div className={clsx(
 "w-6 h-6 rounded-lg border flex items-center justify-center transition-all ",
 form.data.is_active ? 'bg-primary border-primary text-white scale-110' : 'bg-white border-slate-200 text-transparent'
 )}>
 <CheckCircle className="w-4 h-4 stroke-[3px]" />
 </div>
 <div className="flex flex-col">
 <span className={clsx("text-xs font-semibold", form.data.is_active ? 'text-primary' : 'text-slate-400')}>
 STATUS_AKTIF
 </span>
 <span className="text-[9px] font-semibold text-slate-400">Gunakan sebagai basis default</span>
 </div>
 </div>

 <div className="flex flex-col gap-2 pt-4">
 <button
 type="submit"
 disabled={form.processing}
 className="w-full py-4 bg-primary text-white text-[10px] font-semibold rounded-lg transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
 >
 {editing ? 'SIMPAN_PERUBAHAN' : 'LAUNCH_DATA_BARU'}
 </button>
 {editing && (
 <button
 type="button"
 onClick={cancelEdit}
 className="w-full py-4 bg-slate-50 text-slate-400 text-[10px] font-semibold rounded-lg hover:bg-slate-100 transition-all"
 >
 BATALKAN
 </button>
 )}
 </div>
 </form>

 <div className="p-4 bg-emerald-50 rounded-lg flex gap-3 border border-emerald-100">
 <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
 <p className="text-[9px] font-semibold text-emerald-800 leading-relaxed">
 PROSES: Menetapkan status aktif akan memutus jalur default tahun sebelumnya secara otomatis.
 </p>
 </div>
 </div>
 </div>

 {/* Table Section - High Density */}
 <div className="lg:col-span-2 space-y-6">
 {/* Search Strip */}
 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 placeholder="SEARCH_ACADEMIC_DATABASE..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
 />
 </div>

 {/* Table Container */}
 <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-4 text-left text-[10px] font-semibold text-slate-400">ENTITAS_TAHUN</th>
 <th className="px-8 py-4 text-center text-[10px] font-semibold text-slate-400">STATUS</th>
 <th className="px-8 py-4 text-right text-[10px] font-semibold text-slate-400">AKSI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {academicYears.data.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-8 py-16 text-center">
 <Calendar className="w-8 h-8 text-slate-100 mx-auto mb-4" />
 <p className="text-[9px] font-semibold text-slate-300">LOG_ENTRY_KOSONG</p>
 </td>
 </tr>
 ) : (
 academicYears.data.map((ay) => (
 <tr key={ay.id} className="hover:bg-slate-50/50 transition-all group/row">
 <td className="px-8 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-semibold text-slate-300 group-hover/row:text-primary transition-colors">
 {ay.year.charAt(2)}{ay.year.charAt(3)}
 </div>
 <span className="font-semibold text-[13px] text-slate-900 group-hover/row:text-primary transition-colors">{ay.year}</span>
 </div>
 </td>
 <td className="px-8 py-4 text-center">
 <span className={clsx(
 "inline-flex px-4 py-1.5 rounded-lg text-[9px] font-semibold border",
 ay.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
 )}>
 {ay.is_active ? 'DEFAULT_ACTIVE' : 'INACTIVE'}
 </span>
 </td>
 <td className="px-8 py-4 text-right">
 <div className="flex justify-end gap-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
 <button
 onClick={() => startEdit(ay)}
 className="p-2.5 text-slate-400 hover:text-primary border border-slate-100 hover:border-primary/20 rounded-lg transition-all"
 title="KOREKSI"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button
 onClick={() => setDeleting(ay)}
 className="p-2.5 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-lg transition-all"
 title="HAPUS"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Strip */}
 {academicYears.meta && (
 <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
 <Pagination meta={academicYears.meta} />
 </div>
 )}
 </div>
 </div>
 </div>

 <ConfirmDialog
 open={!!deleting}
 onClose={() => setDeleting(null)}
 onConfirm={handleDelete}
 title="Hapus Data?"
 message={`Apakah Anda yakin ingin menghapus data tahun akademik "${deleting?.year}"? Perubahan ini tidak dapat dibatalkan.`}
 confirmLabel="Ya, Hapus"
 processing={deleteForm.processing}
 />
 </AppLayout>
 );
}
