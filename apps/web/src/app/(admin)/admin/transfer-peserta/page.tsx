'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { BackButton, PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { ArrowRightLeft, Search, Users } from 'lucide-react';

type Peserta = {
  id: number;
  status: string;
  mahasiswa?: { nama?: string; nim?: string; prodi?: { nama?: string } };
  periode?: { id: number; name?: string; periode?: number; jenis_kkn?: { name?: string } };
  kelompok?: { id: number; code?: string; nama_kelompok?: string };
};

type PeriodeOption = { id: number; name: string; periode: number; jenis_kkn?: { id: number; name: string; requires_interview?: boolean } };

export default function TransferPesertaPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [angkatan, setAngkatan] = useState('58');
  const [transferTarget, setTransferTarget] = useState<Peserta | null>(null);
  const [targetPeriodeId, setTargetPeriodeId] = useState('');

  // Fetch peserta yang bisa di-transfer (interview_failed + approved yang mau dipindah)
  const { data, isLoading } = useQuery<{ data: Peserta[] }>({
    queryKey: ['admin', 'transfer-peserta', search, angkatan],
    queryFn: async () => {
      const res = await rawApi.get('/admin/transfer-peserta', {
        params: { search: search || undefined, angkatan: angkatan || undefined },
      });
      return ((res.data as { data?: unknown }).data ?? res.data) as { data: Peserta[] };
    },
  });

  // Fetch available periodes for transfer target (non-interview ones)
  const { data: periodesData } = useQuery<PeriodeOption[]>({
    queryKey: ['admin', 'transfer-periodes', angkatan],
    queryFn: async () => {
      const res = await rawApi.get('/admin/transfer-peserta/periodes', { params: { angkatan: angkatan || undefined } });
      return ((res.data as { data?: unknown }).data ?? res.data) as PeriodeOption[];
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ pesertaId, periodeId }: { pesertaId: number; periodeId: number }) => {
      await rawApi.post('/admin/transfer-peserta', { peserta_kkn_id: pesertaId, target_periode_id: periodeId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'transfer-peserta'] });
      toast.success('Peserta berhasil dipindahkan');
      setTransferTarget(null);
      setTargetPeriodeId('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memindahkan';
      toast.error(msg);
    },
  });

  const peserta = data?.data ?? [];
  const periodes = periodesData ?? [];

  return (
    <div className="space-y-6">
      <BackButton href="/admin/peserta-kkn" label="Kembali ke Peserta" />
      <PageHeader title="Transfer Peserta" subtitle="Pindahkan peserta gagal wawancara ke jenis KKN non-wawancara dengan aman." />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari NIM/Nama..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
        </div>
        <select value={angkatan} onChange={e => setAngkatan(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="58">Angkatan 58</option>
          <option value="59">Angkatan 59</option>
          <option value="">Semua</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : peserta.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada peserta yang perlu dipindahkan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">NIM</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Prodi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Jenis KKN Asal</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peserta.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.mahasiswa?.nim ?? '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.mahasiswa?.nama ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.mahasiswa?.prodi?.nama ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.periode?.jenis_kkn?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === 'interview_failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status === 'interview_failed' ? 'Gagal Wawancara' : p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setTransferTarget(p)} className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100">
                      <ArrowRightLeft size={12} /> Pindah
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfer Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Transfer Peserta</h3>
            <p className="mt-1 text-sm text-slate-600">{transferTarget.mahasiswa?.nama} ({transferTarget.mahasiswa?.nim})</p>
            <p className="text-xs text-slate-400">Dari: {transferTarget.periode?.jenis_kkn?.name}</p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-600 mb-1">Pindah ke Jenis KKN:</label>
              <select value={targetPeriodeId} onChange={e => setTargetPeriodeId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
                <option value="">Pilih tujuan...</option>
                {periodes.filter(p => p.id !== transferTarget.periode?.id).map(p => (
                  <option key={p.id} value={p.id}>{p.jenis_kkn?.name ?? p.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setTransferTarget(null); setTargetPeriodeId(''); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => transferMutation.mutate({ pesertaId: transferTarget.id, periodeId: Number(targetPeriodeId) })} disabled={!targetPeriodeId || transferMutation.isPending} className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
