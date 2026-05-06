'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import Link from 'next/link';
import { Users, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import toast from 'react-hot-toast';

export default function AdminGroupsPage() {
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => { const res = await adminApi.groups.index(); return (res as unknown as { success: boolean; data: unknown[] }).data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.groups.destroy(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] }); toast.success('Kelompok dihapus'); },
    onError: () => toast.error('Gagal menghapus'),
  });

   const groups = (data as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Kelompok KKN" subtitle="Kelola kelompok peserta" />

      {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : groups.length === 0 ? <EmptyState icon={<Users size={48} />} title="Belum ada kelompok" />
      : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={String(g.id)} className="flex items-center justify-between bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm">
              <div>
                <p className="font-black text-slate-900">{String(g.nama_kelompok || '-')} ({String(g.code || '-')})</p>
                <p className="text-xs text-slate-400">{String(((g.lokasi as Record<string, unknown>)?.village_name as string) || '-')} | Anggota: {String(g.peserta_count || 0)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/kelompok/${g.id}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">Detail</Link>
                <button onClick={() => { if (confirm('Hapus?')) deleteMutation.mutate(g.id as number); }} className="p-1.5 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
