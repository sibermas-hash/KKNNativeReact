import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import { 
 User, 
 Eye, 
 EyeOff, 
 RefreshCw, 
 ShieldCheck,
 KeyRound,
 CheckCircle2,
 AlertCircle
} from 'lucide-react';

export default function Login() {
 const { captcha_question, flash } = usePage<PageProps & { captcha_question?: string }>().props;
 const { data, setData, post, processing, errors, reset } = useForm({
 login: '',
 password: '',
 captcha_answer: '',
 remember: false,
 });

 const [showPassword, setShowPassword] = useState(false);
 const activeCaptchaQuestion = flash?.captcha_question || captcha_question || 'Silakan muat ulang captcha';

 const submit = (e: React.FormEvent) => {
 e.preventDefault();
 post(route('login'), {
 onFinish: () => {
 reset('password', 'captcha_answer');
 },
 });
 };

 const refreshCaptcha = () => {
 router.get(route('login'), {}, {
 replace: true,
 preserveScroll: true,
 });
 };

 return (
 <GuestLayout title="Masuk ke Sistem">
 <Head title="Masuk ke Sistem" />

 <form onSubmit={submit} className="space-y-6">
 {/* WELCOME TEXT */}
 <div className="mb-8">
 <h1 className="text-xl font-semibold text-slate-800">Selamat Datang</h1>
 <p className="text-sm text-slate-500 font-medium">Silakan masuk ke akun Anda untuk melanjutkan.</p>
 </div>

 {/* ERROR SUMMARY */}
 <AnimatePresence>
 {Object.keys(errors).length > 0 && (
 <motion.div 
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="bg-red-50 border border-red-100 rounded-lg p-3 flex flex-col gap-2"
 >
 {Object.entries(errors).map(([key, message]) => (
 <div key={key} className="flex items-start gap-3">
 <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
 <p className="text-sm text-red-600 leading-normal">
 {message}
 </p>
 </div>
 ))}
 </motion.div>
 )}
 </AnimatePresence>

 <div className="space-y-4">
 {/* USERNAME */}
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-400 ml-1">
 Username
 </label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
 <User size={18} />
 </div>
 <input
 type="text"
 value={data.login}
 onChange={(e) => setData('login', e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
 placeholder="Masukkan username Anda"
 required
 />
 </div>
 </div>

 {/* PASSWORD */}
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-400 ml-1">
 Kata Sandi
 </label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
 <KeyRound size={18} />
 </div>
 <input
 type={showPassword ? 'text' : 'password'}
 value={data.password}
 onChange={(e) => setData('password', e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-12 pr-12 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
 placeholder="••••••••••••"
 required
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
 title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 </div>

 {/* CAPTCHA TACTICAL */}
 <div className="p-5 bg-primary/5 rounded-lg border border-primary/10 relative overflow-hidden group">
 <div className="flex items-center justify-between relative z-10">
 <div className="space-y-1">
 <span className="text-xs font-semibold text-primary/60">
 Verifikasi Manusia
 </span>
 <div className="flex items-center gap-3">
 <span className="text-2xl font-semibold text-primary">
 {activeCaptchaQuestion}
 </span>
 <button
 type="button"
 onClick={refreshCaptcha}
 className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-transform"
 title="Muat ulang captcha"
 >
 <RefreshCw size={14} />
 </button>
 </div>
 </div>
 <div className="w-20">
 <input
 type="number"
 value={data.captcha_answer}
 onChange={(e) => setData('captcha_answer', e.target.value)}
 className="w-full bg-white border border-primary rounded-lg py-3 px-3 text-center font-semibold text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 placeholder="?"
 required
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between px-1">
 <label className="flex items-center gap-2 cursor-pointer group">
 <div className="relative">
 <input
 type="checkbox"
 checked={data.remember}
 onChange={(e) => setData('remember', e.target.checked)}
 className="sr-only peer"
 />
 <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-primary peer-checked:border-primary" />
 <CheckCircle2 className="absolute inset-0 h-5 w-5 scale-75 text-white opacity-0 transition-all peer-checked peer-checked:opacity-100" />
 </div>
 <span className="text-sm text-slate-500 transition-colors group-hover:text-slate-700">Ingat Saya</span>
 </label>
 <Link href={route('password.request')} className="text-sm text-primary hover:underline underline-offset-4">
 Lupa Sandi?
 </Link>
 </div>

 <button
 type="submit"
 disabled={processing}
 className="flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-primary px-4 py-4 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
 >
 {processing ? (
 <RefreshCw className="h-5 w-5" />
 ) : (
 <>
 <ShieldCheck className="h-5 w-5 transition-transform" />
 <span>Verifikasi dan Masuk</span>
 </>
 )}
 </button>
 </form>
 </GuestLayout>
 );
}
