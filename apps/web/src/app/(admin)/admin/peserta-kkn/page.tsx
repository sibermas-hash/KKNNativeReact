'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Users, Search, Download } from 'lucide-react';

type Peserta = {
  id: number;
  status: string;
  role?: string;
  mahasiswa?: { nama?: string; nim?: string; prodi?: { nama?: string }; fakultas?: { nama?: string } };
  periode?: { name?: string; periode?: number; jenis_kkn?: { name?: string } };
  kelompok?: { code?: string; nama_kelompok?: string };
};

type Meta = { current_page: number; last_page: number; total: number; per_page: number };
type Faculty = { id: number; nama: string; code?: string };
type Prodi = { id: number; nama: string; code?: string; fakultas_id?: number };
type JenisKkn = { id: number; name: string; code?: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
  interview_passed: { label: 'Lulus Wawancara', color: 'bg-cyan-100 text-cyan-700' },
  completed: { label: 'Selesai', color: 'bg-slate-100 text-slate-700' },
};

export default function PesertaKknPage(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [angkatan, setAngkatan] = useState('58');
  const [fakultasId, setFakultasId] = useState('');
  const [prodiId, setProdiId] = useState('');
  const [jenisKknId, setJenisKknId] = useState('');

  const { data, isLoading } = useQuery<{ data: Peserta[]; meta: Meta }>({
    queryKey: ['admin', 'peserta-kkn', page, search, angkatan, fakultasId, prodiId, jenisKknId],
    queryFn: async () => {
      const res = await rawApi.get('/admin/peserta-kkn', {
        params: { page, search: search || undefined, angkatan: angkatan || undefined, fakultas_id: fakultasId || undefined, prodi_id: prodiId || undefined, jenis_kkn_id: jenisKknId || undefined, per_page: 25 },
      });
      return ((res.data as { data?: unknown }).data ?? res.data) as { data: Peserta[]; meta: Meta };
    },
  });

  const { data: faculties = [] } = useQuery<Faculty[]>({
    queryKey: ['admin', 'fakultas', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas', { params: { per_page: 100 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Faculty[];
    },
    staleTime: 300000,
  });

  const { data: prodiOptions = [] } = useQuery<Prodi[]>({
    queryKey: ['admin', 'prodi', 'peserta-kkn-filter', fakultasId],
    queryFn: async () => {
      const res = await rawApi.get('/admin/prodi', { params: { per_page: 500, fakultas_id: fakultasId || undefined } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Prodi[];
    },
    staleTime: 300000,
  });

  const { data: jenisKknOptions = [] } = useQuery<JenisKkn[]>({
    queryKey: ['admin', 'jenis-kkn', 'peserta-kkn-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/jenis-kkn', { params: { per_page: 100 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as JenisKkn[];
    },
    staleTime: 300000,
  });

  const peserta = data?.data ?? [];
  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 25 };

  const exportXlsx = async () => {
    try {
      const res = await rawApi.get('/admin/peserta-kkn/export', {
        params: { angkatan: angkatan || undefined, fakultas_id: fakultasId || undefined, prodi_id: prodiId || undefined, jenis_kkn_id: jenisKknId || undefined, limit: 50000 },
        responseType: 'blob',
      });
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peserta-kkn-${angkatan || 'semua'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export gagal');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peserta KKN"
        subtitle={`Total ${meta.total} peserta aktif.`}
        actions={(
          <button onClick={exportXlsx} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20">
            <Download size={14} /> Export
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari NIM/Nama..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
        </div>
        <select value={angkatan} onChange={e => { setAngkatan(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="58">Angkatan 58</option>
          <option value="59">Angkatan 59</option>
          <option value="">Semua Angkatan</option>
        </select>
        <select value={fakultasId} onChange={e => { setFakultasId(e.target.value); setProdiId(''); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Fakultas</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
        </select>
        <select value={prodiId} onChange={e => { setProdiId(e.target.value); setPage(1); }} className="h-10 min-w-[240px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Prodi</option>
          {prodiOptions.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <select value={jenisKknId} onChange={e => { setJenisKknId(e.target.value); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Jenis KKN</option>
          {jenisKknOptions.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : peserta.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada peserta KKN ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">NIM</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Nama</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold text-slate-500 md:table-cell">Prodi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Jenis KKN</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Kelompok</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Role</th>
              </tr>
            </thead>
            <tbody>
              {peserta.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{(meta.current_page - 1) * meta.per_page + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.mahasiswa?.nim ?? '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.mahasiswa?.nama ?? '-'}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{p.mahasiswa?.prodi?.nama ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.periode?.jenis_kkn?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{p.kelompok?.code ?? <span className="text-slate-400">Belum</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_LABELS[p.status]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{p.role ?? 'Anggota'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
          <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page}</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
