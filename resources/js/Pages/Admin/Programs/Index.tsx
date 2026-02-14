import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

interface ProgramWithFaculty extends Omit<Program, 'faculty'> {
    faculty: Faculty;
}

interface Props extends PageProps {
    programs: {
        data: ProgramWithFaculty[];
        links: any[];
        meta: PaginationMeta;
    };
    faculties: Faculty[];
    filters: {
        search?: string;
    };
}

export default function ProgramsIndex({ programs, faculties, filters }: Props) {
    const [editing, setEditing] = useState<ProgramWithFaculty | null>(null);
    const [deleting, setDeleting] = useState<ProgramWithFaculty | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({ faculty_id: '', code: '', name: '' });

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/programs', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

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
            {/* Header with Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                    <FormInput
                        placeholder="Cari prodi, kode, atau fakultas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <p className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
                    {programs.meta?.total || 0} Program Studi
                </p>
            </div>

            <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="mb-6 text-xl font-black text-slate-800 tracking-tight">{editing ? 'Edit Program Studi' : 'Tambah Program Studi'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6">
                    <div className="min-w-[200px] flex-1">
                        <FormSelect
                            id="faculty_id" label="Fakultas"
                            options={faculties.map((f) => ({ value: f.id, label: f.name }))}
                            placeholder="Pilih fakultas..."
                            value={form.data.faculty_id}
                            onChange={(e) => form.setData('faculty_id', e.target.value)}
                            error={form.errors.faculty_id}
                            required
                        />
                    </div>
                    <div className="w-32">
                        <FormInput id="code" label="Kode" placeholder="PAI" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} error={form.errors.code} required />
                    </div>
                    <div className="min-w-[300px] flex-[2]">
                        <FormInput id="name" label="Nama Prodi" placeholder="Pendidikan Agama Islam" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={form.processing} className="px-8">{editing ? 'Simpan' : 'Tambah'}</Button>
                        {editing && <Button variant="secondary" onClick={() => { setEditing(null); form.reset(); }}>Batal</Button>}
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Kode</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Prodi</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fakultas</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {programs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                programs.data.map((p) => (
                                    <tr key={p.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-6 py-4 text-sm font-black text-primary tracking-tighter">{p.code}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 uppercase tracking-tight">{p.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-[10px]">{p.faculty?.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="font-bold">Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="text-red-600 font-bold hover:bg-red-50">Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {programs.meta && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                        <Pagination meta={programs.meta} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/programs/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="Hapus Program Studi"
                message={`Hapus prodi "${deleting?.name}"?`}
                processing={deleteForm.processing}
                confirmLabel="Hapus Permanen"
            />
        </AppLayout>
    );
}
