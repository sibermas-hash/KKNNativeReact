import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import { 
    Lock, 
    Eye, 
    EyeOff, 
    RefreshCw, 
    ShieldCheck,
    CheckCircle2,
    Fingerprint,
    Info,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Login() {
    const { captcha_question } = usePage<PageProps & { captcha_question?: string }>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        captcha_answer: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    
    // Clean up the captcha question (e.g., "10 + 5" instead of "Berapa hasil 10 + 5?")
    const activeCaptchaQuestion = (captcha_question || '0 + 0')
        .replace(/Berapa\s+hasil\s+/i, '')
        .replace(/\?$/, '')
        .trim();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login.store'), {
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                reset('password', 'captcha_answer');
            },
        });
    };

    const refreshCaptcha = () => {
        router.reload({
            only: ['captcha_question', 'captcha_generated_at', 'captcha_ttl_seconds'],
            async: true,
        });

        fetch(route('login.captcha.refresh'), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        }).then(() => {
            router.reload({
                only: ['captcha_question', 'captcha_generated_at', 'captcha_ttl_seconds'],
                async: true,
            });
            setData('captcha_answer', '');
        }).catch(() => {
            router.reload({
                only: ['captcha_question', 'captcha_generated_at', 'captcha_ttl_seconds'],
                async: true,
            });
        });
    };

    return (
        <GuestLayout title="Otoritas Akses">
            <Head title="Otoritas Akses | Pangkalan Data KKN UIN SAIZU" />

            <div className="space-y-12">
                {/* --- HEADER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Secured_Enclave_Handshake</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Akses <span className="font-serif italic font-normal text-emerald-600 capitalize">Personal.</span></h1>
                    <p className="text-sm font-bold text-slate-400 italic leading-relaxed">Identifikasi Mandiri Mahasiswa & Staf Administrasi LPPM UIN Saizu.</p>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    
                    {/* --- ERROR ALERT --- */}
                    <AnimatePresence mode="wait">
                        {Object.keys(errors).length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-rose-50 border border-rose-100 rounded-2xl p-6 overflow-hidden space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Info size={16} className="text-rose-600" />
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Authenticity_Exception</span>
                                </div>
                                <div className="space-y-1 font-bold italic text-sm text-rose-950">
                                    {Object.entries(errors).map(([key, message]) => (
                                        <p key={key} className="flex gap-3">
                                            <span className="text-rose-300">/</span>
                                            {message as string}
                                        </p>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- USERNAME / NIM / NIP --- */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-1">Universal_Identificator</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                                <Fingerprint size={24} />
                            </div>
                            <input
                                type="text"
                                value={data.login}
                                onChange={(e) => setData('login', e.target.value)}
                                className="w-full h-20 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all duration-300 font-black italic tracking-tight text-lg shadow-inner"
                                placeholder="USERNAME / NIM / NIP"
                                required
                            />
                        </div>
                    </div>

                    {/* --- PASSWORD --- */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-1">Security_Passphrase</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                                <Lock size={22} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full h-20 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-16 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all duration-300 font-black italic tracking-wide text-xl shadow-inner tabular-nums"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors p-2 rounded-xl active:scale-90"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
                            </button>
                        </div>
                    </div>

                    {/* --- CAPTCHA MODULE --- */}
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 flex flex-row items-center gap-6 border border-slate-100 shadow-inner group/captcha relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover/captcha:opacity-30 transition-opacity pointer-events-none" />
                        <div className="flex items-center gap-5 flex-1 relative z-10">
                            <button
                                type="button"
                                onClick={refreshCaptcha}
                                className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all hover:rotate-180 duration-700 shadow-sm shrink-0 active:scale-95"
                                aria-label="Refresh captcha question"
                                title="Segarkan Captcha"
                            >
                                <RefreshCw size={18} aria-hidden="true" />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-2">Heuristic_Validator</span>
                                <label htmlFor="captcha-answer" className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none pointer-events-none font-serif">
                                    {activeCaptchaQuestion} <span className="text-emerald-600">= ?</span>
                                </label>
                            </div>
                        </div>
                        <div className="w-40 shrink-0 relative z-10">
                            <input
                                id="captcha-answer"
                                type="number"
                                value={data.captcha_answer}
                                onChange={(e) => setData('captcha_answer', e.target.value)}
                                className="w-full h-16 bg-white border border-slate-200 rounded-2xl text-center font-black text-2xl italic tracking-tighter text-slate-900 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-200 shadow-xl shadow-emerald-900/5"
                                placeholder="..."
                                required
                            />
                        </div>
                    </div>

                    {/* --- REMEMBER & FORGOT --- */}
                    <div className="flex flex-row items-center justify-between px-2 gap-4">
                        <label className="flex items-center gap-4 cursor-pointer group shrink-0">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-6 h-6 border-2 border-slate-100 rounded-lg bg-slate-50 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all shadow-inner group-hover/checkbox:border-emerald-200" />
                                <CheckCircle2 className="absolute inset-0 h-6 w-6 scale-75 text-white opacity-0 transition-all peer-checked:opacity-100" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic group-hover:text-slate-900 transition-colors selection:bg-none">Ingat_Identitas</span>
                        </label>
                        <Link 
                            href={route('password.request')} 
                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.2em] italic transition-colors underline decoration-emerald-200 underline-offset-8"
                        >
                            Reset_Otorisasi?
                        </Link>
                    </div>

                    {/* --- SUBMIT --- */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="group h-24 w-full bg-slate-950 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden italic uppercase tracking-[0.3em]"
                    >
                        <div className="absolute inset-x-[-20%] h-full bg-white/10 -translate-x-full group-hover:px-full transition-all duration-[3s]" />
                        {processing ? (
                            <>
                                <RefreshCw size={24} className="animate-spin text-emerald-400" />
                                <span>AUTHENTICATING...</span>
                            </>
                        ) : (
                            <>
                                <span>ESTABLISH_AUTH_STREAM</span>
                                <ChevronRight size={24} className="group-hover:translate-x-3 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </GuestLayout>
    );
}
