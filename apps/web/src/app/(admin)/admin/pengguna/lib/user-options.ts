import type { EditForm } from './user-types';

export const EMPTY_CREATE_FORM = { username: '', name: '', email: '', role: 'student', fakultas_id: '' };
export const EMPTY_EDIT: EditForm = { user: {}, mahasiswa: {}, dosen: {} };

export const roleOptions = [
  { value: 'student', label: 'Mahasiswa' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'dpl', label: 'DPL' },
  { value: 'admin', label: 'Admin' },
  { value: 'faculty_admin', label: 'Admin Fakultas' },
  { value: 'superadmin', label: 'Superadmin' },
];

export const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
];

export const roleLabelMap = Object.fromEntries(roleOptions.map((option) => [option.value, option.label]));
