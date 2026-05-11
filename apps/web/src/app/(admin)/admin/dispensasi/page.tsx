'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { FileX } from 'lucide-react';
import { PageHeader, ConfirmDialog, EmptyState } from '@/components/ui/shared';

export default function DispensasiPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dispensasi'],
    queryFn: async () => {
      const res = await api.get('/admin/dispensasi');
      return (res as any)?.data ?? res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/dispensasi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispensasi'] });
      toast.success('Dispensasi dihapus');
      setConfirmId(null);
    },
  });

  const dispensasi = ((data as Record<string, unknown>)?.dispensasi as unknown[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Dispensasi KKN"
        subtitle="Kelola dispensasi yang membebaskan mahasiswa dari persyaratan tertentu."
      />

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteMutation.mutate(confirmId)}
        title="Hapus Dispensasi"
        description="Tindakan ini tidak dapat dibatalkan. Dispensasi akan dihapus permanen."
        confirmText="Hapus"
        variant="danger"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : dispensasi.length === 0 ? (
        <EmptyState icon={<FileX size={40} />} title="Belum ada dispensasi" description="Tidak ada data dispensasi saat ini." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Mahasiswa</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Alasan</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dispensasi.map((d) => {
                const item = d as Record<string, unknown>;
                return (
                  <tr key={String(item.id)} className="border-b border-slate-50 last:border-0">
                    <td className="p-4 font-semibold text-slate-800">
                      {String((item.mahasiswa as Record<string, unknown>)?.nama || '-')}
                    </td>
                    <td className="p-4 text-slate-500">{String(item.reason || '-')}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setConfirmId(item.id as number)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100"
                      >
                        <span className="sr-only">Hapus</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
