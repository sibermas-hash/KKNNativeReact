'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { adminApi, rawApi } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import { Users, UserPlus, Eye, EyeOff, X, ShieldAlert, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PageHeader, EmptyState, ResponsiveTable } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useState, useRef, useEffect, useDeferredValue } from 'react';
import { useAuthStore } from '@/stores';

interface User {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  roles?: string[];
  is_active?: boolean;
  fakultas_id?: number | null;
  avatar_url?: string | null;
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

type PaginatedUsersResponse = {
  data: User[];
  meta?: PaginationMeta;
};

type FacultyOption = {
  id: number;
  nama: string;
};

const EMPTY_CREATE_FORM = { username: '', name: '', email: '', role: 'student', fakultas_id: '' };
const EMPTY_EDIT: EditForm = { user: {}, mahasiswa: {}, dosen: {} };


function pageWindow(current: number, last: number): Array<number | 'dots'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, last - 1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: Array<number | 'dots'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('dots');
    out.push(sorted[i]);
  }
  return out;
}

export default function AdminUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperadmin = (currentUser?.roles ?? []).includes('superadmin');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('student');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [resetConfirmUser, setResetConfirmUser] = useState<User | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const resetCreateForm = () => {
    setForm(EMPTY_CREATE_FORM);
    setShowCreatePassword(false);
    if (passwordRef.current) passwordRef.current.value = '';
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
  };

  const toggleCreateForm = () => {
    if (showForm) {
      setShowForm(false);
      resetCreateForm();
      return;
    }

    resetCreateForm();
    setShowForm(true);
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<PaginatedUsersResponse>({
    queryKey: ['admin', 'users', { search: deferredSearch, roleFilter, statusFilter, facultyFilter, page, perPage }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<User[]>>('/admin/pengguna', {
        params: {
          search: deferredSearch || undefined,
          role: roleFilter || undefined,
          is_active: statusFilter === '' ? undefined : statusFilter === 'active',
          fakultas_id: facultyFilter || undefined,
          page,
          per_page: perPage,
        },
      });

      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
    enabled: isSuperadmin,
    placeholderData: (previousData) => previousData,
  });

  const { data: detailData, isLoading: detailLoading, isError: detailError, error: detailQueryError } = useQuery<UserDetailPayload | null>({
    queryKey: ['admin', 'users', 'detail', editingId],
    queryFn: async () => {
      if (editingId === null) return null;
      return await adminApi.users.show(editingId) as unknown as UserDetailPayload;
    },
    enabled: editingId !== null && isSuperadmin,
  });

  const { data: facultiesData } = useQuery<FacultyOption[]>({
    queryKey: ['admin', 'fakultas', 'user-filters'],
    queryFn: async () => {
      const res = await adminApi.master.faculties.index({});
      return res as unknown as FacultyOption[];
    },
    enabled: isSuperadmin,
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
      resetCreateForm();
      setShowForm(false);
      toast.success('Pengguna ditambahkan');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.toggleStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Status diubah'); },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.users.updateRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
      toast.success('Role berhasil diubah');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.resetPassword(id),
    onSuccess: (res: unknown) => {
      setResetConfirmUser(null);
      const data = res as { delivery?: string };
      toast.success(
        data?.delivery === 'default_ddmmyyyy'
          ? 'Password direset ke default DDMMYYYY. User wajib ganti password saat login.'
          : 'Password berhasil direset.'
      );
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      adminApi.users.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      closeEditModal();
      toast.success('Data pengguna berhasil diperbarui.');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = Math.max(1, meta?.last_page ?? 1);
  const currentPage = meta?.current_page ?? page;
  const pages = pageWindow(currentPage, lastPage);
  const listErrorMessage = isError ? mutationErrorHandler(error) : null;
  const detailErrorMessage = detailError ? mutationErrorHandler(detailQueryError) : null;

  const roleOptions = [
    { value: 'student', label: 'Mahasiswa' },
    { value: 'dosen', label: 'Dosen' },
    { value: 'dpl', label: 'DPL' },
    { value: 'admin', label: 'Admin' },
    { value: 'faculty_admin', label: 'Admin Fakultas' },
    { value: 'superadmin', label: 'Superadmin' },
  ];
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
  ];
  const roleLabelMap = Object.fromEntries(roleOptions.map((option) => [option.value, option.label]));
  const faculties = facultiesData ?? [];
  const activeFilterCount = [deferredSearch, roleFilter, statusFilter, facultyFilter].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  if (!isSuperadmin) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Akses khusus superadmin.</p>
            <p className="text-xs mt-1">
              Manajemen pengguna, perubahan role, dan reset password hanya tersedia untuk superadmin
              karena memengaruhi akses seluruh sistem.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      payload.mahasiswa = stripUndefined(rest as Record<string, unknown>);
    }
    if (hasDosen) {
      const { nip: _nip, ...rest } = editForm.dosen;
      void _nip;
      payload.dosen = stripUndefined(rest as Record<string, unknown>);
    }

    editMutation.mutate({ id: editingId, payload: stripUndefined(payload) });
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

  const batchLabel = meta
    ? `Batch ${meta.current_page} dari ${meta.last_page} • ${meta.from ?? 0}-${meta.to ?? 0} dari ${meta.total} pengguna`
    : `Menampilkan ${users.length} pengguna`;

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setFacultyFilter('');
    setPage(1);
  };

  const renderActions = (u: User) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        onClick={() => toggleMutation.mutate(u.id)}
        disabled={(toggleMutation.isPending && toggleMutation.variables === u.id) || (u.id === currentUser?.id && !!u.is_active)}
        title={u.id === currentUser?.id && u.is_active ? 'Akun Anda sendiri tidak dapat dinonaktifkan.' : undefined}
        className={`px-3 py-1.5 rounded-lg text-xs font-black disabled:opacity-50 ${u.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
      >
        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      <button
        onClick={() => { setEditForm(EMPTY_EDIT); setEditingId(u.id); }}
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
        onClick={() => {

          setResetConfirmUser(u);
        }}
        title="Reset password ke default DDMMYYYY dari tanggal lahir"
        className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
      >
        Reset Password
      </button>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun pengguna sistem"
        actions={
          <button
            onClick={toggleCreateForm}
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
            createMutation.mutate({ ...form, fakultas_id: form.fakultas_id ? Number(form.fakultas_id) : null, password: passwordRef.current?.value || '' });
          }}
          className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm space-y-4"
        >
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
            <b>Tambah pengguna:</b> untuk akun mahasiswa, isi <b>Username dengan NIM</b>, pilih role <b>Mahasiswa</b>, dan fakultas bila perlu. Password wajib minimal 8 karakter serta mengandung huruf besar, huruf kecil, angka, dan simbol.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-username" className="text-[10px] font-black text-slate-500 uppercase">Username</label>
              <input id="create-username" placeholder={form.role === 'student' ? 'NIM / username mahasiswa' : 'Username'} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
            </div>
            <div>
              <label htmlFor="create-name" className="text-[10px] font-black text-slate-500 uppercase">Nama</label>
              <input id="create-name" placeholder={form.role === 'student' ? 'Nama mahasiswa' : 'Nama lengkap'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" required />
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
                <p className="mt-1 text-[10px] text-slate-500">Contoh valid: <code>Abcd1234!</code></p>
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
            <div>
              <label htmlFor="create-fakultas" className="text-[10px] font-black text-slate-500 uppercase">Fakultas</label>
              <select
                id="create-fakultas"
                value={form.fakultas_id}
                onChange={(e) => setForm({ ...form, fakultas_id: e.target.value })}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
              >
                <option value="">Tidak diset / Semua Fakultas</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase hover:bg-cyan-700 disabled:opacity-50">Simpan</button>
            <button type="button" onClick={() => { setShowForm(false); resetCreateForm(); }} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="w-full xl:col-span-2">
                <label htmlFor="search-users" className="text-[10px] font-black text-slate-500 uppercase">Cari Pengguna</label>
                <input
                  id="search-users"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Cari nama, username, atau email..."
                  autoComplete="off"
                  className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold"
                />
              </div>

              <div className="w-full">
                <label htmlFor="filter-role" className="text-[10px] font-black text-slate-500 uppercase">Role</label>
                <select
                  id="filter-role"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold"
                >
                  <option value="">Semua Role</option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label htmlFor="filter-status" className="text-[10px] font-black text-slate-500 uppercase">Status Akun</label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="filter-faculty" className="text-[10px] font-black text-slate-500 uppercase">Fakultas</label>
                <select
                  id="filter-faculty"
                  value={facultyFilter}
                  onChange={(e) => {
                    setFacultyFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold"
                >
                  <option value="">Semua Fakultas</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>{faculty.nama}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-40">
                <label htmlFor="users-per-batch" className="text-[10px] font-black text-slate-500 uppercase">Per Batch</label>
                <select
                  id="users-per-batch"
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size} pengguna</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase text-slate-600 hover:bg-slate-50"
                >
                  Reset Filter ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {isFetching && !isLoading ? 'Memuat batch baru...' : batchLabel}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : listErrorMessage ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">Gagal memuat data pengguna.</p>
          <p className="text-sm text-rose-700">{listErrorMessage}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="Belum ada pengguna"
          description={hasActiveFilters ? 'Tidak ada pengguna yang cocok dengan filter saat ini.' : 'Tidak ada pengguna yang ditemukan.'}
        />
      ) : (
        <div className="space-y-4">
          <ResponsiveTable
            columns={[
              {
                key: 'user',
                label: 'Pengguna',
                render: (u) => (
                  <div>
                    <p className="font-black text-slate-900">{String(u.name || '-')}</p>
                    <p className="text-xs text-slate-400">@{String(u.username || '-')}</p>
                  </div>
                ),
              },
              {
                key: 'email',
                label: 'Kontak',
                hideOnMobile: true,
                render: (u) => (
                  <span className="text-sm text-slate-600">{String(u.email || '-')}</span>
                ),
              },
              {
                key: 'role',
                label: 'Role',
                render: (u) => (
                  <div className="flex flex-wrap gap-1">
                    {(u.roles?.length ? u.roles : ['-']).map((role) => (
                      <span
                        key={`${u.id}-${role}`}
                        className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600"
                      >
                        {roleLabelMap[role] ?? role}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (u) => (
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                ),
              },
            ]}
            data={users}
            keyExtractor={(u) => u.id}
            rowActions={renderActions}
          />

                    {lastPage > 1 && (
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs font-semibold text-slate-500">Halaman <b className="text-slate-800">{currentPage}</b> dari <b className="text-slate-800">{lastPage}</b>{meta?.total != null && <> &middot; <b className="text-slate-800">{meta.total.toLocaleString('id-ID')}</b> pengguna</>}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={currentPage <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {pages.map((item, idx) => item === 'dots' ? <span key={`dots-${idx}`} className="px-1 text-xs font-black text-slate-400">&hellip;</span> : <button key={item} onClick={() => setPage(item as number)} className={`h-9 min-w-9 rounded-xl px-3 text-xs font-black transition ${currentPage === item ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item}</button>)}
                <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={currentPage >= lastPage} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                <button onClick={() => setPage(lastPage)} disabled={currentPage >= lastPage} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
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
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') closeEditModal(); }}
        >
          <form
            onSubmit={handleSubmitEdit}
            className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-data-title"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm shrink-0">
                  {detailData?.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailData.user.avatar_url} alt={detailData.user.name || 'Avatar pengguna'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-cyan-50 text-lg font-black text-cyan-700">
                      {(detailData?.user?.name || editForm.user.name || '?').toString().slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 id="edit-data-title" className="font-black text-slate-900 text-lg">Edit Data Pengguna</h3>
                  <p className="text-xs text-slate-500 mt-1">NIM / NIP di-lock (tidak dapat diubah).</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">Foto profil/Avatar ditampilkan untuk verifikasi visual.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Tutup"
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            ) : detailErrorMessage ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                {detailErrorMessage}
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
                onClick={closeEditModal}
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
            ? `Password ${resetConfirmUser.name} (${resetConfirmUser.username}) akan direset ke default DDMMYYYY berdasarkan tanggal lahir. User wajib mengganti password setelah login.`
            : ''
        }
        confirmText="Reset ke DDMMYYYY"
        variant="warning"
      />
    </div>
  );
}

/* ─── Field components ──────────────────────────────────────────────── */

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => {
        if (entryValue && typeof entryValue === 'object' && !Array.isArray(entryValue)) {
          return [key, stripUndefined(entryValue as Record<string, unknown>)];
        }

        return [key, entryValue];
      }),
  ) as T;
}

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
