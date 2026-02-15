import { useForm, Link } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    login: '',
    password: '',
    remember: false,
  });

  const submit: FormEventHandler = (event) => {
    event.preventDefault();
    post('/login');
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
            placeholder="NIM, NIP atau Username"
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
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={data.password}
            onChange={(event) => setData('password', event.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 text-slate-900 font-medium shadow-inner focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.password}</p>}
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
