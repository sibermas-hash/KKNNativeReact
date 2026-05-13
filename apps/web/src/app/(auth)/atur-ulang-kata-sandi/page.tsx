'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@sibermas/schemas';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Home } from 'lucide-react';
import dynamic from 'next/dynamic';
const ParticleBackground = dynamic(
  () => import('@/components/ui/particle-background').then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (token) setValue('token', token);
    if (email) setValue('email', email);
    
    if (!token || !email) {
      toast.error('Token atau email tidak valid.');
      router.replace('/login');
      return;
    }

    // Bersihkan token dari URL untuk mencegah kebocoran via browser history,
    // referrer header, atau server log. Gunakan window.location langsung
    // karena replaceState tidak trigger re-render.
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [token, email, setValue, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setServerErrors([]);
    try {
      await api.post('/auth/atur-ulang-kata-sandi', data);
      toast.success('Kata sandi berhasil diatur ulang!');
      router.replace('/login');
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error;
      setServerErrors([errorData?.message || 'Gagal mengatur ulang kata sandi.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col sm:justify-center items-center overflow-hidden font-sans selection:bg-cyan-500/30 bg-slate-950">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large Cinematic Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none">
        <ParticleBackground />
      </div>

      {/* Relocated Back to Home Button - Above Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-20 mb-4"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group"
        >
          <Home size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[440px] min-w-[320px] px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-none uppercase">
                  ATUR ULANG <span className="text-blue-500">SANDI</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Lengkapi data untuk memulihkan akun
                </p>
              </div>
            </div>

            {/* Alert */}
            {serverErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Gagal Memproses</p>
                  <div className="text-xs font-medium text-rose-900 leading-relaxed">
                    {serverErrors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...register('token')} />
              <input type="hidden" {...register('email')} />

              <div className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Kata Sandi Baru</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="Minimal 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      aria-pressed={showPassword}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
                </div>

                {/* Confirmation */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Konfirmasi Kata Sandi</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                      <RefreshCw size={16} />
                    </div>
                    <input
                      {...register('password_confirmation')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="Ulangi sandi baru"
                    />
                  </div>
                  {errors.password_confirmation && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password_confirmation.message}</p>}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-widest">Simpan Sandi Baru</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
