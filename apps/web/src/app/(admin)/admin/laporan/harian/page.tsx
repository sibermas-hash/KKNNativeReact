'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import Link from 'next/link';
import {
  Activity,
  Search,
  FileText,
  Eye,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';

type DailyReport = {
  id: number;
  date?: string;
  date_label?: string;
  formatted_date?: string;
  title?: string;
  activity?: string;
  status?: string;
  status_label?: string;
  status_color?: string;
  reviewed_at?: string;
  ai_summary?: string;
  files?: Array<{ id: number; original_name?: string }>;
  attachments?: Array<{ id: number; original_name?: string }>;
  student?: {
    name?: string;
    nim?: string;
    prodi?: string;
    fakultas?: string;
  };
  kelompok?: { id?: number; name?: string; location?: string };
  group?: { id?: number; name?: string; location?: string };
  location_name?: string;
  latitude?: string | number;
  longitude?: string | number;
  review?: { reviewer_name?: string; reviewed_at?: string };
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export default function AdminDailyReportsPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [kelompokId, setKelompokId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Fetch list
  const listQ = useQuery({
    queryKey: ['admin', 'daily-reports', { search, status, kelompokId, dateFrom, dateTo, page, perPage }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params.search = search;
      if (status) params.status = status;
      if (kelompokId) params.kelompok_id = kelompokId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await rawApi.get('/admin/laporan/harian', { params });
      const body = res.data as { data?: DailyReport[]; meta?: Pagination };
      return { data: body.data ?? [], meta: body.meta };
    },
  });

  // Fetch all for stats (max 1000)
  const statsQ = useQuery({
    queryKey: ['admin', 'daily-reports', 'stats'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/laporan/harian', { params: { per_page: 1000 } });
      return ((res.data as { data?: DailyReport[] }).data ?? []) as DailyReport[];
    },
  });

  const allReports = useMemo(() => statsQ.data ?? [], [statsQ.data]);

  const stats = useMemo(() => {
    const total = allReports.length;
    const byStatus: Record<string, number> = { submitted: 0, approved: 0, revision: 0, draft: 0 };
    const byKelompok: Record<string, { name: string; count: number }> = {};
    const studentsSet = new Set<string>();
    let withFile = 0;
    let withGps = 0;
    let withAi = 0;

    allReports.forEach((r) => {
      const s = (r.status || 'draft').toLowerCase();
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      const kelompokName = r.kelompok?.name ?? r.group?.name ?? 'Tanpa kelompok';
      const kelompokId = String(r.kelompok?.id ?? r.group?.id ?? 0);
      if (!byKelompok[kelompokId]) byKelompok[kelompokId] = { name: kelompokName, count: 0 };
      byKelompok[kelompokId].count++;
      if (r.student?.nim) studentsSet.add(r.student.nim);
      if ((r.files?.length ?? r.attachments?.length ?? 0) > 0) withFile++;
      if (r.latitude && r.longitude) withGps++;
      if (r.ai_summary) withAi++;
    });

    return { total, byStatus, byKelompok, studentsCount: studentsSet.size, withFile, withGps, withAi };
  }, [allReports]);

  const reports = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const exportCsv = () => {
    if (!allReports.length) return;
    const headers = ['tanggal', 'mahasiswa', 'nim', 'prodi', 'fakultas', 'kelompok', 'judul', 'status', 'reviewed_by', 'reviewed_at', 'lampiran'];
    const rows = allReports.map((r) => [
      r.date ?? '',
      r.student?.name ?? '',
      r.student?.nim ?? '',
      r.student?.prodi ?? '',
      r.student?.fakultas ?? '',
      r.kelompok?.name ?? r.group?.name ?? '',
      r.title ?? '',
      r.status ?? '',
      r.review?.reviewer_name ?? '',
      r.review?.reviewed_at ?? r.reviewed_at ?? '',
      r.files?.length ?? r.attachments?.length ?? 0,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-harian-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setKelompokId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const filterCount = [search, status, kelompokId, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900">Laporan Harian</h1>
          <p className="text-sm text-slate-500">
            Pantau aktivitas harian mahasiswa di lokasi KKN •{' '}
            {stats.total === 0
              ? 'belum ada laporan masuk'
              : `${stats.total} laporan • ${stats.studentsCount} mahasiswa aktif`}
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
            disabled={!stats.total}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Total Laporan"
          value={stats.total}
          icon={<FileText className="h-4 w-4" />}
          color="slate"
        />
        <StatCard
          label="Menunggu Review"
          value={stats.byStatus.submitted ?? 0}
          icon={<Clock className="h-4 w-4" />}
          color={(stats.byStatus.submitted ?? 0) > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          label="Disetujui"
          value={stats.byStatus.approved ?? 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="emerald"
        />
        <StatCard
          label="Perlu Revisi"
          value={stats.byStatus.revision ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={(stats.byStatus.revision ?? 0) > 0 ? 'rose' : 'slate'}
        />
        <StatCard
          label="Mahasiswa Aktif"
          value={stats.studentsCount}
          icon={<Users className="h-4 w-4" />}
          color="cyan"
        />
      </div>

      {/* Quality stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <QualityCard label="Dengan Lampiran" value={stats.withFile} total={stats.total} />
          <QualityCard label="Dengan GPS" value={stats.withGps} total={stats.total} />
          <QualityCard label="Sudah Dianalisa AI" value={stats.withAi} total={stats.total} />
        </div>
      )}

      {/* Per-kelompok filter cards */}
      {Object.keys(stats.byKelompok).length > 0 && (
        <div>
          <p className="text-xs font-black uppercase text-slate-500 mb-2">Filter per Kelompok</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byKelompok)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 12)
              .map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => {
                    setKelompokId(kelompokId === id ? '' : id);
                    setPage(1);
                  }}
                  className={
                    'rounded-lg border px-3 py-1.5 text-xs font-bold transition ' +
                    (kelompokId === id
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300')
                  }
                >
                  {info.name} <span className="text-slate-400">×{info.count}</span>
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
            <option value="submitted">Menunggu Review</option>
            <option value="approved">Disetujui</option>
            <option value="revision">Perlu Revisi</option>
            <option value="draft">Draft</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border px-3 text-sm"
            title="Dari tanggal"
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
            title="Sampai tanggal"
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
              placeholder="Cari judul, aktivitas, atau nama mahasiswa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white">
            Cari
          </button>
        </form>
      </div>

      {/* Empty state - no data at all */}
      {stats.total === 0 && !statsQ.isLoading && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <FileText className="h-14 w-14 text-slate-300 mx-auto" />
          <div>
            <p className="font-black text-slate-900 text-lg">Belum Ada Laporan Harian</p>
            <p className="text-sm text-slate-500 mt-1">
              Mahasiswa belum mulai mengirim laporan harian. Aktivitas akan muncul di sini setelah peserta KKN aktif di lapangan.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href="/admin/plotting-otomatis"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white"
            >
              Mulai Plotting Kelompok
            </Link>
            <Link
              href="/admin/kelompok"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              Lihat Daftar Kelompok
            </Link>
          </div>
        </div>
      )}

      {/* Table */}
      {stats.total > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="border-b">
                  <th className="px-4 py-3 font-bold text-slate-600">Tanggal</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Mahasiswa</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Kelompok</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Judul / Aktivitas</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-center">Lampiran</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-center">GPS</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Memuat laporan...
                    </td>
                  </tr>
                )}
                {!listQ.isLoading && reports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      Tidak ada laporan dengan filter aktif
                    </td>
                  </tr>
                )}
                {reports.map((r) => {
                  const fileCount = r.files?.length ?? r.attachments?.length ?? 0;
                  const hasGps = !!(r.latitude && r.longitude);
                  return (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="font-bold text-slate-700">{r.date_label ?? r.formatted_date ?? r.date ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-bold text-slate-900">{r.student?.name ?? '-'}</p>
                        <p className="text-xs text-slate-500 font-mono">{r.student?.nim ?? ''}</p>
                        <p className="text-xs text-slate-400 truncate max-w-32">{r.student?.prodi ?? ''}</p>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <p className="font-medium text-slate-700">{r.kelompok?.name ?? r.group?.name ?? '-'}</p>
                        <p className="text-slate-500 truncate max-w-40">{r.kelompok?.location ?? r.group?.location ?? ''}</p>
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-medium text-slate-900 truncate max-w-72">{r.title ?? '-'}</p>
                        {r.activity && (
                          <p className="text-xs text-slate-500 truncate max-w-72">{r.activity}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={'rounded-full px-2 py-0.5 text-xs font-bold ' + (fileCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                          {fileCount > 0 ? `📎 ${fileCount}` : '–'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {hasGps ? (
                          <MapPin className="h-3.5 w-3.5 text-cyan-600 inline" />
                        ) : (
                          <span className="text-slate-300">–</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusPill status={r.status ?? 'draft'} label={r.status_label} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/admin/laporan/harian/${r.id}`}
                          className="inline-flex items-center gap-1 rounded p-1.5 text-cyan-600 hover:bg-cyan-50 text-xs font-bold"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between p-3 border-t text-sm">
              <span className="text-slate-500">
                {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total} laporan
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

function QualityCard({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-900">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={'h-full rounded-full ' + (pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{value.toLocaleString('id-ID')} dari {total.toLocaleString('id-ID')}</p>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = status.toLowerCase();
  const cls =
    s === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'submitted' || s === 'pending'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'revision'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const text =
    label ??
    (s === 'approved'
      ? 'Disetujui'
      : s === 'submitted'
      ? 'Menunggu'
      : s === 'revision'
      ? 'Revisi'
      : s === 'draft'
      ? 'Draft'
      : status);
  return <span className={'rounded-full border px-2 py-0.5 text-xs font-bold ' + cls}>{text}</span>;
}
