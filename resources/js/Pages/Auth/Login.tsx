import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    User,
    AlertCircle,
    ArrowRight,
    Fingerprint,
    ShieldCheck,
    Command,
} from 'lucide-react';

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
    const formRef = useRef<HTMLFormElement | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [captchaQuestion, setCaptchaQuestion] = useState(initialCaptchaQuestion || '');
    const [captchaGeneratedAt, setCaptchaGeneratedAt] = useState<number | null>(initialCaptchaGeneratedAt ?? null);

    const csrfToken = useMemo(
        () => document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        [],
    );

    const loginUrl = useMemo(() => {
        try {
            return route('login.store');
        } catch {
            return '/login';
        }
    }, []);

    const captchaRefreshUrl = useMemo(() => {
        try {
            return route('login.captcha.refresh');
        } catch {
            return '/login/captcha-refresh';
        }
    }, []);

    const passwordRequestUrl = useMemo(() => {
        try {
            return route('password.request');
        } catch {
            return '/lupa-kata-sandi';
        }
    }, []);

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
        try {
            post(loginUrl, {
                replace: true,
                preserveScroll: true,
                onFinish: () => {
                    reset('password', 'captcha_answer');
                },
            });
        } catch (error) {
            console.error('Pengiriman login via Inertia gagal, fallback ke submit form biasa.', error);
            if (formRef.current) {
                HTMLFormElement.prototype.submit.call(formRef.current);
            }
        }
    };

    const refreshCaptcha = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const response = await window.fetch(captchaRefreshUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error('refresh_failed');
            const payload = await response.json() as { question?: string; generated_at?: number };
            setCaptchaQuestion(payload.question || '');
            setCaptchaGeneratedAt(payload.generated_at ?? null);
            setData('captcha_answer', '');
        } catch {
            router.reload({
                data: { refresh: 1 },
                only: ['captcha_question', 'captcha_generated_at', 'captcha_ttl_seconds'],
                onSuccess: () => { setData('captcha_answer', ''); },
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [captchaRefreshUrl, setData]);

    useEffect(() => {
        if (!captchaGeneratedAt) return undefined;
        const expiresAt = (captchaGeneratedAt + captchaTtlSeconds) * 1000;
        const timeout = Math.max(0, expiresAt - Date.now());
        const timer = window.setTimeout(() => { void refreshCaptcha(); }, timeout);
        return () => window.clearTimeout(timer);
    }, [captchaGeneratedAt, captchaTtlSeconds, refreshCaptcha]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: 'spring', stiffness: 100, damping: 20 }
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <GuestLayout title="Otoritas Akses">
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 relative"
            >
                {/* --- HEADER IDENTITY --- */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                            <Command size={28} strokeWidth={2.5} />
                        </div>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.4em] mb-3">Gateway Authentication</h2>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] flex flex-col">
                            Mulai <span>Pengabdian.</span>
                        </h1>
                        <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[280px]">
                            Masukkan identitas valid untuk mengakses ekosistem KKN UIN Saizu.
                        </p>
                    </div>
                </motion.div>

                {/* --- ERROR PROTOCOL --- */}
                <AnimatePresence>
                    {hasErrors && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 overflow-hidden"
                        >
                            <div className="flex gap-5">
                                <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                                    <AlertCircle size={20} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Authentication Failed</p>
                                    <div className="space-y-0.5">
                                        {Object.entries(errors).map(([key, message]) => (
                                            <p key={key} className="text-xs font-bold text-slate-700 leading-tight">
                                                {message as string}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- INPUT MATRIX --- */}
                <form ref={formRef} action={loginUrl} method="POST" onSubmit={submit} className="space-y-8">
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div className="space-y-6">
                        {/* Username */}
                        <motion.div variants={itemVariants} className="group/input">
                            <label htmlFor="login" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-focus-within/input:text-emerald-600 transition-colors">
                                Operator Identity
                            </label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors">
                                    <Fingerprint size={22} strokeWidth={2.5} />
                                </div>
                                <input
                                    id="login"
                                    name="login"
                                    type="text"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-[1.5rem] pl-16 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                                    placeholder="Username / NIM / NIP"
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={itemVariants} className="group/input">
                            <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-focus-within/input:text-emerald-600 transition-colors">
                                Secret Key
                            </label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors">
                                    <Lock size={22} strokeWidth={2.5} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-[1.5rem] pl-16 pr-16 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Captcha Matrix */}
                        <motion.div variants={itemVariants} className="group/input">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-focus-within/input:text-emerald-600 transition-colors">
                                Human Verification
                            </label>
                            <div className="flex gap-4">
                                <div className="flex-1 h-16 bg-white border-2 border-slate-50 rounded-[1.5rem] px-8 flex items-center justify-between group-focus-within/input:border-emerald-100 transition-all">
                                    <span className="text-xl font-black text-slate-900 tabular-nums lowercase tracking-tighter">
                                        {activeCaptchaQuestion} <span className="text-emerald-500">is</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={refreshCaptcha}
                                        disabled={isRefreshing}
                                        className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-30 active:scale-95"
                                    >
                                        <RefreshCw size={18} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                                <input
                                    id="captcha_answer"
                                    name="captcha_answer"
                                    type="text"
                                    inputMode="numeric"
                                    value={data.captcha_answer}
                                    onChange={(e) => setData('captcha_answer', e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-28 h-16 bg-emerald-600 border-none rounded-[1.5rem] text-center text-xl font-black text-white focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-xl shadow-emerald-500/20"
                                    placeholder="?"
                                    required
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Meta Controls */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between px-2 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group/check">
                            <div className="relative h-6 w-6">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="h-full w-full bg-slate-100 border-2 border-transparent peer-checked:bg-emerald-600 peer-checked:border-emerald-600 rounded-lg transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                                     <ShieldCheck size={14} strokeWidth={3} />
                                </div>
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/check:text-slate-600 transition-colors">Sustain Session</span>
                        </label>
                        <Link
                            href={passwordRequestUrl}
                            className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
                        >
                            Reset Secret Key
                        </Link>
                    </motion.div>

                    {/* Execution Trigger */}
                    <motion.div variants={itemVariants} className="pt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center gap-6 group/btn hover:bg-emerald-600 transition-all duration-500 shadow-2xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {processing ? (
                                <RefreshCw size={24} strokeWidth={2.5} className="animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg font-black uppercase tracking-[0.3em]">Initialize Access</span>
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-emerald-600 transition-all duration-500">
                                        <ArrowRight size={20} strokeWidth={3} />
                                    </div>
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </motion.div>
        </GuestLayout>
    );
}
