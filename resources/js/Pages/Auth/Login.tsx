import { useForm, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { captcha_question, flash } = usePage<any>().props;
  const [showPassword, setShowPassword] = useState(false);
  const [currentCaptcha, setCurrentCaptcha] = useState(captcha_question ?? '');

  const { data, setData, post, processing, errors } = useForm({
    login: '',
    password: '',
    remember: false,
    captcha_answer: '',
  });

  // Update captcha question when it changes from server (after failed attempt)
  useEffect(() => {
    if (flash?.captcha_question) {
      setCurrentCaptcha(flash.captcha_question);
    }
  }, [flash?.captcha_question]);

  useEffect(() => {
    if (captcha_question) {
      setCurrentCaptcha(captcha_question);
    }
  }, [captcha_question]);

  const submit: FormEventHandler = (event) => {
    event.preventDefault();
    post('/login', {
      onError: () => {
        setData('captcha_answer', '');
      },
    });
  };

  return (
    <GuestLayout title="Masuk">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label htmlFor="login" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Identitas Pengguna
          </label>
          <input
            id="login"
            type="text"
            placeholder="NIM / NIP"
            value={data.login}
            onChange={(event) => setData('login', event.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 text-slate-900 font-medium shadow-inner focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            autoComplete="username"
          />
          {errors.login && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.login}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight"
            >
              Lupa Kata Sandi?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={data.password}
              onChange={(event) => setData('password', event.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 pr-14 text-slate-900 font-medium shadow-inner focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
              tabIndex={-1}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.password}</p>}
        </div>

        {/* Math Captcha */}
        <div>
          <label htmlFor="captcha_answer" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <ShieldCheckIcon className="h-4 w-4 text-primary" />
            Verifikasi Keamanan
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 px-5 py-4 rounded-xl bg-slate-900 text-white font-black text-lg tracking-wider text-center min-w-[140px] select-none shadow-lg">
              {currentCaptcha || '...'}
            </div>
            <input
              id="captcha_answer"
              type="number"
              placeholder="Jawaban"
              value={data.captcha_answer}
              onChange={(event) => setData('captcha_answer', event.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 text-slate-900 font-bold text-lg shadow-inner focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-center tabular-nums"
              autoComplete="off"
            />
          </div>
          {errors.captcha_answer && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.captcha_answer}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={(event) => setData('remember', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-all"
            />
            Ingat Sesi Saya
          </label>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-xl bg-primary py-4 text-xs font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? 'MENGOTORISASI...' : 'MASUK SEKARANG'}
        </button>
      </form>
    </GuestLayout>
  );
}
