export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  avatar_moderation_status?: 'pending' | 'approved' | 'rejected' | null;
  avatar_moderation_reason?: string | null;
  two_factor_enabled?: boolean;
  two_factor_required?: boolean;
  phone?: string | null;
  address?: string | null;
  address_village_name?: string | null;
  address_district_name?: string | null;
  address_regency_name?: string | null;
  address_postal_code?: string | null;
  address_province_code?: string | null;
  address_regency_code?: string | null;
  address_district_code?: string | null;
  address_village_code?: string | null;
  address_lat?: number | null;
  address_lng?: number | null;
  address_registered_at?: string | null;
  address_verified_at?: string | null;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at?: string | null;
  profile_complete?: boolean;
  nim?: string | null;
  roles: string[];
  permissions: string[];
  faculty: Faculty | null;
  student_registration_status?: 'none' | 'pending' | 'approved' | 'rejected';
  student_registration_locked?: boolean;
  active_phase?: string;
  active_period?: Period | null;
  available_periods?: Period[];
  created_at?: string;
}

export interface Mahasiswa {
  id: number;
  user_id: number;
  nim: string;
  nama: string;
  nik?: string | null;
  mother_name?: string | null;
  gender?: 'L' | 'P' | null;
  shirt_size?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  semester?: number | null;
  sks_completed?: number | null;
  gpa?: number | null;
  batch_year?: number | null;
  status_bta_ppi?: string | null;
  is_paid_ukt?: boolean | null;
  health_certificate_path?: string | null;
  parent_permission_path?: string | null;
  faculty?: Faculty | null;
  prodi?: Program | null;
  profile_completion?: number;
}

export interface Dosen {
  id: number;
  user_id: number;
  nip: string;
  nama: string;
  phone?: string | null;
  jabatan?: string | null;
  golongan?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  is_cpns?: boolean | null;
  is_tugas_belajar?: boolean | null;
  faculty?: Faculty | null;
}

export interface Faculty {
  id: number;
  nama: string;
  code: string;
}

export interface Program {
  id: number;
  nama: string;
  code: string;
  fakultas_id: number;
  faculty?: Faculty | null;
}

export interface Period {
  id: number;
  periode: number;
  name: string;
  theme?: string | null;
  start_date: string;
  end_date: string;
  registration_start?: string | null;
  registration_end?: string | null;
  grading_start?: string | null;
  grading_end?: string | null;
  kuota?: number | null;
  is_active: boolean;
  current_phase: string;
  phase_label: string;
  is_locked?: boolean;
  academic_year?: AcademicYear | null;
  jenis_kkn?: JenisKkn | null;
  settings_override?: Record<string, unknown> | null;
}

export interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

export interface JenisKkn {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  registration_mode: string;
  registration_mode_label: string;
  placement_mode: string;
  placement_mode_label: string;
  color?: string | null;
  is_active: boolean;
  attendance_config?: AttendanceConfig;
  requirements_config?: Record<string, unknown> | null;
}

export interface AttendanceConfig {
  geofence_enabled?: boolean;
  radius_meters?: number;
  location_source?: string;
  require_photo?: boolean;
  allow_offline_sync?: boolean;
}

export interface KelompokKkn {
  id: number;
  periode_id: number;
  nama_kelompok: string;
  code: string;
  capacity?: number | null;
  status?: string | null;
  location?: Lokasi | null;
  dpl?: Dosen[];
  ketua_dpl?: Dosen | null;
  member_count?: number;
  members?: PesertaKkn[];
  posko?: Posko | null;
  period?: Period | null;
}

export interface PesertaKkn {
  id: number;
  mahasiswa_id: number;
  periode_id: number;
  kelompok_id?: number | null;
  status: string;
  role?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  registration_date?: string | null;
  approved_at?: string | null;
  revision_count?: number;
  joined_group_at?: string | null;
  notification_shown?: boolean;
  mahasiswa?: Mahasiswa | null;
  kelompok?: KelompokKkn | null;
  periode?: Period | null;
  documents?: DokumenPeserta[];
}

export interface DokumenPeserta {
  id: number;
  peserta_kkn_id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  status: string;
  rejection_reason?: string | null;
  uploaded_at?: string | null;
}

export interface Lokasi {
  id: number;
  village_name: string;
  district_name?: string | null;
  regency_name?: string | null;
  full_name?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  fakultas_id?: number | null;
  faculty?: Faculty | null;
  group_count?: number;
}

export interface Posko {
  id: number;
  kelompok_id: number;
  nama_posko?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number | null;
  photo_url?: string | null;
  gmaps_link?: string | null;
}

export interface KegiatanKkn {
  id: number;
  mahasiswa_id: number;
  kelompok_id: number;
  date: string;
  date_label?: string;
  title: string;
  abcd_stage?: string | null;
  category?: string | null;
  activity: string;
  reflection?: string | null;
  social_media_link?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy?: number | null;
  captured_at?: string | null;
  location_source?: string | null;
  location_name?: string | null;
  status: string;
  status_label?: string;
  status_color?: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  ai_summary?: string | null;
  ai_analysis?: Record<string, unknown> | null;
  attachments?: FileKegiatan[];
  kelompok?: { id: number; name?: string; nama_kelompok?: string };
  mahasiswa?: Mahasiswa;
  created_at?: string;
}

export interface FileKegiatan {
  id: number;
  kegiatan_kkn_id: number;
  file_path: string;
  file_name: string;
  preview_url?: string;
}

export interface ProgramKerja {
  id: number;
  kelompok_id: number;
  title: string;
  description?: string | null;
  sdg_goals?: string[] | null;
  objectives?: string | null;
  target_participants?: number | null;
  budget?: number | null;
  status: string;
  abcd_stage?: string | null;
  kategori?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  proposals?: ProposalProgramKerja[];
  latest_proposal?: ProposalProgramKerja | null;
  kelompok?: KelompokKkn | null;
  created_at?: string;
}

export interface ProposalProgramKerja {
  id: number;
  program_kerja_id: number;
  version: number;
  file_path: string;
  file_name: string;
  uploaded_at?: string | null;
  notes?: string | null;
}

export interface LaporanAkhir {
  id: number;
  mahasiswa_id: number;
  kelompok_id: number;
  title: string;
  abstract?: string | null;
  file_url?: string | null;
  video_link?: string | null;
  news_link?: string | null;
  articles?: { article_1_path?: string | null; article_2_path?: string | null };
  posters?: { poster_1_path?: string | null; poster_2_path?: string | null; poster_3_path?: string | null };
  status: string;
  status_label?: string;
  status_color?: string;
  score?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  mahasiswa?: Mahasiswa | null;
  kelompok?: KelompokKkn | null;
}

export interface NilaiKkn {
  id: number;
  user_id: number;
  kelompok_id: number;
  desa?: { interaksi?: number | null; disiplin?: number | null; kinerja?: number | null; subtotal?: number };
  dpl?: { relevansi?: number | null; ketercapaian?: number | null; inovasi?: number | null; administrasi?: number | null; artikel?: number | null; subtotal?: number };
  lppm?: { workshop?: number | null; administration?: number | null; subtotal?: number };
  dpl_weighted_score?: number | null;
  village_weighted_score?: number | null;
  lppm_weighted_score?: number | null;
  total_score?: number | null;
  letter_grade?: string | null;
  is_finalized?: boolean;
  dpl_graded_at?: string | null;
  village_graded_at?: string | null;
  admin_graded_at?: string | null;
  user?: User | null;
  kelompok?: KelompokKkn | null;
}

export interface Evaluasi {
  id: number;
  mahasiswa_id: number;
  kelompok_id: number;
  evaluator_type: string;
  total_score?: number | null;
  grade?: string | null;
  notes?: string | null;
  evaluated_at?: string | null;
  items?: ItemEvaluasi[];
  mahasiswa?: Mahasiswa | null;
}

export interface ItemEvaluasi {
  id: number;
  evaluasi_id: number;
  criterion: string;
  score: number;
  weight?: number | null;
  notes?: string | null;
}

export interface Workshop {
  id: number;
  periode_id?: number | null;
  title: string;
  description?: string | null;
  methodology?: string | null;
  location?: string | null;
  speaker?: string | null;
  workshop_date?: string | null;
  start_time?: string;
  end_time?: string;
  max_participants?: number | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number | null;
  participant_count?: number;
}

export interface SertifikatKkn {
  id: number;
  user_id: number;
  periode_id: number;
  certificate_number: string;
  verification_token: string;
  nama_mahasiswa: string;
  nim: string;
  nama_prodi: string;
  nama_fakultas: string;
  lokasi_kkn?: string | null;
  total_score?: number | null;
  letter_grade?: string | null;
  issued_at?: string | null;
  is_revoked?: boolean;
  download_url?: string;
}

export interface Announcement {
  id: number;
  title: string;
  slug?: string | null;
  category?: string | null;
  excerpt?: string | null;
  content: string;
  image_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  is_active: boolean;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
}

export interface Attendance {
  id: number;
  peserta_kkn_id: number;
  check_in_at?: string | null;
  check_out_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  method?: string | null;
  status?: string | null;
  created_at?: string;
}

export interface DplPeriod {
  id: number;
  dosen_id: number;
  periode_id: number;
  max_kelompok_kkn: number;
  is_active: boolean;
  status?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  remaining_slots?: number;
  has_capacity?: boolean;
  dosen?: Dosen | null;
  periode?: Period | null;
  kelompok?: KelompokKkn[];
}

export interface PeriodContext {
  active_period: Period | null;
  available_periods: Period[];
  current_phase: string;
  phase_label: string;
}

export interface LogAudit {
  id: number;
  user_id?: number | null;
  action: string;
  auditable_type?: string | null;
  auditable_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  user?: User | null;
}
