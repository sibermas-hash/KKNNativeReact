import { useEffect, useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 Plus,
 Search,
 Calendar,
 Edit2,
 Trash2,
 ShieldCheck,
 Info,
 Copy,
 Map,
 Download,
 AlertTriangle,
 CheckCircle2,
 Users,
 Users2,
 GraduationCap,
} from "lucide-react";
import { clsx } from 'clsx';

interface AcademicYearOption {
 id: number;
 year: string;
}

interface PeriodData {
 id: number;
 academic_year: AcademicYearOption | null;
 periode: number | null;
 jenis: string | null;
 name: string;
 start_date: string;
 end_date: string;
 registration_start: string;
 registration_end: string;
 grading_start: string | null;
 grading_end: string | null;
 kuota: number | null;
 is_active: boolean;
 groups_count: number;
 participants_count: number;
 dpl_periods_count: number;
 can_delete: boolean;
 delete_blocker: string | null;
 duration_days: number;
 registration_duration_days: number;
 capacity_percentage: number;
}

interface Props extends PageProps {
 periods: {
 data: PeriodData[];
 links: unknown[];
 meta: PaginationMeta;
 };
 academicYears: AcademicYearOption[];
 filters: {
 search?: string;
 };
}

const initialFormData = {
 academic_year_id: '',
 periode: '',
 jenis: '',
 name: '',
 start_date: '',
 end_date: '',
 registration_start: '',
 registration_end: '',
 grading_start: '',
 grading_end: '',
 kuota: '2000',
 is_active: false,
};

export default function PeriodsIndex({ periods, academicYears, filters }: Props) {
 const [editing, setEditing] = useState<PeriodData | null>(null);
 const [showForm, setShowForm] = useState(false);
 const [deleting, setDeleting] = useState<PeriodData | null>(null);
 const [duplicating, setDuplicating] = useState<PeriodData | null>(null);
 const [search, setSearch] = useState(filters.search || '');

 const form = useForm(initialFormData);
 const deleteForm = useForm({});
 const duplicateForm = useForm({});

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/periods', { search }, { preserveState: true, replace: true });
 }
 }, 300);

 return () => clearTimeout(timer);
 }, [search, filters.search]);

 useEffect(() => {
 if (!editing && form.data.periode && form.data.jenis) {
 const name = `Periode ${form.data.periode} - ${form.data.jenis}`;
 form.setData('name', name);
 }
 }, [form, form.data.periode, form.data.jenis, editing]);

 function cancelForm() {
 setEditing(null);
 setShowForm(false);
 form.reset();
 form.clearErrors();
 }

 function openCreateForm() {
 cancelForm();
 setShowForm(true);
 }

 function handleExport() {
 window.location.href = '/admin/periods/export';
 }

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 form.clearErrors();

 if (editing) {
 form.put(`/admin/periods/${editing.id}`, {
 onSuccess: () => cancelForm(),
 });
 return;
 }

 form.post('/admin/periods', {
 onSuccess: () => cancelForm(),
 });
 }

 function startEdit(period: PeriodData) {
 setEditing(period);
 setShowForm(true);
 form.clearErrors();
 form.setData({
 academic_year_id: period.academic_year ? String(period.academic_year.id) : '',
 periode: period.periode?.toString() ?? '',
 jenis: period.jenis ?? '',
 name: period.name,
 start_date: period.start_date,
 end_date: period.end_date,
 registration_start: period.registration_start,
 registration_end: period.registration_end,
 grading_start: period.grading_start ?? '',
 grading_end: period.grading_end ?? '',
 kuota: period.kuota?.toString() ?? '',
 is_active: period.is_active,
 });
 }

 return (
 <AppLayout title="Protokol Siklus KKN">
 <Head title="Manajemen Periode KKN" />

 <div className="space-y-6 pb-20">
 {/* Header dengan Stats */}
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-xl font-semibold text-slate-900">Periode KKN</h1>
 <p className="text-sm text-slate-500 mt-1">
 Kelola siklus dan jadwal pelaksanaan KKN
 </p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={handleExport}
 className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
 >
 <Download className="w-4 h-4" />
 Export Excel
 </button>
 {!showForm && (
 <button
 onClick={openCreateForm}
 className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
 >
 <Plus className="w-4 h-4" />
 Tambah Periode
 </button>
 )}
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
 <div className="flex items-center gap-3">
 <Calendar className="w-5 h-5 text-blue-600" />
 <div>
 <p className="text-xs text-slate-500">Total Periode</p>
 <p className="text-2xl font-bold text-slate-900">{periods.meta?.total || 0}</p>
 </div>
 </div>
 </div>
 {periods.data.find(p => p.is_active) && (
 <div className="border border-emerald-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-white">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
 <div>
 <p className="text-xs text-slate-500">Periode Aktif</p>
 <p className="text-sm font-semibold text-emerald-900">
 {periods.data.find(p => p.is_active)?.name}
 </p>
 </div>
 </div>
 </div>
 )}
 <div className="border border-slate-200 rounded-lg p-4">
 <div className="flex items-center gap-3">
 <Users className="w-5 h-5 text-slate-600" />
 <div>
 <p className="text-xs text-slate-500">Total Peserta</p>
 <p className="text-2xl font-bold text-slate-900">
 {periods.data.reduce((sum, p) => sum + p.participants_count, 0).toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 <div className="border border-slate-200 rounded-lg p-4">
 <div className="flex items-center gap-3">
 <Users2 className="w-5 h-5 text-slate-600" />
 <div>
 <p className="text-xs text-slate-500">Total Kelompok</p>
 <p className="text-2xl font-bold text-slate-900">
 {periods.data.reduce((sum, p) => sum + p.groups_count, 0).toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Entry Form */}
 {showForm && (
 <div className="bg-white p-6 border border-slate-100 rounded-lg space-y-8 fade-in slide-in-from-top-4">
 <div className="flex items-center justify-between border-b border-slate-50 pb-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-slate-50 rounded-lg text-primary border border-slate-100 ">
 {editing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900">
 {editing ? 'Edit Periode' : 'Tambah Periode'}
 </h3>
 
 </div>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400 ml-1">Tahun Akademik</label>
 <FormSelect
 options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
 value={form.data.academic_year_id}
 onChange={(e) => form.setData('academic_year_id', e.target.value)}
 required
 className="bg-slate-50 border-slate-100 text-xs font-semibold rounded-lg"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400 ml-1">Periode</label>
 <FormInput
 type="number"
 placeholder="53"
 value={form.data.periode}
 onChange={(e) => form.setData('periode', e.target.value)}
 required
 className="bg-slate-50 border-slate-100 text-sm font-semibold rounded-lg"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400 ml-1">Jenis KKN</label>
 <FormInput
 placeholder="KKN REGULER"
 value={form.data.jenis}
 onChange={(e) => form.setData('jenis', e.target.value)}
 required
 className="bg-slate-50 border-slate-100 text-sm font-semibold rounded-lg"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400 ml-1">Kuota</label>
 <FormInput
 type="number"
 value={form.data.kuota}
 onChange={(e) => form.setData('kuota', e.target.value)}
 required
 className="bg-slate-50 border-slate-100 text-sm font-semibold rounded-lg"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="p-6 bg-slate-50/50 rounded-lg border border-slate-100 space-y-6">
 <div className="flex items-center gap-3 pb-3 border-b border-white">
 <Calendar className="h-4 w-4 text-primary" />
 <span className="text-xs font-semibold text-slate-400">Tanggal Pendaftaran</span>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400">Mulai</label>
 <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required className="bg-white border-slate-200 rounded-lg text-xs font-semibold" />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400">Selesai</label>
 <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required className="bg-white border-slate-200 rounded-lg text-xs font-semibold" />
 </div>
 </div>
 </div>

 <div className="p-6 bg-slate-50/50 rounded-lg border border-slate-100 space-y-6">
 <div className="flex items-center gap-3 pb-3 border-b border-white">
 <Map className="h-4 w-4 text-primary" />
 <span className="text-xs font-semibold text-slate-400">Tanggal Lapangan</span>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400">Mulai</label>
 <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required className="bg-white border-slate-200 rounded-lg text-xs font-semibold" />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-400">Selesai</label>
 <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required className="bg-white border-slate-200 rounded-lg text-xs font-semibold" />
 </div>
 </div>
 </div>
 </div>

 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-slate-50">
 <button
 type="button"
 onClick={() => form.setData('is_active', !form.data.is_active)}
 className="flex items-center gap-4 group transition-transform"
 >
 <div className={clsx(
 "w-12 h-6 rounded-full p-1 transition-all",
 form.data.is_active ? 'bg-primary' : 'bg-slate-200'
 )}>
 <div className={clsx(
 "w-4 h-4 bg-white rounded-full  ",
 form.data.is_active ? 'translate-x-6' : 'translate-x-0'
 )} />
 </div>
 <div className="text-left">
 <span className={clsx("text-xs font-semibold transition-colors", form.data.is_active ? 'text-primary' : 'text-slate-400')}>
 {form.data.is_active ? 'Aktif' : 'Draft'}
 </span>
 </div>
 </button>
 <div className="flex gap-3">
 <button type="button" onClick={cancelForm} className="px-6 py-4 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
 <button
 type="submit"
 disabled={form.processing}
 className="px-10 py-4 bg-primary text-white rounded-lg font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50"
 >
 {editing ? 'Simpan' : 'Simpan'}
 </button>
 </div>
 </div>
 </form>
 </div>
 )}

 {/* Operations Database Section */}
 <div className="space-y-6">
 <div className="flex items-center justify-between gap-6">
 <div className="relative group max-w-md w-full">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 placeholder="Cari..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>
 </div>

 <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full border-collapse divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-5 text-left text-xs font-semibold text-slate-400">Siklus</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">Akademik</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">Durasi</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">Kapasitas</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">Registrasi</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">Status</th>
 <th className="px-8 py-5 text-right text-xs font-semibold text-slate-400 pr-12">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50/50">
 {periods.data.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-8 py-24 text-center">
 <Info className="h-12 w-12 text-slate-100 mx-auto mb-4" />
 <p className="text-xs font-semibold text-slate-300">Belum ada data</p>
 </td>
 </tr>
 ) : (
 periods.data.map((period) => (
 <tr key={period.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-semibold text-slate-400 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary transition-all">
 {period.periode ?? '--'}
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-slate-900 group-hover/row:text-primary transition-colors">{period.jenis ?? 'N/A'}</span>
 <span className="text-xs font-semibold text-slate-300">{period.name}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-400 border border-slate-100">
 {period.academic_year?.year || '--'}
 </span>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-col items-center gap-1">
 <span className="text-xs font-semibold text-slate-700">{period.duration_days} hari</span>
 <span className="text-[10px] text-slate-400">
 {period.start_date ? new Date(period.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '--'} - {period.end_date ? new Date(period.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-col items-center gap-1">
 <span className="text-xs font-semibold text-slate-700">{period.participants_count} / {period.kuota || '∞'}</span>
 <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
 <div 
 className="h-full bg-blue-500 transition-all"
 style={{ width: `${Math.min(period.capacity_percentage, 100)}%` }}
 />
 </div>
 <span className="text-[10px] text-slate-400">{period.capacity_percentage}%</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col items-center gap-1">
 <span className="text-xs font-semibold text-slate-700">
 {period.registration_duration_days} hari
 </span>
 <span className="text-[10px] text-slate-400">
 {period.registration_start ? new Date(period.registration_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '--'} - {period.registration_end ? new Date(period.registration_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '--'}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <Badge
 variant={period.is_active ? 'success' : 'default'}
 >
 {period.is_active ? 'Aktif' : 'Nonaktif'}
 </Badge>
 </td>
 <td className="px-8 py-6 text-right pr-12">
 <div className="flex justify-end gap-2 group-hover/row:opacity-100 transition-opacity">
 <button onClick={() => setDuplicating(period)} className="p-2 text-slate-400 hover:text-emerald-500 border border-slate-100 hover:border-emerald-200 rounded-lg transition-all" title="Duplikasi">
 <Copy className="h-4 w-4" />
 </button>
 <button onClick={() => startEdit(period)} className="p-2 text-slate-400 hover:text-primary border border-slate-100 hover:border-primary/20 rounded-lg transition-all" title="Edit">
 <Edit2 className="h-4 w-4" />
 </button>
 <button onClick={() => setDeleting(period)} disabled={!period.can_delete} className={clsx("p-2 border border-slate-100 rounded-lg transition-all", period.can_delete ? "text-slate-400 hover:text-rose-500 hover:border-rose-200" : "opacity-10 cursor-not-allowed")} title="Hapus">
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {periods.meta && (
 <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
 <Pagination meta={periods.meta} />
 </div>
 )}
 </div>

 {/* Tactical Protocol Info Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-white">Keamanan Siklus Periode</h4>
 <p className="text-xs font-semibold text-slate-500 mt-1  max-w-2xl">
 Seluruh parameter temporal terekam dalam audit sistem universitas. Mengaktifkan status <span className="text-primary">Aktif</span> akan membuka pintu pendaftaran bagi publik.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <ConfirmDialog
 open={!!duplicating}
 onClose={() => !duplicateForm.processing && setDuplicating(null)}
 onConfirm={() => duplicating && duplicateForm.post(`/admin/periods/${duplicating.id}/duplicate`, { onSuccess: () => setDuplicating(null) })}
 title="Duplikasi Periode"
 message={`Inisiasi database baru berbasis "${duplicating?.name}"?`}
 processing={duplicateForm.processing}
 confirmLabel="Ya, duplikasi"
 />

 <ConfirmDialog
 open={!!deleting}
 onClose={() => !deleteForm.processing && setDeleting(null)}
 onConfirm={() => deleting && deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
 title="Hapus Periode"
 message={deleting?.can_delete ? `Hapus siklus "${deleting.name}" dari basis data?` : (deleting?.delete_blocker ?? 'Periode ini tidak dapat dihapus saat ini.')}
 processing={deleteForm.processing}
 confirmLabel="Ya, hapus"
 />
        </div>
        </div>
        </div>
 </AppLayout>

 );
}

function Badge({ variant, className, children }: any) {
 const variants: Record<string, string> = {
 success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
 danger: 'bg-rose-50 text-rose-600 border border-rose-100',
 default: 'bg-slate-50 text-slate-400 border border-slate-200'
 };
 return (
 <span className={clsx("px-4 py-1 rounded-lg text-xs font-semibold whitespace-nowrap", variants[variant] || variants.default, className)}>
 {children}
 </span>
 );
}
