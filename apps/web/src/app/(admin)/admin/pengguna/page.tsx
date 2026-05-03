'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', role: 'student' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search }],
    queryFn: async () => { const res = await endpoints.users.index({ search }); return res.data as { success: boolean; data: unknown[] }; },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => endpoints.users.store(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setShowForm(false); toast.success('Pengguna berhasil ditambahkan'); },
    onError: () => toast.error('Gagal menambahkan pengguna'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => endpoints.users.toggleStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status berhasil diubah'); },
  });

  const users = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">+ Tambah Pengguna</button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Nama</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="student">Mahasiswa</option><option value="dosen">Dosen</option><option value="dpl">DPL</option><option value="admin">Admin</option><option value="faculty_admin">Admin Fakultas</option></select></div>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Simpan</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">Batal</button></div>
        </form>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pengguna..." className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id as number} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{u.name as string} ({u.username as string})</p>
                <p className="text-sm text-slate-500">{u.email as string} | Role: {(u.roles as string[])?.join(', ') || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleMutation.mutate(u.id as number)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${u.is_active ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
