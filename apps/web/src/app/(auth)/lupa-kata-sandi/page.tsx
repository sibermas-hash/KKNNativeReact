'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Home, KeyRound, Mail, RefreshCw, Send, Smartphone, UserSearch } from 'lucide-react';
import { motion } from 'framer-motion';

type Method = { type: 'whatsapp' | 'email'; label: string };
type Step = 'lookup' | 'method' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage(): React.JSX.Element {
  const [step, setStep] = useState<Step>('lookup');
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [methods, setMethods] = useState<Method[]>([]);
  const [selected, setSelected] = useState<Method | null>(null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const errMsg = (err: unknown) => {
    const e = err as { response?: { data?: { error?: { message?: string; errors?: Record<string, string[]>; details?: Record<string, string[]> } } } };
    const bag = e?.response?.data?.error?.errors || e?.response?.data?.error?.details;
    return (bag ? Object.values(bag).flat()[0] : undefined) || e?.response?.data?.error?.message || 'Terjadi kesalahan';
  };

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Masukkan NIM, email, username, atau nomor HP');
    setLoading(true);
    try {
      const res = await api.post('/auth/recovery/lookup', { identifier: identifier.trim() }) as { data?: { found?: boolean; recovery_token?: string; masked_name?: string; methods?: Method[] } };
      if (!res?.data?.found || !res.data.recovery_token || !res.data.methods?.length) {
        toast.error('Akun tidak ditemukan atau belum memiliki kontak pemulihan.');
        return;
      }
      setRecoveryToken(res.data.recovery_token);
      setMaskedName(res.data.masked_name || 'Akun SIBERMAS');
      setMethods(res.data.methods);
      setSelected(res.data.methods[0]);
      setStep('method');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    if (!selected) return toast.error('Pilih metode pemulihan');
    setLoading(true);
    try {
      const res = await api.post('/auth/recovery/send-code', { recovery_token: recoveryToken, method: selected.type }) as { data?: { channel?: string } };
      if (res?.data?.channel === 'email') {
        toast.success('Link pemulihan dikirim ke email');
        setStep('done');
      } else {
        toast.success('Kode OTP dikirim');
        setStep('otp');
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/recovery/verify-code', { recovery_token: recoveryToken, otp }) as { data?: { verification_token?: string } };
      setVerificationToken(res?.data?.verification_token || '');
      setStep('password');
      toast.success('Kode benar');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) return toast.error('Konfirmasi password tidak sama');
    setLoading(true);
    try {
      await api.post('/auth/recovery/reset-password', { recovery_token: recoveryToken, verification_token: verificationToken, password, password_confirmation: passwordConfirmation });
      setStep('done');
      toast.success('Password berhasil diubah');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep('lookup'); setRecoveryToken(''); setVerificationToken(''); setMaskedName(''); setMethods([]); setSelected(null); setOtp(''); setPassword(''); setPasswordConfirmation('');
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col sm:justify-center items-center overflow-x-hidden overflow-y-auto bg-slate-950 px-4 py-8 text-slate-900 selection:bg-cyan-500/30">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] sm:w-[900px] h-[400px] sm:h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative z-20 mb-4">
        <Link href="/" className="flex items-center gap-2 px-6 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group">
          <Home size={14} className="group-hover:-translate-x-0.5 transition-transform"/> Kembali ke Beranda Utama
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full max-w-[480px] px-1 sm:px-0">
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-7 sm:p-9 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><KeyRound size={32}/></div>
          <h1 className="text-3xl font-black uppercase text-emerald-950">Pemulihan Akun</h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">Reset password SIBERMAS</p>
        </div>

        {step === 'lookup' && <form onSubmit={lookup} className="space-y-5">
          <p className="text-sm font-medium text-slate-600">Masukkan NIM, email, username, atau nomor HP untuk mencari akun Anda.</p>
          <div className="relative"><UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18}/><input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} className="h-12 w-full rounded-xl border border-white bg-white/60 pl-12 pr-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="NIM / email / username / nomor HP" autoFocus/></div>
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50">{loading ? <RefreshCw className="animate-spin" size={18}/> : 'Cari Akun'}</button>
        </form>}

        {step === 'method' && <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Akun ditemukan</p><p className="mt-1 text-lg font-black text-emerald-950">{maskedName}</p></div>
          <p className="text-sm font-medium text-slate-600">Pilih cara menerima kode pemulihan.</p>
          <div className="space-y-2">{methods.map((m)=> <button type="button" key={m.type} onClick={()=>setSelected(m)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${selected?.type===m.type?'border-emerald-500 bg-emerald-50':'border-white bg-white/60 hover:bg-white'}`}>{m.type==='whatsapp'?<Smartphone className="text-emerald-600"/>:<Mail className="text-emerald-600"/>}<span className="text-sm font-black">{m.label}</span></button>)}</div>
          <button onClick={sendCode} disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50">{loading ? <RefreshCw className="animate-spin" size={18}/> : <><Send size={16}/> Kirim Kode</>}</button>
          <button onClick={restart} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500">Bukan akun saya</button>
        </div>}

        {step === 'otp' && <form onSubmit={verifyCode} className="space-y-5">
          <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Kode dikirim ke {selected?.label}. Berlaku 5 menit.</p>
          <input value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} className="h-14 w-full rounded-xl border border-white bg-white/60 px-4 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-emerald-500" placeholder="000000" />
          <button disabled={loading || otp.length !== 6} className="flex h-12 w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50">Verifikasi Kode</button>
          <button type="button" onClick={sendCode} className="w-full text-[10px] font-black uppercase tracking-widest text-emerald-600">Kirim ulang kode</button>
        </form>}

        {step === 'password' && <form onSubmit={resetPassword} className="space-y-4">
          <p className="text-sm font-medium text-slate-600">Kode benar. Buat kata sandi baru untuk akun Anda.</p>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-white bg-white/60 px-4 text-sm font-bold outline-none focus:border-emerald-500" placeholder="Password baru" />
          <input type="password" value={passwordConfirmation} onChange={(e)=>setPasswordConfirmation(e.target.value)} className="h-12 w-full rounded-xl border border-white bg-white/60 px-4 text-sm font-bold outline-none focus:border-emerald-500" placeholder="Konfirmasi password baru" />
          <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50">Atur Ulang Password</button>
        </form>}

        {step === 'done' && <div className="space-y-5 py-4 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={40}/></div><h2 className="text-2xl font-black uppercase text-emerald-950">Selesai</h2><p className="text-sm font-medium text-slate-600">Jika proses berhasil, silakan lanjut ke halaman login.</p><Link href="/login" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600"><ArrowLeft size={16}/> Login</Link></div>}

        {step !== 'done' && <div className="mt-7 text-center"><Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600"><ArrowLeft size={14}/> Kembali ke Login</Link></div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
