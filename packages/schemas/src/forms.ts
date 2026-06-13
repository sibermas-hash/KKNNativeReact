import { z } from 'zod';

export const createDailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
  abcd_stage: z.enum(['discovery', 'dream', 'design', 'define', 'destiny', 'reflection'], {
    errorMap: () => ({ message: 'Tahap ABCD wajib dipilih' }),
  }),
  category: z.enum(['shilaturrahmi', 'program_unggulan', 'program_pendukung', 'administrasi'], {
    errorMap: () => ({ message: 'Kategori kegiatan wajib dipilih' }),
  }),
  activity: z.string().min(10, 'Deskripsi kegiatan minimal 10 karakter'),
  reflection: z.string().optional(),
  social_media_link: z.string().url('URL tidak valid').optional().or(z.literal('')),
  latitude: z.number().min(-90, 'Latitude tidak valid').max(90),
  longitude: z.number().min(-180, 'Longitude tidak valid').max(180),
  gps_accuracy: z.number().min(0).optional(),
  captured_at: z.string().datetime({ message: 'Format waktu tidak valid' }),
  location_name: z.string().min(3, 'Nama lokasi minimal 3 karakter').max(255),
  location_source: z.enum(['gps', 'manual', 'tower', 'wifi']).optional().default('gps'),
});

export const editDailyReportSchema = createDailyReportSchema.extend({
  output: z.string().optional(),
});

export const createLeaveRequestSchema = z.object({
  type: z.enum(['sakit', 'izin', 'keperluan_mendesak'], {
    errorMap: () => ({ message: 'Jenis izin wajib dipilih' }),
  }),
  reason: z.string().min(5, 'Alasan minimal 5 karakter').max(1000),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
});

export const createWorkProgramSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
  description: z.string().optional(),
  sdg_goals: z.array(z.number().int().min(1).max(17)).max(17).optional(),
  objectives: z.string().optional(),
  target_participants: z.number().min(1).optional(),
  budget: z.number().min(0).optional(),
  kategori: z.string().max(100).optional(),
});

export const registrationSchema = z.object({
  periode_id: z.number().min(1, 'Periode wajib dipilih'),
  jenis_kkn_id: z.number().optional(),
});

export const evaluationSchema = z.object({
  dosen_id: z.number().min(1, 'DPL wajib dipilih'),
  ratings: z.array(z.object({
    aspect: z.string().min(1),
    score: z.number().min(1).max(5),
  })).min(1, 'Minimal 1 aspek penilaian'),
  comment: z.string().max(2000).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255).optional(),
  email: z.string().email('Format email tidak valid').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  address_village_name: z.string().max(255).optional(),
  address_district_name: z.string().max(255).optional(),
  address_regency_name: z.string().max(255).optional(),
  address_postal_code: z.string().max(10, 'Kode pos maksimal 10 karakter').optional(),
  address_province_code: z.string().max(2).optional(),
  address_regency_code: z.string().max(5).optional(),
  address_district_code: z.string().max(8).optional(),
  address_village_code: z.string().max(13).optional(),
  address_lat: z.preprocess(
    (value) => (value === '' || Number.isNaN(value) ? null : value),
    z.number().min(-90, 'Latitude tidak valid').max(90, 'Latitude tidak valid').nullable().optional(),
  ),
  address_lng: z.preprocess(
    (value) => (value === '' || Number.isNaN(value) ? null : value),
    z.number().min(-180, 'Longitude tidak valid').max(180, 'Longitude tidak valid').nullable().optional(),
  ),
  address_verified: z.boolean().optional(),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka').optional().or(z.literal('')),
  mother_name: z.string().max(150).optional(),
  gender: z.enum(['L', 'P', '']).optional(),
  shirt_size: z.enum(['', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']).optional(),
  birth_place: z.string().max(100).optional(),
  birth_date: z.string().optional(),
  external_faculty: z.string().max(150).optional(),
  external_study_program: z.string().max(150).optional(),
  jabatan: z.string().max(100).optional(),
  kelas_jabatan: z.string().max(50).optional(),
  tugas_tambahan: z.string().max(150).optional(),
  golongan: z.string().max(50).optional(),
  pangkat: z.string().max(100).optional(),
  no_rekening: z.string().max(50).optional(),
  nama_bank: z.string().max(100).optional(),
  npwp: z.string().max(50).optional(),
  dosen_nik: z.string().max(50).optional(),
  nidn: z.string().max(50).optional(),
  nama_gelar: z.string().max(255).optional(),
  dosen_alamat: z.string().max(500).optional(),
});

export type CreateDailyReportFormData = z.infer<typeof createDailyReportSchema>;
export type EditDailyReportFormData = z.infer<typeof editDailyReportSchema>;
export type CreateLeaveRequestFormData = z.infer<typeof createLeaveRequestSchema>;
export type CreateWorkProgramFormData = z.infer<typeof createWorkProgramSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type EvaluationFormData = z.infer<typeof evaluationSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
