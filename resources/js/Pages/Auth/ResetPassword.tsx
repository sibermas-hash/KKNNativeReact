import { useForm, Link } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import type { AuthResetPasswordErrors } from '@/types';
import GuestLayout from '@/Layouts/GuestLayout';

interface Props {
  token: string;
  email?: string;
}

export default function ResetPassword({ token, email }: Props) {
  const { data, setData, post, processing, errors } = useForm<{
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }>({
    token: token,
    email: email || '',
    password: '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (event) => {
    event.preventDefault();
    post('/reset-password');
  };

  return (
    <GuestLayout title="Atur Ulang Kata Sandi">
      <p className="text-sm text-emerald-950 mb-6">
        Masukkan kata sandi baru Anda. Pastikan kata sandi kuat dengan kombinasi huruf besar, kecil,
        angka, dan simbol.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-emerald-700 mb-1">
            NIM / Username
          </label>
          <input
            id="email"
            type="text"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            className="w-full border border-emerald-100/60 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
            autoComplete="username"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-emerald-700 mb-1">
            Kata Sandi Baru
          </label>
          <input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            className="w-full border border-emerald-100/60 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-emerald-950">
            Minimal 8 karakter, mengandung huruf besar, kecil, angka, dan simbol.
          </p>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-emerald-700 mb-1"
          >
            Konfirmasi Kata Sandi Baru
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            className="w-full border border-emerald-100/60 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Menyimpan...' : 'Atur Ulang Kata Sandi'}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700">
            ← Kembali ke halaman masuk
          </Link>
        </div>
      </form>
    </GuestLayout>
  );
}
