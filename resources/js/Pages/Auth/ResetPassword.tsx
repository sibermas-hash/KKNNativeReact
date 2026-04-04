import { useForm, Link } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

interface Props {
 token: string;
 email?: string;
}

export default function ResetPassword({ token, email }: Props) {
 const { data, setData, post, processing, errors } = useForm({
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
 <div className="mb-4 text-sm text-slate-600">
 Masukkan kata sandi baru Anda. Pastikan kata sandi kuat dengan
 kombinasi huruf besar, kecil, angka, dan simbol.
 </div>

 <form onSubmit={submit} className="space-y-5">
 <div>
 <label htmlFor="email" className="block text-sm font-medium text-slate-700">
 Alamat Email
 </label>
 <input
 id="email"
 type="email"
 value={data.email}
 onChange={(e) => setData('email', e.target.value)}
 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
 autoComplete="email"
 />
 {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
 </div>

 <div>
 <label htmlFor="password" className="block text-sm font-medium text-slate-700">
 Kata Sandi Baru
 </label>
 <input
 id="password"
 type="password"
 value={data.password}
 onChange={(e) => setData('password', e.target.value)}
 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
 autoComplete="new-password"
 autoFocus
 />
 <p className="mt-1 text-xs text-slate-500">
 Minimal 8 karakter, mengandung huruf besar, kecil, angka, dan simbol.
 </p>
 {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
 </div>

 <div>
 <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">
 Konfirmasi Kata Sandi Baru
 </label>
 <input
 id="password_confirmation"
 type="password"
 value={data.password_confirmation}
 onChange={(e) => setData('password_confirmation', e.target.value)}
 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
 autoComplete="new-password"
 />
 </div>

 <button
 type="submit"
 disabled={processing}
 className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
