import { z } from 'zod';

export const createDailyReportSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
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
  captured_at: z.string().min(1, 'Waktu capture wajib diisi'),
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
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
});

export const createWorkProgramSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
  description: z.string().optional(),
  sdg_goals: z.array(z.string()).optional(),
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
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  domicile_village_name: z.string().max(255).optional(),
  domicile_district_name: z.string().max(255).optional(),
  domicile_regency_name: z.string().max(255).optional(),
});

export type CreateDailyReportFormData = z.infer<typeof createDailyReportSchema>;
export type EditDailyReportFormData = z.infer<typeof editDailyReportSchema>;
export type CreateLeaveRequestFormData = z.infer<typeof createLeaveRequestSchema>;
export type CreateWorkProgramFormData = z.infer<typeof createWorkProgramSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type EvaluationFormData = z.infer<typeof evaluationSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
