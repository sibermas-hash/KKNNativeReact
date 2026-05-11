'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Users, Trash2, Upload } from 'lucide-react';
import { PageHeader, ConfirmDialog, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

export default function AdminGroupsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => {
      const res = await adminApi.groups.index();
      return (res as unknown as { data?: unknown })?.data ?? res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.groups.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      toast.success('Kelompok dihapus');
      setConfirmId(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return adminApi.groups.import(formData);
    },
    onSuccess: (res: unknown) => {
      const result = (res as { data: { created: number; updated: number; skipped: number } }).data;
      toast.success(`Import selesai: ${result.created} dibuat, ${result.updated} diperbarui`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      setIsImporting(false);
    },
    onError: () => { toast.error('Gagal import'); setIsImporting(false); },
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setIsImporting(true); importMutation.mutate(file); }
  };

  const groups = (data as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Kelompok KKN"
        subtitle="Kelola kelompok peserta KKN."
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

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteMutation.mutate(confirmId)}
        title="Hapus Kelompok"
        description="Kelompok ini akan dihapus permanen beserta seluruh datanya."
        confirmText="Hapus"
        variant="danger"
      />

      <p className="text-sm text-slate-500 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
        Format kolom Excel: kode_kelompok, nama_kelompok, desa, kecamatan, kabupaten, kapasitas
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Belum ada kelompok" description="Import file Excel untuk menambahkan kelompok." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Kelompok</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Lokasi</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Anggota</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={String(g.id)} className="border-b border-slate-50 last:border-0">
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{String(g.nama_kelompok || '-')}</p>
                    <p className="text-xs text-slate-400 font-mono">{String(g.code || '-')}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    {String((g.lokasi as Record<string, unknown>)?.village_name || '-')}
                  </td>
                  <td className="p-4 text-slate-600">{String(g.peserta_count || 0)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/kelompok/${g.id}`}
                        className="h-8 px-3 flex items-center justify-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 border border-transparent hover:border-cyan-100 text-xs font-semibold"
                      >
                        Detail
                      </Link>
                      <button
                        onClick={() => setConfirmId(g.id as number)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
