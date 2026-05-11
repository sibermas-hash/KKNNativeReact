'use client';

export const dynamic = 'force-dynamic';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { PageHeader } from '@/components/ui/shared';
import { Database, ShieldAlert, Play, Clock, CheckCircle2, XCircle } from 'lucide-react';

type SyncType = 'all' | 'mahasiswa' | 'dosen' | 'fakultas' | 'program';

interface BackupResponse {
  artisan_output?: string;
  keep_days?: number;
}

interface SyncResponse {
  backup?: {
    exit_code: number;
    output: string;
  };
  sync?: {
    exit_code: number;
    output: string;
    type: string;
    delta: boolean;
    source: string;
  };
}

export default function SinkronSiakadPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const isSuperadmin = (user?.roles ?? []).includes('superadmin');

  const [type, setType] = useState<SyncType>('all');
  const [delta, setDelta] = useState(true);
  const [keepDays, setKeepDays] = useState(7);
  const [lastBackup, setLastBackup] = useState<BackupResponse | null>(null);
  const [lastSync, setLastSync] = useState<SyncResponse | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const backupOnly = useMutation({
    mutationFn: () => adminApi.siakadSync.backup({ keep_days: keepDays }) as unknown as Promise<{ data: BackupResponse }>,
    onSuccess: (res) => {
      const payload = (res?.data ?? res) as BackupResponse;
      setLastBackup(payload);
      setLastSync(null);
      setLastRunAt(new Date().toISOString());
      toast.success('Backup database berhasil.');
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, 'Backup database gagal.');
      toast.error(message);
    },
  });

  const runWithBackup = useMutation({
    mutationFn: () =>
      adminApi.siakadSync.runWithBackup({
        type: type,
        delta: delta,
        source: 'api',
        keep_days: keepDays,
      }) as unknown as Promise<{ data: SyncResponse }>,
    onSuccess: (res) => {
      const payload = (res?.data ?? res) as SyncResponse;
      setLastSync(payload);
      setLastBackup({ artisan_output: payload.backup?.output, keep_days: keepDays });
      setLastRunAt(new Date().toISOString());
      toast.success('Backup + sinkron SIAKAD selesai.');
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, 'Sinkronisasi SIAKAD gagal.');
      toast.error(message);
    },
  });

  // Gate: only superadmin. Non-superadmin admins get a friendly notice.
  if (!isSuperadmin) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Akses khusus superadmin.</p>
            <p className="text-xs mt-1">
              Tindakan backup &amp; sinkronisasi ke SIAKAD hanya dapat dilakukan oleh superadmin
              karena memengaruhi seluruh data mahasiswa dan dosen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const anyRunning = backupOnly.isPending || runWithBackup.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinkronisasi SIAKAD"
        subtitle="Tarik data terbaru dari SIAKAD. Backup database otomatis dilakukan sebelum sinkronisasi."
      />

      {/* Warning banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">Perlu diketahui sebelum menjalankan:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>Data mahasiswa yang sudah pernah KKN <strong>tidak akan ditimpa</strong> oleh sinkronisasi.</li>
              <li>Field yang sudah diedit/approve (NIK, tanggal lahir, dll.) <strong>dikunci</strong> dan tetap dipertahankan.</li>
              <li>Mahasiswa program S2/S3/Pascasarjana <strong>difilter otomatis</strong> (bukan peserta KKN).</li>
              <li>Backup database dibuat <strong>sebelum</strong> sinkronisasi — aman untuk restore jika terjadi masalah.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800">Konfigurasi Sinkronisasi</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Cakupan data</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SyncType)}
                disabled={anyRunning}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="all">Semua (fakultas, prodi, mahasiswa, dosen)</option>
                <option value="mahasiswa">Mahasiswa saja</option>
                <option value="dosen">Dosen saja</option>
                <option value="fakultas">Fakultas saja</option>
                <option value="program">Prodi saja</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Retensi backup (hari)</span>
              <input
                type="number"
                min={1}
                max={365}
                value={keepDays}
                disabled={anyRunning}
                onChange={(e) => setKeepDays(Math.max(1, Math.min(365, Number(e.target.value) || 7)))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                File backup lebih lama dari {keepDays} hari akan dihapus otomatis.
              </span>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={delta}
              disabled={anyRunning}
              onChange={(e) => setDelta(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              <span className="font-semibold">Delta sync</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Hanya tarik perubahan sejak sinkronisasi terakhir. Lebih cepat. Matikan untuk full sync
                (ambil ulang semua record — gunakan saat migrasi atau mencurigai data hilang).
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => runWithBackup.mutate()}
              disabled={anyRunning}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={15} className={runWithBackup.isPending ? 'animate-pulse' : ''} />
              {runWithBackup.isPending ? 'Menjalankan…' : 'Backup + Sinkron SIAKAD'}
            </button>

            <button
              onClick={() => backupOnly.mutate()}
              disabled={anyRunning}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Database size={15} className={backupOnly.isPending ? 'animate-pulse' : ''} />
              {backupOnly.isPending ? 'Membackup…' : 'Backup DB Saja'}
            </button>

            {anyRunning && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={13} className="animate-spin" />
                Proses di server — jangan tutup tab
              </span>
            )}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Status Terakhir</h3>
          {lastRunAt ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={12} />
                {new Date(lastRunAt).toLocaleString('id-ID')}
              </div>

              {lastSync?.sync && (
                <div className={`rounded-xl border p-3 text-xs ${
                  lastSync.sync.exit_code === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {lastSync.sync.exit_code === 0 ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    Sinkron {lastSync.sync.type} ({lastSync.sync.delta ? 'delta' : 'full'})
                  </div>
                  <div className="mt-1 text-slate-600">
                    exit code: {lastSync.sync.exit_code}
                  </div>
                </div>
              )}

              {lastBackup && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Database size={13} />
                    Backup DB
                  </div>
                  <div className="mt-1 text-slate-500">
                    Retensi: {lastBackup.keep_days} hari
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">Belum ada tindakan yang dijalankan di sesi ini.</p>
          )}
        </div>
      </div>

      {/* Output panel */}
      {(lastBackup?.artisan_output || lastSync?.sync?.output) && (
        <div className="rounded-2xl bg-slate-900 p-5 text-slate-100">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Output Perintah</h3>
          <pre className="max-h-96 overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-slate-300">
{lastSync?.backup?.output ? `=== BACKUP ===\n${lastSync.backup.output}\n` : lastBackup?.artisan_output ? `=== BACKUP ===\n${lastBackup.artisan_output}\n` : ''}
{lastSync?.sync?.output ? `\n=== SYNC ===\n${lastSync.sync.output}` : ''}
          </pre>
        </div>
      )}
    </div>
  );
}

function extractErrorMessage(err: unknown, fallback: string): string {
  // Axios error shape: err.response.data.error.message
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: { message?: string }; message?: string } } }).response;
    const msg = resp?.data?.error?.message ?? resp?.data?.message;
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
