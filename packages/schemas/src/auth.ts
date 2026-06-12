import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string()
    .min(1, 'NIM/NIP/username wajib diisi')
    .max(255)
    .refine((value) => !value.includes('@'), 'Gunakan NIM, NIP, atau username. Email tidak dapat digunakan untuk login.'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  captcha_id: z.string().min(1, 'CAPTCHA ID tidak valid'),
  captcha_answer: z.string().min(1, 'Jawaban CAPTCHA wajib diisi').max(10),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

const passwordValidation = z.string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[a-z]/, 'Kata sandi harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Kata sandi harus mengandung huruf besar')
  .regex(/[0-9]/, 'Kata sandi harus mengandung angka')
  .regex(/[^a-zA-Z0-9]/, 'Kata sandi harus mengandung simbol');

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: passwordValidation,
  password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Kata sandi tidak cocok',
  path: ['password_confirmation'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().optional(),
  password: passwordValidation,
  password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Kata sandi tidak cocok',
  path: ['password_confirmation'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
