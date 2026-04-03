import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const { captcha_question, flash } = usePage<PageProps & { captcha_question?: string }>().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    login: '',
    password: '',
    captcha_answer: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const activeCaptchaQuestion = flash?.captcha_question || captcha_question || 'Silakan muat ulang captcha';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => {
        reset('password', 'captcha_answer');
      },
    });
  };

  const refreshCaptcha = () => {
    router.get(route('login'), {}, {
      replace: true,
      preserveScroll: true,
    });
  };

  return (
      <GuestLayout title="Masuk ke Sistem">
      <Head title="Masuk ke Sistem" />

      <form onSubmit={submit} className="space-y-6">
        {/* WELCOME TEXT */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-800">Selamat Datang</h1>
          <p className="text-sm text-slate-500 font-medium">Silakan masuk ke akun Anda untuk melanjutkan.</p>
        </div>

        {/* ERROR SUMMARY */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-2"
            >
              {Object.entries(errors).map(([key, message]) => (
                <div key={key} className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-bold leading-relaxed">
                    {message}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {/* USERNAME */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase  text-slate-400 ml-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                value={data.login}
                onChange={(e) => setData('login', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                placeholder="Masukkan username Anda"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase  text-slate-400 ml-1">
              Kata Sandi
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <KeyRound size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-12 pr-12 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CAPTCHA TACTICAL */}
          <div className="p-5 bg-primary/5 rounded-lg border border-primary/10 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary/60 uppercase  Manusia</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-primary font-mono 
                    {activeCaptchaQuestion}
                  </span>
                  <button 
                    type="button" 
                    onClick={refreshCaptcha}
                    className="p-1.5 rounded-full hover:bg-primary/10 text-primary transition-transform active:rotate-180"
                    title="Muat ulang captcha"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <div className="w-20">
                <input
                  type="number"
                  value={data.captcha_answer}
                  onChange={(e) => setData('captcha_answer', e.target.value)}
                  className="w-full bg-white border border-primary/20 rounded-xl py-3 px-3 text-center font-black text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="?"
                  required
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] font-bold text-primary/70">
              {activeCaptchaQuestion}
            </p>
            {/* Background pattern for captcha */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-primary peer-checked:border-primary transition-all" />
              <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white scale-0 peer-checked:scale-75 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ingat Saya</span>
          </label>
          <Link href={route('password.request')} className="text-xs font-bold text-primary hover:underline underline-offset-4">
            Lupa Sandi?
          </Link>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full bg-white from-primary to-emerald-600 text-white rounded-lg py-4 font-bold text-sm hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0 border border-white/10 flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          {processing ? (
             <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="tracking-widest">VERIFIKASI & MASUK</span>
            </>
          )}
        </button>
      </form>
    </GuestLayout>
  );
}
