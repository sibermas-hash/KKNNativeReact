'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { setAuthToken, useAuthStore } from '@/stores';
import { dashboardPathForRoles } from '@/lib/auth-routing';

interface VerifyResponse { token?: string; user?: { roles?: string[] } }

export default function TwoFactorLoginPage(): React.JSX.Element {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('sibermas_2fa_challenge') || '';
    setChallenge(token);
    if (!token) router.replace('/login');
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const otp = code.trim().replace(/\s+/g, '');
    if (!otp || otp.length < 6) {
      toast.error('Masukkan kode 2FA');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa-verify', { challenge_token: challenge, code: otp }) as VerifyResponse;
      if (res.token) setAuthToken(res.token);
      if (res.user) setUser(res.user as Parameters<typeof setUser>[0]);
      sessionStorage.removeItem('sibermas_2fa_challenge');
      toast.success('Verifikasi berhasil');
      router.replace(dashboardPathForRoles(res.user?.roles));
    } catch {
      toast.error('Kode 2FA salah atau kedaluwarsa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">SIBERMAS</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Verifikasi 2FA</h1>
          <p className="mt-2 text-sm text-slate-500">Masukkan kode autentikator atau recovery code.</p>
        </div>
        <div>
          <label htmlFor="code" className="text-xs font-black uppercase text-slate-500">Kode</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-bold tracking-widest outline-none focus:border-emerald-500"
            placeholder="123456"
            autoFocus
          />
        </div>
        <button disabled={loading || !challenge} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase text-white hover:bg-emerald-700 disabled:opacity-50">
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>
        <button type="button" onClick={() => router.replace('/login')} className="w-full text-sm font-bold text-slate-500 hover:text-slate-800">
          Kembali ke login
        </button>
      </form>
    </main>
  );
}
