'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';
import { useAuthStore } from '@/stores';
import { setAuthToken } from '@/stores';
import type { User } from '@sibermas/shared-types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, RefreshCw, User as UserIcon, AlertCircle, ArrowRight, Home } from 'lucide-react';
import { ParticleBackground } from '@/components/ui/particle-background';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';


export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState<{ captcha_id: string; question: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshCooldown = useRef(false);

  // Auto-refresh captcha when it expires
  useEffect(() => {
    if (!captcha?.expires_at) return;
    const expiresAt = new Date(captcha.expires_at).getTime();
    const timeout = Math.max(0, expiresAt - Date.now());
    const timer = window.setTimeout(() => { void fetchCaptcha(); }, timeout);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha?.expires_at]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fetchCaptcha = useCallback(async () => {
    if (refreshCooldown.current) return;
    refreshCooldown.current = true;
    setTimeout(() => { refreshCooldown.current = false; }, 3000);
    setIsRefreshing(true);
    try {
      // handleResponse in client.ts already extracts response.data.data,
      // so the result is the captcha object directly.
      const data = await api.get('/auth/captcha') as { captcha_id: string; question: string; expires_at: string };
      if (data?.captcha_id) {
        setCaptcha(data);
        setValue('captcha_id', data.captcha_id);
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
      // handleResponse in client.ts already extracts response.data.data,
      // so the result is { user, token } directly.
      const result = await api.post('/auth/login', data) as { user: User; token?: string };
      if (result?.user) {
        if (result.token) setAuthToken(result.token);
        setUser(result.user);
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
            fetchCaptcha();
          } else if (errorData?.errors) {
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              setError(field as keyof LoginFormData, { message: messages[0] });
            });
          } else {
            setServerErrors([errorData?.message || 'Terjadi kesalahan']);
          }
        } else {
          setServerErrors(['Terjadi kesalahan server. Silakan coba lagi.']);
          fetchCaptcha();
        }
      } else {
        setServerErrors(['Terjadi kesalahan. Silakan coba lagi.']);
        fetchCaptcha();
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
    <div className="relative min-h-screen flex flex-col sm:justify-center items-center overflow-hidden font-sans selection:bg-cyan-500/30 bg-slate-950">
      {/* Background Layers */}
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large Cinematic Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Interactive Particle System (Above Background, Below Card) */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <ParticleBackground />
      </div>

      {/* Relocated Back to Home Button - Above Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-20 mb-4"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group"
        >
          <Home size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </motion.div>



      {/* Card - Animated with Framer Motion */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] min-w-[320px] px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-10">
            {/* Header */}
            <div className="space-y-6 flex flex-col items-center">
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Image src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" width={120} height={120} className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
                  <div className="w-px h-7 sm:h-8 bg-emerald-200" />
                  <Image src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" width={360} height={120} className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-4xl sm:text-[2.5rem] font-black text-emerald-950 tracking-tight font-display leading-none uppercase">
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
            <AnimatePresence>
              {serverErrors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 overflow-hidden shadow-sm"
                >
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Otentikasi Gagal</p>
                    <div className="text-xs font-medium text-rose-900 space-y-0.5 leading-relaxed">
                      {serverErrors.map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Identitas Pengguna</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <input
                      {...register('login')}
                      data-testid="login-identifier"
                      type="text"
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
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
                      data-testid="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
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
                        title="Segarkan CAPTCHA"
                        aria-label="Segarkan CAPTCHA"
                      >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <input
                      {...register('captcha_answer')}
                      data-testid="login-captcha-answer"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      onChange={(e) => setValue('captcha_answer', e.target.value.replace(/[^0-9]/g, ''))}
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
                <Link href="/lupa-kata-sandi" className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 hover:underline underline-offset-4 uppercase tracking-widest transition-colors">
                  Lupa Sandi?
                </Link>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  data-testid="login-submit"
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
        <div className="mt-6 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} LPPM UIN Saizu Purwokerto
          </p>
        </div>
      </motion.div>
    </div>
  );
}
