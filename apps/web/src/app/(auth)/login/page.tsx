'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [captcha, setCaptcha] = useState<{ captcha_id: string; question: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fetchCaptcha = async () => {
    try {
      await api.get('/sanctum/csrf-cookie');
      const res = await api.get('/auth/captcha');
      const data = res.data as { success: boolean; data: { captcha_id: string; question: string; expires_at: string } };
      if (data.success) {
        setCaptcha(data.data);
        setValue('captcha_id', data.data.captcha_id);
      }
    } catch {
      toast.error('Gagal memuat CAPTCHA');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirect: Record<string, string> = {
        superadmin: '/admin',
        admin: '/admin',
        faculty_admin: '/admin',
        dosen: '/dosen',
        dpl: '/dosen',
        student: '/mahasiswa',
      };
      const firstRole = user.roles?.[0];
      router.replace(roleRedirect[firstRole as string] || '/');
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const result = res.data as { success: boolean; data: { user: typeof user } };
      if (result.success) {
        setUser(result.data.user);
        toast.success('Login berhasil!');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: { code?: string; errors?: Record<string, string[]> } } } };
        if (axiosErr.response?.status === 422) {
          const errorData = axiosErr.response.data?.error;
          if (errorData?.code === 'CAPTCHA_INVALID') {
            toast.error('CAPTCHA salah atau kedaluwarsa');
            fetchCaptcha();
          } else if (errorData?.code === 'CREDENTIALS_INVALID') {
            setError('login', { message: 'Username/email atau kata sandi salah' });
          } else if (errorData?.errors) {
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              setError(field as keyof LoginFormData, { message: messages[0] });
            });
          }
        }
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">SIBERMAS</h1>
          <p className="mt-2 text-slate-400">Sistem Informasi KKN UIN Saizu</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-8 shadow-xl">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Username / Email</label>
            <input
              {...register('login')}
              type="text"
              placeholder="Masukkan username atau email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {errors.login && <p className="mt-1 text-xs text-red-500">{errors.login.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kata Sandi</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Masukkan kata sandi"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {captcha && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{captcha.question}</label>
              <div className="flex gap-2">
                <input
                  {...register('captcha_answer')}
                  type="text"
                  placeholder="Jawaban"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 hover:bg-slate-200"
                >
                  Refresh
                </button>
              </div>
              {errors.captcha_answer && <p className="mt-1 text-xs text-red-500">{errors.captcha_answer.message}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !captcha}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>

          <div className="text-center">
            <a href="/lupa-kata-sandi" className="text-sm text-teal-600 hover:underline">
              Lupa kata sandi?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
