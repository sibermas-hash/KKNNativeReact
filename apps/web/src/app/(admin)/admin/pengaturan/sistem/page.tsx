'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Settings, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';

const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA PENDAFTARAN';

export default function SystemSettingsPage(): React.JSX.Element {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [softMode, setSoftMode] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminApi.settings.index();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      adminApi.settings.resetPendaftaran({
        confirmation: CONFIRMATION_PHRASE,
        soft: softMode,
      }),
    onSuccess: () => {
      toast.success('Reset dijadwalkan. Cek audit log untuk konfirmasi.');
      setShowConfirm(false);
      setConfirmationInput('');
      // Informasi ke operator — mereka perlu re-login sekitar 1 menit
      // setelah job selesai kalau soft=false (semua token lain di-truncate).
      toast.message('Anda akan tetap ter-login. Operator lain akan perlu login ulang.', {
        duration: 8000,
      });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Reset gagal. Lihat log server.';
      toast.error(message);
    },
  });

  const settings = (data?.settings as Record<string, unknown> | undefined) ?? {};
  const entries = Object.entries(settings).slice(0, 20);
  const confirmationMatches = confirmationInput.trim() === CONFIRMATION_PHRASE;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Pengaturan Sistem" subtitle="Konfigurasi umum sistem KKN" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Settings size={40} />}
          title="Belum ada pengaturan"
          description="Tidak ada konfigurasi sistem yang tersedia."
        />
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-700 uppercase tracking-wide">
            Pengaturan Umum
          </h2>
          <div className="space-y-0">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{key}</p>
                  <p className="text-xs text-slate-500">{String(value || '-')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona Bahaya — Reset Pendaftaran */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-rose-900 uppercase tracking-wide">
              Zona Bahaya
            </h2>
            <p className="mt-1 text-sm text-rose-700">
              Reset data pendaftaran KKN. Semua data peserta, kelompok, kegiatan, laporan,
              dan nilai akan dihapus permanen. Data master (user, fakultas, prodi, lokasi)
              tetap aman.
            </p>
            <p className="mt-2 text-xs font-bold text-rose-800">
              Operasi ini dijadwalkan ke queue dan berjalan di background. Cek audit log
              untuk konfirmasi.
            </p>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-colors"
              >
                <RefreshCw size={14} /> Reset Pendaftaran
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white p-4 border border-rose-300">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={softMode}
                      onChange={(e) => setSoftMode(e.target.checked)}
                      className="mt-0.5 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Mode Soft (rekomendasi untuk simulasi ringan)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hanya reset queue pendaftaran, slot lock, dan history. Data
                        kelompok dan peserta TETAP ada.
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1.5">
                    Ketik{' '}
                    <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono">
                      {CONFIRMATION_PHRASE}
                    </code>{' '}
                    untuk mengkonfirmasi:
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={CONFIRMATION_PHRASE}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending || !confirmationMatches}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw
                      size={14}
                      className={resetMutation.isPending ? 'animate-spin' : ''}
                    />
                    {resetMutation.isPending ? 'Menjadwalkan...' : 'Ya, Reset Sekarang'}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmationInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>

                {resetMutation.isSuccess && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-2">
                      <CheckCircle2 size={14} /> Reset dijadwalkan
                    </div>
                    <p className="text-xs text-slate-600">
                      Job berjalan di background. Cek{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/admin/audit-log')}
                        className="text-emerald-700 underline font-bold"
                      >
                        audit log
                      </button>{' '}
                      untuk status.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
