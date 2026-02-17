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
      <form onSubmit={submit} className="space-y-8 relative">
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="login" className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-3 group-focus-within:text-accent-gold transition-colors">
              Scholastic Identifier
            </label>
            <div className="relative">
              <input
                id="login"
                type="text"
                placeholder="NIM / NIP / USERNAME"
                value={data.login}
                onChange={(event) => setData('login', event.target.value)}
                className="w-full rounded-2xl bg-white/[0.03] border border-white/10 px-6 py-5 text-white font-medium shadow-2xl focus:bg-white/[0.05] focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all outline-none placeholder:text-white/10 uppercase tracking-widest text-sm"
                autoComplete="username"
              />
            </div>
            {errors.login && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">{errors.login}</p>}
          </div>

          <div className="group">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="password" className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] group-focus-within:text-accent-gold transition-colors">
                Security Protocol
              </label>
              <Link
                href="/forgot-password"
                className="text-[9px] font-black text-white/20 hover:text-accent-gold uppercase tracking-widest transition-colors"
              >
                RECOVER ACCESS?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={data.password}
                onChange={(event) => setData('password', event.target.value)}
                className="w-full rounded-2xl bg-white/[0.03] border border-white/10 px-6 py-5 pr-16 text-white font-medium shadow-2xl focus:bg-white/[0.05] focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all outline-none placeholder:text-white/10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/20 hover:text-accent-gold hover:bg-white/5 transition-all"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">{errors.password}</p>}
          </div>

          {/* Math Captcha - Branded */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 group">
            <label htmlFor="captcha_answer" className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">
              <ShieldCheckIcon className="h-4 w-4 text-accent-gold" />
              INTEGRITY VERIFICATION
            </label>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 px-6 py-5 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white font-black text-2xl tracking-tighter text-center min-w-[150px] select-none shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {currentCaptcha || '...'}
              </div>
              <input
                id="captcha_answer"
                type="number"
                placeholder="RESULT"
                value={data.captcha_answer}
                onChange={(event) => setData('captcha_answer', event.target.value)}
                className="w-full rounded-2xl bg-white/[0.03] border border-white/10 px-6 py-5 text-white font-black text-2xl shadow-2xl focus:bg-white/[0.05] focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all outline-none text-center tabular-nums"
                autoComplete="off"
              />
            </div>
            {errors.captcha_answer && <p className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest">{errors.captcha_answer}</p>}
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] cursor-pointer group hover:text-white/40 transition-colors">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(event) => setData('remember', event.target.checked)}
                className="h-5 w-5 rounded-lg border-white/10 bg-white/5 text-primary focus:ring-primary/20 transition-all cursor-pointer"
              />
              PERSISTENT SESSION
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="group w-full rounded-2xl bg-gradient-to-br from-primary to-primary-dark py-6 text-[11px] font-black text-white uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] hover:-rotate-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {processing ? 'AUTHORIZING NEXUS...' : 'INITIALIZE ACCESS'}
        </button>
      </form>
    </GuestLayout>
  );
}
