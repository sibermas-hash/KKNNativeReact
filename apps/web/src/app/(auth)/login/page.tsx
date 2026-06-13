'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';
import { useAuthStore, setAuthToken } from '@/stores';
import type { User } from '@sibermas/shared-types';
import { api, apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, RefreshCw, User as UserIcon, AlertCircle, ArrowRight, Home } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { dashboardPathForRoles, normalizePostLoginRedirect } from '@/lib/auth-routing';

const ParticleBackground = dynamic(
  () => import('@/components/ui/particle-background').then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);


export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect');
  const normalizedRedirect = normalizePostLoginRedirect(redirectTo);
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState<{ captcha_id: string; question: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const refreshCooldown = useRef(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  useEffect(() => {
    const googleError = searchParams?.get('google_error');
    if (!googleError) return;
    const messages: Record<string, string> = {
      failed: 'Eits, siapa nih? Akun Google ini belum masuk geng SIBERMAS 😏 Pakai email terdaftar dulu, bestie.',
      invalid_state: 'Lah, sesi Google-nya kabur duluan 🏃‍♂️ Jangan bengong, klik Masuk dengan Google lagi.',
      server: 'Server lagi drama dikit 😵‍💫 Sabar ya, jangan langsung nuduh aplikasinya.',
    };
    toast.error(messages[googleError] ?? 'Login Google gagal. SIBERMAS bilang: bukan circle-nya 😌', {
      duration: 7000,
    });
    const next = new URL(window.location.href);
    next.searchParams.delete('google_error');
    router.replace(next.pathname + next.search, { scroll: false });
  }, [router, searchParams]);


  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
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
      const response = await fetch('/api/v1/auth/captcha', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`CAPTCHA request failed with status ${response.status}`);
      }

      const payload = await response.json() as {
        data?: { captcha_id: string; question: string; expires_at: string };
      };
      const data = payload.data;

      if (!data?.captcha_id) {
        throw new Error('CAPTCHA response missing captcha_id');
      }

      setCaptcha(data);
      setValue('captcha_id', data.captcha_id, { shouldValidate: false });
      setValue('captcha_answer', '', { shouldValidate: false });
      clearErrors(['captcha_id', 'captcha_answer']);
    } catch {
      toast.error('Gagal memuat CAPTCHA');
    } finally {
      setIsRefreshing(false);
    }
  }, [clearErrors, setValue]);

  const refetchCaptchaSoon = useCallback(() => {
    refreshCooldown.current = false;
    setCaptcha(null);
    setValue('captcha_id', '', { shouldValidate: false });
    window.setTimeout(() => fetchCaptcha(), 100);
  }, [fetchCaptcha, setValue]);

  useEffect(() => { fetchCaptcha(); }, [fetchCaptcha]);

  // Auto-refresh captcha when it expires, with a minimum delay to avoid
  // tight loops if client/server clocks drift.
  useEffect(() => {
    if (!captcha?.expires_at) return;
    const expiresAt = new Date(captcha.expires_at).getTime();
    const timeout = Math.max(5_000, expiresAt - Date.now());
    const timer = window.setTimeout(() => { void fetchCaptcha(); }, timeout);
    return () => window.clearTimeout(timer);
  }, [captcha?.expires_at, fetchCaptcha]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isSuperadmin = user.roles?.includes('superadmin');

      if (isSuperadmin) {
        router.replace(normalizedRedirect ?? '/admin');
        return;
      }

      // First/default password → must go to /ganti-password first
      if (user.must_change_password || !user.password_changed_at) {
        router.replace('/ganti-password');
        return;
      }

      const isAdmin = ['admin', 'faculty_admin'].some(r => user.roles?.includes(r));
      if (isAdmin) {
        router.replace(normalizedRedirect ?? '/admin');
        return;
      }

      // Password changed but profile still incomplete → go to /profil
      if (!user.profile_complete) {
        router.replace('/profil');
        return;
      }

      const target = dashboardPathForRoles(user.roles);
      router.replace(normalizedRedirect ?? target);
    }
  }, [isAuthenticated, normalizedRedirect, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    if (!captcha?.captcha_id) {
      setError('captcha_answer', { message: 'CAPTCHA belum siap. Silakan muat ulang.' });
      refetchCaptchaSoon();
      return;
    }

    setLoading(true);
    setServerErrors([]);
    try {
      // handleResponse in client.ts already extracts response.data.data,
      // so the result is { user, token } directly.
      const captchaAnswer = data.captcha_answer.trim();
      const payload: LoginFormData = {
        ...data,
        login: data.login.trim(),
        captcha_id: captcha.captcha_id,
        captcha_answer: captchaAnswer,
      };
      const result = await api.post('/auth/login', payload) as { user: User; token?: string };
      if (result?.user) {
        if (result.token) setAuthToken(result.token);
        setUser(result.user);
        toast.success('Login berhasil!');

        const isSuperadmin = result.user.roles?.includes('superadmin');
        if (isSuperadmin) {
          router.replace(normalizedRedirect ?? '/admin');
          return;
        }

        if (result.user.must_change_password || !result.user.password_changed_at) {
          router.replace('/ganti-password');
          return;
        }

        const isAdmin = ['admin', 'faculty_admin'].some((role) => result.user.roles?.includes(role));
        if (isAdmin) {
          router.replace(normalizedRedirect ?? '/admin');
          return;
        }

        if (!result.user.profile_complete) {
          router.replace('/profil');
          return;
        }

        router.replace(normalizedRedirect ?? dashboardPathForRoles(result.user.roles));
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: { code?: string; message?: string; errors?: Record<string, string[] | string | number>; challenge_token?: string; expires_in?: number } } } };
        // 2FA required — navigate to 2FA verification
        if (axiosErr.response?.status === 423 && axiosErr.response.data?.error?.code === 'TWO_FACTOR_REQUIRED') {
          const errorPayload = axiosErr.response.data.error;
          const token =
            errorPayload.challenge_token ??
            (typeof errorPayload.errors?.challenge_token === 'string' ? errorPayload.errors.challenge_token : undefined);
          if (token) {
            try { sessionStorage.setItem('sibermas_2fa_challenge', token); } catch { /* private browsing */ }
            router.push('/login/2fa');
            return;
          }
        }
        if (axiosErr.response?.status === 422) {
          const errorData = axiosErr.response.data?.error;
          if (errorData?.code === 'CAPTCHA_INVALID') {
            setServerErrors(['Verifikasi keamanan kedaluwarsa atau salah.']);
            setValue('captcha_answer', '');
            clearErrors('captcha_answer');
            refetchCaptchaSoon();
            toast.error('Captcha diperbarui. Silakan coba lagi.');
          } else if (errorData?.code === 'CREDENTIALS_INVALID') {
            setError('login', { message: 'NIM/NIP/username atau kata sandi salah' });
            setValue('captcha_answer', '');
            clearErrors('captcha_answer');
            refetchCaptchaSoon();
          } else if (errorData?.errors) {
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                setError(field as keyof LoginFormData, { message: messages[0] });
              }
            });
          } else {
            setServerErrors([errorData?.message || 'Terjadi kesalahan']);
          }
        } else {
          setServerErrors(['Terjadi kesalahan server. Silakan coba lagi.']);
          refetchCaptchaSoon();
        }
      } else {
        setServerErrors(['Terjadi kesalahan. Silakan coba lagi.']);
        refetchCaptchaSoon();
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
    <div className="relative min-h-[100dvh] flex flex-col sm:justify-center items-center overflow-x-hidden overflow-y-auto font-sans selection:bg-cyan-500/30 bg-slate-950">
      {/* Background Layers */}
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large Cinematic Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] sm:w-[900px] h-[400px] sm:h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
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
        className="relative z-10 w-full max-w-[420px] px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-10">
            {/* Header */}
            <div className="space-y-6 flex flex-col items-center">
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Image src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" width={120} height={120} className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" priority />
                  <div className="w-px h-7 sm:h-8 bg-emerald-200" />
                  <Image src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" width={360} height={120} className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" priority />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-4xl sm:text-[2.5rem] font-black text-emerald-950 tracking-tight font-display leading-none uppercase">
                    Portal <span className="text-sky-500">SIBER</span>
                    <span className="text-emerald-500">MAS.</span>
                  </h1>
                  <p className="text-[10px] font-black text-slate-500 font-display uppercase tracking-[0.2em]">
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
            <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                <input type="hidden" {...register('captcha_id')} />
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">NIM / NIP / Username</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <input
                      {...register('login')}
                      data-testid="login-identifier"
                      type="text"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                      placeholder="Masukkan NIM, NIP, atau username"
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
                      autoComplete="current-password"
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      aria-pressed={showPassword}
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
                      className="w-20 sm:w-24 h-12 bg-white/60 border border-white focus:bg-white rounded-xl text-center text-base font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none shadow-sm"
                      placeholder="???"
                    />
                  </div>
                  {!captcha && !isRefreshing && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1">
                      Gagal memuat captcha.{' '}
                      <button type="button" onClick={fetchCaptcha} className="underline hover:text-rose-700">
                        Muat ulang
                      </button>
                    </p>
                  )}
                </div>
                {errors.captcha_answer && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.captcha_answer.message}</p>}
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

              <div className="pt-2">
                <a
                  href={apiUrl('/auth/google/redirect')}
                  className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Masuk dengan Google</span>
                </a>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  data-testid="login-submit"
                  type="submit"
                  disabled={loading || !captcha || isRefreshing}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin text-white" />
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-widest">{!captcha ? 'Memuat Captcha...' : 'Otentikasi Masuk'}</span>
                      {captcha && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            &copy; {currentYear ?? '2026'} LPPM UIN Saizu Purwokerto
          </p>
          <p className="text-[9px] text-slate-400">
            Tidak bisa login?{' '}
            <a href="/clear-session" className="underline hover:text-slate-600 transition-colors">
              Reset sesi browser
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
