import axios from 'axios';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Calendar, CheckCircle2, FileSpreadsheet, MapPin, Pencil, Plus, RefreshCw, Users, X } from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';

interface WorkshopParticipant {
    id: number;
    user_id: number;
    name: string;
    email?: string | null;
    attendance_status?: string | null;
    certificate_generated?: boolean;
}

interface WorkshopRow {
    id: number;
    title: string;
    description?: string | null;
    methodology?: string | null;
    date: string;
    workshop_date_value: string;
    time: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    registered: number;
    max_participants?: number | null;
    status: string;
    can_edit?: boolean;
    can_cancel?: boolean;
    participants: WorkshopParticipant[];
    period?: {
        id: number;
        name: string;
    } | null;
}

interface Summary {
    total_workshops: number;
    scheduled_workshops: number;
    cancelled_workshops: number;
    total_registered: number;
    total_attended: number;
}

interface Props {
    workshops: WorkshopRow[];
    periods?: Array<{ id: number; name: string }>;
    filters?: {
        period_id?: number | string | null;
    };
    workflow?: {
        period_scoped?: boolean;
    };
    summary?: Summary;
}

type WorkshopFormData = {
    period_id: string;
    title: string;
    description: string;
    methodology: string;
    workshop_date: string;
    start_time: string;
    end_time: string;
    location: string;
    max_participants: string;
};

const emptyWorkshopForm: WorkshopFormData = {
    period_id: '',
    title: '',
    description: '',
    methodology: '',
    workshop_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
};

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function formatWorkshopStatus(status?: string | null): string {
    switch ((status ?? '').toLowerCase()) {
        case 'scheduled':
            return 'Terjadwal';
        case 'ongoing':
            return 'Berlangsung';
        case 'completed':
            return 'Selesai';
        case 'cancelled':
            return 'Dibatalkan';
        default:
            return status || 'Belum diatur';
    }
}

function formatAttendanceStatus(status?: string | null): string {
    switch ((status ?? '').toLowerCase()) {
        case 'attended':
            return 'Hadir';
        case 'absent':
            return 'Tidak hadir';
        case 'excused':
            return 'Izin';
        case 'registered':
            return 'Terdaftar';
        default:
            return 'Belum diproses';
    }
}

export default function WorkshopIndex({ workshops, periods = [], filters, workflow, summary }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingWorkshop, setEditingWorkshop] = useState<WorkshopRow | null>(null);
    const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopRow | null>(null);
    const [periodFilter, setPeriodFilter] = useState(filters?.period_id ? String(filters.period_id) : '');
    const [previewData, setPreviewData] = useState<Array<{ nip: string; name: string; status: string; message: string }>>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const form = useForm<WorkshopFormData>(emptyWorkshopForm);
    const attendanceForm = useForm({ user_ids: [] as number[] });
    const importForm = useForm({ nims: [] as string[] });

    const periodScoped = workflow?.period_scoped ?? false;

    useEffect(() => {
        if (!periodScoped) {
            return;
        }

        const timer = window.setTimeout(() => {
            const normalizedFilter = filters?.period_id ? String(filters.period_id) : '';

            if (periodFilter !== normalizedFilter) {
                router.get(
                    route('admin.workshops.index'),
                    { period_id: periodFilter || undefined },
                    { preserveState: true, preserveScroll: true, replace: true },
                );
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [filters?.period_id, periodFilter, periodScoped]);

    const effectiveSummary = useMemo<Summary>(() => ({
        total_workshops: summary?.total_workshops ?? workshops.length,
        scheduled_workshops: summary?.scheduled_workshops ?? workshops.filter((workshop) => workshop.status === 'scheduled').length,
        cancelled_workshops: summary?.cancelled_workshops ?? workshops.filter((workshop) => workshop.status === 'cancelled').length,
        total_registered: summary?.total_registered ?? workshops.reduce((sum, workshop) => sum + workshop.registered, 0),
        total_attended:
            summary?.total_attended
            ?? workshops.reduce(
                (sum, workshop) => sum + workshop.participants.filter((participant) => participant.attendance_status === 'attended').length,
                0,
            ),
    }), [summary, workshops]);

    const openCreateForm = () => {
        setEditingWorkshop(null);
        form.reset();
        form.clearErrors();
        if (periodScoped && periodFilter) {
            form.setData('period_id', periodFilter);
        }
        setShowForm(true);
    };

    const openEditForm = (workshop: WorkshopRow) => {
        setEditingWorkshop(workshop);
        form.clearErrors();
        form.setData({
            period_id: workshop.period ? String(workshop.period.id) : (periodFilter || ''),
            title: workshop.title ?? '',
            description: workshop.description ?? '',
            methodology: workshop.methodology ?? '',
            workshop_date: workshop.workshop_date_value ?? '',
            start_time: workshop.start_time ?? '',
            end_time: workshop.end_time ?? '',
            location: workshop.location ?? '',
            max_participants: workshop.max_participants ? String(workshop.max_participants) : '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingWorkshop(null);
        form.reset();
        form.clearErrors();
    };

    const openAttendancePanel = (workshop: WorkshopRow) => {
        setSelectedWorkshop(workshop);
        attendanceForm.setData(
            'user_ids',
            workshop.participants.filter((participant) => participant.attendance_status === 'attended').map((participant) => participant.user_id),
        );
        importForm.reset();
        setImportFile(null);
        setPreviewData([]);
    };

    const closeAttendancePanel = () => {
        setSelectedWorkshop(null);
        attendanceForm.reset();
        importForm.reset();
        setImportFile(null);
        setPreviewData([]);
    };

    const submitWorkshop = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeForm(),
        };

        if (editingWorkshop) {
            form.patch(route('admin.workshops.update', editingWorkshop.id), options);
            return;
        }

        form.post(route('admin.workshops.store'), options);
    };

    const toggleAttendance = (userId: number) => {
        const current = attendanceForm.data.user_ids;
        attendanceForm.setData('user_ids', current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
    };

    const submitAttendance = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedWorkshop) {
            return;
        }

        attendanceForm.post(route('admin.workshops.mark-attendance', selectedWorkshop.id), {
            preserveScroll: true,
            onSuccess: () => closeAttendancePanel(),
        });
    };

    const cancelWorkshop = (workshop: WorkshopRow) => {
        if (!window.confirm(`Batalkan pembekalan "${workshop.title}"?`)) {
            return;
        }

        router.patch(route('admin.workshops.cancel', workshop.id), {}, { preserveScroll: true });
    };

    const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setImportFile(file);
        setPreviewData([]);

        if (!file || !selectedWorkshop) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsPreviewLoading(true);

        try {
            const response = await axios.post(route('admin.workshops.preview-absensi', selectedWorkshop.id), formData);
            setPreviewData(response.data.preview ?? []);
            importForm.setData(
                'nims',
                (response.data.preview ?? [])
                    .filter((item: { status: string }) => item.status === 'success')
                    .map((item: { nip: string }) => item.nip),
            );
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                window.alert(error.response?.data?.error ?? 'Gagal memproses pratinjau file.');
            } else {
                window.alert('Terjadi kesalahan sistem saat memproses file.');
            }
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedWorkshop || importForm.data.nims.length === 0) {
            return;
        }

        importForm.post(route('admin.workshops.import-absensi', selectedWorkshop.id), {
            preserveScroll: true,
            onSuccess: () => closeAttendancePanel(),
        });
    };

    return (
        <AppLayout title="Workshop dan Pembekalan">
            <Head title="Workshop dan Pembekalan" />

            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Modul Operasional</p>
                            <h1 className="text-3xl font-bold text-slate-900">Workshop dan Pembekalan</h1>
                            <p className="max-w-3xl text-sm text-slate-600">
                                Gunakan halaman ini untuk menjadwalkan pembekalan, mencatat kehadiran, dan memastikan peserta yang
                                hadir tercatat rapi untuk kebutuhan operasional KKN.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={showForm ? closeForm : openCreateForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? 'Tutup Form' : 'Tambah Workshop'}
                        </button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <SummaryCard label="Total Workshop" value={effectiveSummary.total_workshops} />
                    <SummaryCard label="Terjadwal" value={effectiveSummary.scheduled_workshops} />
                    <SummaryCard label="Dibatalkan" value={effectiveSummary.cancelled_workshops} />
                    <SummaryCard label="Peserta Terdaftar" value={effectiveSummary.total_registered} />
                    <SummaryCard label="Peserta Hadir" value={effectiveSummary.total_attended} />
                </section>

                {showForm ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900">
                            {editingWorkshop ? 'Ubah Jadwal Workshop' : 'Tambah Jadwal Workshop'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Isi jadwal pembekalan dengan rapi agar mudah dipakai untuk presensi dan pelaporan.
                        </p>

                        <form onSubmit={submitWorkshop} className="mt-5 grid gap-4 md:grid-cols-2">
                            {periodScoped ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Periode</label>
                                    <select
                                        value={form.data.period_id}
                                        onChange={(event) => form.setData('period_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    >
                                        <option value="">Pilih periode</option>
                                        {periods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {period.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.period_id ? <p className="text-xs text-rose-600">{form.errors.period_id}</p> : null}
                                </div>
                            ) : null}

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Judul workshop</label>
                                <input
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    required
                                />
                                {form.errors.title ? <p className="text-xs text-rose-600">{form.errors.title}</p> : null}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Metodologi</label>
                                <input
                                    value={form.data.methodology}
                                    onChange={(event) => form.setData('methodology', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    placeholder="Tatap muka, hybrid, partisipatif, dll."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tanggal</label>
                                <input
                                    type="date"
                                    value={form.data.workshop_date}
                                    onChange={(event) => form.setData('workshop_date', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Jam mulai</label>
                                <input
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(event) => form.setData('start_time', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Jam selesai</label>
                                <input
                                    type="time"
                                    value={form.data.end_time}
                                    onChange={(event) => form.setData('end_time', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Lokasi</label>
                                <input
                                    value={form.data.location}
                                    onChange={(event) => form.setData('location', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Kuota maksimal</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.data.max_participants}
                                    onChange={(event) => form.setData('max_participants', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />
                            </div>

                            <div className="flex justify-end gap-3 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                    {editingWorkshop ? 'Simpan Perubahan' : 'Simpan Workshop'}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Daftar Workshop</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Presensi dan impor kehadiran dikelola langsung dari daftar jadwal di bawah ini.
                            </p>
                        </div>

                        {periodScoped ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Filter periode</label>
                                <select
                                    value={periodFilter}
                                    onChange={(event) => setPeriodFilter(event.target.value)}
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    <option value="">Semua periode</option>
                                    {periods.map((period) => (
                                        <option key={period.id} value={period.id}>
                                            {period.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[1080px] border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Workshop</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Jadwal</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lokasi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Peserta</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workshops.map((workshop) => {
                                    const attendedCount = workshop.participants.filter((participant) => participant.attendance_status === 'attended').length;

                                    return (
                                        <tr key={workshop.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-slate-900">{workshop.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">{workshop.description || 'Tidak ada deskripsi.'}</p>
                                                {workshop.methodology ? <p className="mt-2 text-xs text-slate-500">Metode: {workshop.methodology}</p> : null}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {workshop.period?.name || (periodScoped ? 'Belum ditentukan' : '-')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <p className="inline-flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-slate-400" />
                                                        {workshop.date}
                                                    </p>
                                                    <p>{workshop.time}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                    {workshop.location || 'Belum ditentukan'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {workshop.registered} / {workshop.max_participants || 'Tanpa batas'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">{attendedCount} peserta sudah hadir</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={clsx(
                                                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                        workshop.status === 'scheduled' && 'bg-emerald-100 text-emerald-700',
                                                        workshop.status === 'cancelled' && 'bg-rose-100 text-rose-700',
                                                        workshop.status === 'completed' && 'bg-slate-200 text-slate-700',
                                                        workshop.status === 'ongoing' && 'bg-amber-100 text-amber-700',
                                                    )}
                                                >
                                                    {formatWorkshopStatus(workshop.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAttendancePanel(workshop)}
                                                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Presensi
                                                    </button>
                                                    {workshop.can_edit ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditForm(workshop)}
                                                            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    ) : null}
                                                    {workshop.can_cancel ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelWorkshop(workshop)}
                                                            className="rounded-lg border border-rose-300 p-2 text-rose-700 hover:bg-rose-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {workshops.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                            Belum ada workshop pada filter yang dipilih.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>

                {selectedWorkshop ? (
                    <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Presensi Workshop</h2>
                                    <p className="mt-1 text-sm text-slate-600">{selectedWorkshop.title}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAttendancePanel}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Tutup Panel
                                </button>
                            </div>

                            <form onSubmit={submitAttendance} className="mt-5">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Hadir</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Peserta</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedWorkshop.participants.map((participant) => {
                                                const checked = attendanceForm.data.user_ids.includes(participant.user_id);

                                                return (
                                                    <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                        <td className="px-4 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleAttendance(participant.user_id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4 text-sm font-medium text-slate-900">{participant.name}</td>
                                                        <td className="px-4 py-4 text-sm text-slate-600">{participant.email || '-'}</td>
                                                        <td className="px-4 py-4 text-sm text-slate-600">
                                                            {formatAttendanceStatus(participant.attendance_status)}
                                                            {participant.certificate_generated ? ' · sertifikat siap' : ''}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedWorkshop.participants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                                                        Belum ada peserta yang terdaftar pada workshop ini.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={attendanceForm.processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {attendanceForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        Simpan Presensi
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-base font-semibold text-slate-900">Import Kehadiran</h2>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                                Unggah file Excel atau CSV untuk memeriksa NIP/NIM yang layak dicatat hadir.
                            </p>

                            <form onSubmit={submitImport} className="mt-4 space-y-4">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleImportFileChange}
                                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                />

                                <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    {isPreviewLoading ? (
                                        <div className="py-8 text-center text-sm text-slate-500">Memproses pratinjau file...</div>
                                    ) : previewData.length > 0 ? (
                                        previewData.map((item, index) => (
                                            <div key={`${item.nip}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{item.nip}</p>
                                                        <p className="mt-2 text-xs text-slate-600">{item.message}</p>
                                                    </div>
                                                    <span
                                                        className={clsx(
                                                            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                            item.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                                                        )}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-sm text-slate-500">
                                            Unggah file untuk melihat pratinjau hasil import.
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={importForm.processing || importForm.data.nims.length === 0}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {importForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                    Proses Import Kehadiran
                                </button>
                            </form>
                        </div>
                    </section>
                ) : null}
            </div>
        </AppLayout>
    );
}
