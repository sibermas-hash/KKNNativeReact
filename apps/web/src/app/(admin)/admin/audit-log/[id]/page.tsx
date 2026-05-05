'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function AuditLogDetailPage() {
  const { id } = useParams();
  

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', Number(id)],
    queryFn: async () => {
      const res = await adminApi.auditLog.show(Number(id));
      return res;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Log tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Detail Audit Log</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">Aksi</p><p className="font-semibold">{String(data.action || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Tipe</p><p className="font-semibold">{String(data.auditable_type || '-')}</p></div>
          <div><p className="text-xs text-slate-500">User</p><p className="font-semibold">{String(((data.user as Record<string, unknown>)?.name as string) || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Waktu</p><p className="font-semibold">{String(data.created_at || '-')}</p></div>
          <div><p className="text-xs text-slate-500">IP</p><p className="font-mono text-sm">{String(data.ip_address || '-')}</p></div>
        </div>
        {data.old_values ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Nilai Lama</p>
            <pre className="rounded-lg bg-slate-50 p-3 text-xs overflow-x-auto">{JSON.stringify(data.old_values, null, 2)}</pre>
          </div>
        ) : null}
        {data.new_values ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Nilai Baru</p>
            <pre className="rounded-lg bg-slate-50 p-3 text-xs overflow-x-auto">{JSON.stringify(data.new_values, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
