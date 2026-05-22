'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high';

interface AuditLog {
  id: number;
  action: string;
  description?: string | null;
  severity?: Severity;
  model_type?: string | null;
  model_id?: number | string | null;
  model_basename?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  user?: { id?: number; name?: string } | null;
}

const SEVERITY_META: Record<Severity, { label: string; icon: typeof Shield; cls: string }> = {
  low:    { label: 'Low',    icon: Shield,      cls: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', icon: ShieldCheck, cls: 'bg-amber-100 text-amber-700' },
  high:   { label: 'High',   icon: ShieldAlert, cls: 'bg-rose-100 text-rose-700' },
};

export default function AuditLogDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading } = useQuery<AuditLog>({
    queryKey: ['admin', 'audit-log', Number(id)],
    queryFn: async () => {
      const res = await adminApi.auditLog.show(Number(id));
      return ((res as { data?: unknown }).data ?? res) as AuditLog;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Log tidak ditemukan</div>;

  const sev = data.severity && SEVERITY_META[data.severity];
  const SevIcon = sev?.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/admin/audit-log"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Detail Audit Log</h1>
        {sev && SevIcon && (
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${sev.cls}`}>
            <SevIcon size={12} />
            {sev.label}
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Aksi</p>
            <p className="mt-1 font-mono font-bold text-cyan-700">{data.action || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Model</p>
            <p className="mt-1 font-semibold text-slate-800">
              {data.model_basename || '-'}
              {data.model_id ? <span className="text-slate-500 font-normal"> #{data.model_id}</span> : null}
            </p>
            {data.model_type && (
              <p className="mt-0.5 text-[10px] font-mono text-slate-400 truncate" title={data.model_type}>
                {data.model_type}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">User</p>
            <p className="mt-1 font-semibold text-slate-800">{data.user?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Waktu</p>
            <p className="mt-1 text-sm text-slate-700">{formatDateTime(data.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">IP</p>
            <p className="mt-1 font-mono text-sm text-slate-700">{data.ip_address || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">User Agent</p>
            <p className="mt-1 text-xs text-slate-600 truncate" title={data.user_agent ?? undefined}>
              {data.user_agent || '-'}
            </p>
          </div>
        </div>

        {data.description && (
          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Deskripsi</p>
            <p className="text-sm text-slate-700">{data.description}</p>
          </div>
        )}
      </div>

      {/* Diff display */}
      {(data.old_values || data.new_values) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.old_values && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nilai Lama</p>
              <pre className="rounded-lg bg-rose-50 text-rose-900 p-3 text-xs overflow-x-auto max-h-96">
{JSON.stringify(data.old_values, null, 2)}
              </pre>
            </div>
          )}
          {data.new_values && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nilai Baru</p>
              <pre className="rounded-lg bg-emerald-50 text-emerald-900 p-3 text-xs overflow-x-auto max-h-96">
{JSON.stringify(data.new_values, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Field bertanda <code>***MASKED***</code> berisi data sensitif (NIK, password, kontak) yang sengaja
        disembunyikan dari audit log untuk keamanan.
      </p>
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
