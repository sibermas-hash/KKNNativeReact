import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect, Button } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';
import {
    UserPlus,
    UserCircle,
    ShieldCheck,
    Key,
    ChevronLeft,
    Fingerprint,
    Loader2,
    Briefcase,
    GraduationCap
} from 'lucide-react';

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
    const isFacultyAdmin = form.data.role === 'faculty_admin';

    return (
        <AppLayout title="Tambah Pengguna Baru">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-6 mb-2">
                            <Link 
                                href="/admin/users"
                                className="group/back flex items-center gap-2.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all backdrop-blur-md"
                            >
                                <ChevronLeft className="w-4 h-4 text-emerald-300 group-hover/back:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-black text-white uppercase  italic">Kembali</span>
                            </Link>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                    <Fingerprint className="h-3.5 w-3.5 text-emerald-300" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                    IDENTITY_PROVISIONING_V3
                                </span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Registrasi <span className="text-emerald-300 text-glow-emerald italic">Personel</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Inisialisasi record baru dalam registry pusat. Pastikan seluruh parameter administratif dan peran otorisasi telah diverifikasi sesuai protokol keamanan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[240px]">
                            <div className="p-3 bg-white rounded-lg text-primary
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Status Keamanan</span>
                                <span className="text-xl font-black text-white uppercase  italic leading-none">Koneksi Terenkripsi</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Role Selection */}
                    <div className="bg-white p-8rounded-lg border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-primary pointer-events-none group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="h-32 w-32" />
                        </div>
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            <div className="md:col-span-4 space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 uppercase  Akses</h3>
                                <p className="text-xs text-slate-500 font-medium italic">Tentukan peran pengguna dalam sistem.</p>
                            </div>
                            <div className="md:col-span-8">
                                <FormSelect
                                    id="role" 
                                    required
                                    options={[
                                        { value: 'superadmin', label: 'Administrator Sistem' },
                                        { value: 'faculty_admin', label: 'Admin Fakultas' },
                                        { value: 'dpl', label: 'Dosen Pembimbing Lapangan (DPL)' },
                                        { value: 'student', label: 'Mahasiswa Peserta KKN' }
                                    ]}
                                    placeholder="Pilih peran..."
                                    value={form.data.role}
                                    onChange={(e) => form.setData('role', e.target.value)}
                                    error={form.errors.role}
                                    className="h-14 font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white p-10 rounded-lg border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform">
                            <Key className="h-40 w-40 transform translate-x-1/4 -translate-y-1/4" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-slate-900 text-primary rounded-xl
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900  leading-none uppercase">Informasi Akun Utama</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase  mt-2">Kredensial & Identitas Dasar</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormInput label="Nama Lengkap" id="name" placeholder="Misal: Dr. Ahmad Fauzi, M.Pd." value={form.data.name} onChange={(e: any) => form.setData('name', e.target.value)} error={form.errors.name} required />
                                <FormInput label="Username" id="username" placeholder="Gunakan NIM/NIP atau teks unik" value={form.data.username} onChange={(e: any) => form.setData('username', e.target.value)} error={form.errors.username} required />
                                <FormInput label="Email Institusi" id="email" type="email" placeholder="example@uinsaizu.ac.id" value={form.data.email} onChange={(e: any) => form.setData('email', e.target.value)} error={form.errors.email} required />
                                <FormInput label="Kata Sandi" id="password" type="password" placeholder="Minimal 8 karakter" value={form.data.password} onChange={(e: any) => form.setData('password', e.target.value)} error={form.errors.password} required />
                            </div>
                        </div>
                    </div>

                    {/* Student Specific */}
                    {isStudent && (
                        <div className="bg-white p-10 rounded-lg border border-slate-100 group">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-primary text-white rounded-xl
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900  leading-none uppercase">Data Mahasiswa</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase  mt-2">Distribusi Unit Akademik</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <FormInput label="Nomor Induk Mahasiswa (NIM)" id="nim" placeholder="20210001" value={form.data.nim} onChange={(e: any) => form.setData('nim', e.target.value)} error={form.errors.nim} required />
                                <FormSelect 
                                    label="Jenis Kelamin"
                                    id="gender" 
                                    options={[
                                        { value: 'L', label: 'Laki-laki' }, 
                                        { value: 'P', label: 'Perempuan' }
                                    ]} 
                                    placeholder="Pilih jenis..." 
                                    value={form.data.gender} 
                                    onChange={(e) => form.setData('gender', e.target.value)} 
                                    error={form.errors.gender} 
                                    required 
                                />
                                <FormInput label="Angkatan" id="batch_year" type="number" placeholder="2021" value={form.data.batch_year} onChange={(e: any) => form.setData('batch_year', e.target.value)} error={form.errors.batch_year} required />
                                
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <FormSelect label="Fakultas" id="faculty_id" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih fakultas..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} required />
                                    <FormSelect label="Program Studi" id="program_id" options={programs.map(p => ({ value: p.id, label: p.name }))} placeholder="Pilih prodi..." value={form.data.program_id} onChange={(e) => form.setData('program_id', e.target.value)} error={form.errors.program_id} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DPL Specific */}
                    {isDpl && (
                        <div className="bg-white p-10 rounded-lg border border-slate-100 group">
                             <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-slate-900 text-primary rounded-xl
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900  leading-none uppercase">Data Dosen</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase  mt-2">Identitas Tugas Lapangan</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormInput label="NIP / NIDN" id="nip" placeholder="19800101..." value={form.data.nip} onChange={(e: any) => form.setData('nip', e.target.value)} error={form.errors.nip} required />
                                <FormSelect label="Homebase Fakultas" id="faculty_id" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="Pilih fakultas..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} required />
                            </div>
                        </div>
                    )}

                    {isFacultyAdmin && (
                        <div className="bg-white p-10 rounded-lg border border-slate-100 group">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-primary text-white rounded-xl
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900  leading-none uppercase">Akses Fakultas</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase  mt-2">Akun ini hanya dapat melihat rekap nilai akhir fakultas.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormSelect
                                    label="Fakultas"
                                    id="faculty_id"
                                    options={faculties.map(f => ({ value: f.id, label: f.name }))}
                                    placeholder="Pilih fakultas..."
                                    value={form.data.faculty_id}
                                    onChange={(e) => form.setData('faculty_id', e.target.value)}
                                    error={form.errors.faculty_id}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Area */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-100">
                         <div className="flex items-start gap-4 max-w-xl self-start">
                            <ShieldCheck className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase  leading-none">Verifikasi Keamanan Dasar</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                    Pastikan data yang dimasukkan telah sesuai dengan identitas resmi. Akun akan langsung aktif setelah proses penyimpanan selesai.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link
                                href="/admin/users"
                                className="flex-1 md:flex-none px-10 py-5 bg-white text-slate-400 text-xs font-bold uppercase  rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all text-center"
                            >
                                Batal
                            </Link>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="flex-1 md:flex-none px-14 py-5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-bold"
                            >
                                {form.processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        <span>Simpan Pengguna</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

