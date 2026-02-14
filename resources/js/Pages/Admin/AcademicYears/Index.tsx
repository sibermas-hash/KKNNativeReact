import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, ConfirmDialog, Badge, Pagination } from '@/Components/ui';
import type { PageProps, AcademicYear } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

interface Props extends PageProps {
    academicYears: {
        data: AcademicYear[];
        links: any[];
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

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/academic-years', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

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
        <AppLayout title="Tahun Akademik">
            {/* Header with Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                    <FormInput
                        placeholder="Cari tahun..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
            </div>

            {/* Form */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">
                    {editing ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px] flex-1">
                        <FormInput
                            id="year"
                            label="Tahun Akademik"
                            placeholder="2024/2025"
                            value={form.data.year}
                            onChange={(e) => form.setData('year', e.target.value)}
                            error={form.errors.year}
                            required
                        />
                    </div>
                    <label className="flex items-center gap-2 pb-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 transition"
                        />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition">Aktif</span>
                    </label>
                    <div className="flex gap-2 pb-0.5">
                        <Button type="submit" loading={form.processing}>
                            {editing ? 'Simpan' : 'Tambah'}
                        </Button>
                        {editing && (
                            <Button variant="secondary" onClick={cancelEdit}>Batal</Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tahun</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {academicYears.data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                academicYears.data.map((ay) => (
                                    <tr key={ay.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{ay.year}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={ay.is_active ? 'success' : 'default'}>
                                                {ay.is_active ? 'Aktif' : 'Tidak Aktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(ay)}>Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeleting(ay)} className="text-red-600 hover:bg-red-50">Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {academicYears.meta && (
                    <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200">
                        <Pagination meta={academicYears.meta} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus Tahun Akademik"
                message={`Apakah Anda yakin ingin menghapus tahun akademik "${deleting?.year}"?`}
                confirmLabel="Ya, Hapus"
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
