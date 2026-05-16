'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'student', label: 'Mahasiswa' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'dpl', label: 'DPL' },
  { value: 'faculty_admin', label: 'Admin Fakultas' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

export default function AdminUserCreatePage(): React.JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', name: '', email: '', password: '',
    role: 'student', nim: '', nip: '', fakultas_id: '', prodi_id: '',
    batch_year: '', gender: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: faculties } = useQuery({
    queryKey: ['admin', 'fakultas'],
    queryFn: async () => {
      const res = await adminApi.master.faculties.index({});
      return (res as { data?: { data?: unknown[] } }).data?.data ?? [];
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['admin', 'prodi'],
    queryFn: async () => {
      const res = await adminApi.master.studyPrograms.index({});
      return (res as { data?: { data?: unknown[] } }).data?.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => adminApi.users.store({
      username: form.username.trim(),
      name: form.name.trim(),
      email: form.email.trim() || null,
      password: form.password,
      role: form.role,
      fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null,
    }),
    onSuccess: () => {
      toast.success('Pengguna berhasil dibuat.');
      router.push('/admin/pengguna');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { errors?: Record<string, string[]> } } } };
      if (e?.response?.data?.error?.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.response.data.error.errors).forEach(([k, v]) => { flat[k] = v[0]; });
        setErrors(flat);
        return;
      }

      toast.error(mutationErrorHandler(err));
    },
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const isStudent = form.role === 'student';
  const isDosen = ['dosen', 'dpl'].includes(form.role);

  const filteredPrograms = (programs as Array<{ id: number; name: string; fakultas_id: number }> ?? [])
    .filter((p) => !form.fakultas_id || String(p.fakultas_id) === String(form.fakultas_id));

  const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const labelClass = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/pengguna" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ChevronLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Tambah Pengguna</h1>
            <p className="text-xs text-slate-400">Registrasi akun baru sistem KKN</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
      >
        {/* Akun */}
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Informasi Akun</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username <span className="text-rose-500">*</span></label>
              <input value={form.username} onChange={set('username')} placeholder="username" className={inputClass} />
              {errors.username && <p className="mt-1 text-xs text-rose-500">{errors.username}</p>}
            </div>
            <div>
              <label className={labelClass}>Nama Lengkap <span className="text-rose-500">*</span></label>
              <input value={form.name} onChange={set('name')} placeholder="Nama lengkap" className={inputClass} />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" className={inputClass} />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
            </div>
            <div>
              <label className={labelClass}>Password <span className="text-rose-500">*</span></label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 karakter" className={inputClass} />
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
            </div>
          </div>
        </div>

        {/* Role */}
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Role & Akses</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role === r.value ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} className="sr-only" />
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${form.role === r.value ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                  {form.role === r.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-bold text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Student-specific */}
        {isStudent && (
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Data Mahasiswa</p>
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              Form ini membuat akun pengguna. NIM, prodi, dan detail akademik lain tetap dilengkapi lewat sinkronisasi SIAKAD atau edit detail setelah akun dibuat.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>NIM</label>
                <input value={form.nim} onChange={set('nim')} placeholder="NIM mahasiswa" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Angkatan</label>
                <input value={form.batch_year} onChange={set('batch_year')} placeholder="2021" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <select value={form.gender} onChange={set('gender')} className={inputClass}>
                  <option value="">Pilih...</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Fakultas</label>
                <select value={form.fakultas_id} onChange={set('fakultas_id')} className={inputClass}>
                  <option value="">Pilih Fakultas...</option>
                  {(faculties as Array<{ id: number; name: string }> ?? []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Program Studi</label>
                <select value={form.prodi_id} onChange={set('prodi_id')} className={inputClass}>
                  <option value="">Pilih Prodi...</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Dosen-specific */}
        {isDosen && (
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Data Dosen</p>
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              Form ini hanya membuat akun dasar. NIP dan data kepegawaian tetap dikelola lewat sinkronisasi atau edit detail setelah akun dibuat.
            </p>
            <div>
              <label className={labelClass}>NIP</label>
              <input value={form.nip} onChange={set('nip')} placeholder="NIP dosen" className={inputClass} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/pengguna" className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">
            Batal
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-teal-200"
          >
            {mutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 size={16} />}
            {mutation.isPending ? 'Menyimpan...' : 'Buat Pengguna'}
          </button>
        </div>
      </form>
    </div>
  );
}
