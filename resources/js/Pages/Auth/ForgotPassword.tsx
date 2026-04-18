import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { MessageCircle, ShieldCheck, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { FormEvent } from 'react';

interface Props {
    status?: string;
    support_contact_label?: string;
    support_whatsapp_number?: string | null;
    support_whatsapp_link?: string | null;
}

export default function ForgotPassword({
    status,
    support_contact_label = 'Admin KKN / LPPM',
    support_whatsapp_number,
    support_whatsapp_link,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout title="Lupa Kata Sandi">
            <Head title="Lupa Kata Sandi" />

            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-emerald-950">Atur Ulang Kata Sandi</h1>
                    <p className="text-sm text-emerald-800 px-4">
                        Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                    </p>
                </div>

                {status && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm font-medium text-emerald-700 flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        {status}
                    </div>
                )}

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
                                placeholder="nama@mahasiswa.uinsaizu.ac.id"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-2 text-xs font-medium text-rose-500 ml-1">{errors.email}</p>
                        )}
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
                                Kirim Tautan Reset
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                        <span className="bg-white px-4 text-emerald-500 font-medium">Atau</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-center text-xs text-emerald-700 font-medium px-6">
                        Jika Anda tidak memiliki akses ke email, silakan hubungi admin bantuan.
                    </p>
                    
                    {support_whatsapp_link && (
                        <a
                            href={support_whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-emerald-50 text-emerald-800 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <MessageCircle className="h-5 w-5 text-emerald-500" />
                            Hubungi Admin {support_contact_label}
                        </a>
                    )}
                </div>

                <div className="text-center pt-2">
                    <Link href="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                        ← Kembali ke Halaman Masuk
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
