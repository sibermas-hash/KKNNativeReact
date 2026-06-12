'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { BackButton, PageHeader } from '@/components/ui/shared';

type Config = { id: number; komponen?: string; name?: string; bobot?: number; weight?: number; deskripsi?: string; description?: string };

function unwrapConfigs(res: unknown): Config[] {
  const root = res as { data?: unknown };
  const data = root?.data ?? res;
  if (Array.isArray(data)) return data as Config[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) return (data as { data: Config[] }).data;
  return [];
}

export default function PengaturanPenilaianPage(): React.JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'konfigurasi-penilaian'],
    queryFn: async () => unwrapConfigs(await adminApi.grades.konfigurasi()),
  });

  const updateMutation = useMutation({
    mutationFn: (configs: Config[]) => adminApi.grades.updateKonfigurasi({ configs }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'konfigurasi-penilaian'] }); toast.success('Konfigurasi penilaian disimpan'); },
    onError: () => toast.error('Gagal menyimpan konfigurasi penilaian'),
  });

  const configs = data ?? [];
  const total = configs.reduce((sum, c) => sum + Number(c.bobot ?? c.weight ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <BackButton href="/admin/dashboard" label="Kembali ke Dashboard" />
      <PageHeader title="Pengaturan Penilaian" subtitle="Audit bobot komponen nilai KKN. Perubahan hanya untuk superadmin." />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Gagal memuat konfigurasi penilaian.</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-900">Komponen Nilai</p>
              <p className={`text-xs font-bold ${total === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>Total bobot: {total}%</p>
            </div>
            <button
              onClick={() => updateMutation.mutate(configs)}
              disabled={updateMutation.isPending || total !== 100}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Simpan Validasi
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {configs.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-slate-500">Belum ada konfigurasi penilaian.</p>
            ) : configs.map((c) => (
              <div key={c.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_120px] sm:items-center">
                <div>
                  <p className="font-black text-slate-900">{c.komponen ?? c.name ?? `Komponen #${c.id}`}</p>
                  <p className="text-xs text-slate-500">{c.deskripsi ?? c.description ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-800">
                  {Number(c.bobot ?? c.weight ?? 0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
