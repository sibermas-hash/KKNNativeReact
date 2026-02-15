import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormSelect } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';

interface Props extends PageProps {
    faculties: Faculty[];
    programs: Program[];
}

export default function UserForm({ faculties, programs }: Props) {
    const form = useForm({
        username: '',
        name: '',
        email: '',
        password: '',
        role: '',
        nim: '',
        nip: '',
        faculty_id: '',
        program_id: '',
        batch_year: '',
        gender: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/users');
    }

    const isStudent = form.data.role === 'student';
    const isDpl = form.data.role === 'dpl';

    return (
        <AppLayout title="Tambah Pengguna Baru">
            <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
                    <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Akun Utama</h2>
                        <p className="text-sm text-slate-400 font-medium">Informasi dasar untuk login dan identitas sistem.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="max-w-xs">
                            <FormSelect
                                id="role" label="Peran Pengguna" required
                                options={[
                                    { value: 'superadmin', label: 'Administrator (Satu Akun Saja)' },
                                    { value: 'dpl', label: 'Dosen (DPL)' },
                                    { value: 'student', label: 'Mahasiswa' }
                                ]}
                                placeholder="Pilih peran..."
                                value={form.data.role}
                                onChange={(e) => form.setData('role', e.target.value)}
                                error={form.errors.role}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                            <FormInput id="username" label="Username" placeholder="e.g. jdoe" value={form.data.username} onChange={(e) => form.setData('username', e.target.value)} error={form.errors.username} required />
                            <FormInput id="name" label="Nama Lengkap" placeholder="e.g. John Doe, M.Pd." value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                            <FormInput id="email" label="Email" type="email" placeholder="john@example.com" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} required />
                            <FormInput id="password" label="Password" type="password" placeholder="••••••••" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} required />
                        </div>

                        {/* Student Specific Fields */}
                        {isStudent && (
                            <div className="rounded-2xl bg-slate-50 p-6 space-y-6 border border-slate-100">
                                <div className="border-b border-slate-200 pb-3">
                                    <h3 className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Detail Mahasiswa</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
                                    <FormInput id="nim" label="NIM" placeholder="20210001" value={form.data.nim} onChange={(e) => form.setData('nim', e.target.value)} error={form.errors.nim} required />
                                    <FormSelect id="gender" label="Jenis Kelamin" options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} placeholder="Pilih..." value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)} error={form.errors.gender} required />
                                    <FormSelect id="faculty_id" label="Fakultas" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} required />
                                    <FormSelect id="program_id" label="Program Studi" options={programs.map(p => ({ value: p.id, label: p.name }))} placeholder="Pilih..." value={form.data.program_id} onChange={(e) => form.setData('program_id', e.target.value)} error={form.errors.program_id} required />
                                    <FormInput id="batch_year" label="Angkatan" type="number" placeholder="2021" value={form.data.batch_year} onChange={(e) => form.setData('batch_year', e.target.value)} error={form.errors.batch_year} required />
                                </div>
                            </div>
                        )}

                        {/* DPL Specific Fields */}
                        {isDpl && (
                            <div className="rounded-2xl bg-indigo-50/30 p-6 space-y-6 border border-indigo-100/50">
                                <div className="border-b border-indigo-200/50 pb-3">
                                    <h3 className="font-black text-indigo-700 uppercase tracking-widest text-[10px]">Detail Dosen (DPL)</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <FormInput id="nip" label="NIP / Kode Dosen" placeholder="19800101..." value={form.data.nip} onChange={(e) => form.setData('nip', e.target.value)} error={form.errors.nip} required />
                                    <FormSelect id="faculty_id" label="Fakultas Homebase" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => window.history.back()} className="font-bold px-6">Batal</Button>
                            <Button type="submit" loading={form.processing} className="px-10 font-black shadow-lg shadow-primary/20">Simpan Pengguna</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
