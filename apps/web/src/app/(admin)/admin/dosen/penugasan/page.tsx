'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Upload, UserCheck, Search } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState } from '@/components/ui/shared';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Assignment = {
  id: number;
  is_active: boolean;
  max_kelompok_kkn?: number;
  dosen?: { id: number; nama?: string; nip?: string };
  periode?: { id: number; name?: string; jenis_kkn?: { name?: string } };
  kelompok_count?: number;
};

type Meta = { current_page: number; last_page: number; total: number; per_page: number };

export default function DplAssignmentPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const periodeId = searchParams?.get('periode_id') ?? '';
  const periodeName = (searchParams?.get('periode_name') ?? '').trim();

  const { data, isLoading } = useQuery<{ data: Assignment[]; meta?: Meta }>({
    queryKey: ['admin', 'dosen', 'penugasan', { periodeId, search, page }],
    queryFn: async () => {
      const res = await rawApi.get('/admin/dosen/penugasan', {
        params: { periode_id: periodeId || undefined, search: search || undefined, page, per_page: 25 },
      });
      const body = (res.data as { data?: unknown }).data ?? res.data;
      if (Array.isArray(body)) return { data: body, meta: undefined };
      const inner = body as { data?: Assignment[]; meta?: Meta };
      return { data: inner?.data ?? [], meta: inner?.meta };
    },
  });

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return rawApi.post('/admin/dosen/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      const result = ((res.data as { data?: { activated: number; group_assigned: number; skipped: number } })?.data ?? res.data) as {
        activated: number; group_assigned: number; skipped: number;
      };
      toast.success(`Import selesai: ${result.activated} diaktifkan, ${result.group_assigned} ditugaskan`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dosen', 'penugasan'] });
      setIsImporting(false);
    },
    onError: () => { toast.error('Gagal import'); setIsImporting(false); },
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setIsImporting(true); importMutation.mutate(file); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan DPL"
        subtitle="Kelola penugasan Dosen Pembimbing Lapangan ke kelompok KKN."
        actions={
          <>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              <Upload size={16} />
              {isImporting ? 'Mengimport...' : 'Import Excel'}
            </button>
          </>
        }
      />

      {periodeId && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          <span className="font-bold">Filter: {periodeName || `Periode #${periodeId}`}</span>
          <Link href="/admin/dosen/penugasan" prefetch={false} className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100">
            Tampilkan semua
          </Link>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari NIP/Nama dosen..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
        Format kolom Excel: NIP, periode, max_kelompok, kode_kelompok, kecamatan
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={<UserCheck size={40} />} title="Belum ada penugasan DPL" description="Import file Excel untuk menambahkan penugasan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">NIP</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Nama Dosen</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold text-slate-500 md:table-cell">Periode</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Max Kelompok</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Kelompok Saat Ini</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 25) + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.dosen?.nip || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.dosen?.nama || '-'}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{a.periode?.jenis_kkn?.name ?? a.periode?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center font-bold">{a.max_kelompok_kkn ?? '-'}</td>
                  <td className="px-4 py-3 text-center">{a.kelompok_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={a.is_active ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
          <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page} • {meta.total} penugasan</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
