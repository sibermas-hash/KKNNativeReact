'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';

type Period = { id: number; name?: string; periode?: string };

type Member = {
  peserta_id: number;
  mahasiswa_id?: number;
  nim?: string;
  nama?: string;
  gender?: string;
  fakultas?: string;
  prodi?: string;
  origin_regency?: string;
  alamat?: string;
  phone?: string;
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
    capacity?: number | string | null;
  };
  members: Member[];
};

type PlotResult = {
  mode?: 'simulasi' | 'real';
  safe_note?: string;
  meta?: {
    generated_at?: string;
    students_by_gender?: Record<string, number>;
    students_by_fakultas?: Record<string, number>;
    students_by_prodi?: Record<string, number>;
    target_regencies?: string[];
    location_candidates?: number;
  };
  summary: {
    students?: number;
    groups?: number;
    placed?: number;
    unplaced?: number;
    violating_groups?: number;
    group_size?: number;
  };
  groups: GroupResult[];
  unplaced: Member[];
  applied?: boolean;
  message?: string;
};

type LogEntry = { time: string; type: 'info' | 'success' | 'warn' | 'error'; message: string };

type ExternalKebumenResult = {
  periode_id?: number | null;
  summary?: { external_unplaced?: number; internal_unplaced?: number; locations_kebumen?: number; groups_needed?: number; internal_needed?: number; can_apply?: boolean };
  groups?: Array<{ no: number; code: string; name: string; location?: { village_name?: string; district_name?: string; regency_name?: string } | null; external_members?: Member[]; internal_members?: Member[]; stats?: { total?: number; external?: number; internal?: number; male?: number; female?: number } }>;
  warnings?: string[];
  applied?: boolean;
  message?: string;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function AutoPlottingPage(): React.JSX.Element {
  const [periodeId, setPeriodeId] = useState<number | ''>('');
  const [groupSize, setGroupSize] = useState(15);
  const [result, setResult] = useState<PlotResult | null>(null);
  const [tab, setTab] = useState<'kelompok' | 'kabupaten' | 'statistik' | 'log'>('kelompok');
  const [filterRegency, setFilterRegency] = useState('');
  const [filterFakultas, setFilterFakultas] = useState('');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: new Date().toLocaleTimeString('id-ID'), type: 'info', message: 'Sistem siap. Klik Jalankan Simulasi untuk memulai.' },
  ]);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runDuration, setRunDuration] = useState<number | null>(null);
  const [externalResult, setExternalResult] = useState<ExternalKebumenResult | null>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString('id-ID'), type, message }]);
  };

  const periods = useQuery({
    queryKey: ['admin', 'periode', 'plotting'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/periode');
      const body = (res.data as { data?: unknown }).data ?? res.data;
      if (Array.isArray(body)) return body as Period[];
      const inner = body as { data?: Period[]; items?: Period[] };
      return (inner?.data ?? inner?.items ?? []) as Period[];
    },
  });

  const periodItems: Period[] = periods.data ?? [];

  const simulate = useMutation({
    mutationFn: async () => {
      setRunStartedAt(Date.now());
      addLog('info', `Memulai simulasi periode #${periodeId} • ukuran kelompok ${groupSize}`);
      const res = await rawApi.post(
        '/admin/plotting-otomatis/simulate',
        { periode_id: periodeId, group_size: groupSize },
        { timeout: 120000 },
      );
      const body = res.data as { data?: PlotResult };
      return (body?.data ?? (res.data as PlotResult)) as PlotResult;
    },
    onSuccess: (data) => {
      const dur = runStartedAt ? (Date.now() - runStartedAt) / 1000 : 0;
      setRunDuration(dur);
      setResult(data);
      addLog('success', `Selesai dalam ${dur.toFixed(2)}s — ${data.summary.groups} kelompok, ${data.summary.placed} mahasiswa`);
      if ((data.summary.violating_groups ?? 0) > 0) {
        addLog('warn', `${data.summary.violating_groups} kelompok melanggar constraint`);
      } else {
        addLog('success', 'Semua kelompok memenuhi H1-H4 + S1');
      }
      if ((data.summary.unplaced ?? 0) > 0) {
        addLog('warn', `${data.summary.unplaced} mahasiswa belum terplot`);
      }
      toast.success(`Simulasi selesai dalam ${dur.toFixed(2)}s`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Gagal';
      addLog('error', `Simulasi gagal: ${msg}`);
      toast.error('Simulasi gagal: ' + msg);
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      addLog('warn', 'MODE REAL: menulis kelompok_kkn dan update peserta_kkn.kelompok_id...');
      const res = await rawApi.post(
        '/admin/plotting-otomatis/apply',
        { periode_id: periodeId, group_size: groupSize, confirm: true, mode: 'real' },
        { timeout: 180000 },
      );
      const body = res.data as { data?: PlotResult };
      return (body?.data ?? (res.data as PlotResult)) as PlotResult;
    },
    onSuccess: (data) => {
      setResult(data);
      addLog('success', data.message || 'Plotting diterapkan ke data real');
      toast.success(data.message || 'Plotting diterapkan ke DB');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Gagal';
      addLog('error', `Apply gagal: ${msg}`);
      toast.error('Apply gagal: ' + msg);
    },
  });


  const externalPreview = useMutation({
    mutationFn: async () => {
      addLog('info', 'Preview plotting peserta eksternal Kebumen...');
      const res = await rawApi.post('/admin/plotting-otomatis/external-kebumen/preview', { periode_id: periodeId || undefined }, { timeout: 120000 });
      const body = res.data as { data?: ExternalKebumenResult };
      return (body?.data ?? (res.data as ExternalKebumenResult)) as ExternalKebumenResult;
    },
    onSuccess: (data) => {
      setExternalResult(data);
      addLog('success', `Preview Kebumen: ${data.summary?.groups_needed ?? 0} kelompok, ${data.summary?.external_unplaced ?? 0} eksternal`);
      (data.warnings ?? []).forEach((w) => addLog('warn', w));
      toast.success('Preview eksternal Kebumen selesai');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Gagal';
      addLog('error', `Preview Kebumen gagal: ${msg}`);
      toast.error('Preview Kebumen gagal: ' + msg);
    },
  });

  const externalApply = useMutation({
    mutationFn: async () => {
      addLog('warn', 'MODE REAL: menerapkan plotting eksternal Kebumen...');
      const res = await rawApi.post('/admin/plotting-otomatis/external-kebumen/apply', { periode_id: (externalResult?.periode_id ?? periodeId) || undefined, confirm: true }, { timeout: 180000 });
      const body = res.data as { data?: ExternalKebumenResult };
      return (body?.data ?? (res.data as ExternalKebumenResult)) as ExternalKebumenResult;
    },
    onSuccess: (data) => {
      setExternalResult(data);
      addLog(data.applied ? 'success' : 'warn', data.message || 'Apply Kebumen selesai');
      toast.success(data.message || 'Apply Kebumen selesai');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Gagal';
      addLog('error', `Apply Kebumen gagal: ${msg}`);
      toast.error('Apply Kebumen gagal: ' + msg);
    },
  });

  const regencies = useMemo(
    () => (result ? [...new Set(result.groups.map((g) => g.location?.regency_name).filter(Boolean) as string[])] : []),
    [result],
  );
  const fakultasOptions = useMemo(() => {
    if (!result) return [];
    const set = new Set<string>();
    result.groups.forEach((g) => {
      Object.keys(g.stats?.fakultas ?? {}).forEach((f) => set.add(f));
    });
    return [...set];
  }, [result]);

  const filtered = useMemo(() => {
    if (!result) return [];
    const s = search.trim().toLowerCase();
    return result.groups.filter((g) => {
      if (filterRegency && g.location?.regency_name !== filterRegency) return false;
      if (filterFakultas && !(g.stats?.fakultas ?? {})[filterFakultas]) return false;
      if (s) {
        const hit = g.members.some(
          (m) => m.nama?.toLowerCase().includes(s) || m.nim?.toLowerCase().includes(s),
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [result, filterRegency, filterFakultas, search]);

  const compliance = useMemo(() => {
    if (!result) return null;
    const total = result.groups.length;
    let h1 = 0, h2 = 0, h3 = 0, h4 = 0, s1 = 0;
    result.groups.forEach((g) => {
      const stats = g.stats ?? {};
      const memTotal = stats.total ?? 0;
      const fakCount = Object.keys(stats.fakultas ?? {}).length;
      const prodiCount = Object.keys(stats.prodi ?? {}).length;
      const malePct = stats.male_pct ?? 0;
      const localViol = g.warnings?.some((w) => /asal/i.test(w) || /lokal/i.test(w));
      if (!localViol) h1++;
      if (memTotal === groupSize) h2++;
      if (fakCount >= 2) h3++;
      if (prodiCount >= 3) h4++;
      if (malePct >= 20 && malePct <= 35) s1++;
    });
    return { total, h1, h2, h3, h4, s1 };
  }, [result, groupSize]);

  const regencyDist = useMemo(() => {
    if (!result) return {};
    return result.groups.reduce<Record<string, number>>((acc, g) => {
      const r = g.location?.regency_name ?? 'Unknown';
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
  }, [result]);

  const genderRatioDist = useMemo(() => {
    if (!result) return {} as Record<number, number>;
    const dist: Record<number, number> = {};
    result.groups.forEach((g) => {
      const ratio = Math.round(g.stats?.male_pct ?? 0);
      dist[ratio] = (dist[ratio] ?? 0) + 1;
    });
    return dist;
  }, [result]);

  const fakultasDist = useMemo(() => result?.meta?.students_by_fakultas ?? {}, [result]);

  // Auto-show results tab on success
  useEffect(() => {
    if (result) setTab('kelompok');
  }, [result]);

  // Build flat row export (per member)
  const buildRows = () => {
    if (!result) return [];
    return result.groups.flatMap((g) =>
      g.members.map((m, i) => ({
        Kelompok: g.nama_kelompok,
        Kode: g.code,
        Kabupaten: g.location?.regency_name ?? '',
        Kecamatan: g.location?.district_name ?? '',
        Desa: g.location?.village_name ?? '',
        No: i + 1,
        NIM: m.nim ?? '',
        Nama: m.nama ?? '',
        Fakultas: m.fakultas ?? '',
        Prodi: m.prodi ?? '',
        Gender: m.gender ?? '',
        IPK: m.gpa ?? '',
        SKS: m.sks ?? '',
        'Asal Kabupaten': m.origin_regency ?? '',
      })),
    );
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = buildRows();
    const headers = Object.keys(rows[0] ?? {});
    const csvCell = (v: unknown) => {
      const text = String(v ?? '');
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell((r as Record<string, unknown>)[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plotting-kkn-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'CSV berhasil di-export');
  };

  const exportXlsx = async () => {
    if (!result) return;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      const XLSX = (window as unknown as { XLSX: { utils: { book_new: () => unknown; json_to_sheet: (rows: unknown[]) => unknown; book_append_sheet: (wb: unknown, ws: unknown, name: string) => void }; writeFile: (wb: unknown, filename: string) => void } }).XLSX;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(buildRows());
      XLSX.utils.book_append_sheet(wb, ws, 'Hasil Plotting');
      XLSX.writeFile(wb, `plotting-kkn-${Date.now()}.xlsx`);
      addLog('success', 'XLSX berhasil di-export');
    } catch (e) {
      addLog('error', `Gagal load XLSX: ${(e as Error).message}`);
      toast.error('Gagal load library XLSX');
    }
  };

  const exportPdf = async () => {
    if (!result) return;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js');
      type AutoTablePdf = { autoTable: (opts: Record<string, unknown>) => void };
      const winPdf = (window as unknown as { jspdf: { jsPDF: new (opts?: Record<string, unknown>) => AutoTablePdf & { setFontSize: (n: number) => void; text: (s: string, x: number, y: number) => void; save: (n: string) => void } } }).jspdf;
      const doc = new winPdf.jsPDF({ orientation: 'landscape' });
      const rows = buildRows();
      doc.setFontSize(14);
      doc.text(`Hasil Plotting KKN (${result.mode === 'real' ? 'REAL' : 'SIMULASI'})`, 14, 14);
      doc.setFontSize(9);
      doc.text(`Total: ${rows.length} mahasiswa, ${result.groups.length} kelompok`, 14, 21);
      doc.autoTable({
        startY: 26,
        head: [Object.keys(rows[0] ?? {})],
        body: rows.map((r) => Object.values(r as Record<string, unknown>)),
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 8, right: 8 },
      });
      doc.save(`plotting-kkn-${Date.now()}.pdf`);
      addLog('success', 'PDF berhasil di-export');
    } catch (e) {
      addLog('error', `Gagal load PDF: ${(e as Error).message}`);
      toast.error('Gagal load library PDF');
    }
  };

  const reset = () => {
    setResult(null);
    setRunDuration(null);
    setRunStartedAt(null);
    setLogs([{ time: new Date().toLocaleTimeString('id-ID'), type: 'info', message: 'Reset. Sistem siap.' }]);
    addLog('info', 'Hasil dibersihkan');
  };

  const meta = result?.meta;

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
        <b>Plotting otomatis hanya untuk KKN Reguler.</b> KKN non-Reguler memakai workflow manual lewat Penempatan KKN → TAB Manual.
      </div>
      <div>
        <h1 className="text-2xl font-black uppercase text-slate-900">Plotting Otomatis KKN Reguler</h1>
        <p className="text-sm text-slate-500">
          Algoritma greedy + diversity scoring. Constraint: H1 non-lokal, H2 ukuran kelompok, H3 ≥2 fakultas, H4 ≥3 prodi, S1 gender 20-35%.
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
            disabled={periods.isLoading}
          >
            <option value="">{periods.isLoading ? 'Memuat...' : 'Pilih periode'}</option>
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
          {simulate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {simulate.isPending ? 'Memproses...' : 'Jalankan Simulasi'}
        </button>
        <button
          disabled={!result || simulate.isPending}
          onClick={() => simulate.mutate()}
          className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Acak Ulang
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
        <button
          disabled={externalPreview.isPending}
          onClick={() => externalPreview.mutate()}
          className="h-10 rounded-lg bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
        >
          {externalPreview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Preview Eksternal Kebumen
        </button>
        <button
          disabled={!externalResult?.summary?.can_apply || externalApply.isPending}
          onClick={() => {
            if (confirm('MODE REAL: terapkan plotting peserta eksternal Kebumen ke DB produksi?')) externalApply.mutate();
          }}
          className="h-10 rounded-lg bg-orange-700 px-4 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
        >
          {externalApply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Apply Eksternal Kebumen
        </button>        <button
          disabled={!result}
          onClick={reset}
          className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50"
        >
          Reset
        </button>
        {result && (
          <>
            <div className="flex-1" />
            <button onClick={exportCsv} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 flex items-center gap-2">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button onClick={exportXlsx} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" /> XLSX
            </button>
            <button onClick={exportPdf} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
          </>
        )}
      </div>

      {externalResult && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-black uppercase">Plotting Eksternal Kebumen</p>
              <p>Periode #{externalResult.periode_id ?? '-'} • {externalResult.summary?.groups_needed ?? 0} kelompok • {externalResult.summary?.external_unplaced ?? 0} eksternal • butuh {externalResult.summary?.internal_needed ?? 0} internal</p>
            </div>
            <span className={externalResult.summary?.can_apply ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700' : 'rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700'}>
              {externalResult.summary?.can_apply ? 'SIAP APPLY' : 'BELUM SIAP'}
            </span>
          </div>
          {(externalResult.warnings ?? []).length > 0 && <ul className="mb-3 list-disc pl-5 text-rose-700">{(externalResult.warnings ?? []).map((w, i) => <li key={i}>{w}</li>)}</ul>}
          <div className="grid gap-2 md:grid-cols-2">
            {(externalResult.groups ?? []).map((g) => (
              <div key={g.code} className="rounded-xl border border-amber-200 bg-white p-3">
                <p className="font-black">{g.name}</p>
                <p className="text-xs text-slate-600">{g.location?.village_name ?? '-'}, {g.location?.district_name ?? '-'} • eksternal {g.stats?.external ?? 0}, internal {g.stats?.internal ?? 0}, total {g.stats?.total ?? 0}</p>
                <p className="mt-1 text-xs">Eksternal: {(g.external_members ?? []).map((m) => m.nama).join(', ') || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
            {runDuration ? ` • Selesai dalam ${runDuration.toFixed(2)}s` : ''}
          </div>

          {/* Stats grid 6 cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard label="Mahasiswa" value={result.summary.students ?? 0} />
            <StatCard label="Laki-laki" value={meta?.students_by_gender?.L ?? 0} />
            <StatCard label="Perempuan" value={meta?.students_by_gender?.P ?? 0} />
            <StatCard label="Kelompok" value={result.summary.groups ?? 0} />
            <StatCard label="Terplot" value={result.summary.placed ?? 0} color="emerald" />
            <StatCard
              label="Belum Plot"
              value={result.summary.unplaced ?? 0}
              color={(result.summary.unplaced ?? 0) > 0 ? 'rose' : 'slate'}
            />
          </div>

          {/* Constraint validation panel */}
          {compliance && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase text-slate-500">Constraint Compliance</p>
              <div className="flex flex-wrap gap-2">
                <ConstraintPill name="H1 Non-Lokal" pass={compliance.h1} total={compliance.total} />
                <ConstraintPill name="H2 Ukuran" pass={compliance.h2} total={compliance.total} />
                <ConstraintPill name="H3 ≥2 Fakultas" pass={compliance.h3} total={compliance.total} />
                <ConstraintPill name="H4 ≥3 Prodi" pass={compliance.h4} total={compliance.total} />
                <ConstraintPill name="S1 Gender 20-35%" pass={compliance.s1} total={compliance.total} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-1">
              {(['kelompok', 'kabupaten', 'statistik', 'log'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    'px-4 py-2 text-sm font-bold uppercase border-b-2 ' +
                    (tab === t ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-500 hover:text-slate-900')
                  }
                >
                  {t === 'kelompok' ? `Kelompok (${result.groups.length})` : t}
                </button>
              ))}
            </div>
          </div>

          {tab === 'kelompok' && (
            <>
              <div className="flex flex-wrap gap-3 items-center">
                <Filter className="h-4 w-4 text-slate-400" />
                <select className="h-10 rounded-lg border px-3 text-sm" value={filterRegency} onChange={(e) => setFilterRegency(e.target.value)}>
                  <option value="">Semua Kabupaten</option>
                  {regencies.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select className="h-10 rounded-lg border px-3 text-sm" value={filterFakultas} onChange={(e) => setFilterFakultas(e.target.value)}>
                  <option value="">Semua Fakultas</option>
                  {fakultasOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    className="h-10 rounded-lg border pl-9 pr-3 text-sm w-64"
                    placeholder="Cari nama atau NIM..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {filtered.length} dari {result.groups.length} kelompok
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((g) => {
                  const stats = g.stats ?? {};
                  const malePct = stats.male_pct ?? 0;
                  const genderOK = malePct >= 20 && malePct <= 35;
                  const fakOK = Object.keys(stats.fakultas ?? {}).length >= 2;
                  const prodiOK = Object.keys(stats.prodi ?? {}).length >= 3;
                  const allOK = genderOK && fakOK && prodiOK && !(g.warnings?.length ?? 0);
                  return (
                    <div key={g.code} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{g.nama_kelompok}</span>
                          {allOK ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-600" />
                          )}
                        </div>
                        <span className="rounded bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">{g.location?.regency_name ?? '-'}</span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                          <MapPin size={12} /> Kec. {g.location?.district_name}, Ds. {g.location?.village_name}
                        </p>
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                          {g.members.slice(0, 15).map((m, i) => (
                            <div key={m.peserta_id} className="flex items-center justify-between border-b border-slate-100 py-1 text-xs">
                              <span className="font-medium text-slate-700">
                                {i + 1}. {m.nama}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                {m.gender} · {(m.prodi ?? '').split(' ')[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-50 border-t p-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                        <span className="text-slate-500">
                          <Users size={10} className="inline mr-0.5" />
                          <b className="text-slate-900">{stats.total ?? 0}</b> anggota
                        </span>
                        <span className="text-slate-500">
                          <b className={genderOK ? 'text-emerald-700' : 'text-amber-700'}>{stats.male ?? 0}L</b> ({malePct}%)
                        </span>
                        <span className="text-slate-500">
                          <b className="text-slate-900">{stats.female ?? 0}P</b>
                        </span>
                        <span className="text-slate-500">
                          <b className={fakOK ? 'text-emerald-700' : 'text-amber-700'}>{Object.keys(stats.fakultas ?? {}).length}</b> fak
                        </span>
                        <span className="text-slate-500">
                          <b className={prodiOK ? 'text-emerald-700' : 'text-amber-700'}>{Object.keys(stats.prodi ?? {}).length}</b> prodi
                        </span>
                        <span className="text-slate-500">
                          IPK <b className="text-slate-900">{stats.avg_gpa ?? '-'}</b>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'kabupaten' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(regencyDist)
                .sort(([, a], [, b]) => b - a)
                .map(([reg, count]) => {
                  const groups = result.groups.filter((g) => g.location?.regency_name === reg);
                  const totalAnggota = groups.reduce((s, g) => s + (g.stats?.total ?? 0), 0);
                  const totalL = groups.reduce((s, g) => s + (g.stats?.male ?? 0), 0);
                  const totalP = groups.reduce((s, g) => s + (g.stats?.female ?? 0), 0);
                  const allFak = new Set<string>();
                  const allProdi = new Set<string>();
                  groups.forEach((g) => {
                    Object.keys(g.stats?.fakultas ?? {}).forEach((f) => allFak.add(f));
                    Object.keys(g.stats?.prodi ?? {}).forEach((p) => allProdi.add(p));
                  });
                  const avgIpk =
                    groups.length > 0
                      ? Math.round((groups.reduce((s, g) => s + (g.stats?.avg_gpa ?? 0), 0) / groups.length) * 100) / 100
                      : 0;
                  const ratio = totalAnggota > 0 ? Math.round((totalL / totalAnggota) * 1000) / 10 : 0;
                  return (
                    <div key={reg} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <h4 className="font-black text-teal-700 text-sm mb-3">{reg}</h4>
                      <div className="space-y-1.5 text-sm">
                        <Row k="Kelompok" v={count} />
                        <Row k="Total Anggota" v={totalAnggota} />
                        <Row k="Laki-laki" v={`${totalL} (${ratio}%)`} />
                        <Row k="Perempuan" v={totalP} />
                        <Row k="Fakultas" v={allFak.size} />
                        <Row k="Prodi" v={allProdi.size} />
                        <Row k="Rata-rata IPK" v={avgIpk} />
                      </div>
                      <div className="mt-3 flex items-end gap-1 h-16 border-b">
                        {groups.slice(0, 12).map((g) => {
                          const h = ((g.stats?.total ?? 0) / groupSize) * 100;
                          return (
                            <div
                              key={g.code}
                              className="flex-1 bg-teal-500 rounded-t"
                              style={{ height: `${h}%`, minWidth: 8 }}
                              title={`${g.nama_kelompok}: ${g.stats?.total} anggota`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {tab === 'statistik' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compliance && (
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h4 className="font-black text-teal-700 text-sm mb-3">Compliance Rate</h4>
                  <div className="space-y-2">
                    <ComplianceRow label="H1 Non-Lokal" pass={compliance.h1} total={compliance.total} />
                    <ComplianceRow label="H2 Ukuran" pass={compliance.h2} total={compliance.total} />
                    <ComplianceRow label="H3 ≥2 Fakultas" pass={compliance.h3} total={compliance.total} />
                    <ComplianceRow label="H4 ≥3 Prodi" pass={compliance.h4} total={compliance.total} />
                    <ComplianceRow label="S1 Gender 20-35%" pass={compliance.s1} total={compliance.total} />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h4 className="font-black text-teal-700 text-sm mb-3">Distribusi Gender per Kelompok</h4>
                <div className="space-y-1">
                  {Object.entries(genderRatioDist)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([ratio, count]) => {
                      const max = Math.max(...Object.values(genderRatioDist));
                      const w = (count / max) * 100;
                      const inRange = Number(ratio) >= 20 && Number(ratio) <= 35;
                      return (
                        <div key={ratio} className="flex items-center gap-2">
                          <span className="w-10 text-xs text-right text-slate-600">{ratio}%</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                            <div className={`h-full ${inRange ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${w}%` }} />
                          </div>
                          <span className="w-8 text-xs text-slate-700">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm md:col-span-2">
                <h4 className="font-black text-teal-700 text-sm mb-3">Distribusi Mahasiswa per Fakultas</h4>
                <div className="space-y-1">
                  {Object.entries(fakultasDist)
                    .sort(([, a], [, b]) => b - a)
                    .map(([fak, count]) => {
                      const total = result.summary.students ?? 1;
                      const w = (count / total) * 100;
                      return (
                        <div key={fak} className="flex items-center gap-2">
                          <span className="w-72 text-xs text-slate-700 truncate">{fak}</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: `${w}%` }} />
                          </div>
                          <span className="w-20 text-xs text-slate-700 text-right">
                            {count} ({w.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {tab === 'log' && (
            <div className="rounded-2xl border bg-slate-900 text-slate-100 p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((l, i) => (
                <div key={i} className="border-b border-slate-800 py-1">
                  <span className="text-slate-500">[{l.time}]</span>{' '}
                  <span
                    className={
                      l.type === 'success'
                        ? 'text-emerald-400'
                        : l.type === 'warn'
                        ? 'text-amber-400'
                        : l.type === 'error'
                        ? 'text-rose-400'
                        : 'text-cyan-400'
                    }
                  >
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(result.summary.unplaced ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold mb-1">{result.summary.unplaced} mahasiswa belum terplot:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs mt-2">
                {result.unplaced.slice(0, 20).map((m) => (
                  <div key={m.peserta_id} className="bg-white rounded px-2 py-1 border border-amber-200">
                    {m.nim} - {m.nama}
                  </div>
                ))}
                {result.unplaced.length > 20 && <div className="text-amber-700">+{result.unplaced.length - 20} lainnya</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'slate' }: { label: string; value: number | string; color?: 'slate' | 'emerald' | 'rose' }) {
  const cl = color === 'emerald' ? 'text-emerald-700' : color === 'rose' ? 'text-rose-700' : 'text-slate-900';
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
      <p className={'text-2xl font-black ' + cl}>{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p>
    </div>
  );
}

function ConstraintPill({ name, pass, total }: { name: string; pass: number; total: number }) {
  const ok = pass === total;
  return (
    <div
      className={
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs ' +
        (ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-amber-50 border border-amber-200 text-amber-900')
      }
    >
      <div className={'h-2 w-2 rounded-full ' + (ok ? 'bg-emerald-500' : 'bg-amber-500')} />
      <span className="font-bold">{name}</span>
      <span className="text-slate-600">
        {pass}/{total}
      </span>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="font-bold text-slate-900">{v}</span>
    </div>
  );
}

function ComplianceRow({ label, pass, total }: { label: string; pass: number; total: number }) {
  const pct = total > 0 ? (pass / total) * 100 : 0;
  const ok = pass === total;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={'font-bold text-sm ' + (ok ? 'text-emerald-700' : 'text-amber-700')}>
        {pass}/{total} ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}
