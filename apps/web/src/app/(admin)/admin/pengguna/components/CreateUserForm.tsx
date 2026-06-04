import { Eye, EyeOff } from 'lucide-react';
import type { RefObject } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { FacultyOption, ProdiOption } from '../lib/user-types';
import { EMPTY_CREATE_FORM, roleOptions } from '../lib/user-options';

type CreateForm = typeof EMPTY_CREATE_FORM;

type Props = {
  form: CreateForm;
  setForm: (form: CreateForm) => void;
  faculties: FacultyOption[];
  prodi: ProdiOption[];
  passwordRef: RefObject<HTMLInputElement | null>;
  showCreatePassword: boolean;
  setShowCreatePassword: (value: boolean) => void;
  createMutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
  onCancel: () => void;
};

export function CreateUserForm({ form, setForm, faculties, prodi, passwordRef, showCreatePassword, setShowCreatePassword, createMutation, onCancel }: Props) {
  const isStudent = form.role === 'student';
  const filteredProdi = form.fakultas_id ? prodi.filter((item) => String(item.fakultas_id) === String(form.fakultas_id)) : prodi;
  const setMahasiswa = (patch: Partial<CreateForm['mahasiswa']>) => setForm({ ...form, mahasiswa: { ...form.mahasiswa, ...patch } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      username: form.username.trim(),
      name: form.name.trim(),
      email: form.email.trim() || null,
      role: form.role,
      fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null,
      password: passwordRef.current?.value || '',
    };

    if (isStudent) {
      payload.username = form.mahasiswa.nim.trim() || form.username.trim();
      payload.mahasiswa = {
        nim: form.mahasiswa.nim.trim(),
        prodi_id: Number(form.mahasiswa.prodi_id),
        batch_year: Number(form.mahasiswa.batch_year),
        semester: form.mahasiswa.semester ? Number(form.mahasiswa.semester) : null,
        gender: form.mahasiswa.gender || null,
        phone: form.mahasiswa.phone.trim() || null,
        status_aktif: 'Aktif',
      };
    }

    createMutation.mutate(payload);
  };

  return (
    <form onSubmit={submit} className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-cyan-600">Akun baru</p>
        <h3 id="create-user-title" className="text-lg font-black text-slate-900">Tambah Pengguna</h3>
        <p className="mt-1 text-xs text-slate-500">Buat akun; role mahasiswa otomatis membuat profil mahasiswa.</p>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
          <b>Mahasiswa:</b> username otomatis memakai NIM. Wajib isi fakultas, prodi, angkatan. Password wajib kuat.
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={isStudent ? 'NIM / Username' : 'Username'}>
            <input id="create-username" placeholder={isStudent ? 'NIM mahasiswa' : 'Username'} value={isStudent ? form.mahasiswa.nim : form.username} onChange={(e) => isStudent ? setForm({ ...form, username: e.target.value, mahasiswa: { ...form.mahasiswa, nim: e.target.value } }) : setForm({ ...form, username: e.target.value })} autoComplete="username" className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1" required />
          </Field>
          <Field label="Nama">
            <input id="create-name" placeholder={isStudent ? 'Nama mahasiswa' : 'Nama lengkap'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1" required />
          </Field>
          <Field label="Email">
            <input id="create-email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1" />
          </Field>
          <div>
            <label htmlFor="create-password" className="text-[10px] font-black text-slate-500 uppercase">Password</label>
            <div className="relative mt-1">
              <input id="create-password" placeholder="Password" type={showCreatePassword ? 'text' : 'password'} ref={passwordRef} autoComplete="new-password" className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 pr-10" required />
              <p className="mt-1 text-[10px] text-slate-500">Contoh valid: <code>Abcd1234!</code></p>
              <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} aria-label={showCreatePassword ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute right-2 top-5 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700">{showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <Field label="Role">
            <select id="create-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1">{roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </Field>
          <Field label="Fakultas">
            <select id="create-fakultas" value={form.fakultas_id} onChange={(e) => setForm({ ...form, fakultas_id: e.target.value, mahasiswa: { ...form.mahasiswa, prodi_id: '' } })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1" required={isStudent}><option value="">Pilih Fakultas</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}</select>
          </Field>
        </div>

        {isStudent && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-black uppercase text-slate-500">Profil Mahasiswa</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prodi">
                <select value={form.mahasiswa.prodi_id} onChange={(e) => setMahasiswa({ prodi_id: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 bg-white" required><option value="">Pilih Prodi</option>{filteredProdi.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>
              </Field>
              <Field label="Angkatan">
                <input type="number" min="2000" max={new Date().getFullYear() + 1} value={form.mahasiswa.batch_year} onChange={(e) => setMahasiswa({ batch_year: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 bg-white" required />
              </Field>
              <Field label="Semester">
                <input type="number" min="1" max="20" placeholder="Opsional" value={form.mahasiswa.semester} onChange={(e) => setMahasiswa({ semester: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 bg-white" />
              </Field>
              <Field label="Gender">
                <select value={form.mahasiswa.gender} onChange={(e) => setMahasiswa({ gender: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 bg-white"><option value="">Opsional</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
              </Field>
              <Field label="No. HP">
                <input placeholder="Opsional" value={form.mahasiswa.phone} onChange={(e) => setMahasiswa({ phone: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mt-1 bg-white" />
              </Field>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <button type="button" onClick={onCancel} className="rounded-xl bg-white px-6 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">Batal</button>
        <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-cyan-600 px-6 py-2 text-xs font-black uppercase text-white hover:bg-cyan-700 disabled:opacity-50">{createMutation.isPending ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] font-black text-slate-500 uppercase">{label}</label>{children}</div>;
}
