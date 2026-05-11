'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { CheckCircle2, XCircle } from 'lucide-react';

type ActivityLog = {
  id: number;
  user: { id: number; name: string; username: string } | null;
  action: string;
  status: 'success' | 'failed';
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  password_change: 'Ganti Password',
  password_reset: 'Reset Password',
  profile_update: 'Update Profil',
  avatar_upload: 'Upload Avatar',
  avatar_rejected: 'Avatar Ditolak',
  registration: 'Pendaftaran KKN',
  ai_playground: 'AI Playground',
};

type Filters = {
  action: string;
  status: string;
  ip: string;
  date_from: string;
  date_to: string;
  user_id: string;
};

export default function ActivityLogPage() {
  const [filters, setFilters] = useState<Filters>({ action: '', status: '', ip: '', date_from: '', date_to: '', user_id: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity-log', filters, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (filters.action) params.action = filters.action;
      if (filters.status) params.status = filters.status;
      if (filters.ip) params.ip = filters.ip;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.user_id) params.user_id = filters.user_id;
      const res = await api.get('/admin/activity-log', { params });
      const response = (res as unknown as { data?: Record<string, unknown>; meta?: Record<string, unknown> });
      return (response.data ?? response) as Record<string, unknown>;
    },
  });

  const logs: ActivityLog[] = (data?.data ?? []) as ActivityLog[];
  const meta = data?.meta as
    | { current_page: number; last_page: number; total: number }
    | undefined;

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ action: '', status: '', ip: '', date_from: '', date_to: '', user_id: '' });
    setPage(1);
  };

  const hasFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Log Aktivitas Pengguna"
        subtitle="Riwayat login, logout, perubahan profil, dan aksi user lainnya (PRD_USER_ACTIVITY_LOG)"
      />

      {/* Filter bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Aksi</label>
            <select value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
              <option value="">Semua</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Status</label>
            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
              <option value="">Semua</option>
              <option value="success">Sukses</option>
              <option value="failed">Gagal</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">User ID</label>
            <input type="number" value={filters.user_id} onChange={(e) => updateFilter('user_id', e.target.value)}
              placeholder="#" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">IP Address</label>
            <input type="text" value={filters.ip} onChange={(e) => updateFilter('ip', e.target.value)}
              placeholder="127.0.0.1" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Dari</label>
            <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Sampai</label>
            <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm" />
          </div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-slate-600 hover:text-slate-900">
            × Reset filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Memuat...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Tidak ada aktivitas yang cocok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3 text-left">Waktu</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Aksi</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">IP</th>
                  <th className="p-3 text-left">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3">
                      {log.user ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{log.user.name}</p>
                          <p className="text-[10px] text-slate-400">{log.user.username}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-700">{ACTION_LABELS[log.action] || log.action}</td>
                    <td className="p-3">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 size={10} /> Sukses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <XCircle size={10} /> Gagal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs font-mono text-slate-500">{log.ip_address ?? '-'}</td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {log.metadata ? (
                        <details>
                          <summary className="cursor-pointer hover:text-slate-700">Lihat</summary>
                          <pre className="mt-1 text-[10px] bg-slate-50 p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-600">
            <span>Halaman {meta.current_page} dari {meta.last_page} ({meta.total} aktivitas)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold disabled:opacity-50 hover:bg-slate-200">
                « Prev
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={meta.current_page >= meta.last_page}
                className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold disabled:opacity-50 hover:bg-slate-200">
                Next »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
