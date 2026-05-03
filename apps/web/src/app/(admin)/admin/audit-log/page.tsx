'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AuditLogPage() {
  const endpoints = adminEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: async () => { const res = await endpoints.auditLog.index(); return res.data as { success: boolean; data: unknown[]; meta?: Record<string, number> }; },
  });

  const logs = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Link key={log.id as number} href={`/admin/audit-log/${log.id}`} className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{log.action as string}</p>
                  <p className="text-sm text-slate-500">oleh {((log.user as Record<string, unknown>)?.name as string) || '-'} | {log.created_at as string}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{log.auditable_type as string}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
