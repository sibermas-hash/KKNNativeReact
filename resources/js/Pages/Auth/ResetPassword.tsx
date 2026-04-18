import { useForm, Link, Head } from '@inertiajs/react';
import { FormEvent } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { KeyRound, ShieldCheck, ArrowRight, Loader2, Mail } from 'lucide-react';

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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.update'));
    };

    return (
        <GuestLayout title="Atur Ulang Kata Sandi">
            <Head title="Atur Ulang Kata Sandi" />

            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-emerald-950">Buat Kata Sandi Baru</h1>
                    <p className="text-sm text-emerald-800 px-4">
                        Silakan masukkan alamat email Anda dan tentukan kata sandi baru yang kuat untuk mengamankan akun Anda.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-emerald-800 uppercase tracking-widest ml-1 mb-2">
                            Alamat Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-emerald-50 rounded-xl text-emerald-950 text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-2 text-xs font-medium text-rose-500 ml-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-emerald-800 uppercase tracking-widest ml-1 mb-2">
                            Kata Sandi Baru
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
                                <KeyRound size={18} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-emerald-50 rounded-xl text-emerald-950 text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-emerald-700 font-medium ml-1">
                            Minimal 8 karakter, mengandung huruf besar, kecil, angka, dan simbol.
                        </p>
                        {errors.password && (
                            <p className="mt-2 text-xs font-medium text-rose-500 ml-1">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="block text-xs font-bold text-emerald-800 uppercase tracking-widest ml-1 mb-2">
                            Konfirmasi Kata Sandi
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
                                <ShieldCheck size={18} />
                            </div>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-emerald-50 rounded-xl text-emerald-950 text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                        {processing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Simpan Kata Sandi
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <Link href="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                        ← Kembali ke Halaman Masuk
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
