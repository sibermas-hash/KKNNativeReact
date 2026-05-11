'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentTransferPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [pesertaId, setPesertaId] = useState<number | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);

  const transferMutation = useMutation({
    mutationFn: () => api.post('/admin/peserta/pindah', { peserta_kkn_id: pesertaId, target_kelompok_id: targetGroupId }),
    onSuccess: () => { toast.success('Mahasiswa berhasil dipindahkan'); setPesertaId(null); setTargetGroupId(null); },
    onError: () => toast.error('Gagal memindahkan mahasiswa'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Transfer Mahasiswa</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500 mb-4">Pindahkan mahasiswa dari satu kelompok ke kelompok lain dalam periode yang sama.</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">ID Peserta KKN</label>
            <input type="number" value={pesertaId ?? ''} onChange={(e) => setPesertaId(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ID peserta_kkn" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ID Kelompok Tujuan</label>
            <input type="number" value={targetGroupId ?? ''} onChange={(e) => setTargetGroupId(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ID kelompok_kkn tujuan" />
          </div>
          <button onClick={() => transferMutation.mutate()} disabled={!pesertaId || !targetGroupId || transferMutation.isPending} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {transferMutation.isPending ? 'Memproses...' : 'Pindahkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
