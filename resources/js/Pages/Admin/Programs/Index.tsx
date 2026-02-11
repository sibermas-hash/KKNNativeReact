import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, ConfirmDialog } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';

interface ProgramWithFaculty extends Program {
    faculty: Faculty;
}

interface Props extends PageProps {
    programs: ProgramWithFaculty[];
    faculties: Faculty[];
}

export default function ProgramsIndex({ programs, faculties }: Props) {
    const [editing, setEditing] = useState<ProgramWithFaculty | null>(null);
    const [deleting, setDeleting] = useState<ProgramWithFaculty | null>(null);

    const form = useForm({ faculty_id: '', code: '', name: '' });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/programs/${editing.id}`, {
                onSuccess: () => { setEditing(null); form.reset(); },
            });
        } else {
            form.post('/admin/programs', { onSuccess: () => form.reset() });
        }
    }

    function startEdit(p: ProgramWithFaculty) {
        setEditing(p);
        form.setData({ faculty_id: String(p.faculty.id), code: p.code, name: p.name });
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Program Studi">
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-800">{editing ? 'Edit Prodi' : 'Tambah Prodi'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                    <FormSelect
                        id="faculty_id" label="Fakultas"
                        options={faculties.map((f) => ({ value: f.id, label: f.name }))}
                        placeholder="Pilih fakultas..."
                        value={form.data.faculty_id}
                        onChange={(e) => form.setData('faculty_id', e.target.value)}
                        error={form.errors.faculty_id}
                        required
                    />
                    <FormInput id="code" label="Kode" placeholder="PAI" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} error={form.errors.code} required className="w-24" />
                    <div className="min-w-[250px] flex-1">
                        <FormInput id="name" label="Nama Prodi" placeholder="Pendidikan Agama Islam" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
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
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Fakultas</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {programs.map((p) => (
                            <tr key={p.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{p.code}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.faculty.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="text-red-600">Hapus</Button>
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
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/programs/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Program Studi"
                message={`Hapus prodi "${deleting?.name}"?`}
                processing={deleteForm.processing}
            />
        </AppLayout>
    );
}
