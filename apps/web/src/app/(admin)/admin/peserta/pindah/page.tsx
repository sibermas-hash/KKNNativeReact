'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/shared';

export default function StudentTransferPage(): React.JSX.Element {
  const [pesertaId, setPesertaId] = useState<number | null>(null);
  const [targetPeriodId, setTargetPeriodId] = useState<number | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const transferMutation = useMutation({
    mutationFn: () => api.post('/admin/peserta/pindah', {
      peserta_kkn_id: pesertaId,
      target_periode_id: targetPeriodId,
      target_kelompok_id: targetGroupId || null,
      reason: reason.trim(),
    }),
    onSuccess: () => {
      toast.success('Mahasiswa berhasil dipindahkan');
      setPesertaId(null);
      setTargetPeriodId(null);
      setTargetGroupId(null);
      setReason('');
    },
    onError: () => toast.error('Gagal memindahkan mahasiswa'),
  });

  const canSubmit = Boolean(pesertaId && targetPeriodId && reason.trim().length >= 5 && !transferMutation.isPending);

  return (
    <div className="space-y-6">
      <BackButton href="/admin/peserta-kkn" label="Kembali ke Peserta" />
      <h1 className="text-2xl font-bold text-slate-800">Transfer Mahasiswa</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500 mb-4">Pindahkan mahasiswa ke periode/kelompok tujuan sesuai endpoint transfer backend.</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">ID Peserta KKN</label>
            <input type="number" value={pesertaId ?? ''} onChange={(e) => setPesertaId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ID peserta_kkn" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ID Periode Tujuan</label>
            <input type="number" value={targetPeriodId ?? ''} onChange={(e) => setTargetPeriodId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ID periode tujuan" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ID Kelompok Tujuan (opsional)</label>
            <input type="number" value={targetGroupId ?? ''} onChange={(e) => setTargetGroupId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ID kelompok_kkn tujuan" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Alasan Transfer</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Minimal 5 karakter" />
          </div>
          <button onClick={() => transferMutation.mutate()} disabled={!canSubmit} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {transferMutation.isPending ? 'Memproses...' : 'Pindahkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
