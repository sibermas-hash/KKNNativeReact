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
    post('/login', {
      replace: true,
      preserveScroll: true,
      onFinish: () => {
        reset('password', 'captcha_answer');
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
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl shadow-primary-900/5 overflow-hidden border border-slate-50">
              <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">LPPM UIN SAIZU</p>
              <h1 className="text-2xl font-bold text-black tracking-tight">
                Masuk ke Sistem
              </h1>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-900 leading-relaxed text-center w-full">
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
                <div className="text-xs font-semibold text-gray-900 space-y-0.5">
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
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">
                Username / NIM / NIP
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={data.login}
                  onChange={(e) => setData('login', e.target.value)}
                  style={{ paddingLeft: '3.5rem' }}
                  className="w-full h-12 bg-emerald-50/30 border border-gray-200/60 rounded-xl pr-4 text-xs font-bold text-black placeholder:text-slate-300 focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all placeholder:normal-case"
                  placeholder="NIM / Username"
                  required
                  autoFocus
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  style={{ paddingLeft: '3.5rem' }}
                  className="w-full h-12 bg-emerald-50/30 border border-gray-200/60 rounded-xl pr-11 text-xs font-bold text-black placeholder:text-slate-300 focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Captcha */}
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider ml-1">
                Verifikasi
              </label>
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-white border border-gray-200/60 rounded-xl px-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 tabular-nums uppercase">
                    {activeCaptchaQuestion}{' '}
                    <span className="text-primary-600 font-bold ml-1">=</span>
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={isRefreshing}
                    className="p-1.5 text-gray-900 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                    title="Refresh Verifikasi"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={data.captcha_answer}
                  onChange={(e) => setData('captcha_answer', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-24 h-12 bg-emerald-50/30 border-2 border-gray-200/60 rounded-xl text-center text-md font-bold text-black focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 transition-all placeholder:text-slate-300"
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
                className="w-3.5 h-3.5 rounded border-gray-200/60 text-primary-600 focus:ring-green-600"
              />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider group-hover:text-gray-900 transition-colors">Ingat Saya</span>
            </label>
            <Link href="/lupa-kata-sandi" className="text-xs font-bold text-primary-600 hover:text-green-800 uppercase tracking-wider">Lupa Sandi?</Link>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="pt-2">
            <button
              type="submit"
              disabled={processing}
              className="w-full h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center gap-2 group hover:bg-green-800 transition-all shadow-lg shadow-green-100 active:scale-[0.98] disabled:opacity-50"
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
