'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dosenApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/shared';
import { UserCheck, AlertCircle } from 'lucide-react';

export default function DaftarDplPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    periode_id: '',
    notes: '',
  });

  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['dosen', 'available-periods'],
    queryFn: async () => {
      const res = await api.get('/dosen/available-periods');
      return (res as { data?: unknown }).data ?? res;
    },
  });

  const periods = (Array.isArray(periodsData) ? periodsData : []) as Array<{ id: number; name: string; is_active?: boolean }>;

  const submitMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => dosenApi.daftarDpl(data),
    onSuccess: () => {
      toast.success('Pendaftaran DPL berhasil dikirim');
      setFormData({ periode_id: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['dosen', 'dashboard'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Gagal mendaftar sebagai DPL');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.periode_id) {
      toast.error('Periode wajib diisi');
      return;
    }
    submitMut.mutate({
      periode_id: parseInt(formData.periode_id),
      notes: formData.notes || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendaftaran DPL"
        subtitle="Daftar sebagai Dosen Pembimbing Lapangan (DPL)"
      />

      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Informasi Pendaftaran DPL</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Pendaftaran akan diverifikasi oleh admin</li>
            <li>Anda akan diberi notifikasi setelah pendaftaran disetujui</li>
            <li>Setelah disetujui, Anda dapat mengakses menu DPL</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Periode KKN <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.periode_id}
            onChange={(e) => setFormData({ ...formData, periode_id: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">Pilih periode...</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
          {periodsLoading && <p className="text-xs text-slate-400 mt-1">Memuat periode...</p>}
          <p className="text-xs text-slate-500 mt-1">Pilih periode KKN yang akan Anda bimbing</p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
            placeholder="Catatan tambahan untuk admin..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitMut.isPending || periodsLoading || periods.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <UserCheck size={16} />
            {submitMut.isPending ? 'Mengirim...' : 'Daftar Sebagai DPL'}
          </button>
        </div>
      </form>
    </div>
  );
}
