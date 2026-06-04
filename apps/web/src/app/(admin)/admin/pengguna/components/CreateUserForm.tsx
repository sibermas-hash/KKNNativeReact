import { Eye, EyeOff } from 'lucide-react';
import type { RefObject } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { FacultyOption } from '../lib/user-types';
import { EMPTY_CREATE_FORM, roleOptions } from '../lib/user-options';

type CreateForm = typeof EMPTY_CREATE_FORM;

type Props = {
  form: CreateForm;
  setForm: (form: CreateForm) => void;
  faculties: FacultyOption[];
  passwordRef: RefObject<HTMLInputElement | null>;
  showCreatePassword: boolean;
  setShowCreatePassword: (value: boolean) => void;
  createMutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
  onCancel: () => void;
};

export function CreateUserForm({ form, setForm, faculties, passwordRef, showCreatePassword, setShowCreatePassword, createMutation, onCancel }: Props) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null, password: passwordRef.current?.value || '' }); }} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
      <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
        <b>Tambah pengguna:</b> untuk akun mahasiswa, isi <b>Username dengan NIM</b>, pilih role <b>Mahasiswa</b>, dan fakultas bila perlu. Password wajib minimal 8 karakter serta mengandung huruf besar, huruf kecil, angka, dan simbol.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label htmlFor="create-username" className="text-[10px] font-black text-slate-500 uppercase">Username</label><input id="create-username" placeholder={form.role === 'student' ? 'NIM / username mahasiswa' : 'Username'} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
        <div><label htmlFor="create-name" className="text-[10px] font-black text-slate-500 uppercase">Nama</label><input id="create-name" placeholder={form.role === 'student' ? 'Nama mahasiswa' : 'Nama lengkap'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
        <div><label htmlFor="create-email" className="text-[10px] font-black text-slate-500 uppercase">Email</label><input id="create-email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" /></div>
        <div>
          <label htmlFor="create-password" className="text-[10px] font-black text-slate-500 uppercase">Password</label>
          <div className="relative mt-1">
            <input id="create-password" placeholder="Password" type={showCreatePassword ? 'text' : 'password'} ref={passwordRef} autoComplete="new-password" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 pr-10 text-sm" required />
            <p className="mt-1 text-[10px] text-slate-500">Contoh valid: <code>Abcd1234!</code></p>
            <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} aria-label={showCreatePassword ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700">{showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        <div><label htmlFor="create-role" className="text-[10px] font-black text-slate-500 uppercase">Role</label><select id="create-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">{roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div><label htmlFor="create-fakultas" className="text-[10px] font-black text-slate-500 uppercase">Fakultas</label><select id="create-fakultas" value={form.fakultas_id} onChange={(e) => setForm({ ...form, fakultas_id: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"><option value="">Tidak diset / Semua Fakultas</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}</select></div>
      </div>
      <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase hover:bg-cyan-700 disabled:opacity-50">Simpan</button><button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button></div>
    </form>
  );
}
