import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().min(1, 'Username/email wajib diisi').max(255),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  captcha_id: z.string().min(1, 'CAPTCHA ID tidak valid'),
  captcha_answer: z.string().min(1, 'Jawaban CAPTCHA wajib diisi').max(10),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Kata sandi tidak cocok',
  path: ['password_confirmation'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Kata sandi tidak cocok',
  path: ['password_confirmation'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
