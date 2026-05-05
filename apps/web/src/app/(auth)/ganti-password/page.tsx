'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormData } from '@sibermas/schemas';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { ParticleBackground } from '@/components/ui/particle-background';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setServerErrors([]);
    try {
      const result = await api.patch('/profile/password', data) as { success: boolean; message: string };
      if (result.success) {
        toast.success('Kata sandi berhasil diperbarui!');
        router.replace('/'); // Redirect to dashboard, middleware will handle role-based routing
      }
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      if (err.response?.status === 422 && errorData?.errors) {
        Object.entries(errorData.errors).forEach(([field, messages]: [string, any]) => {
          setError(field as keyof ChangePasswordFormData, { message: messages[0] });
        });
      } else {
        setServerErrors([errorData?.message || 'Terjadi kesalahan sistem.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col sm:justify-center items-center overflow-hidden font-sans selection:bg-cyan-500/30 bg-slate-950">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none">
        <ParticleBackground />
      </div>

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] min-w-[320px] px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-none">
                  PEMBARUAN <span className="text-sky-500">SANDI</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Wajib Dilakukan Saat Login Pertama Kali
                </p>
              </div>
            </div>

            {/* Alert */}
            {serverErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Gagal Memperbarui</p>
                  <div className="text-xs font-medium text-rose-900 leading-relaxed">
                    {serverErrors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kata Sandi Lama</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      {...register('current_password')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                      placeholder="Masukkan sandi lama"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.current_password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.current_password.message}</p>}
                </div>

                <div className="h-px bg-slate-100 mx-2" />

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Kata Sandi Baru</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <ShieldCheck size={16} />
                    </div>
                    <input
                      {...register('password')}
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                      placeholder="Minimal 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
                </div>

                {/* Confirmation */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Konfirmasi Kata Sandi</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors">
                      <RefreshCw size={16} />
                    </div>
                    <input
                      {...register('password_confirmation')}
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
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
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 group transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-widest">Perbarui & Masuk</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            LPPM UIN Saizu Purwokerto
          </p>
        </div>
      </motion.div>
    </div>
  );
}
