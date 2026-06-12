import type { PaginationMeta } from '@sibermas/shared-types';

export interface User {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  roles?: string[];
  is_active?: boolean;
  fakultas_id?: number | null;
  avatar_url?: string | null;
}

export interface MahasiswaDetail {
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

export interface DosenDetail {
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

export interface UserDetailPayload {
  user: User;
  mahasiswa: MahasiswaDetail | null;
  dosen: DosenDetail | null;
}

export type EditForm = {
  user: Partial<User>;
  mahasiswa: Partial<MahasiswaDetail>;
  dosen: Partial<DosenDetail>;
};

export type PaginatedUsersResponse = {
  data: User[];
  meta?: PaginationMeta;
};

export type FacultyOption = {
  id: number;
  nama: string;
};

export type ProdiOption = {
  id: number;
  nama: string;
  fakultas_id?: number | null;
};
