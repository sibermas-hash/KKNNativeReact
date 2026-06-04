'use client';

import { mutationErrorHandler } from '@/lib/utils';
import { UserPlus, ShieldAlert } from 'lucide-react';
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

  const { usersQuery, facultiesQuery } = useAdminUsers({
    deferredSearch,
    roleFilter,
    statusFilter,
    facultyFilter,
    page,
    perPage,
    enabled: isSuperadmin,
  });
  const { data, isLoading, isFetching, isError, error, refetch } = usersQuery;
  const { data: facultiesData } = facultiesQuery;

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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

      <UsersStats meta={meta} users={users} page={page} perPage={perPage} activeFilterCount={activeFilterCount} />

      {showForm && (
        <CreateUserForm
          form={form}
          setForm={setForm}
          faculties={faculties}
          passwordRef={passwordRef}
          showCreatePassword={showCreatePassword}
          setShowCreatePassword={setShowCreatePassword}
          createMutation={createMutation}
          onCancel={() => { setShowForm(false); resetCreateForm(); }}
        />
      )}

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
    </div>
  );
}
