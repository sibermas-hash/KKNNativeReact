import { useForm, Link } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

interface Props {
 status?: string;
}

export default function ForgotPassword({ status }: Props) {
 const { data, setData, post, processing, errors } = useForm({
 email: '',
 });

 const submit: FormEventHandler = (event) => {
 event.preventDefault();
 post('/forgot-password');
 };

 return (
 <GuestLayout title="Lupa Password">
 <div className="mb-4 text-sm text-slate-600">
 Lupa password Anda? Masukkan email yang terdaftar dan kami akan mengirimkan
 link untuk reset password.
 </div>

 {status && (
 <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
 {status}
 </div>
 )}

 <form onSubmit={submit} className="space-y-5">
 <div>
 <label htmlFor="email" className="block text-sm font-medium text-slate-700">
 Email
 </label>
 <input
 id="email"
 type="email"
 value={data.email}
 onChange={(e) => setData('email', e.target.value)}
 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
 autoFocus
 autoComplete="email"
 placeholder="email@example.com"
 />
 {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
 </div>

 <button
 type="submit"
 disabled={processing}
 className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {processing ? 'Mengirim...' : 'Kirim Link Reset Password'}
 </button>

 <div className="text-center">
 <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700">
 ← Kembali ke halaman login
 </Link>
 </div>
 </form>
 </GuestLayout>
 );
}
