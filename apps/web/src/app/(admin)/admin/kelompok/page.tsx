'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  Users,
  Search,
  Upload,
  Trash2,
  MapPin,
  Download,
  Filter,
  Eye,
  Plus,
  X,
} from 'lucide-react';

type Period = { id: number; name?: string; periode?: string; is_active?: boolean; jenis_kkn?: { code?: string; name?: string } };

type Kelompok = {
  id: number;
  code?: string;
  nama_kelompok?: string;
  capacity?: number;
  peserta_count?: number;
  periode_id?: number;
  location_id?: number;
  lokasi?: {
    id: number;
    village_name?: string;
    district_name?: string;
    regency_name?: string;
    full_name?: string;
  };
  lokasi_manual?: string | null;
  dosen?: { id: number; nama?: string }[];
  periode?: Period;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export default function AdminKelompokPage(): React.JSX.Element {
  const qc = useQueryClient();
  const search = useSearchParams();
  const initialPeriodeId = search?.get('periode_id') ?? '';
  const initialPeriodeName = (search?.get('periode_name') ?? '').trim();
  const jenisKey = (search?.get('jenis_kkn') ?? '').trim();
  const manualMode = search?.get('mode') === 'manual';
  const manualLabelMap: Record<string, string> = {
    nusantara: 'KKN Nusantara',
    internasional: 'KKN Internasional',
    tematik: 'KKN Tematik',
    kolaborasi_ptkin: 'KKN Kolaborasi PTKIN',
    responsif: 'KKN Responsif',
    kampung_zakat_katana: 'KKN Kampung Zakat & Katana',
  };
  const manualLabel = manualLabelMap[jenisKey] ?? 'KKN Manual Non-Reguler';

  const [periodeId, setPeriodeId] = useState<string>(initialPeriodeId);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegency, setFilterRegency] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showCreate, setShowCreate] = useState(manualMode);
  const [createForm, setCreateForm] = useState({ periode_id: initialPeriodeId, code: '', nama_kelompok: '', capacity: '15', lokasi_manual: '' });

  const periodsQ = useQuery({
    queryKey: ['admin', 'periode', 'kelompok-filter', 'active-only'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/periode', { params: { active: 1, per_page: 200 } });
      const body = (res.data as { data?: unknown }).data ?? res.data;
      if (Array.isArray(body)) return (body as Period[]).filter((p) => p.is_active === true);
      const inner = body as { data?: Period[]; items?: Period[] };
      return ((inner?.data ?? inner?.items ?? []) as Period[]).filter((p) => p.is_active === true);
    },
  });
  const allPeriodItems = periodsQ.data ?? [];
  const normalizeJenis = (value: string): string => value.toLowerCase().replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, ' ').trim();
  const jenisAliases: Record<string, string[]> = {
    kampung_zakat_katana: ['kampung zakat katana', 'kampung zakat dan katana'],
    kolaborasi_ptkin: ['kolaborasi ptkin'],
  };
  const jenisNeedles = jenisKey
    ? [jenisKey, jenisKey.replace(/_/g, ' '), ...(jenisAliases[jenisKey] ?? [])].map(normalizeJenis).filter(Boolean)
    : [];
  const periodItems = jenisNeedles.length
    ? allPeriodItems.filter((p) => {
        const hay = normalizeJenis(`${p.jenis_kkn?.code ?? ''} ${p.jenis_kkn?.name ?? ''} ${p.name ?? ''} ${p.periode ?? ''}`);
        return jenisNeedles.some((needle) => hay.includes(needle));
      })
    : allPeriodItems;

  const activePeriodIds = useMemo(() => new Set(periodItems.map((p) => String(p.id))), [periodItems]);
  useEffect(() => {
    if (!periodeId && periodItems[0]?.id) {
      setPeriodeId(String(periodItems[0].id));
      setCreateForm((prev) => ({ ...prev, periode_id: String(periodItems[0].id) }));
    }
    if (periodeId && periodItems.length > 0 && !activePeriodIds.has(periodeId)) {
      setPeriodeId(String(periodItems[0]?.id ?? ''));
      setCreateForm((prev) => ({ ...prev, periode_id: String(periodItems[0]?.id ?? '') }));
    }
  }, [periodeId, periodItems, activePeriodIds]);

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = { periode_id: Number(createForm.periode_id), code: createForm.code.trim(), nama_kelompok: createForm.nama_kelompok.trim(), capacity: Number(createForm.capacity || 15), lokasi_manual: createForm.lokasi_manual.trim() || null, location_id: null };
      const res = await rawApi.post('/admin/kelompok', payload);
      return res.data;
    },
    onSuccess: () => { toast.success('Kelompok manual dibuat'); setShowCreate(false); setCreateForm({ periode_id: periodeId, code: '', nama_kelompok: '', capacity: '15', lokasi_manual: '' }); qc.invalidateQueries({ queryKey: ['admin', 'kelompok'] }); },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Gagal membuat kelompok'; toast.error(msg); },
  });

  const listQ = useQuery({
    queryKey: ['admin', 'kelompok', { periodeId, page, perPage, searchTerm }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (periodeId) params.periode_id = periodeId;
      if (searchTerm) params.search = searchTerm;
      const res = await rawApi.get('/admin/kelompok', { params });
      const body = res.data as { data?: Kelompok[]; meta?: Pagination };
      return { data: body.data ?? [], meta: body.meta };
    },
  });

  const allForStatsQ = useQuery({
    queryKey: ['admin', 'kelompok', 'stats', { periodeId }],
    queryFn: async () => {
      const params: Record<string, string | number> = { per_page: 9999 };
      if (periodeId) params.periode_id = periodeId;
      const res = await rawApi.get('/admin/kelompok', { params });
      const body = res.data as { data?: Kelompok[]; meta?: Pagination };
      return body.data ?? [];
    },
  });

  const stats = useMemo(() => {
    const all = allForStatsQ.data ?? [];
    const totalGroups = all.length;
    const totalPeserta = all.reduce((s, g) => s + (Number(g.peserta_count) || 0), 0);
    const totalKapasitas = all.reduce((s, g) => s + (Number(g.capacity) || 0), 0);
    const groupsWithDpl = all.filter((g) => (g.dosen?.length ?? 0) > 0).length;
    const byRegency: Record<string, number> = {};
    all.forEach((g) => {
      const r = g.lokasi?.regency_name ?? (g.lokasi_manual ? 'Lokasi manual' : 'Tanpa lokasi');
      byRegency[r] = (byRegency[r] ?? 0) + 1;
    });
    return { totalGroups, totalPeserta, totalKapasitas, groupsWithDpl, byRegency };
  }, [allForStatsQ.data]);

  const regencies = useMemo(() => Object.keys(stats.byRegency).sort(), [stats.byRegency]);

  // auto-select first matching manual period from jenis_kkn URL (e.g. nusantara)
  useEffect(() => {
    if (!manualMode || !jenisKey || periodeId || periodItems.length === 0) return;
    const first = periodItems[0];
    setPeriodeId(String(first.id));
    setCreateForm((prev) => ({ ...prev, periode_id: String(first.id) }));
  }, [manualMode, jenisKey, periodeId, periodItems]);

  const items = useMemo(() => listQ.data?.data ?? [], [listQ.data?.data]);
  const meta = listQ.data?.meta;

  const filtered = useMemo(() => {
    if (!filterRegency) return items;
    return items.filter((g) => (g.lokasi?.regency_name ?? (g.lokasi_manual ? 'Lokasi manual' : 'Tanpa lokasi')) === filterRegency);
  }, [items, filterRegency]);

  const del = useMutation({
    mutationFn: async (id: number) => {
      const res = await rawApi.delete(`/admin/kelompok/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Kelompok dihapus');
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'kelompok'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Gagal menghapus';
      toast.error(msg);
    },
  });

  const importMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await rawApi.post('/admin/kelompok/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: (resp: unknown) => {
      const r = ((resp as { data?: { created?: number; updated?: number; skipped?: number } }).data ?? resp) as {
        created?: number;
        updated?: number;
        skipped?: number;
      };
      toast.success(`Import selesai: ${r.created ?? 0} dibuat, ${r.updated ?? 0} diperbarui, ${r.skipped ?? 0} dilewati`);
      setImporting(false);
      qc.invalidateQueries({ queryKey: ['admin', 'kelompok'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Gagal import';
      toast.error(msg);
      setImporting(false);
    },
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    importMut.mutate(file);
    e.target.value = '';
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const exportCsv = () => {
    const all = allForStatsQ.data ?? [];
    if (!all.length) {
      toast.error('Belum ada kelompok');
      return;
    }
    const headers = ['code', 'nama_kelompok', 'periode', 'desa', 'kecamatan', 'kabupaten', 'kapasitas', 'jumlah_anggota', 'dpl'];
    const rows = all.map((g) => [
      g.code ?? '',
      g.nama_kelompok ?? '',
      g.periode?.name ?? g.periode?.periode ?? '',
      g.lokasi?.village_name ?? '',
      g.lokasi?.district_name ?? '',
      g.lokasi?.regency_name ?? '',
      g.capacity ?? '',
      g.peserta_count ?? 0,
      g.dosen?.[0]?.nama ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kelompok-kkn-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${all.length} kelompok diexport`);
  };

  const periodeName = periodItems.find((p) => String(p.id) === periodeId)?.name ?? initialPeriodeName;

  return (
    <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="mb-2 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-700">{manualMode ? 'Manual Placement' : 'Group Operations'}</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">{manualMode ? manualLabel : 'Manajemen Kelompok KKN'}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {manualMode ? 'Kelola kelompok manual, lokasi manual, peserta, import/export untuk jenis KKN ini.' : `${stats.totalGroups} kelompok • ${stats.totalPeserta} peserta terplot`}
            {periodeName ? ` • ${periodeName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
          <button
            onClick={exportCsv}
            disabled={!stats.totalGroups}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          {manualMode && (
            <button onClick={() => setShowCreate(true)} className="h-10 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-lg flex items-center gap-2">
              <Plus className="h-4 w-4" /> Buat Kelompok Manual
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? 'Mengimport...' : 'Import Excel'}
          </button>
        </div>
        </div>
      </div>

      {manualMode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <b>{manualLabel}.</b> Gunakan switch di Pusat Penempatan untuk pindah jenis KKN. Halaman ini sudah terfilter otomatis untuk jenis ini.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/admin/penempatan?mode=manual&jenis=${jenisKey}`} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800">← Switch Jenis KKN</Link>
            <button onClick={() => setShowCreate(true)} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">Buat Kelompok Manual</button>
            <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">Import Kelompok Manual</button>
            <Link href={`/admin/dosen/penugasan?jenis_kkn=${jenisKey}&mode=manual`} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800">Lanjut Assign DPL</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Kelompok" value={stats.totalGroups} />
        <StatCard label="Total Peserta" value={stats.totalPeserta} />
        <StatCard
          label="Kapasitas Tersedia"
          value={Math.max(0, stats.totalKapasitas - stats.totalPeserta)}
          color={stats.totalKapasitas > 0 && stats.totalPeserta >= stats.totalKapasitas ? 'rose' : 'emerald'}
        />
        <StatCard
          label="Kelompok ber-DPL"
          value={stats.groupsWithDpl}
          color={stats.groupsWithDpl < stats.totalGroups && stats.totalGroups > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Per-regency cards */}
      {Object.keys(stats.byRegency).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats.byRegency)
            .sort(([, a], [, b]) => b - a)
            .map(([reg, count]) => (
              <button
                key={reg}
                onClick={() => {
                  setFilterRegency(filterRegency === reg ? '' : reg);
                  setPage(1);
                }}
                className={
                  'rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ' +
                  (filterRegency === reg
                    ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                    : 'border-slate-200 bg-white hover:border-cyan-300')
                }
              >
                <p className="text-xs font-bold uppercase text-slate-500 truncate">{reg}</p>
                <p className="text-2xl font-black text-cyan-700 mt-1">{count}</p>
                <p className="text-[10px] text-slate-500">kelompok</p>
              </button>
            ))}
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 min-w-72"
          value={periodeId}
          onChange={(e) => {
            setPeriodeId(e.target.value);
            setPage(1);
          }}
          disabled={periodsQ.isLoading}
        >
          {periodItems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.periode || `Periode #${p.id}`}
              {p.is_active ? ' (aktif)' : ''}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          value={filterRegency}
          onChange={(e) => {
            setFilterRegency(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Kabupaten</option>
          {regencies.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <form onSubmit={submitSearch} className="flex gap-2 flex-1 min-w-72">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder="Cari nama atau kode kelompok..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            Cari
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
              }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 text-slate-600"
            >
              Reset
            </button>
          )}
        </form>
        <select
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
      </div>

      <p className="text-xs text-slate-600 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 shadow-sm">
        💡 Format Excel: <code>kode_kelompok, nama_kelompok, desa, kecamatan, kabupaten, kapasitas</code>. Atau gunakan halaman <Link href="/admin/plotting-otomatis" className="font-bold underline">Plotting Otomatis</Link> untuk generate kelompok dari peserta KKN.
      </p>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-cyan-50 text-left">
              <tr className="border-b">
                <th className="px-4 py-3 font-bold text-slate-600">Kelompok</th>
                <th className="px-4 py-3 font-bold text-slate-600">Lokasi</th>
                <th className="px-4 py-3 font-bold text-slate-600">DPL</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-center">Anggota</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-center">Kapasitas</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Memuat kelompok...
                  </td>
                </tr>
              )}
              {!listQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Belum ada kelompok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Import Excel atau jalankan{' '}
                      <Link href="/admin/plotting-otomatis" className="text-cyan-600 hover:underline">
                        Plotting Otomatis
                      </Link>
                    </p>
                  </td>
                </tr>
              )}
              {filtered.map((g) => {
                const isPenuh = (g.peserta_count ?? 0) >= (g.capacity ?? 999);
                return (
                  <tr key={g.id} className="border-b transition-colors hover:bg-cyan-50/40">
                    <td className="px-4 py-2">
                      <p className="font-bold text-slate-900">{g.nama_kelompok ?? '-'}</p>
                      <p className="text-xs text-slate-500 font-mono">{g.code ?? '-'}</p>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {g.lokasi ? (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-cyan-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-700">{g.lokasi.village_name}</p>
                            <p className="text-slate-500">
                              {g.lokasi.district_name}, {g.lokasi.regency_name}
                            </p>
                          </div>
                        </div>
                      ) : g.lokasi_manual ? (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-700">{g.lokasi_manual}</p>
                            <p className="text-slate-500">Lokasi manual</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Belum ada lokasi</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {g.dosen?.[0]?.nama ?? <span className="text-amber-600">Belum ada DPL</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="font-bold text-slate-900">{g.peserta_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={'font-bold ' + (isPenuh ? 'text-rose-700' : 'text-slate-700')}>{g.capacity ?? '-'}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/kelompok/${g.id}`}
                          className="rounded p-1.5 text-cyan-600 hover:bg-cyan-50"
                          title="Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setConfirmId(g.id)}
                          className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
              {meta.from ?? 0}-{meta.to ?? 0} dari {meta.total} kelompok
            </span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">
                ← Prev
              </button>
              <span className="rounded border px-3 py-1 text-xs bg-slate-100">
                {page} / {meta.last_page}
              </span>
              <button disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between"><h2 className="font-black text-lg text-slate-900">Buat Kelompok Manual</h2><button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <label className="block text-sm font-bold">Periode<select required className="mt-1 h-10 w-full rounded-lg border px-3" value={createForm.periode_id} onChange={(e) => { setCreateForm({ ...createForm, periode_id: e.target.value }); setPeriodeId(e.target.value); }}>{periodItems.map((p) => <option key={p.id} value={p.id}>{p.name || p.periode || 'Periode #' + p.id}</option>)}</select></label>
              <label className="block text-sm font-bold">Kode Kelompok<input required className="mt-1 h-10 w-full rounded-lg border px-3" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })} placeholder="MISAL: NUS-01" /></label>
              <label className="block text-sm font-bold">Nama Kelompok<input required className="mt-1 h-10 w-full rounded-lg border px-3" value={createForm.nama_kelompok} onChange={(e) => setCreateForm({ ...createForm, nama_kelompok: e.target.value })} placeholder="Kelompok Nusantara 1" /></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="block text-sm font-bold">Kapasitas<input type="number" min="1" className="mt-1 h-10 w-full rounded-lg border px-3" value={createForm.capacity} onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })} /></label><label className="block text-sm font-bold">Lokasi Manual<input required className="mt-1 h-10 w-full rounded-lg border px-3" value={createForm.lokasi_manual} onChange={(e) => setCreateForm({ ...createForm, lokasi_manual: e.target.value })} placeholder="Malaysia / Kampus UIN Saizu / Rumah masing-masing" /></label></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowCreate(false)} className="h-10 rounded-lg border px-4 text-sm font-bold">Batal</button><button disabled={createMut.isPending} className="h-10 rounded-lg bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50">{createMut.isPending ? 'Menyimpan...' : 'Simpan Kelompok'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="font-black text-lg text-rose-700">Hapus Kelompok</h2>
              <p className="text-sm text-slate-600 mt-1">
                Kelompok ini akan dihapus permanen beserta data anggotanya. Aksi tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="h-10 rounded-lg border px-4 text-sm font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => del.mutate(confirmId)}
                disabled={del.isPending}
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
              >
                {del.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'slate' }: { label: string; value: number; color?: 'slate' | 'emerald' | 'rose' | 'amber' }) {
  const cl =
    color === 'emerald'
      ? 'text-emerald-700'
      : color === 'rose'
      ? 'text-rose-700'
      : color === 'amber'
      ? 'text-amber-700'
      : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
      <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
      <p className={'text-2xl font-black ' + cl}>{value.toLocaleString('id-ID')}</p>
    </div>
  );
}
