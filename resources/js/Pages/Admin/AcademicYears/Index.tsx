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
    RotateCcw, 
    CheckCircle, 
    Info,
    
    Cpu,
    Save,
    ShieldCheck
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

            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="bg-white p-6 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Tahun Akademik</h2>
                    </div>
                    <span className="text-sm text-slate-500">Total: {academicYears.meta?.total || 0}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 border border-slate-200 rounded-lg space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                                {editing ? <Edit2 className="h-5 w-5 text-slate-600" /> : <Plus className="h-5 w-5 text-slate-600" />}
                                <h3 className="font-semibold text-slate-900">{editing ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Tahun Akademik</label>
                                    <FormInput
                                        placeholder="2024/2025"
                                        value={form.data.year}
                                        onChange={(e) => form.setData('year', e.target.value)}
                                        error={form.errors.year}
                                        label=""
                                        className="text-sm rounded-lg"
                                        required
                                    />
                                </div>

                                <div
                                    className={clsx(
                                        "flex items-center gap-3 p-4 border rounded-lg cursor-pointer",
                                        form.data.is_active ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-slate-200'
                                    )}
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center",
                                        form.data.is_active ? 'bg-primary border-primary' : 'bg-white border-slate-300'
                                    )}>
                                        {form.data.is_active && <CheckCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className={clsx("text-sm font-semibold", form.data.is_active ? 'text-primary' : 'text-slate-600')}>
                                            Aktif
                                        </span>
                                        <span className="text-xs text-slate-500">Gunakan sebagai periode aktif</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                    >
                                        {editing ? 'Simpan Perubahan' : 'Tambah Tahun'}
                                    </button>
                                    {editing && (
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="w-full py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200"
                                        >
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700">
                                    Hanya satu tahun akademik yang dapat aktif. Menetapkan aktif akan menonaktifkan tahun sebelumnya.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Cari tahun akademik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Tahun Akademik</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {academicYears.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                                                Tidak ada data tahun akademik
                                            </td>
                                        </tr>
                                    ) : (
                                        academicYears.data.map((ay) => (
                                            <tr key={ay.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <span className="font-semibold text-slate-900">{ay.year}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={clsx(
                                                        "inline-flex px-2 py-1 rounded text-xs font-semibold",
                                                        ay.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {ay.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => startEdit(ay)}
                                                            className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleting(ay)}
                                                            className="p-2 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-lg"
                                                            title="Hapus"
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

                        {/* Pagination */}
                        {academicYears.meta && (
                            <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg">
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
