'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import Link from 'next/link';

export default function AuditLogPage() {
  
const { data, isLoading } = useQuery<unknown[]>({
  queryKey: ['admin', 'audit-log'],
  queryFn: async () => {
    const res = await adminApi.auditLog.index();
    return (res as any).data;
  },
});

const logs = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
{logs.map((log: unknown) => {
  const item = log as Record<string, unknown>;
  return (
    <Link key={String(item.id)} href={`/admin/audit-log/${String(item.id)}`} className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{String(item.action)}</p>
          <p className="text-sm text-slate-500">oleh {String((item.user as Record<string, unknown>)?.name) || '-'} | {String(item.created_at)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{String(item.auditable_type)}</span>
      </div>
    </Link>
  );
})}
        </div>
      )}
    </div>
  );
}
