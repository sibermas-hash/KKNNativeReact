import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    AlertCircle,
    CheckCircle2,
    MapPinned,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

interface DosenOption {
    id: number;
    nama: string;
    nip: string;
}

interface PeriodOption {
    id: number;
    name: string;
    periode?: number | null;
    jenis?: string | null;
}

interface AssignmentRow {
    id: number;
    max_groups: number;
    current_groups: number;
    remaining_slots: number;
    is_active: boolean;
    dosen: DosenOption;
    period: PeriodOption;
}

interface GroupRow {
    id: number;
    name: string;
    code: string;
    dpl_period_id: number | null;
    period: PeriodOption;
    location?: {
        district_name?: string | null;
        regency_name?: string | null;
    } | null;
    dpl?: DosenOption | null;
}

interface DistrictOption {
    district_id: string;
    district_name: string;
    regency_name?: string | null;
}

interface DistrictCoordinatorRow {
    id: number;
    district_id: string;
    district_name: string;
    regency_name?: string | null;
    period: PeriodOption;
    dosen: DosenOption;
}

interface Props {
    assignments: AssignmentRow[];
    groups: GroupRow[];
    allDosen: DosenOption[];
    allPeriods: PeriodOption[];
    districts: DistrictOption[];
    districtCoordinators: DistrictCoordinatorRow[];
    filters: {
        search?: string;
    };
}

/**
 * Memformat tampilan periode menjadi string yang mudah dibaca.
 */
function formatPeriod(period: PeriodOption): string {
    const parts = [period.name];

    if (period.periode) {
        parts.push(`Periode ${period.periode}`);
    }

    if (period.jenis) {
        parts.push(period.jenis);
    }

    return parts.join(' · ');
}

/**
 * Memformat lokasi kelompok menjadi string alamat.
 */
function formatLocation(group: GroupRow): string {
    const parts = [];
    if (group.location?.district_name) parts.push(group.location.district_name);
    if (group.location?.regency_name) parts.push(group.location.regency_name);
    return parts.join(', ') || 'Lokasi administratif belum tersedia';
}

export default function DplAssignment({
    assignments,
    groups,
    allDosen,
    allPeriods,
    districts,
    districtCoordinators,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const periodForm = useForm({
        dosen_id: '',
        period_id: '',
        max_groups: '5',
    });

    const groupForm = useForm({
        group_id: '',
        dpl_period_id: '',
    });

    const districtForm = useForm({
        dosen_id: '',
        period_id: '',
        district_id: '',
        max_groups: '5',
    });

    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    const selectedGroup = useMemo(
        () => groups.find((group) => String(group.id) === groupForm.data.group_id) ?? null,
        [groupForm.data.group_id, groups],
    );

    const availableAssignments = useMemo(() => {
        if (!selectedGroup) {
            return assignments;
        }

        return assignments.filter((assignment) => assignment.period.id === selectedGroup.period.id);
    }, [assignments, selectedGroup]);

    const assignedGroupCount = groups.filter((group) => group.dpl_period_id !== null).length;
    const progressPercentage = groups.length > 0 ? (assignedGroupCount / groups.length) * 100 : 0;

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            route('admin.dpl.penugasan'),
            { search },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitPeriodAssignment = (event: FormEvent) => {
        event.preventDefault();
        periodForm.post(route('admin.dpl.tugaskan-periode'), {
            preserveScroll: true,
            onSuccess: () => periodForm.reset('dosen_id', 'period_id'),
        });
    };

    const submitGroupAssignment = (event: FormEvent) => {
        event.preventDefault();

        if (!groupForm.data.group_id) {
            return;
        }

        groupForm.post(route('admin.dpl.tugaskan-kelompok', Number(groupForm.data.group_id)), {
            preserveScroll: true,
            onSuccess: () => groupForm.reset('group_id', 'dpl_period_id'),
        });
    };

    const submitDistrictCoordinator = (event: FormEvent) => {
        event.preventDefault();
        districtForm.post(route('admin.dpl.tugaskan-wilayah'), {
            preserveScroll: true,
            onSuccess: () => districtForm.reset('dosen_id', 'period_id', 'district_id'),
        });
    };

    const submitImport = (event: FormEvent) => {
        event.preventDefault();
        importForm.post(route('admin.dpl.impor'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset(),
        });
    };

    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        importForm.setData('file', event.target.files?.[0] ?? null);
    };

    return (
        <AppLayout title="Penugasan DPL">
            <Head title="Penugasan DPL" />

            <div className="space-y-8 pb-20">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Penugasan DPL</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Aktivasi DPL per periode, penugasan ke kelompok, dan penetapan koordinator kecamatan.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900">Aktivasi DPL per periode</h2>
                                    <p className="text-sm text-slate-500">
                                        Akun DPL akan dibuat saat dosen diaktifkan pada periode ini.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitPeriodAssignment} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Dosen
                                    </label>
                                    <select
                                        value={periodForm.data.dosen_id}
                                        onChange={(event) => periodForm.setData('dosen_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                                        required
                                    >
                                        <option value="">Pilih dosen</option>
                                        {allDosen.map((dosen) => (
                                            <option key={dosen.id} value={dosen.id}>
                                                {dosen.nama} ({dosen.nip})
                                            </option>
                                        ))}
                                    </select>
                                    {periodForm.errors.dosen_id ? (
                                        <p className="mt-2 text-xs text-red-600">{periodForm.errors.dosen_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Periode
                                    </label>
                                    <select
                                        value={periodForm.data.period_id}
                                        onChange={(event) => periodForm.setData('period_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                                        required
                                    >
                                        <option value="">Pilih periode</option>
                                        {allPeriods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {formatPeriod(period)}
                                            </option>
                                        ))}
                                    </select>
                                    {periodForm.errors.period_id ? (
                                        <p className="mt-2 text-xs text-red-600">{periodForm.errors.period_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Maksimum kelompok
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={periodForm.data.max_groups}
                                        onChange={(event) => periodForm.setData('max_groups', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                                    />
                                    {periodForm.errors.max_groups ? (
                                        <p className="mt-2 text-xs text-red-600">{periodForm.errors.max_groups}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={periodForm.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {periodForm.processing ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="h-4 w-4" />
                                    )}
                                    Aktifkan DPL
                                </button>
                            </form>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="rounded-lg bg-sky-50 p-3 text-sky-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900">Tetapkan DPL ke kelompok</h2>
                                    <p className="text-sm text-slate-500">
                                        Penugasan kelompok hanya valid bila periodenya sama.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitGroupAssignment} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Kelompok
                                    </label>
                                    <select
                                        value={groupForm.data.group_id}
                                        onChange={(event) => groupForm.setData('group_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5"
                                        required
                                    >
                                        <option value="">Pilih kelompok</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.code} · {group.name}
                                            </option>
                                        ))}
                                    </select>
                                    {groupForm.errors.group_id ? (
                                        <p className="mt-2 text-xs text-red-600">{groupForm.errors.group_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Penugasan DPL aktif
                                    </label>
                                    <select
                                        value={groupForm.data.dpl_period_id}
                                        onChange={(event) => groupForm.setData('dpl_period_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5"
                                        disabled={!selectedGroup}
                                        required
                                    >
                                        <option value="">
                                            {selectedGroup ? 'Pilih DPL aktif' : 'Pilih kelompok lebih dulu'}
                                        </option>
                                        {availableAssignments.map((assignment) => (
                                            <option key={assignment.id} value={assignment.id}>
                                                {assignment.dosen.nama} · Sisa {assignment.remaining_slots} slot
                                            </option>
                                        ))}
                                    </select>
                                    {selectedGroup && availableAssignments.length === 0 ? (
                                        <p className="mt-2 text-xs text-amber-600">
                                            Belum ada DPL aktif untuk periode kelompok ini.
                                        </p>
                                    ) : null}
                                    {groupForm.errors.dpl_period_id ? (
                                        <p className="mt-2 text-xs text-red-600">{groupForm.errors.dpl_period_id}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={groupForm.processing || !selectedGroup || availableAssignments.length === 0}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
                                >
                                    {groupForm.processing ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    Simpan penugasan kelompok
                                </button>
                            </form>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="rounded-lg bg-violet-50 p-3 text-violet-600">
                                    <MapPinned className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900">Koordinator kecamatan</h2>
                                    <p className="text-sm text-slate-500">
                                        Satu kecamatan dapat memiliki satu koordinator aktif per periode.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitDistrictCoordinator} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Dosen
                                    </label>
                                    <select
                                        value={districtForm.data.dosen_id}
                                        onChange={(event) => districtForm.setData('dosen_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                                        required
                                    >
                                        <option value="">Pilih dosen</option>
                                        {allDosen.map((dosen) => (
                                            <option key={dosen.id} value={dosen.id}>
                                                {dosen.nama} ({dosen.nip})
                                            </option>
                                        ))}
                                    </select>
                                    {districtForm.errors.dosen_id ? (
                                        <p className="mt-2 text-xs text-red-600">{districtForm.errors.dosen_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Periode
                                    </label>
                                    <select
                                        value={districtForm.data.period_id}
                                        onChange={(event) => districtForm.setData('period_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                                        required
                                    >
                                        <option value="">Pilih periode</option>
                                        {allPeriods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {formatPeriod(period)}
                                            </option>
                                        ))}
                                    </select>
                                    {districtForm.errors.period_id ? (
                                        <p className="mt-2 text-xs text-red-600">{districtForm.errors.period_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Kecamatan
                                    </label>
                                    <select
                                        value={districtForm.data.district_id}
                                        onChange={(event) => districtForm.setData('district_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                                        required
                                    >
                                        <option value="">Pilih kecamatan</option>
                                        {districts.map((district) => (
                                            <option key={`${district.district_id}-${district.regency_name ?? ''}`} value={district.district_id}>
                                                {district.district_name}
                                                {district.regency_name ? ` · ${district.regency_name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {districtForm.errors.district_id ? (
                                        <p className="mt-2 text-xs text-red-600">{districtForm.errors.district_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Maksimum kelompok
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={districtForm.data.max_groups}
                                        onChange={(event) => districtForm.setData('max_groups', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                                    />
                                    {districtForm.errors.max_groups ? (
                                        <p className="mt-2 text-xs text-red-600">{districtForm.errors.max_groups}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={districtForm.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                                >
                                    {districtForm.processing ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <MapPinned className="h-4 w-4" />
                                    )}
                                    Tetapkan koordinator kecamatan
                                </button>
                            </form>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900">Import penugasan DPL</h2>
                                    <p className="text-sm text-slate-500">
                                        Gunakan Excel untuk aktivasi DPL, penugasan kelompok, dan koordinator wilayah.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitImport} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        File Excel
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.txt"
                                        onChange={handleImportFileChange}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                        required
                                    />
                                    {importForm.errors.file ? (
                                        <p className="mt-2 text-xs text-red-600">{importForm.errors.file}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={importForm.processing || !importForm.data.file}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
                                >
                                    {importForm.processing ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    Jalankan import
                                </button>
                            </form>
                        </section>

                        <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-semibold">Catatan operasional</h3>
                                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                                        Sinkronisasi master dosen, aktivasi DPL, penugasan kelompok, dan koordinator
                                        kecamatan sekarang dipisah. Dosen baru akan memiliki akun login hanya setelah
                                        diaktifkan pada periode tertentu.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8 xl:col-span-8">
                        <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Status penugasan kelompok</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {assignedGroupCount} dari {groups.length} kelompok sudah memiliki DPL utama.
                                    </p>
                                </div>
                                <div className="text-sm font-semibold text-slate-700">
                                    {progressPercentage.toFixed(1)}% terisi
                                </div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari kelompok, DPL, periode, atau kecamatan..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                            />
                        </form>

                        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Penugasan DPL per periode</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Pantau kapasitas DPL sebelum ditugaskan ke kelompok.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {assignments.length > 0 ? (
                                    assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900">
                                                            {assignment.dosen.nama}
                                                        </p>
                                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                                            {assignment.dosen.nip}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">
                                                        {formatPeriod(assignment.period)}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                                                        <span>Maksimum {assignment.max_groups} kelompok</span>
                                                        <span>{assignment.current_groups} kelompok aktif</span>
                                                        <span>Sisa {assignment.remaining_slots} slot</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={assignment.current_groups > 0}
                                                    onClick={() =>
                                                        router.patch(
                                                            route('admin.dpl.lepas-periode', assignment.id),
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Nonaktifkan
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                                        Belum ada penugasan DPL untuk filter saat ini.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Koordinator kecamatan</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Koordinator bertugas memantau seluruh kelompok di kecamatan yang ditetapkan.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {districtCoordinators.length > 0 ? (
                                    districtCoordinators.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-start lg:justify-between"
                                        >
                                            <div className="space-y-2">
                                                <p className="font-semibold text-slate-900">
                                                    {assignment.district_name}
                                                    {assignment.regency_name ? `, ${assignment.regency_name}` : ''}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {assignment.dosen.nama} ({assignment.dosen.nip})
                                                </p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    {formatPeriod(assignment.period)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(
                                                        route('admin.dpl.lepas-wilayah', assignment.id),
                                                        {},
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Nonaktifkan
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                                        Belum ada koordinator kecamatan yang aktif.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Daftar kelompok</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Pastikan setiap kelompok memiliki DPL utama yang sesuai dengan periodenya.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {groups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{group.name}</h3>
                                                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                                                    {group.code}
                                                </p>
                                            </div>
                                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                #{group.id}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                                            <p>{formatPeriod(group.period)}</p>
                                            <p>{formatLocation(group) || 'Lokasi administratif belum tersedia'}</p>
                                        </div>

                                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            {group.dpl ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                                        DPL utama
                                                    </p>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {group.dpl.nama}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{group.dpl.nip}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                                                        Belum ada DPL
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        Kelompok ini masih menunggu penugasan DPL.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
