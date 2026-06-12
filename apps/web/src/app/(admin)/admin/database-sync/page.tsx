'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { adminApi, rawApi } from '@/lib/api';
import Link from 'next/link';
import { RefreshCw, CheckCircle, XCircle, Clock, Eye, Upload, Users, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type SyncLogRow = Record<string, unknown>;
type PaginatedSyncLogsResponse = {
  data: SyncLogRow[];
  meta?: Partial<PaginationMeta>;
};

function ImportSection() {
  const dosenFileRef = useRef<HTMLInputElement>(null);
  const nilaiFileRef = useRef<HTMLInputElement>(null);
  const [nilaiAngkatan, setNilaiAngkatan] = useState('');

  const importDosen = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return adminApi.dataImport.dosenData(fd);
    },
    onSuccess: (res: unknown) => {
      const d = res as { updated?: number; not_found?: number; skipped?: number };
      toast.success(`Import dosen: ${d.updated ?? 0} diperbarui, ${d.not_found ?? 0} tidak ditemukan, ${d.skipped ?? 0} dilewati.`);
    },
    onError: () => toast.error('Gagal import data dosen'),
  });

  const importNilai = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      if (nilaiAngkatan) fd.append('angkatan', nilaiAngkatan);
      return adminApi.dataImport.nilaiKknHistoris(fd);
    },
    onSuccess: (res: unknown) => {
      const d = res as { imported?: number; not_found?: number };
      toast.success(`Import nilai: ${d.imported ?? 0} mahasiswa ditandai sudah KKN, ${d.not_found ?? 0} NIM tidak ditemukan.`);
    },
    onError: () => toast.error('Gagal import nilai KKN'),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Import Dosen */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-800">Import Data Dosen (DB2)</h3>
        </div>
        <p className="text-xs text-slate-500">Upload file HTML (export Excel) berisi data dosen. Hanya mengisi field yang kosong di database, tidak menimpa data yang sudah ada.</p>
        <p className="text-[10px] text-slate-400">Format: file <code>.html</code> dari export Excel DB2 (kolom: NIP, NIDN, NIK, Pangkat, Golongan, Jabatan, dll)</p>
        <input ref={dosenFileRef} type="file" accept=".html,.htm" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) importDosen.mutate(f); e.target.value = ''; }} />
        <button onClick={() => dosenFileRef.current?.click()} disabled={importDosen.isPending}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
          <Upload size={14} /> {importDosen.isPending ? 'Mengimport...' : 'Upload & Import Dosen'}
        </button>
      </div>

      {/* Import Nilai KKN Historis */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">Import Nilai KKN Historis</h3>
        </div>
        <p className="text-xs text-slate-500">Upload file HTML berisi nilai KKN dari sistem lama. Mahasiswa yang ter-import akan ditandai sebagai sudah pernah KKN (blokir pendaftaran ulang).</p>
        <p className="text-[10px] text-slate-400">Format: file <code>.html</code> (kolom: NIM, Nama, Laporan, Artikel, Pelaksanaan, Kedisiplinan, Sikap, LPPM, Total, Huruf)</p>
        <div className="flex items-center gap-2">
          <input value={nilaiAngkatan} onChange={e => setNilaiAngkatan(e.target.value)} placeholder="Angkatan (misal: 51)" className="h-9 w-32 rounded-lg border border-slate-200 px-3 text-sm" />
          <input ref={nilaiFileRef} type="file" accept=".html,.htm" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importNilai.mutate(f); e.target.value = ''; }} />
          <button onClick={() => nilaiFileRef.current?.click()} disabled={importNilai.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Upload size={14} /> {importNilai.isPending ? 'Mengimport...' : 'Upload & Import Nilai'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DatabaseSyncPage(): React.JSX.Element {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery<PaginatedSyncLogsResponse>({
    queryKey: ['admin', 'database-sync', page],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<SyncLogRow[]>>('/admin/database-sync', {
        params: { page, per_page: 20 },
      });
      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
  });

  const logs = data?.data ?? [];
  const meta = data?.meta ?? {};

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle size={14} className="text-emerald-500" />;
    if (status === 'failed') return <XCircle size={14} className="text-rose-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinkronisasi & Import Data"
        subtitle="Import data dosen, nilai KKN historis, dan log sinkronisasi SIAKAD"
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Import Section */}
      <ImportSection />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Tipe</th>
              <th className="px-5 py-3 text-left">Entitas</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Dibuat</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Belum ada log sinkronisasi</td></tr>
            ) : logs.map((log) => (
              <tr key={String(log.id)} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{String(log.source ?? '-')} → {String(log.target ?? '-')}</td>
                <td className="px-5 py-3 text-slate-700">{String(log.entity_type ?? '-')}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    {statusIcon(String(log.status ?? ''))}
                    <span className="text-xs capitalize">{String(log.status ?? '-')}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-xs text-slate-400">{String(log.created_at ?? '-').slice(0, 16).replace('T', ' ')}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/database-sync/${log.id}`} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                    <Eye size={13} /> Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(meta.last_page ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(meta.last_page)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
