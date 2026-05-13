'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Users, UserPlus, Eye, EyeOff, X } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string[];
  is_active?: boolean;
  fakultas_id?: number | null;
}

interface MahasiswaDetail {
  id: number;
  nim: string;
  nama: string;
  nik?: string | null;
  mother_name?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  shirt_size?: string | null;
  marital_status?: string | null;
  phone?: string | null;
  alamat?: string | null;
  api_email?: string | null;
  fakultas_id?: number | null;
  prodi_id?: number | null;
  batch_year?: number | null;
  semester?: number | null;
  sks_completed?: number | null;
  gpa?: number | null;
  is_paid_ukt?: boolean;
  status_bta_ppi?: string | null;
  status_aktif?: string | null;
}

interface DosenDetail {
  id: number;
  nip: string;
  nama: string;
  nama_gelar?: string | null;
  nidn?: string | null;
  nik?: string | null;
  phone?: string | null;
  jabatan?: string | null;
  pangkat?: string | null;
  golongan?: string | null;
  pendidikan_terakhir?: string | null;
  birth_date?: string | null;
  tempat_lahir?: string | null;
  gender?: string | null;
  alamat?: string | null;
  status_aktif?: string | null;
  status_pegawai?: string | null;
  is_cpns?: boolean;
  is_tugas_belajar?: boolean;
  fakultas_id?: number | null;
}

interface UserDetailPayload {
  user: User;
  mahasiswa: MahasiswaDetail | null;
  dosen: DosenDetail | null;
}

type EditForm = {
  user: Partial<User>;
  mahasiswa: Partial<MahasiswaDetail>;
  dosen: Partial<DosenDetail>;
};

const EMPTY_EDIT: EditForm = { user: {}, mahasiswa: {}, dosen: {} };

export default function AdminUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', role: 'student' });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('student');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [resetConfirmUser, setResetConfirmUser] = useState<User | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', { search }],
    queryFn: async () => {
      const res = await adminApi.users.index({ search });
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const { data: detailData, isLoading: detailLoading, isError: detailError } = useQuery({
    queryKey: ['admin', 'users', 'detail', editingId],
    queryFn: async () => {
      if (editingId === null) return null;
      const res = await adminApi.users.show(editingId);
      return (((res as unknown as { data?: unknown })?.data ?? res) as { data?: UserDetailPayload })?.data
        ?? ((res as unknown as UserDetailPayload));
    },
    enabled: editingId !== null,
  });

  // Audit fix (2026-05-13): sync detail → form DILAKUKAN di useEffect, bukan
  // di render body. Sebelumnya `if (detailData && editForm.user.id !== ...) setEditForm()`
  // dipanggil langsung di body — memicu "setState during render" warning +
  // potensi infinite loop kalau id comparison tidak stabil.
  useEffect(() => {
    if (!detailData || !detailData.user) return;

    const { user: u, mahasiswa, dosen } = detailData;
    setEditForm({
      user: {
        id: u.id,
        username: u.username ?? '',
        name: u.name ?? '',
        email: u.email ?? '',
        is_active: !!u.is_active,
        fakultas_id: u.fakultas_id ?? null,
      },
      mahasiswa: mahasiswa
        ? {
            nim: mahasiswa.nim,
            nama: mahasiswa.nama ?? '',
            nik: mahasiswa.nik ?? '',
            mother_name: mahasiswa.mother_name ?? '',
            birth_place: mahasiswa.birth_place ?? '',
            birth_date: mahasiswa.birth_date ?? '',
            gender: mahasiswa.gender ?? '',
            shirt_size: mahasiswa.shirt_size ?? '',
            marital_status: mahasiswa.marital_status ?? '',
            phone: mahasiswa.phone ?? '',
            alamat: mahasiswa.alamat ?? '',
            api_email: mahasiswa.api_email ?? '',
            fakultas_id: mahasiswa.fakultas_id ?? null,
            prodi_id: mahasiswa.prodi_id ?? null,
            batch_year: mahasiswa.batch_year ?? null,
            semester: mahasiswa.semester ?? null,
            sks_completed: mahasiswa.sks_completed ?? null,
            gpa: mahasiswa.gpa ?? null,
            is_paid_ukt: !!mahasiswa.is_paid_ukt,
            status_bta_ppi: mahasiswa.status_bta_ppi ?? '',
            status_aktif: mahasiswa.status_aktif ?? '',
          }
        : {},
      dosen: dosen
        ? {
            nip: dosen.nip,
            nama: dosen.nama ?? '',
            nama_gelar: dosen.nama_gelar ?? '',
            nidn: dosen.nidn ?? '',
            nik: dosen.nik ?? '',
            phone: dosen.phone ?? '',
            jabatan: dosen.jabatan ?? '',
            pangkat: dosen.pangkat ?? '',
            golongan: dosen.golongan ?? '',
            pendidikan_terakhir: dosen.pendidikan_terakhir ?? '',
            birth_date: dosen.birth_date ?? '',
            tempat_lahir: dosen.tempat_lahir ?? '',
            gender: dosen.gender ?? '',
            alamat: dosen.alamat ?? '',
            status_aktif: dosen.status_aktif ?? '',
            status_pegawai: dosen.status_pegawai ?? '',
            is_cpns: !!dosen.is_cpns,
            is_tugas_belajar: !!dosen.is_tugas_belajar,
            fakultas_id: dosen.fakultas_id ?? null,
          }
        : {},
    });
  }, [detailData]);

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

  const resetPwMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.resetPassword(id),
    onSuccess: (res: unknown) => {
      const data = (res as { data?: { data?: { email_sent?: boolean } } })?.data?.data;
      toast.success(
        data?.email_sent
          ? 'Password sementara dikirim ke email.'
          : 'Password sementara dibuat (user tidak punya email — hubungi manual).'
      );
    },
    onError: () => toast.error('Gagal reset password'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      adminApi.users.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingId(null);
      setEditForm(EMPTY_EDIT);
      toast.success('Data pengguna berhasil diperbarui.');
    },
    onError: (error: unknown) =>
      toast.error(
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Gagal memperbarui data.'
      ),
  });

  const users = (data as unknown as User[]) || [];

  const roleOptions = [
    { value: 'student', label: 'Mahasiswa' },
    { value: 'dosen', label: 'Dosen' },
    { value: 'dpl', label: 'DPL' },
    { value: 'admin', label: 'Admin' },
    { value: 'faculty_admin', label: 'Admin Fakultas' },
    { value: 'superadmin', label: 'Superadmin' },
  ];

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;

    // Strip id dari user payload supaya tidak dikirim ke backend.
    const { id: _id, ...userPayload } = editForm.user;
    void _id;

    const payload: Record<string, unknown> = {
      ...userPayload,
      email: (userPayload.email as string | null | undefined)?.toString().trim() || null,
    };

    const hasMahasiswa = Object.keys(editForm.mahasiswa).length > 0;
    const hasDosen = Object.keys(editForm.dosen).length > 0;

    if (hasMahasiswa) {
      const { nim: _nim, ...rest } = editForm.mahasiswa;
      void _nim;
      payload.mahasiswa = rest;
    }
    if (hasDosen) {
      const { nip: _nip, ...rest } = editForm.dosen;
      void _nip;
      payload.dosen = rest;
    }

    editMutation.mutate({ id: editingId, payload });
  };

  const updateUserField = <K extends keyof User>(key: K, value: User[K]) => {
    setEditForm((prev) => ({ ...prev, user: { ...prev.user, [key]: value } }));
  };
  const updateMahasiswaField = <K extends keyof MahasiswaDetail>(key: K, value: MahasiswaDetail[K]) => {
    setEditForm((prev) => ({ ...prev, mahasiswa: { ...prev.mahasiswa, [key]: value } }));
  };
  const updateDosenField = <K extends keyof DosenDetail>(key: K, value: DosenDetail[K]) => {
    setEditForm((prev) => ({ ...prev, dosen: { ...prev.dosen, [key]: value } }));
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-username" className="text-[10px] font-black text-slate-500 uppercase">Username</label>
              <input id="create-username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label htmlFor="create-name" className="text-[10px] font-black text-slate-500 uppercase">Nama</label>
              <input id="create-name" placeholder="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label htmlFor="create-email" className="text-[10px] font-black text-slate-500 uppercase">Email</label>
              <input id="create-email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" />
            </div>
            <div>
              <label htmlFor="create-password" className="text-[10px] font-black text-slate-500 uppercase">Password</label>
              <div className="relative mt-1">
                <input
                  id="create-password"
                  placeholder="Password"
                  type={showCreatePassword ? 'text' : 'password'}
                  ref={passwordRef}
                  autoComplete="new-password"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  aria-label={showCreatePassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700"
                >
                  {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="create-role" className="text-[10px] font-black text-slate-500 uppercase">Role</label>
              <select id="create-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">
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

      <div>
        <label htmlFor="search-users" className="sr-only">Cari pengguna</label>
        <input
          id="search-users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pengguna..."
          autoComplete="off"
          className="w-full max-w-sm h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : isError ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">Gagal memuat data pengguna.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
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
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => toggleMutation.mutate(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black ${u.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => setEditingId(u.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => { setEditingUser(u); setEditRole(u.roles?.[0] || 'student'); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Ubah Role
                </button>
                <button
                  onClick={() => setResetConfirmUser(u)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditingUser(null); }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ubah-role-title"
          >
            <h3 id="ubah-role-title" className="font-black text-slate-900 text-lg">Ubah Role Pengguna</h3>
            <div>
              <p className="text-sm font-bold text-slate-700">{editingUser.name}</p>
              <p className="text-xs text-slate-500 mb-3">{editingUser.username}</p>
              <label className="text-[10px] font-black text-slate-500 uppercase" htmlFor="edit-role-select">Role Baru</label>
              <select
                id="edit-role-select"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
              >
                {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
              <button type="button" onClick={() => roleMutation.mutate({ id: editingUser.id, role: editRole })} disabled={roleMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editingId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) { setEditingId(null); setEditForm(EMPTY_EDIT); } }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setEditingId(null); setEditForm(EMPTY_EDIT); } }}
        >
          <form
            onSubmit={handleSubmitEdit}
            className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-data-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="edit-data-title" className="font-black text-slate-900 text-lg">Edit Data Pengguna</h3>
                <p className="text-xs text-slate-500 mt-1">NIM / NIP di-lock (tidak dapat diubah).</p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingId(null); setEditForm(EMPTY_EDIT); }}
                aria-label="Tutup"
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            ) : detailError ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                Gagal memuat detail pengguna. Tutup modal ini dan coba lagi.
              </div>
            ) : (
              <>
                {/* User-level */}
                <section className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Akun</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Username</span>
                      <input
                        value={String(editForm.user.username ?? '')}
                        onChange={(e) => updateUserField('username', e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Nama (Akun)</span>
                      <input
                        value={String(editForm.user.name ?? '')}
                        onChange={(e) => updateUserField('name', e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Email</span>
                      <input
                        type="email"
                        value={String(editForm.user.email ?? '')}
                        onChange={(e) => updateUserField('email', e.target.value)}
                        placeholder="Kosongkan jika belum ada"
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={!!editForm.user.is_active}
                        onChange={(e) => updateUserField('is_active', e.target.checked)}
                      />
                      Akun aktif
                    </label>
                  </div>
                </section>

                {/* Mahasiswa */}
                {detailData?.mahasiswa && (
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Data Mahasiswa</h4>
                    <div className="text-[10px] font-bold text-slate-500">
                      NIM: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{editForm.mahasiswa.nim}</code> (locked)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Nama Lengkap" value={editForm.mahasiswa.nama} onChange={(v) => updateMahasiswaField('nama', v)} />
                      <TextField label="NIK" value={editForm.mahasiswa.nik} onChange={(v) => updateMahasiswaField('nik', v)} placeholder="16 digit" />
                      <TextField label="Nama Ibu" value={editForm.mahasiswa.mother_name} onChange={(v) => updateMahasiswaField('mother_name', v)} />
                      <TextField label="Phone" value={editForm.mahasiswa.phone} onChange={(v) => updateMahasiswaField('phone', v)} />
                      <TextField label="Tempat Lahir" value={editForm.mahasiswa.birth_place} onChange={(v) => updateMahasiswaField('birth_place', v)} />
                      <TextField label="Tanggal Lahir" type="date" value={editForm.mahasiswa.birth_date} onChange={(v) => updateMahasiswaField('birth_date', v)} />
                      <SelectField label="Gender" value={editForm.mahasiswa.gender} options={[{ value: '', label: '-' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} onChange={(v) => updateMahasiswaField('gender', v)} />
                      <TextField label="Ukuran Baju" value={editForm.mahasiswa.shirt_size} onChange={(v) => updateMahasiswaField('shirt_size', v)} />
                      <NumberField label="Angkatan" value={editForm.mahasiswa.batch_year} onChange={(v) => updateMahasiswaField('batch_year', v)} />
                      <NumberField label="Semester" value={editForm.mahasiswa.semester} onChange={(v) => updateMahasiswaField('semester', v)} />
                      <NumberField label="SKS Lulus" value={editForm.mahasiswa.sks_completed} onChange={(v) => updateMahasiswaField('sks_completed', v)} />
                      <NumberField label="IPK" value={editForm.mahasiswa.gpa} onChange={(v) => updateMahasiswaField('gpa', v)} step={0.01} />
                      <TextField label="Status BTA-PPI" value={editForm.mahasiswa.status_bta_ppi} onChange={(v) => updateMahasiswaField('status_bta_ppi', v)} placeholder="LULUS / BELUM" />
                      <TextField label="Status Aktif" value={editForm.mahasiswa.status_aktif} onChange={(v) => updateMahasiswaField('status_aktif', v)} placeholder="AKTIF / CUTI / LULUS" />
                      <NumberField label="Fakultas ID" value={editForm.mahasiswa.fakultas_id} onChange={(v) => updateMahasiswaField('fakultas_id', v)} />
                      <NumberField label="Prodi ID" value={editForm.mahasiswa.prodi_id} onChange={(v) => updateMahasiswaField('prodi_id', v)} />
                      <TextField label="Email API" value={editForm.mahasiswa.api_email} onChange={(v) => updateMahasiswaField('api_email', v)} />
                      <TextField label="Status Nikah" value={editForm.mahasiswa.marital_status} onChange={(v) => updateMahasiswaField('marital_status', v)} />
                      <div className="sm:col-span-2">
                        <TextField label="Alamat" value={editForm.mahasiswa.alamat} onChange={(v) => updateMahasiswaField('alamat', v)} />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.mahasiswa.is_paid_ukt}
                          onChange={(e) => updateMahasiswaField('is_paid_ukt', e.target.checked)}
                        />
                        UKT sudah dibayar
                      </label>
                    </div>
                  </section>
                )}

                {/* Dosen */}
                {detailData?.dosen && (
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Data Dosen</h4>
                    <div className="text-[10px] font-bold text-slate-500">
                      NIP: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{editForm.dosen.nip}</code> (locked)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Nama Lengkap" value={editForm.dosen.nama} onChange={(v) => updateDosenField('nama', v)} />
                      <TextField label="Nama + Gelar" value={editForm.dosen.nama_gelar} onChange={(v) => updateDosenField('nama_gelar', v)} />
                      <TextField label="NIDN" value={editForm.dosen.nidn} onChange={(v) => updateDosenField('nidn', v)} />
                      <TextField label="NIK" value={editForm.dosen.nik} onChange={(v) => updateDosenField('nik', v)} placeholder="16 digit" />
                      <TextField label="Phone" value={editForm.dosen.phone} onChange={(v) => updateDosenField('phone', v)} />
                      <TextField label="Jabatan" value={editForm.dosen.jabatan} onChange={(v) => updateDosenField('jabatan', v)} />
                      <TextField label="Pangkat" value={editForm.dosen.pangkat} onChange={(v) => updateDosenField('pangkat', v)} />
                      <TextField label="Golongan" value={editForm.dosen.golongan} onChange={(v) => updateDosenField('golongan', v)} />
                      <TextField label="Pendidikan Terakhir" value={editForm.dosen.pendidikan_terakhir} onChange={(v) => updateDosenField('pendidikan_terakhir', v)} />
                      <TextField label="Tempat Lahir" value={editForm.dosen.tempat_lahir} onChange={(v) => updateDosenField('tempat_lahir', v)} />
                      <TextField label="Tanggal Lahir" type="date" value={editForm.dosen.birth_date} onChange={(v) => updateDosenField('birth_date', v)} />
                      <SelectField label="Gender" value={editForm.dosen.gender} options={[{ value: '', label: '-' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} onChange={(v) => updateDosenField('gender', v)} />
                      <TextField label="Status Aktif" value={editForm.dosen.status_aktif} onChange={(v) => updateDosenField('status_aktif', v)} />
                      <TextField label="Status Pegawai" value={editForm.dosen.status_pegawai} onChange={(v) => updateDosenField('status_pegawai', v)} />
                      <NumberField label="Fakultas ID" value={editForm.dosen.fakultas_id} onChange={(v) => updateDosenField('fakultas_id', v)} />
                      <div className="sm:col-span-2">
                        <TextField label="Alamat" value={editForm.dosen.alamat} onChange={(v) => updateDosenField('alamat', v)} />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.dosen.is_cpns}
                          onChange={(e) => updateDosenField('is_cpns', e.target.checked)}
                        />
                        CPNS
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.dosen.is_tugas_belajar}
                          onChange={(e) => updateDosenField('is_tugas_belajar', e.target.checked)}
                        />
                        Tugas Belajar
                      </label>
                    </div>
                  </section>
                )}
              </>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setEditingId(null); setEditForm(EMPTY_EDIT); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editMutation.isPending || detailLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50"
              >
                {editMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={resetConfirmUser !== null}
        onClose={() => setResetConfirmUser(null)}
        onConfirm={() => {
          if (resetConfirmUser !== null) {
            resetPwMutation.mutate(resetConfirmUser.id);
          }
        }}
        title="Reset Password"
        description={
          resetConfirmUser
            ? `Password sementara akan dibuat untuk ${resetConfirmUser.name} (${resetConfirmUser.username}) dan dikirim ke email jika tersedia.`
            : ''
        }
        confirmText="Reset"
        variant="warning"
      />
    </div>
  );
}

/* ─── Field components ──────────────────────────────────────────────── */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <input
        type="number"
        step={step}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
