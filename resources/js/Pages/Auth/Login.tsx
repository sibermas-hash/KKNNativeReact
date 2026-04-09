import { useCallback, useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import { 
    Lock, 
    Eye, 
    EyeOff, 
    RefreshCw, 
    Fingerprint,
    Info,
    ChevronRight,
    Binary
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Login() {
    const {
        captcha_question: initialCaptchaQuestion,
        captcha_generated_at: initialCaptchaGeneratedAt,
        captcha_ttl_seconds: captchaTtlSeconds = 600,
    } = usePage<PageProps & {
        captcha_question?: string;
        captcha_generated_at?: number;
        captcha_ttl_seconds?: number;
    }>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        captcha_answer: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [captchaQuestion, setCaptchaQuestion] = useState(initialCaptchaQuestion || '');
    const [captchaGeneratedAt, setCaptchaGeneratedAt] = useState<number | null>(initialCaptchaGeneratedAt ?? null);
    
    useEffect(() => {
        setCaptchaQuestion(initialCaptchaQuestion || '');
    }, [initialCaptchaQuestion]);

    useEffect(() => {
        setCaptchaGeneratedAt(initialCaptchaGeneratedAt ?? null);
    }, [initialCaptchaGeneratedAt]);

    const activeCaptchaQuestion = (captchaQuestion || '0 + 0')
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

    const refreshCaptcha = useCallback(async () => {
        setIsRefreshing(true);

        try {
            const response = await window.fetch(route('login.captcha.refresh'), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('refresh_failed');
            }

            const payload = await response.json() as {
                question?: string;
                generated_at?: number;
            };

            setCaptchaQuestion(payload.question || '');
            setCaptchaGeneratedAt(payload.generated_at ?? null);
            setData('captcha_answer', '');
            return;
        } catch {
            router.reload({
                data: { refresh: 1 },
                only: ['captcha_question', 'captcha_generated_at', 'captcha_ttl_seconds'],
                onSuccess: () => {
                    setData('captcha_answer', '');
                },
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [setData]);

    useEffect(() => {
        if (!captchaGeneratedAt) {
            return undefined;
        }

        const expiresAt = (captchaGeneratedAt + captchaTtlSeconds) * 1000;
        const timeout = Math.max(0, expiresAt - Date.now());
        const timer = window.setTimeout(() => {
            void refreshCaptcha();
        }, timeout);

        return () => window.clearTimeout(timer);
    }, [captchaGeneratedAt, captchaTtlSeconds, refreshCaptcha]);

    return (
        <GuestLayout title="Login">
            <div className="space-y-10">
                {/* Header Sederhana */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
                        Masuk <span className="text-emerald-600">Portal.</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-400 leading-none italic">
                        Silakan lengkapi identitas Anda untuk melanjutkan.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    {/* Aler Error Sederhana */}
                    <AnimatePresence mode="wait">
                        {Object.keys(errors).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-rose-50 border-emerald-400 border border-slate-50 border-l-4 border-l-rose-500 p-5 space-y-3 shadow-xl shadow-rose-950/5"
                            >
                                <div className="flex items-center gap-3">
                                    <Info size={16} className="text-rose-500" />
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic leading-none">Login Bermasalah</span>
                                </div>
                                <div className="space-y-2 text-[10px] font-bold text-slate-600 uppercase leading-relaxed italic">
                                    {Object.entries(errors).map(([key, message]) => (
                                        <p key={key} className="flex gap-2">
                                            <span>&#8226;</span>
                                            {message as string}
                                        </p>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Fields */}
                    <div className="space-y-6">
                        {/* IDENTITAS */}
                        <div className="space-y-3 group">
                            <label htmlFor="login" className="text-[11px] font-bold text-slate-500 italic group-focus-within:text-emerald-600 transition-colors">
                                Username / NIM / NIP
                            </label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                    <Fingerprint size={18} />
                                </div>
                                <input
                                    id="login"
                                    name="login"
                                    type="text"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 px-16 text-slate-900 border-emerald-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold tracking-normal text-sm shadow-inner rounded-3xl"
                                    placeholder="Masukkan username, NIM, atau NIP"
                                    required
                                />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-3 group">
                            <label htmlFor="password" className="text-[11px] font-bold text-slate-500 italic group-focus-within:text-emerald-600 transition-colors">
                                Kata Sandi
                            </label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 px-16 text-slate-900 border-emerald-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold tracking-[0.4em] text-sm shadow-inner rounded-3xl"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors p-2"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* CAPTCHA */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 h-16 bg-emerald-50 border border-emerald-100 px-8 flex items-center justify-between shadow-inner rounded-3xl relative overflow-hidden group/captcha">
                                <div className="flex flex-col leading-none">
                                    <span className="text-[9px] font-bold text-emerald-600 mb-1 italic opacity-70">Lengkapi hasil hitung</span>
                                    <span className="text-3xl font-black text-emerald-950 tracking-tighter tabular-nums italic">
                                        {activeCaptchaQuestion} <span className="text-emerald-500">=</span>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshCaptcha}
                                    disabled={isRefreshing}
                                    className="h-10 w-10 flex items-center justify-center bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90 disabled:opacity-50 shadow-sm rounded-full"
                                >
                                    <RefreshCw size={16} className={clsx((processing || isRefreshing) && "animate-spin")} />
                                </button>
                            </div>
                            <div className="w-full sm:w-32 h-16 border border-emerald-50 bg-slate-50 rounded-3xl focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-inner flex items-center px-4 overflow-hidden">
                                <input
                                    id="captcha_answer"
                                    name="captcha_answer"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={data.captcha_answer}
                                    onChange={(e) => setData('captcha_answer', e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full bg-transparent border-none p-0 text-center font-black text-3xl text-emerald-950 focus:ring-0 placeholder:text-emerald-100 tabular-nums"
                                    placeholder="?"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Controls Sederhana */}
                    <div className="flex flex-row items-center justify-between px-1">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                             <div className="relative h-5 w-5 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center transition-all group-hover:border-emerald-500">
                                 <input
                                     id="remember"
                                     name="remember"
                                     type="checkbox"
                                     checked={data.remember}
                                     onChange={(e) => setData('remember', e.target.checked)}
                                     className="sr-only peer"
                                 />
                                 <div className="h-2 w-2 rounded-full bg-emerald-500 opacity-0 peer-checked:opacity-100 transition-opacity animate-pulse" />
                             </div>
                             <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors italic">Ingat Saya</span>
                        </label>
                        <Link
                            href={route('password.request')}
                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-slate-900 underline underline-offset-4 decoration-emerald-100 italic"
                        >
                            Reset Password?
                        </Link>
                    </div>

                    {/* Button MASUK Sederhana */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="group relative h-20 w-full bg-emerald-600 text-white font-black text-[12px] uppercase tracking-[0.4em] italic rounded-[2rem] transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-2xl shadow-emerald-500/30"
                    >
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                        <div className="relative z-10 flex items-center justify-center gap-6">
                            {processing ? (
                                <>
                                    <RefreshCw size={24} className="animate-spin text-white" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Masuk Sekarang</span>
                                    <div className="h-10 w-10 bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform backdrop-blur-md rounded-full shadow-lg">
                                        <ChevronRight size={20} />
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                    
                    <div className="flex items-center justify-center gap-4 text-[9px] font-black text-emerald-200 uppercase tracking-widest italic opacity-60 hover:opacity-100 transition-opacity group">
                        <Binary size={14} className="group-hover:rotate-180 transition-transform" />
                        <span>Sistem Keamanan Terintegrasi V4</span>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
