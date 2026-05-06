'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { Users, Trash2, UserPlus } from 'lucide-react';
import { StatusBadge, PageHeader } from '@/components/ui/shared';
import toast from 'react-hot-toast';
import { useState, useRef } from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string[];
  is_active?: boolean;
}

export default function AdminUsersPage() {
   
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', role: 'student' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('student');
  const passwordRef = useRef<HTMLInputElement>(null);

    const { data, isLoading } = useQuery({
      queryKey: ['admin', 'users', { search }],
      queryFn: async () => { const res = await adminApi.users.index({ search }); return res.data; },
    });
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.users.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowForm(false);
      toast.success('Pengguna ditambahkan');
      // Clear password after success
      if (passwordRef.current) passwordRef.current.value = '';
    },
    onError: () => toast.error('Gagal menambahkan pengguna'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.toggleStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status diubah'); },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.users.updateRole(id, { role }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); 
      setEditingUser(null);
      toast.success('Role berhasil diubah'); 
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Gagal mengubah role'),
  });

   const users = (data as User[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Manajemen Pengguna" subtitle="Kelola akun pengguna sistem" actions={<button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><UserPlus size={14} /> Tambah</button>} />

      {showForm && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = {
            ...form,
            password: passwordRef.current?.value || '',
          };
          createMutation.mutate(formData);
        }} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Username</label><input title="Username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Nama</label><input title="Nama" placeholder="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Email</label><input title="Email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Password</label><input title="Password" placeholder="Password" type="password" ref={passwordRef} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Role</label><select title="Pilih Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">
              <option value="student">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="dpl">DPL</option>
              <option value="admin">Admin</option>
              <option value="faculty_admin">Admin Fakultas</option>
              <option value="superadmin">Superadmin</option>
            </select></div>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Simpan</button><button type="button" onClick={() => { setShowForm(false); if (passwordRef.current) passwordRef.current.value = ''; }} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button></div>
        </form>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pengguna..." className="w-full max-w-sm h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold" />

      {isLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={String(u.id)} className="flex items-center justify-between bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm">
              <div>
                <p className="font-black text-slate-900">{String(u.name || '-')} ({String(u.username || '-')})</p>
                <p className="text-xs text-slate-400">{String(u.email || '-')} | Role: {(u.roles as string[])?.join(', ') || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleMutation.mutate(u.id as number)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${u.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                <button onClick={() => { setEditingUser(u); setEditRole(u.roles?.[0] || 'student'); }} className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200">Ubah Role</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
            <h3 className="font-black text-slate-900 text-lg">Ubah Role Pengguna</h3>
            <div>
              <p className="text-sm font-bold text-slate-700">{editingUser.name}</p>
              <p className="text-xs text-slate-500 mb-3">{editingUser.username}</p>
              <label className="text-[10px] font-black text-slate-400 uppercase">Role Baru</label>
              <select title="Ubah Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">
                <option value="student">Mahasiswa</option>
                <option value="dosen">Dosen</option>
                <option value="dpl">DPL</option>
                <option value="admin">Admin</option>
                <option value="faculty_admin">Admin Fakultas</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
              <button onClick={() => roleMutation.mutate({ id: editingUser.id, role: editRole })} disabled={roleMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
