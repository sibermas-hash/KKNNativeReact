'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { Users, Trash2, UserPlus } from 'lucide-react';
import { StatusBadge, PageHeader } from '@/components/ui/shared';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminUsersPage() {
  
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', role: 'student' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search }],
    queryFn: async () => { const res = await adminApi.users.index({ search }); return (res as unknown as { success: boolean; data: unknown[] }).data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.users.store(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setShowForm(false); toast.success('Pengguna ditambahkan'); },
    onError: () => toast.error('Gagal menambahkan pengguna'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.toggleStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status diubah'); },
  });

  const users = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Manajemen Pengguna" subtitle="Kelola akun pengguna sistem" actions={<button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><UserPlus size={14} /> Tambah</button>} />

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Nama</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"><option value="student">Mahasiswa</option><option value="dosen">Dosen</option><option value="dpl">DPL</option><option value="admin">Admin</option></select></div>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Simpan</button><button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button></div>
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
              <button onClick={() => toggleMutation.mutate(u.id as number)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${u.is_active ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
