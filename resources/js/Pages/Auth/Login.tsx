import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps, AuthLoginErrors } from '@/types';
import { hasErrors as checkErrors, getErrorMessages } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  User,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function Login() {
  const {
    captcha_question: initialCaptchaQuestion,
    captcha_generated_at: initialCaptchaGeneratedAt,
    captcha_ttl_seconds: captchaTtlSeconds = 600,
  } = usePage<
    PageProps & {
      captcha_question?: string;
      captcha_generated_at?: number;
      captcha_ttl_seconds?: number;
    }
  >().props;

  const { data, setData, post, processing, errors, reset } = useForm<{
    login: string;
    password: string;
    captcha_answer: string;
    remember: boolean;
  }>({
    login: '',
    password: '',
    captcha_answer: '',
    remember: false,
  });
  const formRef = useRef<HTMLFormElement | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState(initialCaptchaQuestion || '');
  const [captchaGeneratedAt, setCaptchaGeneratedAt] = useState<number | null>(
    initialCaptchaGeneratedAt ?? null,
  );





  const activeCaptchaQuestion = (captchaQuestion || '0 + 0')
    .replace(/Berapa\s+hasil\s+/i, '')
    .replace(/\?$/, '')
    .trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== LOGIN FORM SUBMIT ===', {
      url: '/login',
      data: data,
      csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
      cookies: document.cookie,
    });

    post('/login', {
      replace: true,
      preserveScroll: true,
      onSuccess: (page) => {
        console.log('=== LOGIN SUCCESS ===', page);
        reset('password', 'captcha_answer');
      },
      onError: (errors) => {
        console.log('=== LOGIN ERROR ===', errors);
      },
      onFinish: () => {
        console.log('=== LOGIN FINISH ===');
      },
    });
  };

  const refreshCaptcha = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await window.fetch('/login/captcha-refresh', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) throw new Error('refresh_failed');
      const payload = (await response.json()) as { question?: string; generated_at?: number };
      setCaptchaQuestion(payload.question || '');
      setCaptchaGeneratedAt(payload.generated_at ?? null);
      setData('captcha_answer', '');
    } catch {
      router.reload({
        only: ['captcha_question', 'captcha_generated_at'],
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [setData]);

  useEffect(() => {
    if (!captchaGeneratedAt) return undefined;
    const expiresAt = (captchaGeneratedAt + captchaTtlSeconds) * 1000;
    const timeout = Math.max(0, expiresAt - Date.now());
    const timer = window.setTimeout(() => {
      void refreshCaptcha();
    }, timeout);
    return () => window.clearTimeout(timer);
  }, [captchaGeneratedAt, captchaTtlSeconds, refreshCaptcha]);

  // Auto-clear sensitive fields and sync captcha on login error
  useEffect(() => {
    if (checkErrors(errors)) {
      reset('password', 'captcha_answer');
      setCaptchaQuestion(initialCaptchaQuestion || '');
      setCaptchaGeneratedAt(initialCaptchaGeneratedAt ?? null);
    }
  }, [errors, initialCaptchaQuestion, initialCaptchaGeneratedAt, reset]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <GuestLayout title="Masuk ke Sistem">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
      >
        {/* --- HEADER --- */}
        <motion.div variants={itemVariants} className="space-y-6 flex flex-col items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-5">
              <img src="/images/logo_uin_saizu.png" alt="Logo UIN SAIZU" className="h-14 w-auto object-contain" />
              <div className="w-px h-8 bg-emerald-100" />
              <img src="/images/logo_siberdaya.png" alt="Logo Siberdaya" className="h-12 w-auto object-contain" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-1">LPPM UIN SAIZU PURWOKERTO</p>
              <h1 className="text-2xl font-black text-emerald-950 tracking-tight uppercase italic">
                Siberdaya <span className="text-emerald-600">Portal.</span>
              </h1>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-900 leading-relaxed text-center w-full">
            Silakan masukkan NIM / Username / NIP dan kata sandi Anda untuk mengakses portal.
          </p>
        </motion.div>

        {/* --- ERRORS --- */}
        <AnimatePresence>
          {checkErrors(errors) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3"
            >
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Akses Gagal</p>
                <div className="text-xs font-bold text-emerald-950 space-y-0.5">
                  {getErrorMessages(errors).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FORM --- */}
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-4">
            {/* Username/NIM/Email */}
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider ml-1">
                Username / NIM / NIP
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-600 transition-colors">
                  <User size={16} />
                </div>
                <input
                  data-testid="login-identifier"
                  type="text"
                  value={data.login}
                  onChange={(e) => setData('login', e.target.value)}
                  style={{ paddingLeft: '3.5rem' }}
                  className="w-full h-12 bg-emerald-50/30 border border-emerald-100 rounded-xl pr-4 text-xs font-bold text-emerald-950 placeholder:text-black focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all"
                  placeholder="NIM / Username"
                  required
                  autoFocus
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider ml-1">
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  style={{ paddingLeft: '3.5rem' }}
                  className="w-full h-12 bg-emerald-50/30 border border-emerald-100 rounded-xl pr-11 text-xs font-bold text-emerald-950 placeholder:text-black focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Captcha */}
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider ml-1">
                Verifikasi
              </label>
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-white border border-emerald-100 rounded-xl px-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 tabular-nums uppercase">
                    <span data-testid="login-captcha-question">{activeCaptchaQuestion}</span>{' '}
                    <span className="text-emerald-600 font-bold ml-1">=</span>
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={isRefreshing}
                    className="p-1.5 text-emerald-950 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Refresh Verifikasi"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <input
                  data-testid="login-captcha-answer"
                  type="text"
                  inputMode="numeric"
                  value={data.captcha_answer}
                  onChange={(e) => setData('captcha_answer', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-24 h-12 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl text-center text-md font-bold text-emerald-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all placeholder:text-black"
                  placeholder="???"
                  required
                />
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
             <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-600"
              />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Ingat Saya</span>
            </label>
            <Link href="/lupa-kata-sandi" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider">Lupa Sandi?</Link>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="pt-2">
            <button
              data-testid="login-submit"
              type="submit"
              disabled={processing}
              className="w-full h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 group hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest">Masuk Sekarang</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </GuestLayout>
  );
}
