'use client';

import { useState } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@sibermas/schemas';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Send, CheckCircle2, RefreshCw, Home } from 'lucide-react';
import dynamic from 'next/dynamic';
const ParticleBackground = dynamic(
  () => import('@/components/ui/particle-background').then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await api.post('/auth/lupa-kata-sandi', data);
      setSubmitted(true);
      toast.success('Instruksi pemulihan telah dikirim!');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal memproses permintaan');
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
          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group"
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
        className="relative z-10 w-full max-w-[420px] min-w-[320px] px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Cek Email Anda</h1>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Kami telah mengirimkan tautan pemulihan kata sandi ke email Anda. Silakan periksa kotak masuk atau folder spam.
                  </p>
                </div>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-all">
                  <ArrowLeft size={16} /> Kembali ke Login
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4 flex flex-col items-center">
                  <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                    <Mail size={32} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-none uppercase">
                      Lupa <span className="text-amber-500">Sandi?</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Masukkan email untuk pemulihan akun
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Alamat Email Terdaftar</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                        <Mail size={16} />
                      </div>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                        placeholder="nama@email.com"
                        autoFocus
                      />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-widest">Kirim Instruksi</span>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-all">
                    <ArrowLeft size={14} /> Kembali ke Halaman Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
