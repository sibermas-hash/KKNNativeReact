'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DispensasiPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dispensasi'],
    queryFn: async () => {
      const res = await api.get('/admin/dispensasi');
      return res.data as { success: boolean; data: Record<string, unknown> };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/dispensasi/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'dispensasi'] }); toast.success('Dispensasi dihapus'); },
  });

  const dispensasi = ((data as Record<string, unknown>)?.dispensasi as unknown[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dispensasi KKN</h1>
      <p className="text-sm text-slate-500">Kelola dispensasi yang membebaskan mahasiswa dari persyaratan tertentu.</p>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {dispensasi.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-slate-500">Belum ada dispensasi</p></div>
          ) : dispensasi.map((d) => (
            <div key={String((d as Record<string, unknown>).id)} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{String(((d as Record<string, unknown>).mahasiswa as Record<string, unknown>)?.nama || '-')}</p>
                <p className="text-sm text-slate-500">{String((d as Record<string, unknown>).reason || '-')}</p>
              </div>
              <button onClick={() => { if (confirm('Hapus dispensasi ini?')) deleteMutation.mutate((d as Record<string, unknown>).id as number); }} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
