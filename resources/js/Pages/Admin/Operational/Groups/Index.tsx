import { type FormEvent, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
 Download, MapPin, Pencil, Plus, Search, Trash2, Users, UserCheck, Filter, CheckCircle2, Activity, Layers, ArrowRight, Save, X, RefreshCw, Upload, Info
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Pagination, Modal, FormInput, FormSelect, Button, Badge } from '@/Components/ui';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import PageHeader from '@/Components/Premium/PageHeader';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';

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
 periode_id?: string | number;
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
 groups,
 periods = [],
 locations = [],
 lecturers = [],
 filters = {},
 ui = {},
 summary,
}: Props) {
 const [search, setSearch] = useState(filters?.search ?? '');
 const [periodId, setPeriodId] = useState(filters?.periode_id ? String(filters.periode_id) : '');
 const [statusFilter, setStatusFilter] = useState(filters?.status ? String(filters.status) : '');
 const [editingGroup, setEditingGroup] = useState<Group | null>(null);
 const [deletingId, setDeletingId] = useState<number | null>(null);
 const [showSyncModal, setShowSyncModal] = useState(false);

 const form = useForm<GroupFormData>(initialFormData);
 const syncForm = useForm({
    periode_id: '',
    default_capacity: '10',
    default_status: 'active'
 });
 const canManage = ui?.can_manage ?? false;

 const [importing, setImporting] = useState(false);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 setImporting(true);
 router.post(route('admin.kelompok.import'), { file: e.target.files[0] }, {
 preserveScroll: true,
 onFinish: () => setImporting(false),
 });
 e.target.value = '';
 }
 };

 const handleApplyFilters = () => {
 router.get(
 route('admin.kelompok.index'),
 {
 search: search || undefined,
 periode_id: periodId || undefined,
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

 const handleSync = (e: FormEvent) => {
    e.preventDefault();
    syncForm.post(route('admin.kelompok.sync-from-locations'), {
        preserveScroll: true,
        onSuccess: () => setShowSyncModal(false),
    });
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
 <AppLayout title="Manajemen Kelompok">
 <Head title="Manajemen Kelompok | SIBERDAYA"/>

 <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
 
 {/* PAGE HEADER */}
 <PageHeader
    title="Manajemen Kelompok"
    subtitle="Kelola unit kelompok, kuota peserta, dan penempatan wilayah penugasan KKN."
    icon={Layers}
    groupLabel="Kelompok & Penugasan"
    stats={{
        label: 'Total Unit',
        value: summary?.total_groups?.toLocaleString() ?? '0',
        icon: Users
    }}
 >
    <div className="flex items-center gap-3">
        <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-emerald-800 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
            <RefreshCw size={16} /> Sinkron Wilayah
        </button>
        <Link
            href={route('admin.kelompok.template')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-emerald-800 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
            <Download size={16} /> Template
        </Link>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium cursor-pointer shadow-sm">
            {importing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            {importing ? 'Mengimpor...' : 'Impor Data'}
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} disabled={importing} />
        </label>
    </div>
 </PageHeader>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
 
 {/* LEFT: FORM PANEL (1/3) */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
 <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
 {editingGroup ? <Pencil size={16} /> : <Plus size={16} />}
 </div>
 <div>
 <h3 className="text-sm font-bold text-emerald-950">
 {editingGroup ? 'Edit Kelompok' : 'Tambah Kelompok'}
 </h3>
 <p className="text-xs text-emerald-800">
 {editingGroup ? 'Perbarui data kelompok' : 'Buat unit kelompok baru'}
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
 <FormSelect
    label="Periode Program"
    value={form.data.period_id}
    onChange={(e) => form.setData('period_id', e.target.value)}
    error={form.errors.period_id}
    required
 >
    <option value="">Pilih Periode Aktif</option>
    {(periods || []).map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
    ))}
 </FormSelect>

 <FormSelect
    label="Wilayah Penugasan"
    value={form.data.location_id}
    onChange={(e) => form.setData('location_id', e.target.value)}
    error={form.errors.location_id}
    required
 >
    <option value="">Pilih Lokasi Desa</option>
    {(locations || []).map((l) => (
        <option key={l.id} value={l.id}>{l.full_name}</option>
    ))}
 </FormSelect>

 <FormInput
    label="Nama Kelompok"
    value={form.data.name}
    onChange={(e) => form.setData('name', e.target.value)}
    error={form.errors.name}
    placeholder="Cth: Kelompok 10 Karangduren"
    required
 />

 <div className="grid grid-cols-2 gap-4">
    <FormInput
        label="Kapasitas"
        type="number"
        min="1"
        value={form.data.capacity}
        onChange={(e) => form.setData('capacity', e.target.value)}
        error={form.errors.capacity}
        className="text-center tabular-nums"
        required
    />
    <FormSelect
        label="Status"
        value={form.data.status}
        onChange={(e) => form.setData('status', e.target.value as any)}
        error={form.errors.status}
        required
    >
        <option value="draft">Penyusunan</option>
        <option value="active">Aktif</option>
        <option value="closed">Ditutup</option>
    </FormSelect>
 </div>

 <FormSelect
    label="DPL Utama (Ketua)"
    value={form.data.lead_lecturer_id}
    onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
    error={form.errors.lead_lecturer_id}
 >
    <option value="">(Belum Tersedia)</option>
    {(lecturers || []).map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
    ))}
 </FormSelect>
 
 <button 
    type="submit"
    disabled={form.processing || !canManage} 
    className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
 >
    {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
    {editingGroup ? 'Simpan Perubahan' : 'Tambahkan Kelompok'}
 </button>
 </form>
 </div>

 {/* INLINE METRICS */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3 shadow-sm">
 <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
 <UserCheck size={18} />
 </div>
 <div>
 <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary?.groups_without_main_lecturer ?? 0}</p>
 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Tanpa DPL</p>
 </div>
 </div>
 <div className="bg-white border border-emerald-50 rounded-xl p-4 flex items-center gap-3 shadow-sm">
 <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#e8f5ee] text-[#1a7a4a]">
 <Users size={18} />
 </div>
 <div>
 <p className="text-xl font-bold text-emerald-950 tabular-nums">{summary?.total_available_slots ?? 0}</p>
 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Sisa Slot</p>
 </div>
 </div>
 </div>
 </div>

 {/* RIGHT: TABLE PANEL (2/3) */}
 <div className="lg:col-span-2">
 <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
 
 {/* Table header with search */}
 <div className="px-5 py-4 border-b border-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
 <div>
 <h3 className="text-sm font-bold text-emerald-950">Daftar Kelompok</h3>
 <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Total: {groups.meta.total} Unit</p>
 </div>
 <div className="flex gap-2 w-full sm:w-auto">
 <SearchInput
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
    placeholder="Cari kode/kelompok..."
    className="w-full sm:w-64"
 />
 <button
    onClick={handleApplyFilters}
    className="h-10 px-4 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-sm"
 >
    Filter
 </button>
 </div>
 </div>

 {/* Filter row */}
 <div className="px-5 py-3 border-b border-emerald-50 bg-gray-50/50 flex flex-wrap items-center gap-3">
 <select
 value={periodId}
 onChange={(e) => setPeriodId(e.target.value)}
 className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-bold text-emerald-800 focus:border-[#1a7a4a] outline-none transition-all min-w-[150px]"
 >
 <option value="">Semua Periode</option>
 {(periods || []).map((p) => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-bold text-emerald-800 focus:border-[#1a7a4a] outline-none transition-all"
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
 <tr className="border-b border-emerald-50 bg-gray-50/20">
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Unit & Identitas</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Lokasi Desa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Kapasitas</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {groups?.data?.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-6 py-16 text-center">
 <Layers size={32} className="mx-auto text-[#d1d5db] mb-3" strokeWidth={1} />
 <p className="text-sm font-medium text-emerald-800">Data Kelompok Tidak Ditemukan</p>
 </td>
 </tr>
 ) : (
 groups.data.map((group) => (
 <tr key={group.id} className="hover:bg-gray-50 transition-colors group/row">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-base font-semibold text-emerald-950">{group.name}</span>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[10px] font-mono font-bold bg-gray-100 text-emerald-800 px-1.5 py-0.5 rounded border border-gray-200 uppercase">{group.code}</span>
 <StatusTag
    status={group.status}
    label={group.status === 'active' ? 'AKTIF' : group.status === 'closed' ? 'DITUTUP' : 'DRAFT'}
    variant={group.status === 'active' ? 'success' : group.status === 'closed' ? 'default' : 'warning'}
    size="sm"
 />
 </div>
 <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-800 font-bold uppercase tracking-tight">
 <UserCheck size={12} className="text-[#16a34a]" />
 <span className="truncate max-w-[180px]">{group.main_lecturer?.name || 'BELUM ADA DPL'}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 align-top">
 <div className="flex flex-col">
 <span className="text-sm font-medium text-emerald-950 line-clamp-1">{group.location?.full_name || '-'}</span>
 <span className="text-[11px] font-bold text-emerald-600 uppercase mt-1 tracking-tighter opacity-70">{group.period?.name || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 align-top">
 <div className="flex flex-col gap-1.5 w-24">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-emerald-950">{group.approved_participants_count} Kel.</span>
 <span className="text-emerald-700">/ {group.capacity}</span>
 </div>
 <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
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
 className="h-8 px-3 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest border border-gray-300 text-emerald-800 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm"
 >
 Detail
 </Link>
 {canManage && (
 <>
 <button onClick={() => openEditForm(group)} className="h-8 w-8 flex items-center justify-center text-emerald-800 hover:text-emerald-950 hover:bg-white border border-transparent hover:border-emerald-100 rounded-md transition-all shadow-sm" title="Edit">
 <Pencil size={14} />
 </button>
 <button onClick={() => setDeletingId(group.id)} className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md transition-all shadow-sm" title="Hapus">
 <Trash2 size={14} />
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
 <div className="px-5 py-4 border-t border-emerald-50 flex items-center justify-between bg-gray-50/50">
 <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Halaman {groups.meta.current_page} dari {groups.meta.last_page}</span>
 <Pagination meta={groups.meta} />
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <Modal
    show={showSyncModal}
    onClose={() => setShowSyncModal(false)}
    title="Sinkronisasi Wilayah"
    maxWidth="md"
 >
    <form onSubmit={handleSync} className="space-y-6">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
            <Info size={18} className="text-[#1a7a4a] shrink-0 mt-0.5" />
            <div className="space-y-1">
                <p className="text-xs font-black text-emerald-950 uppercase tracking-wider leading-none mb-1">Konsep 1 Desa = 1 Kelompok:</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold uppercase tracking-tight">
                    Sistem akan otomatis membuat unit kelompok baru untuk setiap desa yang memiliki <strong>KODE BPS VALID</strong> namun belum terdaftar di periode terpilih.
                </p>
            </div>
        </div>

        <div className="space-y-5">
            <FormSelect
                label="Periode Target"
                value={syncForm.data.periode_id}
                onChange={(e) => syncForm.setData('periode_id', e.target.value)}
                error={syncForm.errors.periode_id}
                required
            >
                <option value="">Pilih Periode KKN</option>
                {(periods || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </FormSelect>

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="Kapasitas Default"
                    type="number"
                    min="1"
                    max="50"
                    value={syncForm.data.default_capacity}
                    onChange={(e) => syncForm.setData('default_capacity', e.target.value)}
                    error={syncForm.errors.default_capacity}
                    className="text-center font-bold"
                    required
                />
                <FormSelect
                    label="Status Awal"
                    value={syncForm.data.default_status}
                    onChange={(e) => syncForm.setData('default_status', e.target.value as any)}
                    error={syncForm.errors.default_status}
                    required
                >
                    <option value="draft">Penyusunan</option>
                    <option value="active">Aktif</option>
                </FormSelect>
            </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
            <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="flex-1 py-2.5 border border-gray-300 text-xs font-black uppercase tracking-widest rounded-lg text-emerald-950 bg-white hover:bg-gray-50 transition-all shadow-sm"
            >
                Batal
            </button>
            <button 
                type="submit" 
                className="flex-1 py-2.5 bg-[#16a34a] text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-[#15803d] transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2" 
                disabled={syncForm.processing}
            >
                {syncForm.processing ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                Proses Sinkron
            </button>
        </div>
    </form>
 </Modal>

 <ConfirmDialog
 open={deletingId !== null}
 onClose={() => setDeletingId(null)}
 onConfirm={handleDelete}
 title="Hapus Kelompok?"
 message="Data kelompok ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
 confirmVariant="danger"
 confirmLabel="Hapus Permanen"
 />
 </AppLayout>
 );
}
