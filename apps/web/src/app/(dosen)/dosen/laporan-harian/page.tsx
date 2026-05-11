'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';

export default function DplDailyReportsPage(): React.JSX.Element {
  
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dpl', 'daily-reports', { status }],
    queryFn: async () => { return await dplApi.dailyReports.index({ status: status || undefined }); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => dplApi.dailyReports.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Laporan disetujui'); },
  });

  const reports = ((data as any) || []) as Record<string, unknown>[];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Review Laporan Harian" subtitle="Validasi laporan mahasiswa bimbingan" />

      <div className="flex gap-2">
        {['', 'submitted', 'approved', 'revision'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${status === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-200'}`}>
            {s === '' ? 'Semua' : s === 'submitted' ? 'Pending' : s === 'approved' ? 'Disetujui' : 'Revisi'}
          </button>
        ))}
      </div>

      {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : reports.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Tidak ada laporan" />
      : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={String(r.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-xs text-slate-400">{String((r.mahasiswa as Record<string, unknown>)?.name || '-')} — {String((r.kelompok as Record<string, unknown>)?.name || '-')}</p>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{String(r.title || '')}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{String(r.activity || '')}</p>
                </div>
                <StatusBadge status={String(r.status || '')} />
              </div>
              {r.status === 'submitted' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => approveMutation.mutate(r.id as number)} disabled={approveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50"><CheckCircle2 size={14} /> Setujui</button>
                  <Link href={`/dosen/laporan-harian/${r.id}`} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase">Detail →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
