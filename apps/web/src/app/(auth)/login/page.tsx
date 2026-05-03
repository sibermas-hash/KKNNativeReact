'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, RefreshCw, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState<{ captcha_id: string; question: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const captchaAnswer = watch('captcha_answer');

  const fetchCaptcha = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await api.get('/sanctum/csrf-cookie');
      const res = await api.get('/auth/captcha');
      const data = res.data as { success: boolean; data: { captcha_id: string; question: string; expires_at: string } };
      if (data.success) {
        setCaptcha(data.data);
        setValue('captcha_id', data.data.captcha_id);
        setValue('captcha_answer', '');
      }
    } catch {
      toast.error('Gagal memuat CAPTCHA');
    } finally {
      setIsRefreshing(false);
    }
  }, [setValue]);

  useEffect(() => { fetchCaptcha(); }, [fetchCaptcha]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirect: Record<string, string> = {
        superadmin: '/admin', admin: '/admin', faculty_admin: '/admin',
        dosen: '/dosen', dpl: '/dosen', student: '/mahasiswa',
      };
      router.replace(roleRedirect[user.roles?.[0] as string] || '/');
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setServerErrors([]);
    try {
      const res = await api.post('/auth/login', data);
      const result = res.data as { success: boolean; data: { user: typeof user } };
      if (result.success) {
        setUser(result.data.user);
        toast.success('Login berhasil!');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: { code?: string; message?: string; errors?: Record<string, string[]> } } } };
        if (axiosErr.response?.status === 422) {
          const errorData = axiosErr.response.data?.error;
          if (errorData?.code === 'CAPTCHA_INVALID') {
            setServerErrors(['Verifikasi keamanan kedaluwarsa atau salah.']);
            fetchCaptcha();
          } else if (errorData?.code === 'CREDENTIALS_INVALID') {
            setError('login', { message: 'Username/email atau kata sandi salah' });
          } else if (errorData?.errors) {
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              setError(field as keyof LoginFormData, { message: messages[0] });
            });
          } else {
            setServerErrors([errorData?.message || 'Terjadi kesalahan']);
          }
        }
      } else {
        setServerErrors(['Terjadi kesalahan. Silakan coba lagi.']);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeCaptchaQuestion = (captcha?.question || '...')
    .replace(/Berapa\s+hasil\s+/i, '')
    .replace(/\?$/, '')
    .trim();

  return (
    <div className="relative min-h-screen flex flex-col sm:justify-center items-center overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-lime-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-amber-400/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] px-6 py-12">
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-10">
            {/* Header */}
            <div className="space-y-6 flex flex-col items-center">
              <div className="flex flex-col items-center gap-5">
                <div className="text-center space-y-2">
                  <h1 className="text-[2.5rem] font-black text-emerald-950 tracking-tight font-display leading-none uppercase">
                    Portal <span className="text-sky-500">SIBER</span>
                    <span className="text-emerald-500">MAS.</span>
                  </h1>
                  <p className="text-[10px] font-black text-slate-400/80 font-display uppercase tracking-[0.2em]">
                    LPPM UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto
                  </p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {serverErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 overflow-hidden shadow-sm">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Otentikasi Gagal</p>
                  <div className="text-xs font-medium text-rose-900 space-y-0.5 leading-relaxed">
                    {serverErrors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Identitas Pengguna</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <User size={16} />
                    </div>
                    <input
                      {...register('login')}
                      type="text"
                      style={{ paddingLeft: '3.2rem' }}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                      placeholder="NIM / NIP / Username"
                      autoFocus
                    />
                  </div>
                  {errors.login && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.login.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kata Sandi</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      style={{ paddingLeft: '3.2rem' }}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
                </div>

                {/* Captcha */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Verifikasi Keamanan</label>
                  <div className="flex gap-3">
                    <div className="flex-1 h-12 bg-white/60 border border-white rounded-xl px-4 flex items-center justify-between group shadow-sm">
                      <span className="text-sm font-black text-emerald-950 tabular-nums tracking-wider">
                        {activeCaptchaQuestion}{' '}
                        <span className="text-emerald-500 font-black ml-1 group-hover:text-teal-500 transition-colors">=</span>
                      </span>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        disabled={isRefreshing}
                        className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <input
                      {...register('captcha_answer')}
                      type="text"
                      inputMode="numeric"
                      className="w-24 h-12 bg-white/60 border border-white focus:bg-white rounded-xl text-center text-base font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none shadow-sm"
                      placeholder="???"
                    />
                  </div>
                  {errors.captcha_answer && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.captcha_answer.message}</p>}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      {...register('remember')}
                      className="peer appearance-none w-4 h-4 rounded-md border-2 border-emerald-200 bg-white checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:text-cyan-500 transition-colors">Ingat Sesi Saya</span>
                </label>
                <a href="/lupa-kata-sandi" className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 hover:underline underline-offset-4 uppercase tracking-widest transition-colors">
                  Lupa Sandi?
                </a>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !captcha}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin text-white" />
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-widest">Otentikasi Masuk</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <a href="/" className="text-xs font-bold text-emerald-200/80 hover:text-white transition-colors flex items-center justify-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            Kembali ke Beranda Publik
          </a>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} LPPM UIN Saizu Purwokerto
          </p>
        </div>
      </div>
    </div>
  );
}
