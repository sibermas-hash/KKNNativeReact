import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    AlertCircle,
    Calendar,
    ChevronRight,
    ClipboardList,
    Download,
    Filter,
    Info,
    Layers3,
    MapPin,
    Plus,
    Search,
    Settings,
    Trash2,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Pagination, Modal, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Group {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    period?: { id: number; name: string } | null;
    location?: { id: number; village_name: string; full_name: string } | null;
    main_lecturer?: { id: number; name: string } | null;
    lecturers?: Array<{ id: number; name: string; role: string }>;
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
    workflow?: {
        has_locations?: boolean;
        has_periods?: boolean;
        locations_managed_automatically?: boolean;
    };
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

function statusLabel(status: string) {
    switch (status) {
        case 'active':
            return 'Aktif';
        case 'closed':
            return 'Ditutup';
        case 'draft':
            return 'Draft';
        default:
            return status;
    }
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
    switch (status) {
        case 'active':
            return 'success';
        case 'draft':
            return 'warning';
        case 'closed':
            return 'danger';
        default:
            return 'default';
    }
}

export default function GroupsIndex({ groups, periods, locations, lecturers, filters, ui, workflow }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
    const [status, setStatus] = useState(filters.status ? String(filters.status) : '');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const form = useForm<GroupFormData>(initialFormData);
    const importForm = useForm<{ file: File | null }>({ file: null });
    const canManage = ui?.can_manage ?? false;
    const hasLocations = workflow?.has_locations ?? locations.length > 0;
    const hasPeriods = workflow?.has_periods ?? periods.length > 0;
    const locationsManagedAutomatically = workflow?.locations_managed_automatically ?? true;
    const canCreate = canManage && hasLocations && hasPeriods;
    const canImport = canManage && hasPeriods;

    const summary = useMemo(() => {
        const active = groups.data.filter((group) => group.status === 'active').length;
        const draft = groups.data.filter((group) => group.status === 'draft').length;
        const occupied = groups.data.reduce((total, group) => total + group.registrations_count, 0);

        return {
            total: groups.meta?.total || 0,
            active,
            draft,
            occupied,
        };
    }, [groups]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const normalizedSearch = filters.search || '';
            const normalizedPeriodId = filters.period_id ? String(filters.period_id) : '';
            const normalizedStatus = filters.status ? String(filters.status) : '';

            if (
                search !== normalizedSearch ||
                periodId !== normalizedPeriodId ||
                status !== normalizedStatus
            ) {
                router.get(
                    route('admin.kelompok.index'),
                    {
                        search: search || undefined,
                        period_id: periodId || undefined,
                        status: status || undefined,
                    },
                    { preserveState: true, replace: true, preserveScroll: true },
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, periodId, status, filters.search, filters.period_id, filters.status]);

    const resetFilters = () => {
        setSearch('');
        setPeriodId('');
        setStatus('');
        router.get(route('admin.kelompok.index'), {}, { preserveState: true, replace: true, preserveScroll: true });
    };

    const openCreateForm = () => {
        form.reset();
        form.clearErrors();
        setShowCreateForm(true);
    };

    const closeCreateForm = () => {
        form.reset();
        form.clearErrors();
        setShowCreateForm(false);
        setEditingGroup(null);
    };

    const openEditForm = (group: Group) => {
        setEditingGroup(group);
        form.setData({
            period_id: String(group.period?.id || ''),
            location_id: String(group.location?.id || ''),
            lead_lecturer_id: String(group.main_lecturer?.id || ''),
            name: group.name,
            capacity: String(group.capacity),
            status: group.status as 'draft' | 'active' | 'closed',
        });
        form.clearErrors();
    };

    const submitCreateForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform(() => ({
            period_id: form.data.period_id,
            location_id: form.data.location_id,
            name: form.data.name,
            nama_kelompok: form.data.name,
            capacity: form.data.capacity,
            status: form.data.status,
            lecturers: form.data.lead_lecturer_id
                ? [{ id: Number(form.data.lead_lecturer_id), role: 'Ketua' }]
                : [],
        }));

        if (editingGroup) {
            form.put(route('admin.kelompok.update', editingGroup.id), {
                preserveScroll: true,
                onSuccess: () => closeCreateForm(),
            });
        } else {
            form.post(route('admin.kelompok.store'), {
                preserveScroll: true,
                onSuccess: () => closeCreateForm(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingId) return;
        router.delete(route('admin.kelompok.destroy', deletingId), {
            preserveScroll: true,
            onSuccess: () => setDeletingId(null),
        });
    };

    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        importForm.setData('file', event.target.files?.[0] ?? null);
    };

    const submitImportForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('admin.kelompok.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset(),
        });
    };

    return (
        <AppLayout title="Kelompok KKN">
            <Head title="Kelompok KKN" />

            <div className="space-y-8 pb-24">
                <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <Layers3 className="h-4 w-4" />
                            Operasional Kelompok
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                            <span className="font-serif italic font-normal text-emerald-600">Manajemen</span> <br />
                            Kelompok KKN.
                        </h1>
                        <p className="max-w-3xl text-sm font-bold text-slate-400 italic leading-relaxed">
                            Pusat kendali unit kolektif mahasiswa yang mencakup alokasi wilayah, kapasitas bimbingan, dan penempatan strategis personel.
                        </p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => (showCreateForm ? closeCreateForm() : openCreateForm())}
                            disabled={!canCreate}
                            className="h-16 px-8 bg-emerald-600 text-white rounded-[1.5rem] text-sm font-black flex items-center gap-4 hover:shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {showCreateForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            <span>{showCreateForm ? 'BATALKAN_AKSI' : 'BUAT_UNIT_BARU'}</span>
                        </button>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start gap-3">
                        <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Alur Bulk Data</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Import kelompok sekarang sudah cukup untuk membentuk master lokasi sekaligus. Sistem akan membuat atau memperbarui lokasi otomatis dari kolom <strong>desa, kecamatan, dan kabupaten</strong>, lalu mengunci penugasan DPL sampai ada data kelompok.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Langkah 1</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">Import Kelompok</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Sekali upload file kelompok. Lokasi akan otomatis dibuat atau disesuaikan dari setiap baris data kelompok.
                            </p>
                            <p className="mt-3 text-sm font-medium text-slate-700">
                                Status prasyarat: {hasPeriods ? 'periode siap' : 'periode belum tersedia'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Langkah 2</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">Import Penugasan DPL</p>
                            <p className="mt-1 text-sm text-slate-600">Penugasan DPL baru bisa dijalankan setelah data kelompok tersedia.</p>
                            <Link href="/admin/dosen/penugasan" className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800">
                                Buka penugasan DPL
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Total Kelompok', value: summary.total, color: 'slate', icon: Users },
                        { label: 'Kelompok Aktif', value: summary.active, color: 'emerald', icon: UserCheck },
                        { label: 'Status Draft', value: summary.draft, color: 'amber', icon: ClipboardList },
                        { label: 'Peserta Terplot', value: summary.occupied, color: 'blue', icon: Layers3 },
                    ].map((s, i) => (
                        <div key={i} className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                                <s.icon size={60} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase italic mb-2 leading-none">{s.label}</p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none group-hover:text-emerald-700 transition-colors">{s.value}</h4>
                        </div>
                    ))}
                </div>

                {canManage && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-start gap-3">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <Upload className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Import Kelompok dari Excel</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Gunakan file Excel/CSV untuk membuat atau memperbarui kelompok secara bulk.
                                </p>
                            </div>
                        </div>

                        {!hasPeriods ? (
                            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="space-y-1">
                                    {!hasPeriods ? <p>Import kelompok dikunci karena periode KKN belum tersedia.</p> : null}
                                    {!hasPeriods && locationsManagedAutomatically ? <p>Lokasi tidak perlu diupload terpisah; sistem akan membuatnya otomatis dari file kelompok.</p> : null}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
                                Format minimal: <code>kode_kelompok</code>, <code>nama_kelompok</code>, <code>periode</code>, <code>desa</code>, <code>kecamatan</code>, <code>kabupaten</code>, <code>kapasitas</code>, <code>status</code>.
                            </div>
                        )}

                        <div className="mb-5">
                            <a
                                href={route('admin.kelompok.template')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Template CSV
                            </a>
                        </div>

                        <form onSubmit={submitImportForm} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    File Excel / CSV
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.txt"
                                    onChange={handleImportFileChange}
                                    disabled={!canImport}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                {importForm.errors.file ? (
                                    <p className="mt-2 text-xs text-red-600">{importForm.errors.file}</p>
                                ) : null}
                            </div>

                            <button
                                type="submit"
                                disabled={importForm.processing || !importForm.data.file || !canImport}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Upload className="h-4 w-4" />
                                {importForm.processing ? 'Mengimpor...' : 'Jalankan Import Kelompok'}
                            </button>
                        </form>
                    </div>
                )}

                {showCreateForm && canManage && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Buat Kelompok Baru</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Buat kelompok baru manual. Untuk jalur manual, lokasi tetap harus sudah ada agar penempatan kelompok jelas.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitCreateForm} className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nama Kelompok</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                    placeholder="Contoh: Kelompok Anggrek 01"
                                />
                                {form.errors.name && <p className="text-sm text-rose-600">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Periode KKN</label>
                                <select
                                    value={form.data.period_id}
                                    onChange={(event) => form.setData('period_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value="">Pilih periode</option>
                                    {periods.map((period) => (
                                        <option key={period.id} value={period.id}>
                                            {period.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.period_id && <p className="text-sm text-rose-600">{form.errors.period_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Lokasi Penempatan</label>
                                <select
                                    value={form.data.location_id}
                                    onChange={(event) => form.setData('location_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value="">Pilih lokasi</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.full_name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.location_id && <p className="text-sm text-rose-600">{form.errors.location_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">DPL Utama</label>
                                <select
                                    value={form.data.lead_lecturer_id}
                                    onChange={(event) => form.setData('lead_lecturer_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value="">Belum ditentukan</option>
                                    {lecturers.map((lecturer) => (
                                        <option key={lecturer.id} value={lecturer.id}>
                                            {lecturer.name}
                                        </option>
                                    ))}
                                </select>
                                    {form.errors.lead_lecturer_id && <p className="text-sm text-rose-600">{form.errors.lead_lecturer_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Kapasitas</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={form.data.capacity}
                                    onChange={(event) => form.setData('capacity', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                />
                                {form.errors.capacity && <p className="text-sm text-rose-600">{form.errors.capacity}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Status Awal</label>
                                <select
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value as GroupFormData['status'])}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Aktif</option>
                                    <option value="closed">Ditutup</option>
                                </select>
                                {form.errors.status && <p className="text-sm text-rose-600">{form.errors.status}</p>}
                            </div>

                            <div className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <p>
                                    Kalau DPL yang dipilih belum aktif pada periode terkait, penyimpanan akan ditolak. Anda tetap bisa membuat kelompok dulu
                                    lalu menugaskan DPL dari menu penugasan DPL.
                                </p>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeCreateForm}
                                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Kelompok'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-start gap-3">
                        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Filter Kelompok</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Cari kelompok berdasarkan nama, kode, lokasi penempatan, periode, atau status operasional.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="relative xl:col-span-2">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Cari nama kelompok, kode, desa, kecamatan, atau nama DPL"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            />
                        </div>

                        <select
                            value={periodId}
                            onChange={(event) => setPeriodId(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="">Semua periode</option>
                            {periods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-3">
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            >
                                <option value="">Semua status</option>
                                <option value="draft">Draft</option>
                                <option value="active">Aktif</option>
                                <option value="closed">Ditutup</option>
                            </select>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {groups.data.map((group) => (
                        <div
                            key={group.id}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                                        <Badge variant={statusVariant(group.status)}>{statusLabel(group.status)}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Kode: <span className="font-medium text-slate-700">{group.code}</span>
                                    </p>
                                </div>

                                <Link
                                    href={route('admin.kelompok.show', group.id)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Link>
                            </div>

                            <div className="mt-6 space-y-4 text-sm text-slate-600">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-sm border border-slate-100">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Periode</p>
                                        <p className="text-sm font-bold text-slate-700 leading-none">{group.period?.name || 'BELUM_DITENTUKAN'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shadow-sm border border-slate-100">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Lokasi_Target</p>
                                        <p className="text-sm font-bold text-slate-700 leading-tight uppercase italic">{group.location?.full_name || 'BELUM_DITENTUKAN'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm border border-slate-100">
                                        <UserCheck size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">DPL_Utama</p>
                                        <p className="text-sm font-bold text-slate-700 leading-none uppercase italic">{group.main_lecturer?.name || 'BELUM_DITUGASKAN'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-50">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Kapasitas</p>
                                    <p className="text-lg font-black text-slate-900 italic tracking-tighter leading-none">
                                        {group.registrations_count} / {group.capacity} <span className="text-[10px] text-slate-400">PAX</span>
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    {canManage && (
                                        <>
                                            <button
                                                onClick={() => openEditForm(group)}
                                                className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-90"
                                            >
                                                <Settings size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(group.id)}
                                                className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        href={route('admin.kelompok.show', group.id)}
                                        className="h-12 px-6 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-3"
                                    >
                                        OPEN
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {groups.data.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                        <Users className="mx-auto h-12 w-12 text-slate-300" />
                        <h4 className="mt-4 text-lg font-semibold text-slate-800">Belum ada kelompok yang cocok dengan filter</h4>
                        <p className="mt-2 text-sm text-slate-600">
                            Ubah filter pencarian atau buat kelompok baru terlebih dahulu agar peserta bisa ditempatkan ke lokasi KKN.
                        </p>
                    </div>
                )}

                <div className="flex flex-col items-start justify-between gap-6 pt-10 border-t border-slate-100 md:flex-row md:items-center">
                    <div className="flex items-center gap-4 group cursor-help">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic group-hover:text-slate-900 transition-colors leading-none">
                            Operational Logistics Registry Protocol v4.0 / Integrity Safe
                        </p>
                    </div>
                    <Pagination meta={groups.meta} />
                </div>
            </div>

            {/* MODAL EDIT / UPDATE */}
            <Modal open={!!editingGroup} onClose={closeCreateForm} maxWidth="2xl">
                <div className="p-10 space-y-8">
                    <div className="flex items-start gap-6 border-b border-slate-50 pb-6">
                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                            <Settings size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Mutasi Entitas Kelompok</h2>
                            <p className="text-sm font-bold text-slate-400 italic">Perubahan parameter operasional untuk unit ID: {editingGroup?.code}</p>
                        </div>
                    </div>

                    <form onSubmit={submitCreateForm} className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Nama_Unit</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="w-full h-14 rounded-xl border border-slate-200 px-5 text-sm font-bold italic shadow-sm outline-none focus:border-emerald-500 transition-all"
                            />
                            {form.errors.name && <p className="text-xs font-black text-rose-500 italic ml-1 uppercase">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Periode</label>
                            <select
                                value={form.data.period_id}
                                onChange={(event) => form.setData('period_id', event.target.value)}
                                className="w-full h-14 rounded-xl border border-slate-200 px-5 text-sm font-bold italic shadow-sm outline-none focus:border-emerald-500 appearance-none bg-white"
                            >
                                <option value="">Pilih periode</option>
                                {periods.map((period) => (
                                    <option key={period.id} value={period.id}>{period.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Geografis_Target</label>
                            <select
                                value={form.data.location_id}
                                onChange={(event) => form.setData('location_id', event.target.value)}
                                className="w-full h-14 rounded-xl border border-slate-200 px-5 text-sm font-bold italic shadow-sm outline-none focus:border-emerald-500 appearance-none bg-white"
                            >
                                <option value="">Pilih lokasi</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>{loc.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Kapasitas</label>
                            <input
                                type="number"
                                value={form.data.capacity}
                                onChange={(event) => form.setData('capacity', event.target.value)}
                                className="w-full h-14 rounded-xl border border-slate-200 px-5 text-sm font-bold italic shadow-sm outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-4 pt-6">
                            <button
                                type="button"
                                onClick={closeCreateForm}
                                className="px-6 h-14 rounded-xl text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase italic tracking-widest"
                            >
                                Batalkan
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-10 h-14 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 shadow-xl transition-all active:scale-95 uppercase italic tracking-widest"
                            >
                                {form.processing ? 'SINKRONISASI...' : 'TERAPKAN_PERUBAHAN'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDialog
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="TERMINASI_UNIT"
                message="Aksi ini akan menghapus entitas kelompok secara permanen. Pastikan tidak ada personel aktif di dalam unit ini sebelum melakukan terminasi."
                confirmVariant="danger"
            />
        </AppLayout>
    );
}
