'use client';

import { mutationErrorHandler } from '@/lib/utils';
import { rawApi } from '@/lib/api';
import { UserPlus, ShieldAlert, Circle, Wifi, Clock3, MonitorSmartphone, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import type { DosenDetail, EditForm, MahasiswaDetail, User } from './lib/user-types';
import { EMPTY_CREATE_FORM, EMPTY_EDIT } from './lib/user-options';
import { stripUndefined } from './lib/user-helpers';
import { useUserFilters } from './hooks/useUserFilters';
import { useAdminUsers } from './hooks/useAdminUsers';
import { useUserDetail } from './hooks/useUserDetail';
import { useUserMutations } from './hooks/useUserMutations';
import { UsersStats } from './components/UsersStats';
import { UsersFilterBar } from './components/UsersFilterBar';
import { UsersTable } from './components/UsersTable';
import { UserRowActions } from './components/UserRowActions';
import { CreateUserForm } from './components/CreateUserForm';
import { RoleDialog } from './components/RoleDialog';
import { ResetPasswordConfirm } from './components/ResetPasswordConfirm';
import { EditUserDialog } from './components/EditUserDialog';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';

type OnlineUser = {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  roles: string[];
  session_count: number;
  ip_address?: string | null;
  user_agent?: string | null;
  last_seen_human: string;
};

type OnlineUsersResponse = {
  users: OnlineUser[];
  total: number;
  window_minutes: number;
  checked_at: string;
};

const PAGE_ENTER = { hidden: { opacity: 0, y: 14, filter: 'blur(5px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.36, ease: 'easeOut' } } } as const;

export default function AdminUsersPage(): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperadmin = (currentUser?.roles ?? []).includes('superadmin');
  const {
    search,
    setSearch,
    deferredSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    facultyFilter,
    setFacultyFilter,
    page,
    setPage,
    perPage,
    setPerPage,
    activeFilterCount,
    hasActiveFilters,
    resetFilters,
  } = useUserFilters();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('student');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [resetConfirmUser, setResetConfirmUser] = useState<User | null>(null);
  const [onlineSidebarOpen, setOnlineSidebarOpen] = useState(true);
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

  const { usersQuery, facultiesQuery, prodiQuery } = useAdminUsers({
    deferredSearch,
    roleFilter,
    statusFilter,
    facultyFilter,
    page,
    perPage,
    enabled: isSuperadmin,
  });
  const { data, isLoading, isFetching, isError, error, refetch } = usersQuery;
  const onlineUsersQuery = useQuery<OnlineUsersResponse>({
    queryKey: ['admin', 'online-users'],
    queryFn: async () => {
      const response = await rawApi.get<{ data: OnlineUsersResponse }>('/admin/online-users', { params: { minutes: 5, limit: 24 } });
      return response.data.data;
    },
    enabled: isSuperadmin,
    refetchInterval: 30000,
  });
  const { data: facultiesData } = facultiesQuery;
  const { data: prodiData } = prodiQuery;

  const { data: detailData, isLoading: detailLoading, isError: detailError, error: detailQueryError } = useUserDetail(editingId, isSuperadmin);

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

  const { createMutation, toggleMutation, roleMutation, resetPwMutation, editMutation } = useUserMutations({
    resetCreateForm,
    setShowForm,
    setEditingUser,
    setResetConfirmUser,
    closeEditModal,
  });

  const users = data?.data ?? [];
  const meta = data?.meta;
  const listErrorMessage = isError ? mutationErrorHandler(error) : null;
  const detailErrorMessage = detailError ? mutationErrorHandler(detailQueryError) : null;

  const faculties = facultiesData ?? [];
  const prodi = prodiData ?? [];

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

  const renderActions = (u: User) => (
    <UserRowActions
      user={u}
      currentUserId={currentUser?.id}
      toggleMutation={toggleMutation}
      onEdit={(user) => { setEditForm(EMPTY_EDIT); setEditingId(user.id); }}
      onRole={(user) => { setEditingUser(user); setEditRole(user.roles?.[0] || 'student'); }}
      onReset={setResetConfirmUser}
    />
  );

  return (
    <motion.div
      className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } } }}
    >
      <motion.div variants={PAGE_ENTER}>
        <PageHeader
        title="Manajemen Pengguna"
        subtitle="Pusat kontrol akun, role, status akses, dan reset kredensial pengguna SIBERMAS."
        actions={
          <button
            onClick={toggleCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase text-slate-900 shadow-sm ring-1 ring-white/70 hover:bg-cyan-50"
          >
            <UserPlus size={14} /> {showForm ? 'Tutup Form' : 'Tambah Pengguna'}
          </button>
        }
      />
      </motion.div>

      <motion.div variants={PAGE_ENTER}>
        <UsersStats meta={meta} users={users} page={page} perPage={perPage} activeFilterCount={activeFilterCount} />
      </motion.div>

      <motion.aside
        variants={PAGE_ENTER}
        animate={{ x: onlineSidebarOpen ? 0 : 220 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="fixed bottom-5 right-5 top-24 z-40 flex w-[min(360px,calc(100vw-2.5rem))] flex-col rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => setOnlineSidebarOpen((open) => !open)}
              className="inline-flex min-w-32 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-emerald-700 shadow-sm hover:bg-emerald-100"
              aria-label={onlineSidebarOpen ? 'Minimize user online' : 'Buka user online'}
            >
              {onlineSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              {onlineSidebarOpen ? 'Minimize' : 'Online'}
            </button>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                <Wifi size={13} /> User Online
              </div>
              <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">Aktif {onlineUsersQuery.data?.window_minutes ?? 5} menit</h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Auto-refresh 30 detik.</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Online</p>
              <p className="text-2xl font-black leading-none">{onlineUsersQuery.data?.total ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {(onlineUsersQuery.data?.users ?? []).map((onlineUser) => (
            <div key={onlineUser.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
                {onlineUser.avatar_url ? <img src={onlineUser.avatar_url} alt={onlineUser.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-black uppercase">{onlineUser.name.slice(0, 2)}</span>}
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-black text-slate-950">{onlineUser.name}</p>
                  <Circle size={8} className="shrink-0 fill-emerald-500 text-emerald-500" />
                </div>
                <p className="truncate text-[11px] font-bold text-slate-500">@{onlineUser.username} · {onlineUser.roles[0] ?? 'user'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {onlineUser.last_seen_human}</span>
                  <span className="inline-flex items-center gap-1"><MonitorSmartphone size={11} /> {onlineUser.session_count} sesi</span>
                </div>
              </div>
            </div>
          ))}
          {!onlineUsersQuery.isLoading && (onlineUsersQuery.data?.users ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">Belum ada user online.</div>
          )}
          {onlineUsersQuery.isLoading && (
            <div className="rounded-2xl border border-dashed border-emerald-100 p-5 text-sm font-semibold text-emerald-700">Memuat user online...</div>
          )}
        </div>
      </motion.aside>

      <AnimatePresence>
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetCreateForm(); } }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowForm(false); resetCreateForm(); } }}
        >
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <CreateUserForm
            form={form}
            setForm={setForm}
            faculties={faculties}
            prodi={prodi}
            passwordRef={passwordRef}
            showCreatePassword={showCreatePassword}
            setShowCreatePassword={setShowCreatePassword}
            createMutation={createMutation}
            onCancel={() => { setShowForm(false); resetCreateForm(); }}
          />
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div variants={PAGE_ENTER}>
        <UsersFilterBar
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        facultyFilter={facultyFilter}
        setFacultyFilter={setFacultyFilter}
        perPage={perPage}
        setPerPage={setPerPage}
        setPage={setPage}
        faculties={faculties}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        resetFilters={resetFilters}
        isFetching={isFetching}
        isLoading={isLoading}
        batchLabel={batchLabel}
      />
      </motion.div>

      <motion.div variants={PAGE_ENTER}>
        <UsersTable
        users={users}
        meta={meta}
        batchLabel={batchLabel}
        hasActiveFilters={hasActiveFilters}
        listErrorMessage={listErrorMessage}
        isLoading={isLoading}
        refetch={refetch}
        setPage={setPage}
        rowActions={renderActions}
      />
      </motion.div>

      <RoleDialog
        user={editingUser}
        editRole={editRole}
        setEditRole={setEditRole}
        roleMutation={roleMutation}
        onClose={() => setEditingUser(null)}
      />

      <EditUserDialog
        editingId={editingId}
        detailData={detailData}
        detailLoading={detailLoading}
        detailErrorMessage={detailErrorMessage}
        editForm={editForm}
        editMutation={editMutation}
        closeEditModal={closeEditModal}
        handleSubmitEdit={handleSubmitEdit}
        updateUserField={updateUserField}
        updateMahasiswaField={updateMahasiswaField}
        updateDosenField={updateDosenField}
      />

      <ResetPasswordConfirm
        user={resetConfirmUser}
        onClose={() => setResetConfirmUser(null)}
        resetPwMutation={resetPwMutation}
      />
    </motion.div>
  );
}
