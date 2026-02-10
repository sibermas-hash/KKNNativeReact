import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, ConfirmDialog, Badge } from '@/Components/UI';
import type { PageProps } from '@/types';

interface AcademicYear {
    id: number;
    year: string;
    is_active: boolean;
}

interface Props extends PageProps {
    academicYears: AcademicYear[];
}

export default function AcademicYearsIndex({ academicYears }: Props) {
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [deleting, setDeleting] = useState<AcademicYear | null>(null);

    const form = useForm({ year: '', is_active: false });

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
                    <label className="flex items-center gap-2 pb-2">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700">Aktif</span>
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
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tahun</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {academicYears.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Belum ada data.
                                </td>
                            </tr>
                        ) : (
                            academicYears.map((ay) => (
                                <tr key={ay.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{ay.year}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ay.is_active ? 'success' : 'default'}>
                                            {ay.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(ay)}>Edit</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(ay)} className="text-red-600">Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
