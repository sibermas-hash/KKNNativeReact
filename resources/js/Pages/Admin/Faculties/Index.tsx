import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, ConfirmDialog } from '@/Components/ui';
import type { PageProps, Faculty } from '@/types';

interface FacultyWithCount extends Faculty {
    programs_count: number;
}

interface Props extends PageProps {
    faculties: FacultyWithCount[];
}

export default function FacultiesIndex({ faculties }: Props) {
    const [editing, setEditing] = useState<Faculty | null>(null);
    const [deleting, setDeleting] = useState<Faculty | null>(null);

    const form = useForm({ code: '', name: '' });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/faculties/${editing.id}`, {
                onSuccess: () => { setEditing(null); form.reset(); },
            });
        } else {
            form.post('/admin/faculties', { onSuccess: () => form.reset() });
        }
    }

    function startEdit(f: Faculty) {
        setEditing(f);
        form.setData({ code: f.code, name: f.name });
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Fakultas">
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">{editing ? 'Edit Fakultas' : 'Tambah Fakultas'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                    <FormInput id="code" label="Kode" placeholder="FITK" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} error={form.errors.code} required className="w-24" />
                    <div className="min-w-[250px] flex-1">
                        <FormInput id="name" label="Nama Fakultas" placeholder="Fakultas Ilmu Tarbiyah dan Keguruan" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" loading={form.processing}>{editing ? 'Simpan' : 'Tambah'}</Button>
                        {editing && <Button variant="secondary" onClick={() => { setEditing(null); form.reset(); }}>Batal</Button>}
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kode</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Prodi</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {faculties.map((f) => (
                            <tr key={f.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{f.code}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{f.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{f.programs_count} prodi</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => startEdit(f)}>Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDeleting(f)} className="text-red-600">Hapus</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/faculties/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Fakultas"
                message={`Hapus fakultas "${deleting?.name}"? Semua program studi di bawahnya juga akan terhapus.`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
