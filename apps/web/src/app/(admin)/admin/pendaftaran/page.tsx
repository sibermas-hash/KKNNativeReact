'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RegistrationsPage() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'registrations', { status, search, page }],
    queryFn: async () => { const res = await endpoints.registrations.index({ status, search, page }); return res.data as { success: boolean; data: unknown[]; meta?: Record<string, number> }; },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.registrations.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Pendaftaran disetujui'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => endpoints.registrations.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Pendaftaran ditolak'); },
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const registrations = (data?.data as Record<string, unknown>[]) || [];

  const bulkApprove = () => {
    endpoints.registrations.bulkApprove(selectedIds).then(() => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); setSelectedIds([]); toast.success(`${selectedIds.length} pendaftaran disetujui`); });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Pendaftaran KKN</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari NIM/Nama..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
        {selectedIds.length > 0 && (
          <button onClick={bulkApprove} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">✅ Setujui {selectedIds.length} Terpilih</button>
        )}
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {registrations.map((r) => {
            const mhs = r.mahasiswa as Record<string, unknown> | undefined;
            return (
              <div key={r.id as number} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
                <input type="checkbox" checked={selectedIds.includes(r.id as number)} onChange={() => setSelectedIds((prev) => prev.includes(r.id as number) ? prev.filter((i) => i !== r.id) : [...prev, r.id as number])} className="mt-1 h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{mhs?.nama as string || '-'}</p>
                      <p className="text-sm text-slate-500">NIM: {mhs?.nim as string} | {((mhs?.fakultas as Record<string, unknown>)?.nama as string) || '-'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{r.status as string}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => approveMutation.mutate(r.id as number)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">✅ Setujui</button>
                      <button onClick={() => { const reason = prompt('Alasan penolakan:'); if (reason) rejectMutation.mutate({ id: r.id as number, reason }); }} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">❌ Tolak</button>
                      <a href={`/admin/pendaftaran/${r.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">Detail →</a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
