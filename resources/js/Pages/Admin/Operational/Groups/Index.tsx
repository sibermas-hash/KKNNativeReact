import { type FormEvent, useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
 Download, MapPin, Pencil, Plus, Search, Trash2, Users, UserCheck, Filter, CheckCircle2, Activity, Layers, ArrowRight, Save, X, RefreshCw, Upload
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination } from '@/Components/ui';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Group {
 id: number;
 code: string;
 name: string;
 capacity: number;
 status: string;
 registrations_count: number;
 approved_participants_count: number;
 pending_participants_count: number;
 available_slots: number;
 ready_for_placement: boolean;
 placement_note: string;
 period?: { id: number; name: string } | null;
 location?: {
 id: number;
 village_name: string;
 district_name?: string | null;
 regency_name?: string | null;
 full_name: string;
 } | null;
 main_lecturer?: { id: number; name: string } | null;
}

interface Summary {
 total_groups: number;
 active_groups: number;
 draft_groups: number;
 groups_without_main_lecturer: number;
 groups_ready_for_placement: number;
 total_available_slots: number;
}

interface Props {
 groups: {
 data: Group[];
 meta: PaginationMeta;
 };
 periods: Array<{ id: number; name: string }>;
 locations: Array<{ id: number; village_name: string; full_name: string }>;
 lecturers: Array<{ id: number; name: string }>;
 filters: {
 search?: string;
 period_id?: string | number;
 status?: string;
 };
 ui?: {
 can_manage?: boolean;
 };
 summary: Summary;
}

type GroupFormData = {
 period_id: string;
 location_id: string;
 lead_lecturer_id: string;
 name: string;
 capacity: string;
 status: 'draft' | 'active' | 'closed';
};

const initialFormData: GroupFormData = {
 period_id: '',
 location_id: '',
 lead_lecturer_id: '',
 name: '',
 capacity: '10',
 status: 'draft',
};

export default function GroupsIndex({
 groups = { data: [], meta: { total: 0, current_page: 1, per_page: 15, from: 0, to: 0, path: '', links: [], last_page: 1 } },
 periods = [],
 locations = [],
 lecturers = [],
 filters = {},
 ui = {},
 summary = { total_groups: 0, active_groups: 0, draft_groups: 0, groups_without_main_lecturer: 0, groups_ready_for_placement: 0, total_available_slots: 0 },
}: Props) {
 const [search, setSearch] = useState(filters?.search ?? '');
 const [periodId, setPeriodId] = useState(filters?.period_id ? String(filters.period_id) : '');
 const [statusFilter, setStatusFilter] = useState(filters?.status ? String(filters.status) : '');
 const [editingGroup, setEditingGroup] = useState<Group | null>(null);
 const [deletingId, setDeletingId] = useState<number | null>(null);

 const form = useForm<GroupFormData>(initialFormData);
 const importForm = useForm<{ file: File | null }>({ file: null });
 const canManage = ui?.can_manage ?? false;

 const [importing, setImporting] = useState(false);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 setImporting(true);
 router.post(route('admin.kelompok.import'), { file: e.target.files[0] }, {
 preserveScroll: true,
 onFinish: () => setImporting(false),
 });
 // Reset the input value
 e.target.value = '';
 }
 };

 const handleApplyFilters = () => {
 router.get(
 route('admin.kelompok.index'),
 {
 search: search || undefined,
 period_id: periodId || undefined,
 status: statusFilter || undefined,
 },
 { preserveState: true, preserveScroll: true, replace: true },
 );
 };

 const cancelEdit = () => {
 setEditingGroup(null);
 form.reset();
 form.clearErrors();
 };

 const openEditForm = (group: Group) => {
 setEditingGroup(group);
 form.clearErrors();
 form.setData({
 period_id: String(group.period?.id ?? ''),
 location_id: String(group.location?.id ?? ''),
 lead_lecturer_id: String(group.main_lecturer?.id ?? ''),
 name: group.name,
 capacity: String(group.capacity),
 status: (group.status as GroupFormData['status']) ?? 'draft',
 });
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const submitForm = (e: FormEvent) => {
 e.preventDefault();
 const payload = {
 ...form.data,
 nama_kelompok: form.data.name,
 lecturers: form.data.lead_lecturer_id
 ? [{ id: Number(form.data.lead_lecturer_id), role: 'Ketua' }]
 : [],
 };

 if (editingGroup) {
 router.put(route('admin.kelompok.update', editingGroup.id), payload, {
 preserveScroll: true,
 onSuccess: () => cancelEdit(),
 });
 } else {
 router.post(route('admin.kelompok.store'), payload, {
 preserveScroll: true,
 onSuccess: () => form.reset(),
 });
 }
 };

 const handleDelete = () => {
 if (deletingId) {
 router.delete(route('admin.kelompok.destroy', deletingId), {
 preserveScroll: true,
 onSuccess: () => setDeletingId(null),
 });
 }
 };

 return (
 <AppLayout title="Data Kelompok">
 <Head title="Manajemen Kelompok | KKN UIN SAIZU"/>

 <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
 
 {/* PAGE HEADER */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-emerald-50">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <Layers size={14} className="text-emerald-800" />
 <span className="text-sm font-medium text-emerald-800">Kelompok & Penugasan</span>
 </div>
 <h1 className="text-2xl font-bold text-emerald-950 leading-tight">Manajemen Kelompok</h1>
 <p className="text-sm text-emerald-800 max-w-2xl leading-relaxed">
 Manajemen data alokasi kelompok, kuota, pembimbing, dan penyusunan wilayah KKN.
 </p>
 </div>
 
 <div className="flex items-center gap-3 shrink-0">
 <Link
 href={route('admin.kelompok.template')}
 className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-emerald-800 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
 >
 <Download size={16} /> Template Impor
 </Link>
 <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium cursor-pointer shadow-sm disabled:opacity-50">
 {importing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
 {importing ? 'Mengimpor...' : 'Impor Data'}
 <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} disabled={importing} />
 </label>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
 
 {/* LEFT: FORM PANEL (1/3) */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden">
 <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
 {editingGroup ? <Pencil size={16} /> : <Plus size={16} />}
 </div>
 <div>
 <h3 className="text-sm font-bold text-emerald-950">
 {editingGroup ? 'Edit Kelompok' : 'Tambah Kelompok'}
 </h3>
 <p className="text-xs text-emerald-800">
 {editingGroup ? 'Perbarui data kelompok yang ada' : 'Buat entri kelompok baru'}
 </p>
 </div>
 </div>
 {editingGroup && (
 <button onClick={cancelEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-800 hover:text-[#ef4444] hover:bg-red-50 transition-colors">
 <X size={16} />
 </button>
 )}
 </div>
 
 <form onSubmit={submitForm} className="p-5 space-y-5">
 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">Periode Program</label>
 <select
 value={form.data.period_id}
 onChange={(e) => form.setData('period_id', e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 required
 >
 <option value="">Pilih Periode Aktif</option>
 {(periods || []).map((p) => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">Wilayah Penugasan</label>
 <select
 value={form.data.location_id}
 onChange={(e) => form.setData('location_id', e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 required
 >
 <option value="">Pilih Lokasi Desa</option>
 {(locations || []).map((l) => (
 <option key={l.id} value={l.id}>{l.full_name}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">Nama Kelompok</label>
 <input
 type="text"
 value={form.data.name}
 onChange={(e) => form.setData('name', e.target.value)}
 className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-emerald-950 placeholder:text-black focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 placeholder="Cth: Kelompok 10 Karangduren"
 required
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">Daya Tampung</label>
 <input
 type="number"
 min="1"
 value={form.data.capacity}
 onChange={(e) => form.setData('capacity', e.target.value)}
 className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-emerald-950 text-center focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all tabular-nums"
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">Status</label>
 <select
 value={form.data.status}
 onChange={(e) => form.setData('status', e.target.value as any)}
 className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 required
 >
 <option value="draft">Penyusunan</option>
 <option value="active">Aktif</option>
 <option value="closed">Ditutup</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-emerald-800 mb-1.5">DPL Utama (Ketua)</label>
 <select
 value={form.data.lead_lecturer_id}
 onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 >
 <option value="">(Belum Tersedia)</option>
 {(lecturers || []).map((l) => (
 <option key={l.id} value={l.id}>{l.name}</option>
 ))}
 </select>
 </div>
 
 <button 
 type="submit"
 disabled={form.processing || !canManage} 
 className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
 {editingGroup ? 'Simpan Perubahan' : 'Tambahkan Kelompok'}
 </button>
 </form>
 </div>

 {/* INLINE METRICS */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
 <UserCheck size={18} />
 </div>
 <div>
 <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary?.groups_without_main_lecturer ?? 0}</p>
 <p className="text-xs font-medium text-emerald-800">Tanpa DPL</p>
 </div>
 </div>
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
 <Users size={18} />
 </div>
 <div>
 <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary?.total_available_slots ?? 0}</p>
 <p className="text-xs font-medium text-emerald-800">Sisa Kapasitas</p>
 </div>
 </div>
 </div>
 </div>

 {/* RIGHT: TABLE PANEL (2/3) */}
 <div className="lg:col-span-2">
 <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden">
 
 {/* Table header with search */}
 <div className="px-5 py-4 border-b border-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h3 className="text-sm font-bold text-emerald-950">Daftar Kelompok</h3>
 <p className="text-xs text-emerald-800">Total: {groups.meta.total} entri data</p>
 </div>
 <div className="flex gap-2">
 <div className="relative w-full sm:w-56">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800"/>
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
 className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 rounded-lg text-sm text-emerald-950 placeholder:text-black focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all"
 placeholder="Cari kode/kelompok..."
 />
 </div>
 <button
 onClick={handleApplyFilters}
 className="h-10 px-4 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors"
 >
 Filter
 </button>
 </div>
 </div>

 {/* Filter row */}
 <div className="px-5 py-3 border-b border-emerald-50 bg-gray-50 flex flex-wrap items-center gap-3">
 <select
 value={periodId}
 onChange={(e) => setPeriodId(e.target.value)}
 className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-emerald-800 focus:border-[#1a7a4a] outline-none transition-all min-w-[150px]"
 >
 <option value="">Semua Periode</option>
 {(periods || []).map((p) => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-emerald-800 focus:border-[#1a7a4a] outline-none transition-all"
 >
 <option value="">Semua Status</option>
 <option value="draft">Penyusunan (Draft)</option>
 <option value="active">Aktif</option>
 <option value="closed">Ditutup</option>
 </select>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="min-w-full">
 <thead>
 <tr className="border-b-2 border-emerald-50">
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">ID & Nama</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Lokasi</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kapasitas</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {groups?.data?.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-6 py-16 text-center">
 <Layers size={32} className="mx-auto text-[#d1d5db] mb-3" />
 <p className="text-sm font-medium text-emerald-800">Data Tidak Ditemukan</p>
 <p className="text-xs text-emerald-800 mt-1">Silakan periksa filter atau buat entri baru</p>
 </td>
 </tr>
 ) : (
 groups.data.map((group) => (
 <tr key={group.id} className="hover:bg-gray-50 transition-colors group/row">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-base font-semibold text-emerald-950">{group.name}</span>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs font-mono bg-gray-100 text-emerald-800 px-1.5 py-0.5 rounded">{group.code}</span>
 <span className={clsx(
 'text-xs font-medium px-2 py-0.5 rounded-full',
 group.status === 'active' ? 'bg-[#dcfce7] text-[#15803d]' : 
 group.status === 'closed' ? 'bg-gray-100 text-emerald-800' : 'bg-amber-50 text-amber-700'
 )}>
 {group.status === 'active' ? 'Aktif' : group.status === 'closed' ? 'Ditutup' : 'Draft'}
 </span>
 </div>
 <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-800">
 <UserCheck size={12} />
 <span className="truncate max-w-[150px]">{group.main_lecturer?.name || 'Tanpa DPL'}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 align-top">
 <div className="flex flex-col">
 <span className="text-sm font-medium text-emerald-950 line-clamp-1">{group.location?.full_name || '-'}</span>
 <span className="text-xs text-emerald-800 mt-1">{group.period?.name || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 align-top">
 <div className="flex flex-col gap-1.5 w-24">
 <div className="flex justify-between text-xs font-medium">
 <span className="text-emerald-950">{group.approved_participants_count}</span>
 <span className="text-emerald-800">/ {group.capacity}</span>
 </div>
 <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div 
 className={clsx("h-full transition-all rounded-full", (group.approved_participants_count / group.capacity) >= 1 ? 'bg-amber-500' : 'bg-[#16a34a]')} 
 style={{ width: `${Math.min(100, (group.approved_participants_count / group.capacity) * 100)}%` }} 
 />
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right align-top">
 <div className="flex items-center justify-end gap-2">
 <Link 
 href={route('admin.kelompok.show', group.id)} 
 className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-sm font-medium border border-gray-300 text-emerald-800 bg-white hover:bg-gray-50 transition-colors"
 >
 Detail
 </Link>
 {canManage && (
 <>
 <button onClick={() => openEditForm(group)} className="h-8 w-8 flex items-center justify-center text-emerald-800 hover:text-emerald-950 hover:bg-gray-50 rounded-md transition-colors" title="Edit">
 <Pencil size={15} />
 </button>
 <button onClick={() => setDeletingId(group.id)} className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-red-50 rounded-md transition-colors" title="Hapus">
 <Trash2 size={15} />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {groups?.meta && (groups.meta.last_page ?? 0) > 1 && (
 <div className="px-5 py-3 border-t border-emerald-50 flex items-center justify-between">
 <span className="text-xs text-emerald-800">Menampilkan {groups.data.length} dari {groups.meta.total} baris</span>
 <Pagination meta={groups.meta} />
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <ConfirmDialog
 open={deletingId !== null}
 onClose={() => setDeletingId(null)}
 onConfirm={handleDelete}
 title="Hapus Kelompok?"
 message="Data kelompok ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
 confirmVariant="danger"
 confirmLabel="Ya, Hapus"
 />
 </AppLayout>
 );
}
