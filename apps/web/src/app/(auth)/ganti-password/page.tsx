'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, authApi } from '@/lib/api';
import { resetAuthState, useAuthStore } from '@/stores';
import type { User } from '@sibermas/shared-types';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const ParticleBackground = dynamic(
  () => import('@/components/ui/particle-background').then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);
import { motion } from 'framer-motion';

function dashboardPathFor(roles: string[]) {
  if (roles.some((role) => ['superadmin', 'admin', 'faculty_admin'].includes(role))) return '/admin';
  if (roles.some((role) => ['dosen', 'dpl'].includes(role))) return '/dosen';
  if (roles.includes('student')) return '/mahasiswa';
  return '/';
}

function maskPassword(value: string) {
  if (value.length <= 5) return `${value.slice(0, 1)}${'x'.repeat(Math.max(0, value.length - 2))}${value.slice(-1)}`;
  return `${value.slice(0, 3)}${'x'.repeat(Math.max(0, value.length - 5))}${value.slice(-2)}`;
}

export default function ChangePasswordPage(): React.JSX.Element {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);
  const [maskedPassword, setMaskedPassword] = useState('');
  const [successRedirectPath, setSuccessRedirectPath] = useState('/profil');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await authApi.user() as unknown as User | null;
        if (user && typeof user === 'object' && 'id' in user) {
          const u = user as User & { password_changed_at?: string | null };
          setIsFirstLogin(!!u.must_change_password || !u.password_changed_at);
        } else {
          resetAuthState();
          router.replace('/login');
        }
      } catch {
        resetAuthState();
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerErrors([]);

    // Client-side validation — simple like old codebase
    if (password.length < 8) {
      setFieldErrors({ password: 'Kata sandi minimal 8 karakter' });
      return;
    }
    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }
    if (!isFirstLogin && !currentPassword) {
      setFieldErrors({ current_password: 'Kata sandi saat ini wajib diisi' });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        password,
        password_confirmation: passwordConfirmation,
      };
      if (!isFirstLogin) {
        payload.current_password = currentPassword;
      }

      const result = await api.post('/profile/password', payload) as { user?: User } | null;
      const masked = maskPassword(password);
      setMaskedPassword(masked);
      toast.success(`Selamat, password berhasil diubah: ${masked}`);

      // Backend returns user data + new cookie — no need to re-fetch
      const freshUser = (result?.user ?? null) as User | null;
      if (freshUser && typeof freshUser === 'object' && 'id' in freshUser) {
        setUser(freshUser);
      }

      const redirectPath = (isFirstLogin || !freshUser?.profile_complete) ? '/profil' : dashboardPathFor(freshUser?.roles ?? []);
      setSuccessRedirectPath(redirectPath);
      setSuccess(true);
      setTimeout(() => router.replace(redirectPath), 3500);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { errors?: Record<string, string[]>; message?: string } } } };
      const errorData = e.response?.data?.error;

      if (e.response?.status === 422 && errorData?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(errorData.errors).forEach(([field, messages]) => {
          errs[field] = messages[0];
        });
        setFieldErrors(errs);
        if (Object.keys(errs).length === 0 && errorData.message) {
          setServerErrors([errorData.message]);
        }
      } else if (e.response?.status === 401) {
        setServerErrors(['Sesi berakhir. Silakan login kembali.']);
        setTimeout(() => { resetAuthState(); router.replace('/login'); }, 2000);
      } else {
        setServerErrors([errorData?.message || 'Terjadi kesalahan sistem.']);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col sm:justify-center items-center overflow-x-hidden overflow-y-auto font-sans selection:bg-cyan-500/30 bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] sm:w-[900px] h-[400px] sm:h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none">
        <ParticleBackground />
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="w-full max-w-md rounded-2xl sm:rounded-[2rem] border border-white/70 bg-white p-6 sm:p-8 text-center shadow-[0_24px_80px_rgba(16,185,129,0.28)]"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={44} strokeWidth={2.6} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-950">Berhasil</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              Selamat, password berhasil diubah menjadi <span className="font-black text-emerald-700">{maskedPassword}</span>.
              <br />Sistem akan mengarahkan Anda ke halaman profil.
            </p>
            <button
              type="button"
              onClick={() => {
                router.replace(successRedirectPath);
              }}
              className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-700"
            >
              Lanjutkan
            </button>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] px-4 py-8 sm:px-6 sm:py-12"
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
                  GANTI KATA SANDI
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {isFirstLogin ? 'Wajib dilakukan saat login pertama' : 'Perbarui kata sandi Anda'}
                </p>
              </div>
            </div>

            {/* Alert */}
            {isFirstLogin && serverErrors.length === 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Akses Diblokir</p>
                  <p className="text-xs font-medium text-rose-900 leading-relaxed">
                    Anda wajib mengganti kata sandi default sebelum dapat mengakses portal <span className="text-sky-600">SIBER</span><span className="text-emerald-600">MAS</span>.
                  </p>
                </div>
              </div>
            )}

            {serverErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs font-medium text-rose-900 leading-relaxed">
                  {serverErrors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              </div>
            )}

            {/* Form — simple like old codebase */}
            <form onSubmit={onSubmit} className="space-y-5">
              {!isFirstLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Kata Sandi Saat Ini</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"><Lock size={16} /></div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                      placeholder="Masukkan sandi saat ini"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600">
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.current_password && <p className="text-[10px] font-bold text-rose-500 ml-1">{fieldErrors.current_password}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Kata Sandi Baru</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"><ShieldCheck size={16} /></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Min. 8 karakter, huruf besar & kecil, angka, simbol"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 ml-1 leading-relaxed">
                  Minimal 8 karakter dengan kombinasi <span className="font-bold text-emerald-700">huruf besar</span>, <span className="font-bold text-emerald-700">huruf kecil</span>, <span className="font-bold text-emerald-700">angka</span>, dan <span className="font-bold text-emerald-700">simbol</span>.
                </p>
                {fieldErrors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Konfirmasi Kata Sandi</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"><RefreshCw size={16} /></div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full h-12 bg-white/60 border border-white focus:bg-white rounded-xl pl-[3.2rem] pr-11 text-sm font-bold text-emerald-950 placeholder:text-emerald-800/40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Ulangi sandi baru"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password_confirmation && <p className="text-[10px] font-bold text-rose-500 ml-1">{fieldErrors.password_confirmation}</p>}
              </div>

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
                      <span className="text-[11px] font-bold uppercase tracking-widest">Simpan &amp; Lanjutkan</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-[10px] text-slate-400 leading-relaxed">
              Setelah mengganti kata sandi, Anda akan diarahkan ke halaman profil untuk melengkapi data.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
