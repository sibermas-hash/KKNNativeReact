'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Period {
  id: number;
  name: string;
  periode: number;
  start_date: string;
  end_date: string;
  kuota: number;
  current_phase?: string;
}

export default function PeriodsPage() {
  
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', periode: 1, start_date: '', end_date: '', kuota: 0, academic_year_id: 0, jenis_kkn_id: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'periods'],
    queryFn: async () => { const res = await adminApi.periods.index(); return res.data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.periods.store(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'periods'] }); setShowForm(false); toast.success('Periode berhasil dibuat'); },
    onError: () => toast.error('Gagal membuat periode'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.periods.destroy(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'periods'] }); toast.success('Periode berhasil dihapus'); },
  });

   const periods = (data as Period[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Periode KKN</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">+ Tambah Periode</button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Nama</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Periode (angkatan)</label><input type="number" value={form.periode} onChange={(e) => setForm({ ...form, periode: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Tanggal Mulai</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Tanggal Selesai</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Kuota</label><input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Simpan</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">Batal</button></div>
        </form>
      )}

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {periods.map((p) => (
            <div key={p.id as number} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{p.name as string}</p>
                <p className="text-sm text-slate-500">Periode {p.periode as number} | {p.start_date as string} — {p.end_date as string} | Kuota: {p.kuota as number || '-'}</p>
                <p className="text-xs text-indigo-600">{(p.current_phase as string) || 'upcoming'}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/admin/periode/${p.id}`} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Detail</a>
                <button onClick={() => { if (confirm('Hapus periode ini?')) deleteMutation.mutate(p.id as number); }} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
