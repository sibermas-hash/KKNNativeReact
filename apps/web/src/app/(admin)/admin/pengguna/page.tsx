'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Users, UserPlus } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string[];
  is_active?: boolean;
}

export default function AdminUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', role: 'student' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState({ username: '', name: '', email: '', is_active: true });
  const [editRole, setEditRole] = useState('student');
  const passwordRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search }],
    queryFn: async () => {
      const res = await adminApi.users.index({ search });
      return (res as unknown as { data?: unknown })?.data ?? res;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.users.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowForm(false);
      toast.success('Pengguna ditambahkan');
      if (passwordRef.current) passwordRef.current.value = '';
    },
    onError: () => toast.error('Gagal menambahkan pengguna'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.toggleStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status diubah'); },
    onError: () => toast.error('Gagal mengubah status pengguna'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.users.updateRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
      toast.success('Role berhasil diubah');
    },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mengubah role'),
  });

  const profileMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => adminApi.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingProfile(null);
      toast.success('Data pengguna berhasil diubah');
    },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal mengubah data pengguna'),
  });

  const users = (data as User[]) || [];

  const roleOptions = [
    { value: 'student', label: 'Mahasiswa' },
    { value: 'dosen', label: 'Dosen' },
    { value: 'dpl', label: 'DPL' },
    { value: 'admin', label: 'Admin' },
    { value: 'faculty_admin', label: 'Admin Fakultas' },
    { value: 'superadmin', label: 'Superadmin' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun pengguna sistem"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-cyan-700"
          >
            <UserPlus size={14} /> Tambah
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, password: passwordRef.current?.value || '' });
          }}
          className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Username</label>
              <input title="Username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Nama</label>
              <input title="Nama" placeholder="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
              <input title="Email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Password</label>
              <input title="Password" placeholder="Password" type="password" ref={passwordRef} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Role</label>
              <select title="Pilih Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">
                {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase hover:bg-cyan-700 disabled:opacity-50">Simpan</button>
            <button type="button" onClick={() => { setShowForm(false); if (passwordRef.current) passwordRef.current.value = ''; }} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
          </div>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari pengguna..."
        className="w-full max-w-sm h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold"
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Belum ada pengguna" description="Tidak ada pengguna yang ditemukan." />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={String(u.id)} className="flex items-center justify-between bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm">
              <div>
                <p className="font-black text-slate-900">{String(u.name || '-')} ({String(u.username || '-')})</p>
                <p className="text-xs text-slate-400">{String(u.email || '-')} | Role: {(u.roles as string[])?.join(', ') || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleMutation.mutate(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black ${u.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(u);
                    setProfileForm({ username: u.username || '', name: u.name || '', email: u.email || '', is_active: !!u.is_active });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                >
                  Ubah Data
                </button>
                <button
                  onClick={() => { setEditingUser(u); setEditRole(u.roles?.[0] || 'student'); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Ubah Role
                </button>
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
                {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
              <button onClick={() => roleMutation.mutate({ id: editingUser.id, role: editRole })} disabled={roleMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate({
                id: editingProfile.id,
                data: { ...profileForm, email: profileForm.email.trim() || null },
              });
            }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5"
          >
            <h3 className="font-black text-slate-900 text-lg">Ubah Data Pengguna</h3>
            <div className="grid gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Username</label>
                <input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Nama</label>
                <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Kosongkan jika belum ada" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input type="checkbox" checked={profileForm.is_active} onChange={(e) => setProfileForm({ ...profileForm, is_active: e.target.checked })} />
                Akun aktif
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingProfile(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
              <button type="submit" disabled={profileMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
