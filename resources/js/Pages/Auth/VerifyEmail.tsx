import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import { route } from 'ziggy-js';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const isSent = status === 'verification-link-sent';

    return (
        <GuestLayout title="Verifikasi Email">
            <Head title="Verifikasi Email" />

            <div className="space-y-10 relative z-10">
                {/* Visual Indicator */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-xl shadow-emerald-500/10">
                            {isSent ? <CheckCircle size={40} className="animate-in zoom-in duration-500" /> : <Mail size={40} className="animate-pulse" />}
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50">
                            <div className="h-4 w-4 bg-emerald-500 rounded-full animate-ping opacity-20" />
                            <div className="absolute h-3 w-3 bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Header Content */}
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase italic">
                        VERIFIKASI <span className="text-emerald-600">EMAIL</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">
                        {isSent 
                            ? 'Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat pendaftaran.'
                            : 'Terima kasih telah mendaftar! Sebelum memulai, silakan verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan ke email Anda.'
                        }
                    </p>
                </div>

                {isSent && (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-5 animate-in slide-in-from-top-4 duration-700">
                        <div className="h-10 w-10 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-tight italic">
                            Email terkirim! Silakan periksa kotak masuk atau folder spam Anda.
                        </p>
                    </div>
                )}

                {/* Action Form */}
                <form onSubmit={submit} className="space-y-6">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-16 bg-emerald-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] italic hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 disabled:opacity-30 border-none flex items-center justify-center gap-4 group"
                    >
                        <RefreshCw size={18} className={processing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                        {processing ? 'MENGIRIM ULANG...' : 'KIRIM ULANG TAUTAN VERIFIKASI'}
                    </button>

                    <div className="flex items-center justify-center gap-8 pt-4">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-3 italic group"
                        >
                            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                            KELUAR DARI SISTEM
                        </Link>
                    </div>
                </form>

                {/* Tactical Indicator */}
                <div className="flex items-center justify-center gap-6 opacity-20">
                    <div className="h-px w-12 bg-slate-200" />
                    <span className="text-[8px] font-black text-slate-400 tracking-[0.5em] uppercase italic">Auth Verification Required</span>
                    <div className="h-px w-12 bg-slate-200" />
                </div>
            </div>
        </GuestLayout>
    );
}
