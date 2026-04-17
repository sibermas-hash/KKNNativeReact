import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';
import type { Faculty, PageProps, Program } from '@/types';
import { UserPlus, ArrowLeft, ShieldCheck, HelpCircle, Save, X, GraduationCap } from 'lucide-react';

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
 form.post('/admin/pengguna');
 };

 return (
 <AppLayout title="Tambah Pengguna">
 <Head title="Tambah Pengguna | Admin KKN"/>

 <div className="mx-auto max-w-5xl space-y-10 pb-20">
 {/* --- HEADER CARD --- */}
 <section className="bg-white rounded-xl border border-gray-200/60 p-10 lg:p-12 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
 <UserPlus size={160} className="text-[#1a7a4a]"/>
 </div>
 
 <div className="flex items-center gap-8 relative z-10">
 <div className="h-10 w-20 rounded-xl bg-[#16a34a] shadow-sm shadow-emerald-600/20 flex items-center justify-center text-white">
 <UserPlus size={32} />
 </div>
 <div className="space-y-1">
 <h1 className="text-3xl font-bold text-black">Tambah <span className="text-[#1a7a4a]">Pengguna</span></h1>
 <p className="text-sm font-bold text-gray-900 font-semibold text-xs">Registrasi Akun Baru Sistem KKN</p>
 </div>
 </div>

 <Link
 href="/admin/pengguna"
 className="relative z-10 inline-flex items-center gap-3 px-8 py-4 bg-gray-50 border border-gray-200/60 rounded-xl text-sm font-bold text-gray-900 font-semibold text-xs hover:bg-white hover:border-emerald-900 hover:text-[#1a7a4a] transition-all shadow-sm group/btn"
 >
 <ArrowLeft size={14} className="group-hover/btn:-translate-x-2 transition-transform"/>
 Kembali
 </Link>
 </section>

 <form onSubmit={handleSubmit} className="space-y-10">
 {/* --- ACCCOUNT SECTION --- */}
 <section className="bg-white rounded-xl border border-gray-200/60 p-10 lg:p-12 shadow-sm relative group">
 <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
 <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-[#1a7a4a]">
 <ShieldCheck size={20} />
 </div>
 <div>
 <h2 className="text-xs font-bold text-black font-semibold text-xs">Data Akun</h2>
 <p className="text-sm font-bold text-gray-900 font-semibold text-xs mt-1">Username dan email untuk login.</p>
 </div>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <FormSelect
 id="role"
 label="Peran / Role"
 required
 value={form.data.role}
 onChange={(event) => form.setData('role', event.target.value)}
 error={form.errors.role}
 placeholder="Pilih Peran"
 options={[
 { value: 'superadmin', label: 'Superadmin' },
 { value: 'faculty_admin', label: 'Admin Fakultas' },
 { value: 'dpl', label: 'Dosen Pembimbing' },
 { value: 'student', label: 'Mahasiswa' },
 ]}
 />
 <div className="hidden md:block"/>

 <FormInput
 id="name"
 label="Nama Lengkap"
 required
 value={form.data.name}
 onChange={(event) => form.setData('name', event.target.value)}
 error={form.errors.name}
 placeholder="Input nama sesuai ijazah"
 />
 <FormInput
 id="username"
 label="User ID / Username"
 required
 value={form.data.username}
 onChange={(event) => form.setData('username', event.target.value)}
 error={form.errors.username}
 placeholder="Gunakan NIM atau NIP"
 />
 <FormInput
 id="email"
 type="email"
 label="Alamat Email"
 required
 value={form.data.email}
 onChange={(event) => form.setData('email', event.target.value)}
 error={form.errors.email}
 placeholder="user@domain.com"
 />
 <FormInput
 id="password"
 type="password"
 label="Kata Sandi"
 required
 value={form.data.password}
 onChange={(event) => form.setData('password', event.target.value)}
 error={form.errors.password}
 placeholder="Minimal 8 karakter"
 />
 </div>
 </section>

 {/* --- AFFILIATION SECTION --- */}
 {(isStudent || isDpl || isFacultyAdmin) && (
 <section className="bg-white rounded-xl border border-gray-200/60 p-10 lg:p-12 shadow-sm relative group">
 <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
 <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-gray-900">
 <HelpCircle size={20} />
 </div>
 <div>
 <h2 className="text-xs font-bold text-black font-semibold text-xs">Data Fakultas</h2>
 <p className="text-sm font-bold text-gray-900 font-semibold text-xs mt-1">Fakultas asal pengguna.</p>
 </div>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <FormSelect
 id="faculty_id"
 label="Fakultas"
 required
 value={form.data.faculty_id}
 onChange={(event) => {
 form.setData('faculty_id', event.target.value);
 if (isStudent) form.setData('program_id', '');
 }}
 error={form.errors.faculty_id}
 placeholder="Pilih Fakultas"
 options={faculties.map((f) => ({ value: f.id, label: f.name }))}
 />
 </div>
 </section>
 )}

 {/* --- STUDENT DATA --- */}
 {isStudent && (
 <section className="bg-white rounded-xl border border-gray-200/60 p-10 lg:p-12 shadow-sm relative group">
 <div className="flex items-center gap-4 mb-10 border-b border-gray-200/60 pb-8 text-[#1a7a4a]">
 <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
 <GraduationCap size={20} />
 </div>
 <div>
 <h2 className="text-xs font-bold text-black font-semibold text-xs">Data Mahasiswa</h2>
 <p className="text-sm font-bold text-[#1a7a4a] font-semibold text-xs mt-1">Kewajiban Pengisian Data Pokok</p>
 </div>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <FormInput
 id="nim"
 label="Nomor Induk Mahasiswa (NIM)"
 required
 value={form.data.nim}
 onChange={(event) => form.setData('nim', event.target.value)}
 error={form.errors.nim}
 placeholder="Input NIM Aktif"
 />
 <FormInput
 id="batch_year"
 type="number"
 label="Tahun Angkatan"
 required
 value={form.data.batch_year}
 onChange={(event) => form.setData('batch_year', event.target.value)}
 error={form.errors.batch_year}
 placeholder="Contoh: 2021"
 />
 <FormSelect
 id="gender"
 label="Jenis Kelamin"
 required
 value={form.data.gender}
 onChange={(event) => form.setData('gender', event.target.value)}
 error={form.errors.gender}
 placeholder="Pilih Gender"
 options={[
 { value: 'L', label: 'LAKI-LAKI' },
 { value: 'P', label: 'PEREMPUAN' },
 ]}
 />
 <FormSelect
 id="program_id"
 label="Program Studi"
 required
 value={form.data.program_id}
 onChange={(event) => form.setData('program_id', event.target.value)}
 error={form.errors.program_id}
 placeholder="Pilih Prodi"
 options={filteredPrograms.map((p) => ({ value: p.id, label: p.name }))}
 />
 </div>
 </section>
 )}

 {/* --- DPL DATA --- */}
 {isDpl && (
 <section className="bg-white rounded-xl border border-gray-200/60 p-10 lg:p-12 shadow-sm">
 <h2 className="text-xs font-bold text-black font-semibold text-xs mb-10 border-b border-slate-50 pb-8">Validasi Data DPL</h2>
 <div className="grid gap-6 md:grid-cols-2">
 <FormInput
 id="nip"
 label="NIP / NIDN"
 required
 value={form.data.nip}
 onChange={(event) => form.setData('nip', event.target.value)}
 error={form.errors.nip}
 placeholder="Identitas Pegawai"
 />
 </div>
 </section>
 )}

 {/* --- ACTIONS --- */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-10">
 <p className="text-sm font-bold text-slate-300 font-semibold text-xs leading-relaxed text-center sm:text-left">
 Sistem akan mengirimkan email notifikasi <br /> otomatis kepada pengguna baru.
 </p>
 
 <div className="flex items-center gap-6">
 <Link
 href="/admin/pengguna"
 className="px-8 py-5 text-sm font-bold text-gray-900 hover:text-rose-500 transition-all flex items-center gap-3 tracking-normal"
 >
 <X size={16} /> Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="group inline-flex items-center gap-6 px-6 py-5 bg-gray-100 text-white rounded-xl font-bold text-sm tracking-normal hover:bg-[#16a34a] shadow-sm shadow-none transition-all active:scale-95"
 >
 {form.processing ? 'MENYIMPAN...' : 'SIMPAN AKUN'}
 <Save size={18} className="group-hover:translate-y-1 transition-transform"/>
 </button>
 </div>
 </div>
 </form>

 <footer className="text-center pt-20 border-t border-gray-200/60">
 <p className="text-sm font-bold text-slate-300 font-semibold text-xs">
 SIM-KKN &bull; UIN SAIFUDDIN ZUHRI &copy; 2026
 </p>
 </footer>
 </div>
 </AppLayout>
 );
}
