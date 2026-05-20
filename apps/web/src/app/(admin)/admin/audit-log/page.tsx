'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { rawApi } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/shared';
import { ClipboardList, ShieldAlert, Shield, ShieldCheck, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Severity = '' | 'low' | 'medium' | 'high';

interface AuditLogRow {
  id: number;
  action: string;
  description?: string | null;
  severity?: Severity;
  model_type?: string | null;
  model_basename?: string | null;
  model_id?: number | string | null;
  created_at?: string;
  user?: { id?: number; name?: string } | null;
}

type PaginatedAuditLogResponse = {
  data: AuditLogRow[];
  meta?: Partial<PaginationMeta>;
};

const SEVERITY_META: Record<Exclude<Severity, ''>, { label: string; icon: typeof Shield; cls: string }> = {
  low:    { label: 'Low',    icon: Shield,       cls: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', icon: ShieldCheck,  cls: 'bg-amber-100 text-amber-700' },
  high:   { label: 'High',   icon: ShieldAlert,  cls: 'bg-rose-100 text-rose-700' },
};


function pageWindow(current: number, last: number): Array<number | 'dots'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, last - 1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: Array<number | 'dots'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('dots');
    out.push(sorted[i]);
  }
  return out;
}

export default function AuditLogPage(): React.JSX.Element {
  const [severity, setSeverity] = useState<Severity>('');
  const [modelType, setModelType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filtersActive = severity || modelType || action || dateFrom || dateTo;

  const { data, isLoading, isFetching } = useQuery<PaginatedAuditLogResponse>({
    queryKey: ['admin', 'audit-log', { severity, modelType, action, dateFrom, dateTo, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (severity) params.severity = severity;
      if (modelType) params.model_type = modelType;
      if (action) params.action = action;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await rawApi.get<ApiResponse<AuditLogRow[]>>('/admin/audit-log', { params });
      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
  });

  const logs = data?.data ?? [];
  const meta = data?.meta ?? {};

  const resetFilters = () => {
    setSeverity('');
    setModelType('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Riwayat perubahan data — siapa, apa, kapan" />

      {/* Filters */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Severity</span>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value as Severity); setPage(1); }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
            >
              <option value="">Semua</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Model</span>
            <input
              value={modelType}
              onChange={(e) => { setModelType(e.target.value); setPage(1); }}
              placeholder="Mahasiswa, NilaiKkn…"
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Aksi</span>
            <input
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              placeholder="CREATE, UPDATE, DELETE…"
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Dari tanggal</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Sampai tanggal</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
            />
          </label>
        </div>

        {filtersActive ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <X size={12} /> Reset filter
            </button>
            {isFetching && <span className="text-xs text-slate-400">memfilter…</span>}
          </div>
        ) : null}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <ClipboardList className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada log yang cocok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const sev = log.severity && log.severity in SEVERITY_META
              ? SEVERITY_META[log.severity as Exclude<Severity, ''>]
              : null;
            const SevIcon = sev?.icon;
            return (
              <Link
                key={log.id}
                href={`/admin/audit-log/${log.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5">
                        {log.action}
                      </span>
                      {log.model_basename && (
                        <span className="text-xs font-semibold text-slate-600">
                          on {log.model_basename}
                          {log.model_id ? ` #${log.model_id}` : ''}
                        </span>
                      )}
                      {sev && SevIcon && (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sev.cls}`}>
                          <SevIcon size={10} />
                          {sev.label}
                        </span>
                      )}
                    </div>
                    {log.description && (
                      <p className="mt-1.5 text-sm text-slate-700 truncate">{log.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      oleh {log.user?.name || '-'} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page && meta.last_page > 1 && (() => { const lp = meta.last_page; const cp = meta.current_page ?? page; const pgs = pageWindow(cp, lp); return (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs font-semibold text-slate-500">Halaman <b className="text-slate-800">{cp}</b> dari <b className="text-slate-800">{lp}</b> &middot; <b className="text-slate-800">{(meta.total ?? 0).toLocaleString('id-ID')}</b> log</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setPage(1)} disabled={cp <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cp <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {pgs.map((item, idx) => item === 'dots' ? <span key={`dots-${idx}`} className="px-1 text-xs font-black text-slate-400">&hellip;</span> : <button key={item} onClick={() => setPage(item as number)} className={`h-9 min-w-9 rounded-xl px-3 text-xs font-black transition ${cp === item ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item}</button>)}
            <button onClick={() => setPage((p) => Math.min(lp, p + 1))} disabled={cp >= lp} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(lp)} disabled={cp >= lp} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      ); })()}
    </div>
  );
}

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID');
  } catch {
    return iso;
  }
}
