import { useCallback, useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { hasErrors as checkErrors, getErrorMessages } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, RefreshCw, User, AlertCircle, ArrowRight } from 'lucide-react';

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
      onSuccess: () => reset('password', 'captcha_answer'),
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
    <GuestLayout title="Otentikasi Sistem">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
      >
        {/* --- HEADER --- */}
        <motion.div variants={itemVariants} className="space-y-6 flex flex-col items-center">
          <div className="flex flex-col items-center gap-5">
            {/* Logos simply displayed on the bright glass */}
            <div className="flex items-center gap-4">
              <img src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" className="h-12 w-auto object-contain drop-shadow-sm" />
              <div className="w-px h-8 bg-emerald-200" />
              <img src="/images/logo_siberdaya.png" alt="Logo Siberdaya" className="h-10 w-auto object-contain drop-shadow-sm" />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-[2.5rem] font-black text-emerald-950 tracking-tight font-display leading-none uppercase">
                Portal <span className="text-cyan-500">Siber</span><span className="text-lime-500">daya.</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400/80 font-display uppercase tracking-[0.2em]">
                LPPM UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto
              </p>
            </div>
          </div>
        </motion.div>

        {/* --- ERRORS --- */}
        <AnimatePresence>
          {checkErrors(errors) && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 overflow-hidden shadow-sm"
            >
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Otentikasi Gagal</p>
                <div className="text-xs font-medium text-rose-900 space-y-0.5 leading-relaxed">
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
          <div className="space-y-5">
            {/* Username/NIM */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">
                Identitas Pengguna
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                  <User size={16} />
                </div>
                <input
                  data-testid="login-identifier"
                  type="text"
                  value={data.login}
                  onChange={(e) => setData('login', e.target.value)}
                  style={{ paddingLeft: '3.2rem' }}
                  className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  placeholder="NIM / NIP / Username"
                  required
                  autoFocus
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  style={{ paddingLeft: '3.2rem' }}
                  className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Captcha */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">
                Verifikasi Keamanan
              </label>
              <div className="flex gap-3">
                <div className="flex-1 h-12 bg-white/60 border border-white rounded-xl px-4 flex items-center justify-between group shadow-sm">
                  <span className="text-sm font-black text-emerald-950 tabular-nums tracking-wider">
                    <span data-testid="login-captcha-question">{activeCaptchaQuestion}</span>{' '}
                    <span className="text-emerald-500 font-black ml-1 group-hover:text-teal-500 transition-colors">=</span>
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={isRefreshing}
                    className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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
                  className="w-24 h-12 bg-white/60 border border-white focus:bg-white rounded-xl text-center text-base font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none shadow-sm"
                  placeholder="???"
                  required
                />
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
             <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded-md border-2 border-emerald-200 bg-white checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                />
                <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:text-cyan-500 transition-colors">Ingat Sesi Saya</span>
            </label>
            <Link href="/lupa-kata-sandi" className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 hover:underline underline-offset-4 uppercase tracking-widest transition-colors">
              Lupa Sandi?
            </Link>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="pt-4">
            <button
              data-testid="login-submit"
              type="submit"
              disabled={processing}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {processing ? (
                <RefreshCw size={18} className="animate-spin text-white" />
              ) : (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Otentikasi Masuk</span>
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
