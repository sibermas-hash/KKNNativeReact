'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import type { User } from '@sibermas/shared-types';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

type GoogleOtpRole = string | { name?: unknown };
type GoogleOtpUser = Omit<User, 'roles'> & { roles?: GoogleOtpRole[] | null };

function dashboardFor(user: GoogleOtpUser): string {
  const roles = Array.isArray(user.roles)
    ? user.roles
      .map((role) => (typeof role === 'string' ? role : String(role.name ?? '')))
      .filter(Boolean)
    : [];
  if (roles.some((role) => ['superadmin', 'super-admin', 'admin', 'faculty_admin', 'operator'].includes(String(role)))) return '/admin';
  if (roles.some((role) => ['lecturer', 'dosen', 'dpl'].includes(String(role)))) return '/dosen';
  if (roles.some((role) => ['student', 'mahasiswa'].includes(String(role)))) return '/mahasiswa';
  return '/';
}

export default function GoogleOtpPage(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const challenge = params?.get('challenge') ?? '';
  const { setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.trim().replace(/\D/g, '');
    if (!challenge || otp.length !== 6) { toast.error('Masukkan OTP 6 digit.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/google/otp-verify', { challenge_token: challenge, code: otp }) as { user: GoogleOtpUser };
      const normalizedUser = {
        ...res.user,
        roles: Array.isArray(res.user.roles)
          ? res.user.roles.map((role) => (typeof role === 'string' ? role : String(role.name ?? ''))).filter(Boolean)
          : [],
      } as User;
      setUser(normalizedUser);
      toast.success('Login Google berhasil.');
      router.replace(dashboardFor(normalizedUser));
    } catch {
      toast.error('OTP salah/kedaluwarsa.');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Verifikasi OTP Google</h1>
          <p className="text-sm text-slate-500 mt-1">Masukkan kode 6 digit yang dikirim ke email terdaftar.</p>
        </div>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus className="w-full h-14 rounded-xl border text-center text-2xl font-bold tracking-[0.4em]" placeholder="000000" />
        <button disabled={loading || !challenge} className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <RefreshCw size={16} className="animate-spin" />} Verifikasi {'&'} Masuk
        </button>
      </form>
    </main>
  );
}
