'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DplRegistrationPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dpl-registration'],
    queryFn: async () => {
      const res = await api.get('/admin/dosen/pendaftaran-dpl');
      return (res as unknown as { success: boolean; data: unknown[] }).data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/dosen/pendaftaran-dpl/${id}/setujui`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] }); toast.success('DPL disetujui'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.patch(`/admin/dosen/pendaftaran-dpl/${id}/tolak`, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] }); toast.success('DPL ditolak'); },
  });

  const registrations = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Pendaftaran DPL</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {registrations.map((r) => (
            <div key={String(r.id)} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{String(((r as Record<string, unknown>)?.dosen as Record<string, unknown>)?.nama || '-')}</p>
                <p className="text-sm text-slate-500">NIP: {String(((r as Record<string, unknown>)?.dosen as Record<string, unknown>)?.nip || '-')}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {String(r.status || 'pending')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
