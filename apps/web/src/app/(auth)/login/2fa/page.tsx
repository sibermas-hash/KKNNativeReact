'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuthToken, setPasswordChangedCookie, useAuthStore } from '@/stores';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Key } from 'lucide-react';
import type { User } from '@sibermas/shared-types';

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('sibermas_2fa_challenge');
    if (!token) {
      router.replace('/login');
      return;
    }
    setChallenge(token);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.post('/auth/2fa-verify', {
        challenge_token: challenge,
        code: code.trim(),
      }) as { user: User; token?: string; recovery_code_used?: boolean };

      if (result?.user) {
        sessionStorage.removeItem('sibermas_2fa_challenge');
        if (result.token) setAuthToken(result.token);
        setPasswordChangedCookie(result.user.password_changed_at ?? null);
        setUser(result.user);

        if (result.recovery_code_used) {
          toast.warning('Anda login dengan backup code. Segera regenerate di pengaturan keamanan!');
        } else {
          toast.success('Login berhasil!');
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const code = e?.response?.data?.error?.code;
      if (code === 'TWO_FACTOR_CHALLENGE_EXPIRED') {
        setCode('');
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Shield size={24} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Verifikasi 2FA</h1>
            <p className="mt-1 text-sm text-slate-500">
              {useRecovery
                ? 'Masukkan salah satu backup code yang Anda simpan saat setup 2FA.'
                : 'Masukkan kode 6-digit dari aplikasi authenticator Anda.'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <input
              ref={inputRef}
              type="text"
              inputMode={useRecovery ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                const v = useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(v);
              }}
              maxLength={useRecovery ? 9 : 6}
              placeholder={useRecovery ? 'XXXX-XXXX' : '123456'}
              className="w-full h-14 rounded-xl border border-slate-300 bg-slate-50 px-4 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={code.length < (useRecovery ? 9 : 6) || loading}
            className="w-full h-11 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={12} /> Kembali ke login
            </button>
            <button
              type="button"
              onClick={() => { setUseRecovery(!useRecovery); setCode(''); setError(null); }}
              className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold"
            >
              <Key size={12} /> {useRecovery ? 'Gunakan kode TOTP' : 'Gunakan backup code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
