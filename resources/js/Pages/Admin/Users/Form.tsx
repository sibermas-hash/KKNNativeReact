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
        <AppLayout title="Tambah Pengguna">
            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormSelect
                        id="role" label="Role" required
                        options={[{ value: 'admin', label: 'Admin' }, { value: 'dpl', label: 'DPL' }, { value: 'student', label: 'Mahasiswa' }]}
                        placeholder="Pilih role..."
                        value={form.data.role}
                        onChange={(e) => form.setData('role', e.target.value)}
                        error={form.errors.role}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="username" label="Username" value={form.data.username} onChange={(e) => form.setData('username', e.target.value)} error={form.errors.username} required />
                        <FormInput id="name" label="Nama Lengkap" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormInput id="email" label="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} required />
                        <FormInput id="password" label="Password" type="password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} required />
                    </div>

                    {isStudent && (
                        <>
                            <hr className="border-slate-200" />
                            <h3 className="font-semibold text-slate-700">Data Mahasiswa</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormInput id="nim" label="NIM" value={form.data.nim} onChange={(e) => form.setData('nim', e.target.value)} error={form.errors.nim} required />
                                <FormSelect id="gender" label="Jenis Kelamin" options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} placeholder="Pilih..." value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)} error={form.errors.gender} required />
                                <FormSelect id="faculty_id" label="Fakultas" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} required />
                                <FormSelect id="program_id" label="Prodi" options={programs.map(p => ({ value: p.id, label: p.name }))} placeholder="Pilih..." value={form.data.program_id} onChange={(e) => form.setData('program_id', e.target.value)} error={form.errors.program_id} required />
                                <FormInput id="batch_year" label="Angkatan" type="number" value={form.data.batch_year} onChange={(e) => form.setData('batch_year', e.target.value)} error={form.errors.batch_year} required />
                            </div>
                        </>
                    )}

                    {isDpl && (
                        <>
                            <hr className="border-slate-200" />
                            <h3 className="font-semibold text-slate-700">Data Dosen</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormInput id="nip" label="NIP" value={form.data.nip} onChange={(e) => form.setData('nip', e.target.value)} error={form.errors.nip} required />
                                <FormSelect id="faculty_id" label="Fakultas" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => window.history.back()}>Batal</Button>
                        <Button type="submit" loading={form.processing}>Simpan</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
