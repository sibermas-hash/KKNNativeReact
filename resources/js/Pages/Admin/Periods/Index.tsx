import { useEffect, useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, FormInput, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { 
    Plus, 
    Search, 
    Calendar, 
    Edit2,
    Trash2,
    ShieldCheck,
    Database,
    Fingerprint,
    Info,
    Copy,
    Map
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
        <AppLayout title="Manajemen Periode KKN">
            <Head title="Manajemen Periode KKN" />
            
            <div className="space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-[10px] bg-primary/10 w-fit px-3 py-1 rounded-full mb-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Manajemen Data KKN
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Periode <span className="text-primary italic">KKN</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
                            Kelola jadwal pendaftaran, kuota, dan siklus pelaksanaan pengabdian masyarakat.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 px-6 h-16">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Periode</span>
                                <span className="text-2xl font-black text-slate-900 leading-none">{periods.data.length}</span>
                            </div>
                        </div>
                        {!showForm && (
                            <button
                                onClick={openCreateForm}
                                className="h-16 px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-3 group"
                            >
                                <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-500">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <span>Tambah Periode</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Entry Form */}
                {showForm && (
                    <div className="animate-in slide-in-from-top-4 rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl duration-700 relative overflow-hidden group mb-10">
                        <div className="mb-10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="rounded-2xl bg-primary/10 p-4 text-primary shadow-inner-sm">
                                    {editing ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                                        {editing ? 'Ubah Data Periode' : 'Tambah Periode Baru'}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">Lengkapi parameter periode KKN di bawah ini.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700">Tahun Akademik</label>
                                    <FormSelect
                                        options={academicYears.map((ay) => ({ value: ay.id, label: ay.year }))}
                                        value={form.data.academic_year_id}
                                        onChange={(e) => form.setData('academic_year_id', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700">Nomor Periode</label>
                                    <FormInput
                                        type="number"
                                        placeholder="Misal: 53"
                                        value={form.data.periode}
                                        onChange={(e) => form.setData('periode', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700">Jenis KKN</label>
                                    <FormInput
                                        placeholder="Misal: KKN REGULER"
                                        value={form.data.jenis}
                                        onChange={(e) => form.setData('jenis', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700">Kuota Mahasiswa</label>
                                    <FormInput
                                        type="number"
                                        min={1}
                                        placeholder="Misal: 2000"
                                        value={form.data.kuota}
                                        onChange={(e) => form.setData('kuota', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jadwal Pendaftaran</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Mulai</label>
                                            <FormInput type="date" value={form.data.registration_start} onChange={(e) => form.setData('registration_start', e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Selesai</label>
                                            <FormInput type="date" value={form.data.registration_end} onChange={(e) => form.setData('registration_end', e.target.value)} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                        <Map className="h-4 w-4 text-primary" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pelaksanaan Lapangan</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Mulai</label>
                                            <FormInput type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Selesai</label>
                                            <FormInput type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} required />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className={clsx(
                                        "w-14 h-7 rounded-full p-1 transition-all duration-300",
                                        form.data.is_active ? 'bg-primary' : 'bg-slate-200'
                                    )}>
                                        <div className={clsx(
                                            "w-5 h-5 bg-white rounded-full transition-all duration-300 transform",
                                            form.data.is_active ? 'translate-x-7' : 'translate-x-0'
                                        )} />
                                    </div>
                                    <span className={clsx("text-xs font-bold uppercase tracking-wider", form.data.is_active ? 'text-primary' : 'text-slate-400')}>
                                        Status: {form.data.is_active ? 'Aktif' : 'Non-Aktif'}
                                    </span>
                                </button>
                                <div className="flex gap-4">
                                    <button type="button" onClick={cancelForm} className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Batal</button>
                                    <button 
                                        type="submit" 
                                        disabled={form.processing}
                                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                                    >
                                        {editing ? 'Perbarui Periode' : 'Simpan Periode'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Operations Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden mb-10">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative group max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                placeholder="Cari nama atau jenis..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-600 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identitas Periode</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Tahun Akademik</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kuota Mahasiswa</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendaftaran</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pelaksanaan</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {periods.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="p-8 bg-slate-50 rounded-full">
                                                     <Info className="h-14 w-14 text-slate-200" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-slate-500">Belum ada data periode.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    periods.data.map((period) => (
                                        <tr key={period.id} className="group transition-all duration-300 hover:bg-slate-50/50">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold">
                                                        {period.periode ?? '--'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{period.jenis ?? 'N/A'}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{period.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                                                    {period.academic_year?.year || '--'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-bold text-slate-900">{period.kuota ?? '--'}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                        Terdaftar {period.participants_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-semibold text-emerald-600">{period.registration_start}</span>
                                                    <div className="h-3 w-[1px] bg-slate-200" />
                                                    <span className="text-[10px] font-medium text-slate-400">{period.registration_end}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-semibold text-primary">{period.start_date}</span>
                                                    <div className="h-3 w-[1px] bg-slate-200" />
                                                    <span className="text-[10px] font-medium text-slate-400">{period.end_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                                    period.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                )}>
                                                    {period.is_active ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setDuplicating(period)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 rounded-xl transition-all shadow-sm group-hover:bg-emerald-50/50"
                                                        title="Duplikasi Periode"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => startEdit(period)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 rounded-xl transition-all shadow-sm"
                                                        title="Edit Periode"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleting(period)}
                                                        disabled={!period.can_delete}
                                                        className={clsx(
                                                            "p-2.5 bg-white border border-slate-200 rounded-xl transition-all shadow-sm",
                                                            period.can_delete ? "text-slate-400 hover:text-red-500 hover:border-red-200" : "opacity-20 cursor-not-allowed"
                                                        )}
                                                        title={period.can_delete ? 'Hapus Periode' : (period.delete_blocker ?? 'Sedang digunakan')}
                                                    >
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
                    {periods.meta && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-10 py-6">
                            <Pagination meta={periods.meta} />
                        </div>
                    )}
                </div>

                {/* Professional Advisory Footer */}
                <div className="p-10 bg-emerald-50 rounded-[2.5rem] border border-emerald-100/50 shadow-sm relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Informasi Tata Kelola</h4>
                            </div>
                            <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-3xl">
                                Pengaturan Periode: Periode KKN merupakan unit waktu utama yang mengatur penugasan mahasiswa dan DPL. 
                                Mengaktifkan periode akan membuka akses pendaftaran bagi mahasiswa. 
                                Pastikan kuota dan rentang waktu telah divalidasi oleh bagian akademik sebelum menggeser status ke 'AKTIF'.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic">Integritas Data Terjamin</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-300">
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!duplicating}
                onClose={() => !duplicateForm.processing && setDuplicating(null)}
                onConfirm={() => duplicating && duplicateForm.post(`/admin/periods/${duplicating.id}/duplicate`, { onSuccess: () => setDuplicating(null) })}
                title="Konfirmasi Duplikasi"
                message={`Apakah Anda yakin ingin menduplikasi periode "${duplicating?.name}"? Ini akan membuat periode baru berbasis data ini.`}
                processing={duplicateForm.processing}
                confirmLabel="Ya, Duplikasikan"
                confirmVariant="primary"
            />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => !deleteForm.processing && setDeleting(null)}
                onConfirm={() => deleting && deleteForm.delete(`/admin/periods/${deleting.id}`, { onSuccess: () => setDeleting(null) })}
                title="Konfirmasi Penghapusan"
                message={deleting?.can_delete
                    ? `Apakah Anda yakin ingin menghapus periode "${deleting.name}"? Tindakan ini tidak dapat dibatalkan.`
                    : (deleting?.delete_blocker ?? 'Data tidak dapat dihapus karena masih digunakan.')}
                processing={deleteForm.processing}
                confirmLabel="Ya, Hapus"
            />
        </AppLayout>
    );
}
