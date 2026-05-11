'use client';

export const dynamic = 'force-dynamic';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

type Status = 'all' | 'unread' | 'read';
type Priority = '' | 'info' | 'success' | 'warning' | 'danger';

interface NotificationItem {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  action?: string | null;
  icon?: string;
  priority?: 'info' | 'success' | 'warning' | 'danger' | string;
  is_read?: boolean;
  read_at?: string | null;
  created_at_human?: string;
  created_at?: string;
}

interface IndexPayload {
  notifications: NotificationItem[];
  unread_count: number;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function NotifikasiPage(): React.JSX.Element {
  // Mount guard — this page uses React Query which needs its QueryClient
  // context at runtime. Next.js 15 may attempt static prerender of this
  // route; we return a skeleton before mount to avoid calling hooks that
  // need client-only context (QueryClient, auth store, router).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return <NotifikasiPageContent />;
}

function NotifikasiPageContent(): React.JSX.Element {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [status, setStatus] = useState<Status>('all');
  const [priority, setPriority] = useState<Priority>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Redirect to login if known-unauthenticated.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/notifikasi');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data, isLoading: isLoadingData, isFetching } = useQuery<IndexPayload>({
    queryKey: ['notifications', 'index', { status, priority, dateFrom, dateTo, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 20, status };
      if (priority) params.priority = priority;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await notificationsApi.index(params);
      const maybe = res as unknown as { data?: IndexPayload } & Partial<IndexPayload>;
      return (maybe?.data ?? maybe) as IndexPayload;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Semua notifikasi ditandai dibaca.');
    },
    onError: () => toast.error('Gagal menandai semua notifikasi.'),
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const items = data?.notifications ?? [];
  const unread = data?.unread_count ?? 0;
  const meta = data?.meta;

  const resetFilters = () => {
    setStatus('all');
    setPriority('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const filtersActive = status !== 'all' || priority || dateFrom || dateTo;

  const handleRowClick = (n: NotificationItem) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    if (n.action) {
      router.push(n.action);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            {unread > 0 ? <BellRing className="text-amber-500" /> : <Bell />}
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0
              ? `${unread} belum dibaca`
              : 'Semua notifikasi sudah dibaca.'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Status</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as Status); setPage(1); }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
            >
              <option value="all">Semua</option>
              <option value="unread">Belum dibaca</option>
              <option value="read">Sudah dibaca</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Prioritas</span>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value as Priority); setPage(1); }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"
            >
              <option value="">Semua prioritas</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
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

        {filtersActive && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <X size={12} /> Reset filter
            </button>
            {isFetching && <span className="text-xs text-slate-400">memfilter…</span>}
          </div>
        )}
      </div>

      {/* List */}
      {isLoadingData ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Bell className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada notifikasi</p>
          <p className="mt-1 text-xs text-slate-400">
            {filtersActive ? 'Coba longgarkan filter.' : 'Notifikasi baru akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleRowClick(n)}
                className={`w-full text-left rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow ${
                  n.is_read ? '' : 'ring-cyan-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <PriorityIcon priority={n.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${n.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {n.title ?? 'Notifikasi'}
                      </p>
                      {!n.is_read && (
                        <span
                          aria-label="Belum dibaca"
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-cyan-500"
                        />
                      )}
                    </div>
                    {n.message && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{n.message}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {n.created_at_human ?? formatDateTime(n.created_at)}
                      {n.read_at && <> · dibaca {formatDateTime(n.read_at)}</>}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            Halaman {meta.current_page} dari {meta.last_page} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              className="h-9 rounded-lg bg-cyan-600 px-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityIcon({ priority }: { priority?: string }): React.JSX.Element {
  const meta = {
    danger:  { icon: AlertTriangle, cls: 'text-rose-500' },
    warning: { icon: AlertTriangle, cls: 'text-amber-500' },
    success: { icon: CheckCircle2,  cls: 'text-emerald-500' },
    info:    { icon: Info,          cls: 'text-cyan-500' },
  }[priority ?? 'info'] ?? { icon: Info, cls: 'text-cyan-500' };

  const Icon = meta.icon;
  return <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.cls}`} />;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID');
  } catch {
    return iso ?? '';
  }
}
