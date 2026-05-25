'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import Link from 'next/link';
import {
  FileText,
  Search,
  Target,
  Globe,
  Eye,
  Filter,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Layers,
  Users,
} from 'lucide-react';

type Proker = {
  id: number;
  kelompok_id?: number;
  title?: string;
  description?: string;
  sdg_goals?: number[] | null;
  objectives?: string;
  target_participants?: number;
  budget?: number;
  status?: string;
  abcd_stage?: string;
  kategori?: string;
  submitted_at?: string;
  approved_at?: string;
  approval_notes?: string;
  kelompok?: {
    id?: number;
    code?: string;
    nama_kelompok?: string;
    lokasi?: { village_name?: string; regency_name?: string; full_name?: string };
  };
  latest_proposal?: {
    id: number;
    status?: string;
    file_path?: string;
    submitted_at?: string;
  } | null;
  created_at?: string;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type Stats = {
  total: number;
  approved: number;
  pending: number;
  revision: number;
  rejected: number;
  with_proposal: number;
  kategori: Record<string, number>;
  abcd: Record<string, number>;
};

export default function AdminProkerPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [kategori, setKategori] = useState('');
  const [kelompokId, setKelompokId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const listQ = useQuery({
    queryKey: ['admin', 'proker', { search, status, kategori, kelompokId, dateFrom, dateTo, page, perPage }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (status) params.status = status;
      if (kategori) params.kategori = kategori;
      if (kelompokId) params.kelompok_id = kelompokId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await rawApi.get('/admin/laporan/program-kerja', { params });
      const body = res.data as { data?: { data: Proker[]; meta: Pagination; stats: Stats } | Proker[]; meta?: Pagination; stats?: Stats };
      // Backend wraps in success() under data, so unwrap once
      const inner = (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) ? body.data : body;
      return {
        data: (inner as { data?: Proker[] }).data ?? [],
        meta: (inner as { meta?: Pagination }).meta,
        stats: (inner as { stats?: Stats }).stats,
      };
    },
  });

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const stats = listQ.data?.stats;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const exportCsv = async () => {
    const params: Record<string, string | number> = { per_page: 1000 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (kategori) params.kategori = kategori;
    if (kelompokId) params.kelompok_id = kelompokId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const res = await rawApi.get('/admin/laporan/program-kerja', { params });
    const body = res.data as { data?: { data?: Proker[] } };
    const all = body.data?.data ?? [];
    if (!all.length) return;
    const headers = ['kode_kelompok', 'kelompok', 'lokasi', 'judul', 'kategori', 'abcd_stage', 'sdg_goals', 'target_peserta', 'budget', 'status', 'submitted_at', 'approved_at'];
    const rows = all.map((p) => [
      p.kelompok?.code ?? '',
      p.kelompok?.nama_kelompok ?? '',
      p.kelompok?.lokasi?.full_name ?? '',
      p.title ?? '',
      p.kategori ?? '',
      p.abcd_stage ?? '',
      Array.isArray(p.sdg_goals) ? p.sdg_goals.join(' ') : '',
      p.target_participants ?? '',
      p.budget ?? '',
      p.status ?? '',
      p.submitted_at ?? '',
      p.approved_at ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `program-kerja-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setKategori('');
    setKelompokId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const filterCount = [search, status, kategori, kelompokId, dateFrom, dateTo].filter(Boolean).length;
  const total = stats?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900">Monitoring Program Kerja</h1>
          <p className="text-sm text-slate-500">
            Pantau program kerja seluruh kelompok KKN •{' '}
            {total === 0 ? 'belum ada proker disubmit' : `${total} proker • ${stats?.with_proposal ?? 0} punya proposal`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => listQ.refetch()}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!total}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Proker" value={total} icon={<FileText className="h-4 w-4" />} color="slate" />
        <StatCard
          label="Disetujui"
          value={stats?.approved ?? 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="emerald"
        />
        <StatCard
          label="Menunggu Review"
          value={stats?.pending ?? 0}
          icon={<Clock className="h-4 w-4" />}
          color={(stats?.pending ?? 0) > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          label="Perlu Revisi"
          value={stats?.revision ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={(stats?.revision ?? 0) > 0 ? 'rose' : 'slate'}
        />
        <StatCard
          label="Ditolak"
          value={stats?.rejected ?? 0}
          icon={<XCircle className="h-4 w-4" />}
          color={(stats?.rejected ?? 0) > 0 ? 'rose' : 'slate'}
        />
      </div>

      {/* ABCD distribution */}
      {stats && Object.keys(stats.abcd).length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" /> Distribusi Tahap ABCD
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['discovery', 'design', 'do', 'destiny'].map((stage) => {
              const count = stats.abcd[stage] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={stage} className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs font-bold text-slate-600 capitalize">{stage}</p>
                  <p className="text-xl font-black text-cyan-700 mt-0.5">{count}</p>
                  <p className="text-xs text-slate-400">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kategori filter */}
      {stats && Object.keys(stats.kategori).length > 0 && (
        <div>
          <p className="text-xs font-black uppercase text-slate-500 mb-2">Filter Kategori</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.kategori)
              .sort(([, a], [, b]) => b - a)
              .map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => {
                    setKategori(kategori === k ? '' : k);
                    setPage(1);
                  }}
                  className={
                    'rounded-lg border px-3 py-1.5 text-xs font-bold transition ' +
                    (kategori === k
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300')
                  }
                >
                  {k} <span className="text-slate-400">×{c}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          <select
            className="h-10 rounded-lg border px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Disetujui</option>
            <option value="revision">Perlu Revisi</option>
            <option value="rejected">Ditolak</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border px-3 text-sm"
            title="Submitted from"
          />
          <span className="text-slate-400 text-xs">s/d</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border px-3 text-sm"
            title="Submitted to"
          />
          <select
            className="h-10 rounded-lg border px-3 text-sm"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
          </select>
          {filterCount > 0 && (
            <button
              onClick={resetFilters}
              className="h-10 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white"
            >
              Reset Filter ({filterCount})
            </button>
          )}
        </div>
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm"
              placeholder="Cari judul, deskripsi, kelompok atau kode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white">
            Cari
          </button>
        </form>
      </div>

      {/* Empty */}
      {total === 0 && !listQ.isLoading && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <Target className="h-14 w-14 text-slate-300 mx-auto" />
          <div>
            <p className="font-black text-slate-900 text-lg">Belum Ada Program Kerja</p>
            <p className="text-sm text-slate-500 mt-1">
              Kelompok belum mengusulkan program kerja. Setelah peserta KKN aktif dan kelompok ter-plot, proker akan muncul di sini.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Link href="/admin/plotting-otomatis" className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white">
              Mulai Plotting Kelompok
            </Link>
            <Link href="/admin/laporan/harian" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700">
              Lihat Laporan Harian
            </Link>
          </div>
        </div>
      )}

      {/* Table */}
      {total > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="border-b">
                  <th className="px-4 py-3 font-bold text-slate-600">Judul Program</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Kelompok / Lokasi</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Kategori</th>
                  <th className="px-4 py-3 font-bold text-slate-600">SDG</th>
                  <th className="px-4 py-3 font-bold text-slate-600">ABCD</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-center">Target</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-right">Budget</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Memuat program kerja...
                    </td>
                  </tr>
                )}
                {!listQ.isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      Tidak ada program kerja dengan filter aktif
                    </td>
                  </tr>
                )}
                {items.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <p className="font-bold text-slate-900 max-w-xs truncate" title={p.title}>{p.title ?? '-'}</p>
                      {p.description && (
                        <p className="text-xs text-slate-500 max-w-xs truncate">{p.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-700 text-xs">{p.kelompok?.nama_kelompok ?? '-'}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.kelompok?.code ?? ''}</p>
                      <p className="text-xs text-slate-400 truncate max-w-40">
                        {p.kelompok?.lokasi?.village_name ?? p.kelompok?.lokasi?.full_name ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      {p.kategori ? (
                        <span className="inline-block rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold">
                          {p.kategori}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {Array.isArray(p.sdg_goals) && p.sdg_goals.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.sdg_goals.slice(0, 3).map((g) => (
                            <span key={g} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
                              <Globe className="h-2.5 w-2.5" /> {g}
                            </span>
                          ))}
                          {p.sdg_goals.length > 3 && (
                            <span className="text-xs text-slate-400">+{p.sdg_goals.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {p.abcd_stage ? (
                        <span className="rounded bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-bold capitalize border border-purple-100">
                          {p.abcd_stage}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="font-bold text-slate-700">{p.target_participants ?? '-'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs font-bold text-slate-700">
                      {p.budget ? 'Rp ' + Number(p.budget).toLocaleString('id-ID') : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill status={p.status ?? 'pending'} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/laporan/program-kerja/${p.id}`}
                        className="inline-flex items-center gap-1 rounded p-1.5 text-cyan-600 hover:bg-cyan-50 text-xs font-bold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between p-3 border-t text-sm">
              <span className="text-slate-500">
                {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total} program
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="rounded border px-3 py-1 text-xs bg-slate-100">
                  {page} / {meta.last_page}
                </span>
                <button
                  disabled={page >= meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = 'slate',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'slate' | 'emerald' | 'amber' | 'rose' | 'cyan';
}) {
  const cm = {
    slate: 'text-slate-900 bg-slate-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
    cyan: 'text-cyan-700 bg-cyan-50',
  } as const;
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
        <div className={'rounded-lg p-1.5 ' + cm[color]}>{icon}</div>
      </div>
      <p className={'text-2xl font-black mt-1 ' + cm[color].split(' ')[0]}>{value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'pending' || s === 'submitted'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'revision'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : s === 'rejected'
      ? 'bg-slate-200 text-slate-700 border-slate-300'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const text =
    s === 'approved'
      ? 'Disetujui'
      : s === 'pending' || s === 'submitted'
      ? 'Menunggu'
      : s === 'revision'
      ? 'Revisi'
      : s === 'rejected'
      ? 'Ditolak'
      : status;
  return <span className={'rounded-full border px-2 py-0.5 text-xs font-bold ' + cls}>{text}</span>;
}
