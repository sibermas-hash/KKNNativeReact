'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, AlertCircle, Copy, Check, RefreshCw, Key } from 'lucide-react';

type Status = {
  enabled: boolean;
  required: boolean;
  has_pending_setup: boolean;
  confirmed_at: string | null;
  has_recovery_codes: boolean;
};

type SetupResponse = {
  secret: string;
  qr_svg: string;
  otpauth_url: string;
  issuer: string;
  account: string;
};

export function TwoFactorCard() {
  const qc = useQueryClient();
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['2fa', 'status'],
    queryFn: async () => {
      const res = await api.get('/2fa/status');
      return ((res as unknown as { data?: Status })?.data ?? res) as Status;
    },
  });

  const setupMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/2fa/setup');
      return ((res as unknown as { data?: SetupResponse })?.data ?? res) as SetupResponse;
    },
    onSuccess: (data) => {
      setSetupData(data);
      toast.success('Scan QR code dengan aplikasi authenticator');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal memulai setup');
    },
  });

  const confirmMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/2fa/confirm', { code: confirmCode });
      return ((res as unknown as { data?: { enabled: boolean; recovery_codes: string[] } })?.data ?? res) as { enabled: boolean; recovery_codes: string[] };
    },
    onSuccess: (data) => {
      setRecoveryCodes(data.recovery_codes);
      setSetupData(null);
      setConfirmCode('');
      qc.invalidateQueries({ queryKey: ['2fa'] });
      toast.success('2FA aktif! Simpan backup codes di tempat aman.');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Kode tidak valid');
    },
  });

  const disableMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/2fa/disable', { password: disablePassword, code: disableCode });
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    onSuccess: () => {
      setShowDisable(false);
      setDisablePassword('');
      setDisableCode('');
      qc.invalidateQueries({ queryKey: ['2fa'] });
      toast.success('2FA dinonaktifkan.');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal menonaktifkan 2FA');
    },
  });

  const regenMut = useMutation({
    mutationFn: async () => {
      const code = prompt('Masukkan kode 6-digit TOTP saat ini untuk regenerate backup codes:');
      if (!code) throw new Error('cancelled');
      const res = await api.post('/2fa/regenerate-recovery', { code });
      return ((res as unknown as { data?: { recovery_codes: string[] } })?.data ?? res) as { recovery_codes: string[] };
    },
    onSuccess: (data) => {
      setRecoveryCodes(data.recovery_codes);
      toast.success('Backup codes diperbarui');
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === 'cancelled') return;
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal regenerate');
    },
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
  if (!status) return null;

  const copySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success('Backup codes disalin');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <header className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${status.enabled ? 'bg-emerald-50' : 'bg-slate-100'}`}>
          {status.enabled ? <ShieldCheck size={20} className="text-emerald-600" /> : <Shield size={20} className="text-slate-500" />}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-900">Autentikasi Dua Faktor (2FA)</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tingkatkan keamanan akun dengan kode 6-digit dari aplikasi authenticator (Google Authenticator, Authy, dll).
          </p>
          {status.required && !status.enabled && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span><strong>2FA wajib</strong> untuk role Anda (admin/DPL). Silakan aktifkan segera.</span>
            </div>
          )}
        </div>
      </header>

      {/* Recovery codes display (one-time) */}
      {recoveryCodes && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Key size={14} /> Backup Codes — SIMPAN SEKARANG
            </h3>
            <button onClick={copyCodes} className="rounded bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300">
              <Copy size={12} className="inline mr-1" /> Copy
            </button>
          </div>
          <p className="text-xs text-amber-800">
            Gunakan salah satu code berikut jika aplikasi authenticator Anda hilang. Setiap code hanya bisa dipakai <strong>sekali</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((c) => (
              <div key={c} className="rounded bg-white p-2 text-amber-900 border border-amber-200">{c}</div>
            ))}
          </div>
          <button onClick={() => setRecoveryCodes(null)}
            className="w-full rounded bg-amber-900 py-1.5 text-xs font-bold text-white hover:bg-amber-800">
            Saya sudah menyimpan — Tutup
          </button>
        </div>
      )}

      {/* Setup flow — QR code + confirmation */}
      {setupData && !recoveryCodes && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h3 className="text-sm font-bold">Langkah 1 — Scan QR Code</h3>
          <div className="flex flex-col items-center">
            <img src={setupData.qr_svg} alt="2FA QR Code" className="w-48 h-48 border border-slate-300 bg-white rounded-lg" />
            <p className="mt-2 text-[10px] text-slate-500">Atau input manual:</p>
            <div className="flex items-center gap-1 mt-1">
              <code className="rounded bg-white px-2 py-1 text-xs font-mono text-slate-700 border border-slate-300">{setupData.secret}</code>
              <button onClick={copySecret} className="rounded p-1.5 hover:bg-slate-200" title="Copy">
                {copiedSecret ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-1">Langkah 2 — Masukkan kode dari aplikasi</h3>
            <input type="text" value={confirmCode} onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" maxLength={6}
              className="w-full h-11 rounded-lg border border-slate-300 px-3 text-center text-lg font-mono tracking-widest" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirmMut.mutate()} disabled={confirmCode.length !== 6 || confirmMut.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {confirmMut.isPending ? 'Memverifikasi...' : 'Aktifkan 2FA'}
            </button>
            <button onClick={() => { setSetupData(null); setConfirmCode(''); }}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main action */}
      {!setupData && !recoveryCodes && (
        <>
          {status.enabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <ShieldCheck size={14} />
                <span>2FA aktif sejak {status.confirmed_at ? new Date(status.confirmed_at).toLocaleDateString('id-ID') : 'baru saja'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => regenMut.mutate()} disabled={regenMut.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  <RefreshCw size={12} /> Regenerate Backup Codes
                </button>
                {!status.required && (
                  <button onClick={() => setShowDisable(!showDisable)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    <ShieldOff size={12} /> Nonaktifkan 2FA
                  </button>
                )}
              </div>
              {showDisable && !status.required && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-2">
                  <p className="text-xs text-rose-800 font-semibold">Konfirmasi untuk menonaktifkan 2FA</p>
                  <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Password Anda"
                    className="w-full h-9 rounded-lg border border-rose-200 px-3 text-sm" />
                  <input type="text" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Kode TOTP 6-digit" maxLength={6}
                    className="w-full h-9 rounded-lg border border-rose-200 px-3 text-sm font-mono tracking-widest" />
                  <button onClick={() => disableMut.mutate()} disabled={!disablePassword || disableCode.length !== 6 || disableMut.isPending}
                    className="w-full rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                    Nonaktifkan 2FA
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setupMut.mutate()} disabled={setupMut.isPending}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {setupMut.isPending ? 'Memulai setup...' : 'Aktifkan 2FA Sekarang'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
