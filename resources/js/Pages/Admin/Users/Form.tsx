import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';
import type { Faculty, PageProps, Program } from '@/types';

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

 const isStudent = form.data.role === 'student';
 const isDpl = form.data.role === 'dpl';
 const isFacultyAdmin = form.data.role === 'faculty_admin';

 const filteredPrograms = form.data.faculty_id
 ? programs.filter((program) => String(program.faculty_id) === String(form.data.faculty_id))
 : programs;

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/admin/users');
 };

 return (
 <AppLayout title="Tambah Pengguna">
 <Head title="Tambah Pengguna" />

 <div className="mx-auto max-w-5xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Tambah Pengguna Baru</h1>
 <p className="mt-2 text-sm text-slate-500">
 Buat akun baru untuk administrator, admin fakultas, DPL, atau mahasiswa.
 </p>
 </div>

 <Link
 href="/admin/users"
 className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke daftar pengguna
 </Link>
 </div>
 </section>

 <form onSubmit={handleSubmit} className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Akun Utama</h2>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <FormSelect
 id="role"
 label="Peran"
 required
 value={form.data.role}
 onChange={(event) => form.setData('role', event.target.value)}
 error={form.errors.role}
 placeholder="Pilih peran"
 options={[
 { value: 'superadmin', label: 'Superadmin' },
 { value: 'faculty_admin', label: 'Admin fakultas' },
 { value: 'dpl', label: 'DPL' },
 { value: 'student', label: 'Mahasiswa' },
 ]}
 />
 <div />

 <FormInput
 id="name"
 label="Nama lengkap"
 required
 value={form.data.name}
 onChange={(event) => form.setData('name', event.target.value)}
 error={form.errors.name}
 />
 <FormInput
 id="username"
 label="Username"
 required
 value={form.data.username}
 onChange={(event) => form.setData('username', event.target.value)}
 error={form.errors.username}
 />
 <FormInput
 id="email"
 type="email"
 label="Email"
 required
 value={form.data.email}
 onChange={(event) => form.setData('email', event.target.value)}
 error={form.errors.email}
 />
 <FormInput
 id="password"
 type="password"
 label="Kata sandi"
 required
 value={form.data.password}
 onChange={(event) => form.setData('password', event.target.value)}
 error={form.errors.password}
 />
 </div>
 </section>

 {(isStudent || isDpl || isFacultyAdmin) && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Afiliasi Fakultas</h2>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <FormSelect
 id="faculty_id"
 label="Fakultas"
 required
 value={form.data.faculty_id}
 onChange={(event) => {
 form.setData('faculty_id', event.target.value);
 if (isStudent) {
 form.setData('program_id', '');
 }
 }}
 error={form.errors.faculty_id}
 placeholder="Pilih fakultas"
 options={faculties.map((faculty) => ({
 value: faculty.id,
 label: faculty.name,
 }))}
 />
 </div>
 </section>
 )}

 {isStudent && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Data Mahasiswa</h2>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <FormInput
 id="nim"
 label="NIM"
 required
 value={form.data.nim}
 onChange={(event) => form.setData('nim', event.target.value)}
 error={form.errors.nim}
 />
 <FormInput
 id="batch_year"
 type="number"
 label="Angkatan"
 required
 value={form.data.batch_year}
 onChange={(event) => form.setData('batch_year', event.target.value)}
 error={form.errors.batch_year}
 />
 <FormSelect
 id="gender"
 label="Jenis kelamin"
 required
 value={form.data.gender}
 onChange={(event) => form.setData('gender', event.target.value)}
 error={form.errors.gender}
 placeholder="Pilih jenis kelamin"
 options={[
 { value: 'L', label: 'Laki-laki' },
 { value: 'P', label: 'Perempuan' },
 ]}
 />
 <FormSelect
 id="program_id"
 label="Program studi"
 required
 value={form.data.program_id}
 onChange={(event) => form.setData('program_id', event.target.value)}
 error={form.errors.program_id}
 placeholder="Pilih program studi"
 options={filteredPrograms.map((program) => ({
 value: program.id,
 label: program.name,
 }))}
 />
 </div>
 </section>
 )}

 {isDpl && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Data DPL</h2>
 <div className="mt-6 grid gap-6 md:grid-cols-2">
 <FormInput
 id="nip"
 label="NIP / NIDN"
 required
 value={form.data.nip}
 onChange={(event) => form.setData('nip', event.target.value)}
 error={form.errors.nip}
 />
 </div>
 </section>
 )}

 {isFacultyAdmin && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Akses Admin Fakultas</h2>
 <p className="mt-2 text-sm text-slate-500">
 Akun ini hanya dipakai untuk melihat rekap nilai akhir pada fakultas yang dipilih.
 </p>
 </section>
 )}

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <p className="text-sm text-slate-500">
 Akun akan langsung aktif setelah data berhasil disimpan.
 </p>
 <div className="flex gap-3">
 <Link
 href="/admin/users"
 className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan pengguna'}
 </button>
 </div>
 </div>
 </section>
 </form>
 </div>
 </AppLayout>
 );
}
