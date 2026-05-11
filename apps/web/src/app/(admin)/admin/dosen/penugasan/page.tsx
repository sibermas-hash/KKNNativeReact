'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Upload, UserCheck } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState } from '@/components/ui/shared';

export default function DplAssignmentPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dosen', 'penugasan'],
    queryFn: async () => {
      const res = await api.get('/admin/dosen/penugasan');
      return (res as any)?.data ?? res;
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/admin/dosen/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res: unknown) => {
      const result = (res as { data: { activated: number; group_assigned: number; skipped: number } }).data;
      toast.success(`Import selesai: ${result.activated} diaktifkan, ${result.group_assigned} ditugaskan`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-assignment'] });
      setIsImporting(false);
    },
    onError: () => { toast.error('Gagal import'); setIsImporting(false); },
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setIsImporting(true); importMutation.mutate(file); }
  };

  const assignments = (data as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Penugasan DPL"
        subtitle="Kelola penugasan Dosen Pembimbing Lapangan ke kelompok KKN."
        actions={
          <>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              <Upload size={16} />
              {isImporting ? 'Mengimport...' : 'Import Excel'}
            </button>
          </>
        }
      />

      <p className="text-sm text-slate-500 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
        Format kolom Excel: NIP, periode, max_kelompok, kode_kelompok, kecamatan
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={<UserCheck size={40} />} title="Belum ada penugasan DPL" description="Import file Excel untuk menambahkan penugasan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Dosen</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Periode</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Max Kelompok</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={String(a.id)} className="border-b border-slate-50 last:border-0">
                  <td className="p-4 font-semibold text-slate-800">
                    {String((a.dosen as Record<string, unknown>)?.nama || '-')}
                  </td>
                  <td className="p-4 text-slate-600">
                    {String((a.periode as Record<string, unknown>)?.name || '-')}
                  </td>
                  <td className="p-4 text-slate-600">{String(a.max_kelompok_kkn || '-')}</td>
                  <td className="p-4">
                    <StatusBadge status={a.is_active ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
