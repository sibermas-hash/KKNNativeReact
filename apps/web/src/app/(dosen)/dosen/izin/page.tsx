'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';

export default function DplIzinPage() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.leaveRequests,
    queryFn: async () => { const res = await endpoints.leaveRequests.index(); return res.data as { success: boolean; data: unknown[] }; },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.leaveRequests.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); toast.success('Izin disetujui'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => endpoints.leaveRequests.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); setRejectId(null); setRejectReason(''); toast.success('Izin ditolak'); },
  });

  const izinList = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Persetujuan Izin</h1>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      : izinList.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Tidak ada pengajuan izin" />
      : (
        <div className="space-y-4">
          {izinList.map((izin) => (
            <div key={String(izin.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-slate-900">{String((izin.mahasiswa as Record<string, unknown>)?.name || '-')}</p>
                  <p className="text-sm text-slate-600 capitalize">{String(izin.type || '')}: {String(izin.reason || '')}</p>
                  <p className="text-xs text-slate-400 mt-1">{String(izin.start_date || '')} — {String(izin.end_date || '')}</p>
                </div>
                <StatusBadge status={String(izin.status || 'pending')} />
              </div>
              {izin.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => approveMutation.mutate(izin.id as number)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase"><CheckCircle2 size={14} /> Setujui</button>
                  {rejectId === izin.id ? (
                    <div className="flex flex-1 gap-2">
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan" className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm" />
                      <button onClick={() => rejectMutation.mutate({ id: izin.id as number, reason: rejectReason })} disabled={!rejectReason} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase">Kirim</button>
                      <button onClick={() => setRejectId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setRejectId(izin.id as number)} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase"><XCircle size={14} /> Tolak</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
