'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';

interface Registration {
  id: number;
  mahasiswa: {
    nama: string;
    nim: string;
    fakultas: { nama: string };
  };
  status: string;
  [key: string]: unknown;
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'registrations', { status, search }],
    queryFn: async () => { 
      const res = await adminApi.registrations.index({ status, search }); 
      return (res as any).data as Registration[]; 
    },
  });

  const registrations = data || [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.registrations.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Disetujui'); },
    onError: () => toast.error('Gagal menyetujui pendaftaran'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Ditolak'); },
    onError: () => toast.error('Gagal menolak pendaftaran'),
  });

  const toggleSelect = (id: number) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const bulkApprove = () => adminApi.registrations.bulkApprove(selectedIds).then(() => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); setSelectedIds([]); toast.success(`${selectedIds.length} pendaftaran disetujui`); });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Pendaftaran KKN" subtitle="Kelola pendaftaran mahasiswa" />

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIM/Nama..." className="w-64 h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold" />
        <select aria-label="Filter status pendaftaran" title="Filter status pendaftaran" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold">
          <option value="">Semua Status</option><option value="pending">Menunggu</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option>
        </select>
        {selectedIds.length > 0 && <button onClick={bulkApprove} className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase">✅ Setujui {selectedIds.length} Terpilih</button>}
      </div>

      {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : registrations.length === 0 ? <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada pendaftaran" />
      : (
        <div className="space-y-3">
          {registrations.map((r) => {
            const mhs = r.mahasiswa as Record<string, unknown> | undefined;
            return (
              <div key={String(r.id)} className="flex items-start gap-3 bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm">
                <input type="checkbox" aria-label={`Pilih pendaftaran ${String(mhs?.nama || '-')}`} title={`Pilih pendaftaran ${String(mhs?.nama || '-')}`} checked={selectedIds.includes(r.id as number)} onChange={() => toggleSelect(r.id as number)} className="mt-1 h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div><p className="font-black text-slate-900">{String(mhs?.nama || '-')}</p><p className="text-xs text-slate-400">NIM: {String(mhs?.nim || '-')} | {String((mhs?.fakultas as Record<string, unknown>)?.nama || '-')}</p></div>
                    <StatusBadge status={String(r.status || '')} />
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(r.id as number)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black disabled:opacity-50"><CheckCircle2 size={12} /> Setujui</button>
                      <button onClick={() => { const reason = prompt('Alasan penolakan:'); if (reason) rejectMutation.mutate({ id: r.id as number, reason }); }} className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-black"><XCircle size={12} /> Tolak</button>
                      <Link href={`/admin/pendaftaran/${r.id}`} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Detail →</Link>
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
