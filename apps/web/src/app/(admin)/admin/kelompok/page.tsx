'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'groups', { page }],
    queryFn: async () => { const res = await endpoints.groups.index({ page }); return res.data as { success: boolean; data: unknown[]; meta?: Record<string, number> }; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => endpoints.groups.destroy(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] }); toast.success('Kelompok berhasil dihapus'); },
    onError: () => toast.error('Gagal menghapus kelompok'),
  });

  const groups = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Kelompok KKN</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id as number} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{g.nama_kelompok as string} ({g.code as string})</p>
                <p className="text-sm text-slate-500">{((g.lokasi as Record<string, unknown>)?.village_name as string) || '-'} | Anggota: {g.peserta_count as number || 0}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/admin/kelompok/${g.id}`} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Detail</a>
                <button onClick={() => { if (confirm('Hapus kelompok ini?')) deleteMutation.mutate(g.id as number); }} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
