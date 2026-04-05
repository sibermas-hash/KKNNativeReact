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
    Mail,
    CheckCircle2
} from 'lucide-react';

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
        post(route('login'), {
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                reset('password', 'captcha_answer');
            },
        });
    };

    const refreshCaptcha = () => {
        router.get(route('login'), { refresh: Date.now().toString() }, {
            replace: true,
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <GuestLayout title="Login">
            <Head title="Login | KKN UIN SAIZU" />

            {/* --- HEADER --- */}
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Selamat Datang</h1>
                <p className="text-slate-500 font-medium italic">Masuk ke akun KKN Anda</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                
                {/* --- ERROR ALERT --- */}
                <AnimatePresence mode="wait">
                    {Object.keys(errors).length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-2 overflow-hidden"
                        >
                            {Object.entries(errors).map(([key, message]) => (
                                <p key={key} className="text-xs sm:text-sm text-rose-600 font-medium flex items-center gap-2 py-0.5">
                                    <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                                    {message as string}
                                </p>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- USERNAME / EMAIL --- */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email / Username</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="text"
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 shadow-sm"
                            placeholder="nama@email.com"
                            required
                        />
                    </div>
                </div>

                {/* --- PASSWORD --- */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-12 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 shadow-sm"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    </div>
                </div>

                {/* --- CAPTCHA MODULE --- */}
                <div className="bg-slate-50/50 rounded-2xl p-5 flex flex-row items-center gap-4 border border-slate-100">
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            type="button"
                            onClick={refreshCaptcha}
                            className="text-slate-400 hover:text-emerald-600 transition-all hover:rotate-180 duration-500 p-2 rounded-full hover:bg-emerald-50 shrink-0"
                            aria-label="Refresh captcha question"
                            title="Segarkan Captcha"
                        >
                            <RefreshCw size={16} aria-hidden="true" />
                        </button>
                        <label htmlFor="captcha-answer" className="text-lg font-bold text-slate-700 italic tracking-tight break-words pointer-events-none">
                            {activeCaptchaQuestion}
                        </label>
                    </div>
                    <div className="w-28 shrink-0">
                        <input
                            id="captcha-answer"
                            type="number"
                            value={data.captcha_answer}
                            onChange={(e) => setData('captcha_answer', e.target.value)}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 shadow-sm"
                            placeholder="Jawaban"
                            required
                        />
                    </div>
                </div>
                {errors.captcha_answer && (
                    <p className="mt-[-16px] text-xs text-rose-500 font-semibold italic px-2">{errors.captcha_answer}</p>
                )}

                {/* --- REMEMBER & FORGOT --- */}
                <div className="flex flex-row items-center justify-between px-1 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group shrink-0">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                            <CheckCircle2 className="absolute inset-0 h-5 w-5 scale-75 text-white opacity-0 transition-all peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Ingat saya</span>
                    </label>
                    <Link 
                        href={route('password.request')} 
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors text-right"
                    >
                        Lupa password?
                    </Link>
                </div>

                {/* --- SUBMIT --- */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <>
                            <RefreshCw size={20} className="animate-spin" />
                            <span>Memproses...</span>
                        </>
                    ) : (
                        <span>Masuk</span>
                    )}
                </button>
            </form>
        </GuestLayout>
    );
}
