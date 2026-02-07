import { useForm } from '@inertiajs/react';
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
    <GuestLayout title="Login">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-slate-700">
            Email atau Username
          </label>
          <input
            id="login"
            type="text"
            value={data.login}
            onChange={(event) => setData('login', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            autoComplete="username"
          />
          {errors.login && <p className="mt-1 text-sm text-red-600">{errors.login}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={data.password}
            onChange={(event) => setData('password', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={data.remember}
            onChange={(event) => setData('remember', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Ingat saya
        </label>

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </GuestLayout>
  );
}
