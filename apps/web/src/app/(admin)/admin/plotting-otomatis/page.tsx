'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, MapPin, Users, Loader2 } from 'lucide-react';

type Period = { id: number; name?: string; periode?: string };

type Member = {
  peserta_id: number;
  nim?: string;
  nama?: string;
  gender?: string;
  fakultas?: string;
  prodi?: string;
  origin_regency?: string;
  gpa?: number;
  sks?: number;
  semester?: number;
};

type GroupResult = {
  no: number;
  code: string;
  nama_kelompok: string;
  warnings?: string[];
  stats?: {
    total?: number;
    male?: number;
    female?: number;
    male_pct?: number;
    avg_gpa?: number;
    fakultas?: Record<string, number>;
    prodi?: Record<string, number>;
    origin_regencies?: Record<string, number>;
  };
  location?: {
    full_name?: string;
    village_name?: string;
    district_name?: string;
    regency_name?: string;
    address?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    maps_url?: string | null;
    capacity?: number | string | null;
    geofence_radius_meters?: number | string | null;
  };
  members: Member[];
};

type PlotResult = {
  mode?: 'simulasi' | 'real';
  safe_note?: string;
  meta?: Record<string, unknown>;
  summary: Record<string, number | string>;
  groups: GroupResult[];
  unplaced: Member[];
  applied?: boolean;
  message?: string;
};

function unwrap<T>(res: unknown): T {
  const r = res as { data?: { data?: T } };
  return (r.data?.data ?? r.data) as T;
}

export default function AutoPlottingPage(): React.JSX.Element {
  const [periodeId, setPeriodeId] = useState<number | ''>('');
  const [groupSize, setGroupSize] = useState(15);
  const [result, setResult] = useState<PlotResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterRegency, setFilterRegency] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'warning'>('all');

  const periods = useQuery({
    queryKey: ['admin', 'periode', 'plotting'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/periode');
      const body = (res.data as { data?: unknown }).data ?? res.data;
      // body could be array directly or { data: [...] } or { items: [...] }
      if (Array.isArray(body)) return body as Period[];
      const inner = body as { data?: Period[]; items?: Period[] };
      return (inner?.data ?? inner?.items ?? []) as Period[];
    },
  });
  const periodItems = periods.data ?? [];

  const simulate = useMutation({
    mutationFn: async () =>
      unwrap<PlotResult>(
        await rawApi.post(
          '/admin/plotting-otomatis/simulate',
          { periode_id: periodeId, group_size: groupSize },
          { timeout: 120000 },
        ),
      ),
    onSuccess: (data) => {
      setResult(data);
      setExpanded({});
      toast.success('Simulasi selesai. Data real tidak diubah.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Gagal';
      toast.error('Simulasi gagal: ' + msg);
    },
  });

  const apply = useMutation({
    mutationFn: async () =>
      unwrap<PlotResult>(
        await rawApi.post(
          '/admin/plotting-otomatis/apply',
          { periode_id: periodeId, group_size: groupSize, confirm: true, mode: 'real' },
          { timeout: 180000 },
        ),
      ),
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.message || 'Plotting diterapkan ke data real');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Gagal';
      toast.error('Apply gagal: ' + msg);
    },
  });

  const toggle = (code: string) => setExpanded((e) => ({ ...e, [code]: !e[code] }));

  const regencies = result ? [...new Set(result.groups.map((g) => g.location?.regency_name).filter(Boolean))] : [];

  const filtered =
    result?.groups.filter((g) => {
      if (filterRegency && g.location?.regency_name !== filterRegency) return false;
      if (filterStatus === 'ok' && (g.warnings?.length ?? 0) > 0) return false;
      if (filterStatus === 'warning' && (g.warnings?.length ?? 0) === 0) return false;
      return true;
    }) ?? [];

  const summaryStats = result
    ? {
        regencyDistribution: result.groups.reduce<Record<string, number>>((acc, g) => {
          const r = g.location?.regency_name ?? 'Unknown';
          acc[r] = (acc[r] ?? 0) + 1;
          return acc;
        }, {}),
        avgMalePct:
          result.groups.length > 0
            ? Math.round(
                (result.groups.reduce((s, g) => s + (g.stats?.male_pct ?? 0), 0) / result.groups.length) * 10,
              ) / 10
            : 0,
        avgGpa:
          result.groups.length > 0
            ? Math.round(
                (result.groups.reduce((s, g) => s + (g.stats?.avg_gpa ?? 0), 0) / result.groups.length) * 100,
              ) / 100
            : 0,
      }
    : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black uppercase text-slate-900">Plotting Otomatis KKN Reguler</h1>
        <p className="text-sm text-slate-500">
          Constraint: non-lokal (H1), 15 anggota/kelompok (H2), min 2 fakultas (H3), min 3 prodi (H4), gender 20-35% (S1).
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <p className="font-black text-teal-900">MODE SIMULASI</p>
          <p className="text-sm text-teal-800">Hitung preview saja. Tidak menulis ke DB.</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="font-black text-rose-900">MODE REAL</p>
          <p className="text-sm text-rose-800">Tulis kelompok_kkn dan update peserta_kkn.kelompok_id.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Periode</label>
          <select
            className="mt-1 h-10 min-w-72 rounded-lg border px-3"
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Pilih periode</option>
            {periodItems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.periode || `Periode #${p.id}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Anggota/kelompok</label>
          <input
            className="mt-1 h-10 w-24 rounded-lg border px-3"
            type="number"
            min={10}
            max={20}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value) || 15)}
          />
        </div>
        <button
          disabled={!periodeId || simulate.isPending}
          onClick={() => simulate.mutate()}
          className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
        >
          {simulate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {simulate.isPending ? 'Memproses...' : 'Jalankan Simulasi'}
        </button>
        <button
          disabled={!result || apply.isPending || (result?.summary?.unplaced ?? 1) !== 0 || (result?.summary?.violating_groups ?? 1) !== 0}
          onClick={() => {
            if (confirm('MODE REAL akan menulis ke DB produksi. Lanjutkan?')) apply.mutate();
          }}
          className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
        >
          {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {apply.isPending ? 'Menerapkan...' : 'Terapkan Real'}
        </button>
      </div>

      {simulate.isPending && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <p className="font-bold">Sedang menjalankan simulasi...</p>
            <p className="text-xs text-teal-700">Bisa memakan waktu hingga 30 detik untuk 2.000+ mahasiswa.</p>
          </div>
        </div>
      )}

      {result && (
        <>
          <div
            className={
              result.mode === 'real'
                ? 'rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900'
                : 'rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-900'
            }
          >
            {result.safe_note || (result.mode === 'real' ? 'Mode real diterapkan' : 'Mode simulasi: data tidak diubah')}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Mahasiswa</p>
              <p className="text-2xl font-black text-slate-900">{result.summary.students}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Kelompok</p>
              <p className="text-2xl font-black text-slate-900">{result.summary.groups}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Terplot</p>
              <p className="text-2xl font-black text-emerald-700">{result.summary.placed}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Belum Plot</p>
              <p className={'text-2xl font-black ' + (Number(result.summary.unplaced ?? 0) > 0 ? 'text-rose-700' : 'text-slate-900')}>
                {result.summary.unplaced}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Violations</p>
              <p className={'text-2xl font-black ' + (Number(result.summary.violating_groups ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                {result.summary.violating_groups}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Avg L%</p>
              <p className="text-2xl font-black text-slate-900">{summaryStats?.avgMalePct}%</p>
            </div>
          </div>

          {/* Distribusi per kabupaten */}
          {summaryStats && (
            <div className="rounded-2xl border bg-white p-5">
              <p className="mb-3 text-xs font-black uppercase text-slate-500">Distribusi Kelompok per Kabupaten</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(summaryStats.regencyDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([reg, count]) => {
                    const max = Math.max(...Object.values(summaryStats.regencyDistribution));
                    const pct = (count / max) * 100;
                    return (
                      <div key={reg} className="flex items-center gap-2">
                        <span className="w-32 text-sm font-bold text-slate-700">{reg}</span>
                        <div className="flex-1 h-6 rounded bg-slate-100 overflow-hidden relative">
                          <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
                            {count} kelompok
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="h-10 rounded-lg border px-3 text-sm"
              value={filterRegency}
              onChange={(e) => setFilterRegency(e.target.value)}
            >
              <option value="">Semua Kabupaten</option>
              {regencies.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border px-3 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'ok' | 'warning')}
            >
              <option value="all">Semua Status</option>
              <option value="ok">Hanya OK</option>
              <option value="warning">Hanya Warning</option>
            </select>
            <span className="text-xs text-slate-500">
              {filtered.length} dari {result.groups.length} kelompok
            </span>
          </div>

          {/* Groups list with expand */}
          <div className="space-y-2">
            {filtered.map((g) => {
              const isOpen = expanded[g.code];
              const hasWarning = (g.warnings?.length ?? 0) > 0;
              const stats = g.stats ?? {};
              return (
                <div key={g.code} className="rounded-xl border bg-white overflow-hidden">
                  <button
                    onClick={() => toggle(g.code)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{g.nama_kelompok}</span>
                          {hasWarning ? (
                            <AlertTriangle size={14} className="text-amber-600" />
                          ) : (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={12} />
                          {g.location?.full_name ?? '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-600">
                        <Users size={12} className="inline mr-1" />
                        {stats.total ?? 0}
                      </span>
                      <span className="text-slate-600">
                        L/P: <span className="font-bold">{stats.male ?? 0}/{stats.female ?? 0}</span> ({stats.male_pct ?? 0}%)
                      </span>
                      <span className="text-slate-600">
                        IPK: <span className="font-bold">{stats.avg_gpa ?? '-'}</span>
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t bg-slate-50 p-4 space-y-3">
                      {hasWarning && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <p className="text-xs font-black uppercase text-amber-800 mb-1">Warning</p>
                          <ul className="text-xs text-amber-900 list-disc pl-4">
                            {g.warnings!.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded bg-white p-2">
                          <p className="font-bold text-slate-500">Fakultas</p>
                          {Object.entries(stats.fakultas ?? {}).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-700">{k}</span>: <span className="font-bold">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded bg-white p-2">
                          <p className="font-bold text-slate-500">Prodi</p>
                          {Object.entries(stats.prodi ?? {}).slice(0, 6).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-700">{k}</span>: <span className="font-bold">{v}</span>
                            </div>
                          ))}
                          {Object.keys(stats.prodi ?? {}).length > 6 && (
                            <div className="text-slate-400">+{Object.keys(stats.prodi ?? {}).length - 6} lagi</div>
                          )}
                        </div>
                        <div className="rounded bg-white p-2">
                          <p className="font-bold text-slate-500">Asal</p>
                          {Object.entries(stats.origin_regencies ?? {}).slice(0, 6).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-700">{k}</span>: <span className="font-bold">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="p-2 text-left">NIM</th>
                              <th className="p-2 text-left">Nama</th>
                              <th className="p-2 text-left">G</th>
                              <th className="p-2 text-left">Fakultas</th>
                              <th className="p-2 text-left">Prodi</th>
                              <th className="p-2 text-left">IPK</th>
                              <th className="p-2 text-left">Asal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.members.map((m) => (
                              <tr key={m.peserta_id} className="border-t">
                                <td className="p-2 font-mono">{m.nim}</td>
                                <td className="p-2">{m.nama}</td>
                                <td className="p-2">{m.gender}</td>
                                <td className="p-2 text-slate-600">{m.fakultas ?? '-'}</td>
                                <td className="p-2 text-slate-600">{m.prodi ?? '-'}</td>
                                <td className="p-2">{m.gpa ?? '-'}</td>
                                <td className="p-2 text-slate-600">{m.origin_regency ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
