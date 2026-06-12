'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, UserPlus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';

type AccountType = 'admin_internal' | 'admin_external' | 'faculty_admin' | 'dosen' | 'dpl' | 'student_internal' | 'student_external';
type Faculty = { id: number; nama: string };
type StudyProgram = { id: number; nama: string; fakultas_id: number };
type ExternalUniversity = { id: number; name: string; code?: string };
type ExternalBatch = { id: number; home_university: string; program_name?: string; periode?: { name?: string; periode?: number } };

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string; desc: string }> = [
  { value: 'admin_internal', label: 'Admin LPPM Internal', desc: 'Akses panel admin internal LPPM.' },
  { value: 'admin_external', label: 'Admin LPPM Eksternal', desc: 'Terikat kampus eksternal; akses dashboard eksternal.' },
  { value: 'faculty_admin', label: 'Admin Fakultas', desc: 'Terikat fakultas internal.' },
  { value: 'dosen', label: 'Dosen', desc: 'Membuat user + profil dosen.' },
  { value: 'dpl', label: 'DPL', desc: 'Membuat user + profil dosen + role DPL.' },
  { value: 'student_internal', label: 'Mahasiswa Internal', desc: 'Membuat user + profil mahasiswa internal.' },
  { value: 'student_external', label: 'Mahasiswa Eksternal', desc: 'Membuat user + profil mahasiswa eksternal.' },
];

const roleFor = (type: AccountType) => ({
  admin_internal: 'admin',
  admin_external: 'external_lppm_admin',
  faculty_admin: 'faculty_admin',
  dosen: 'dosen',
  dpl: 'dpl',
  student_internal: 'student',
  student_external: 'student',
}[type]);

export default function AdminUserCreatePage(): React.JSX.Element {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperadmin = (currentUser?.roles ?? []).includes('superadmin');
  const [form, setForm] = useState({
    account_type: 'admin_internal' as AccountType,
    username: '', name: '', email: '', password: '',
    fakultas_id: '', external_university_id: '',
    nim: '', prodi_id: '', external_nim: '', external_batch_id: '', external_faculty: '', external_study_program: '',
    nip: '', batch_year: String(new Date().getFullYear()), semester: '', gender: '', phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: faculties = [] } = useQuery({
    queryKey: ['admin', 'fakultas'],
    queryFn: async () => adminApi.master.faculties.index({}) as unknown as Faculty[],
    enabled: isSuperadmin,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['admin', 'prodi'],
    queryFn: async () => adminApi.master.studyPrograms.index({}) as unknown as StudyProgram[],
    enabled: isSuperadmin,
  });

  const { data: externalUniversities = [] } = useQuery({
    queryKey: ['admin', 'external-universities', 'create-user'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/external-universities', { params: { per_page: 200 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as ExternalUniversity[];
    },
    enabled: isSuperadmin,
  });

  const { data: externalBatches = [] } = useQuery({
    queryKey: ['admin', 'external-batches', 'create-user'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/peserta-eksternal/batches');
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as ExternalBatch[];
    },
    enabled: isSuperadmin,
  });

  const filteredPrograms = useMemo(
    () => programs.filter((p) => !form.fakultas_id || String(p.fakultas_id) === String(form.fakultas_id)),
    [programs, form.fakultas_id],
  );
  const selectedExternalUniversity = externalUniversities.find((u) => String(u.id) === String(form.external_university_id));
  const filteredExternalBatches = useMemo(
    () => externalBatches.filter((b) => !selectedExternalUniversity || b.home_university === selectedExternalUniversity.name),
    [externalBatches, selectedExternalUniversity],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const role = roleFor(form.account_type);
      const payload: Record<string, unknown> = {
        account_type: form.account_type,
        role,
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim() || null,
        password: form.password,
        fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null,
        external_university_id: form.external_university_id ? Number(form.external_university_id) : null,
      };

      if (form.account_type === 'student_internal') {
        payload.mahasiswa = {
          nim: form.nim.trim(),
          prodi_id: Number(form.prodi_id),
          batch_year: Number(form.batch_year),
          semester: form.semester ? Number(form.semester) : null,
          gender: form.gender || null,
          phone: form.phone.trim() || null,
        };
      }

      if (form.account_type === 'student_external') {
        payload.mahasiswa = {
          external_nim: form.external_nim.trim(),
          external_batch_id: Number(form.external_batch_id),
          external_faculty: form.external_faculty.trim(),
          external_study_program: form.external_study_program.trim(),
          batch_year: Number(form.batch_year),
          semester: form.semester ? Number(form.semester) : null,
          gender: form.gender || null,
          phone: form.phone.trim() || null,
        };
      }

      if (form.account_type === 'dosen' || form.account_type === 'dpl') {
        payload.dosen = {
          nip: form.nip.trim(),
          gender: form.gender || null,
          phone: form.phone.trim() || null,
        };
      }

      return rawApi.post('/admin/pengguna', payload);
    },
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

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  if (!isSuperadmin) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold">Akses khusus superadmin.</p><p className="text-xs mt-1">Pembuatan akun pengguna baru hanya tersedia untuk superadmin.</p></div>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';
  const labelClass = 'block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5';
  const needsFaculty = ['faculty_admin', 'dosen', 'dpl', 'student_internal'].includes(form.account_type);
  const needsExternalUniversity = ['admin_external', 'student_external'].includes(form.account_type);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/pengguna" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali"><ChevronLeft size={20} className="text-slate-600" /></Link>
        <div className="flex items-center gap-3"><div className="h-12 w-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserPlus size={24} /></div><div><h1 className="text-xl font-black text-slate-900 tracking-tight">Tambah Pengguna</h1><p className="text-xs text-slate-400">Superadmin membuat akun sesuai tipe role dan relasi data.</p></div></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <section>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Tipe Akun</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ACCOUNT_TYPES.map((type) => (
              <label key={type.value} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.account_type === type.value ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="account_type" value={type.value} checked={form.account_type === type.value} onChange={set('account_type')} className="sr-only" />
                <span className="block text-sm font-black text-slate-800">{type.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{type.desc}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Informasi Akun</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Username" required value={form.username} onChange={set('username')} error={errors.username} inputClass={inputClass} labelClass={labelClass} />
            <Field label="Nama Lengkap" required value={form.name} onChange={set('name')} error={errors.name} inputClass={inputClass} labelClass={labelClass} />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} inputClass={inputClass} labelClass={labelClass} />
            <Field label="Password" required type="password" value={form.password} onChange={set('password')} error={errors.password} inputClass={inputClass} labelClass={labelClass} />
          </div>
        </section>

        {(needsFaculty || needsExternalUniversity) && (
          <section>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Relasi Organisasi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needsFaculty && <Select label="Fakultas" required value={form.fakultas_id} onChange={set('fakultas_id')} error={errors.fakultas_id} inputClass={inputClass} labelClass={labelClass} options={faculties.map((f) => ({ value: String(f.id), label: f.nama }))} placeholder="Pilih Fakultas..." />}
              {needsExternalUniversity && <Select label="Kampus Eksternal" required value={form.external_university_id} onChange={set('external_university_id')} error={errors.external_university_id} inputClass={inputClass} labelClass={labelClass} options={externalUniversities.map((u) => ({ value: String(u.id), label: u.name }))} placeholder="Pilih Kampus Eksternal..." />}
            </div>
          </section>
        )}

        {form.account_type === 'student_internal' && (
          <section>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Mahasiswa Internal</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="NIM" required value={form.nim} onChange={set('nim')} error={errors['mahasiswa.nim']} inputClass={inputClass} labelClass={labelClass} />
              <Select label="Program Studi" required value={form.prodi_id} onChange={set('prodi_id')} error={errors['mahasiswa.prodi_id']} inputClass={inputClass} labelClass={labelClass} options={filteredPrograms.map((p) => ({ value: String(p.id), label: p.nama }))} placeholder="Pilih Prodi..." />
              <Field label="Angkatan" required value={form.batch_year} onChange={set('batch_year')} error={errors['mahasiswa.batch_year']} inputClass={inputClass} labelClass={labelClass} />
              <StudentSharedFields form={form} set={set} inputClass={inputClass} labelClass={labelClass} />
            </div>
          </section>
        )}

        {form.account_type === 'student_external' && (
          <section>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Mahasiswa Eksternal</p>
            <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs font-medium text-cyan-900">Login mahasiswa eksternal tetap memakai prefix <b>X-</b> di depan NIM eksternal.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="NIM Eksternal" required value={form.external_nim} onChange={set('external_nim')} error={errors['mahasiswa.external_nim']} inputClass={inputClass} labelClass={labelClass} />
              <Select label="Batch Eksternal" required value={form.external_batch_id} onChange={set('external_batch_id')} error={errors['mahasiswa.external_batch_id']} inputClass={inputClass} labelClass={labelClass} options={filteredExternalBatches.map((b) => ({ value: String(b.id), label: `${b.home_university} — ${b.program_name || b.periode?.name || b.periode?.periode || 'Batch'}` }))} placeholder={selectedExternalUniversity ? 'Pilih Batch Eksternal...' : 'Pilih kampus eksternal dulu'} />
              <Field label="Fakultas Asal" required value={form.external_faculty} onChange={set('external_faculty')} error={errors['mahasiswa.external_faculty']} inputClass={inputClass} labelClass={labelClass} />
              <Field label="Prodi Asal" required value={form.external_study_program} onChange={set('external_study_program')} error={errors['mahasiswa.external_study_program']} inputClass={inputClass} labelClass={labelClass} />
              <Field label="Angkatan" required value={form.batch_year} onChange={set('batch_year')} error={errors['mahasiswa.batch_year']} inputClass={inputClass} labelClass={labelClass} />
              <StudentSharedFields form={form} set={set} inputClass={inputClass} labelClass={labelClass} />
            </div>
          </section>
        )}

        {(form.account_type === 'dosen' || form.account_type === 'dpl') && (
          <section>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-50">Data {form.account_type === 'dpl' ? 'DPL' : 'Dosen'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="NIP/NIDN" required value={form.nip} onChange={set('nip')} error={errors['dosen.nip']} inputClass={inputClass} labelClass={labelClass} />
              <StudentSharedFields form={form} set={set} inputClass={inputClass} labelClass={labelClass} />
            </div>
          </section>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/pengguna" className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">Batal</Link>
          <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-teal-200">
            {mutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 size={16} />}
            {mutation.isPending ? 'Menyimpan...' : 'Buat Pengguna'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, type = 'text', value, onChange, error, inputClass, labelClass }: { label: string; required?: boolean; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; inputClass: string; labelClass: string }) {
  return <div><label className={labelClass}>{label} {required && <span className="text-rose-500">*</span>}</label><input type={type} value={value} onChange={onChange} className={inputClass} />{error && <p className="mt-1 text-xs text-rose-500">{error}</p>}</div>;
}

function Select({ label, required, value, onChange, error, inputClass, labelClass, options, placeholder }: { label: string; required?: boolean; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; error?: string; inputClass: string; labelClass: string; options: Array<{ value: string; label: string }>; placeholder: string }) {
  return <div><label className={labelClass}>{label} {required && <span className="text-rose-500">*</span>}</label><select value={value} onChange={onChange} className={inputClass}><option value="">{placeholder}</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{error && <p className="mt-1 text-xs text-rose-500">{error}</p>}</div>;
}

function StudentSharedFields({ form, set, inputClass, labelClass }: { form: { semester: string; gender: string; phone: string }; set: (field: 'semester' | 'gender' | 'phone') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; inputClass: string; labelClass: string }) {
  return <><Field label="Semester" value={form.semester} onChange={set('semester')} inputClass={inputClass} labelClass={labelClass} /><Select label="Jenis Kelamin" value={form.gender} onChange={set('gender')} inputClass={inputClass} labelClass={labelClass} placeholder="Pilih..." options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} /><Field label="No. HP" value={form.phone} onChange={set('phone')} inputClass={inputClass} labelClass={labelClass} /></>;
}
