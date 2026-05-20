'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import { Bell, BellRing, CheckCheck, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { showNotificationPopup, desktopPermissionState } from '@/lib/notify';
import { useAuthStore } from '@/stores';

interface NotificationItem {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  action?: string | null;
  icon?: string;
  priority?: 'info' | 'success' | 'warning' | 'danger' | string;
  created_at?: string;
}

interface UnreadPayload {
  notifications: NotificationItem[];
  unread_count: number;
}

/**
 * Global notification bell for authenticated layouts.
 *
 * Behavior:
 *   - Polls `/notifications/unread` every 60s (axios returns raw
 *     { notifications, unread_count } because the endpoint doesn't use the
 *     ApiResponse envelope — handled by client.ts fallback).
 *   - SSE is opt-in via `NEXT_PUBLIC_ENABLE_NOTIFICATION_SSE=true`.
 *   - Click a notification → mark read → navigate to `action` URL if present.
 *   - "Tandai semua dibaca" → POST /notifications/read-all, then refetch.
 *   - When unauthenticated or during initial load, nothing renders
 *     (prevents 401 errors on public/auth pages).
 */
export function NotificationBell({ className }: { className?: string }): React.JSX.Element | null {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Page Visibility optimization — pause polling when tab is hidden.
  // This avoids wasting requests + battery on browser tabs the user
  // isn't looking at. When the tab becomes visible again, React Query
  // refetches automatically (refetchOnWindowFocus).
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Dedup set for popup — SSE and polling can both deliver the same
  // notification id. We track what we've already surfaced as a popup to
  // avoid double toasts. The set is scoped to the component lifetime
  // (cleared on logout / page reload).
  const seenPopupIds = useRef<Set<string>>(new Set());

  const handleNotificationAction = useCallback((actionUrl: string) => {
    router.push(actionUrl);
  }, [router]);

  const sseEnabled = process.env.NEXT_PUBLIC_ENABLE_NOTIFICATION_SSE === 'true';

  // SSE realtime — fire & forget. Keeps the query cache fresh as soon as
  // a notification is created server-side (no waiting for the next poll).
  // Disabled by default because the current backend implementation uses a
  // long-lived PHP worker per connection.
  const [sseConnected, setSseConnected] = useState(false);
  useEffect(() => {
    if (!sseEnabled) {
      setSseConnected(false);
      return;
    }
    if (!isAuthenticated || typeof window === 'undefined') return;
    if (typeof EventSource === 'undefined') return;

    let es: EventSource | null = null;
    let aborted = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (aborted) return;
      const apiBase = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined;
      if (!apiBase) {
        setSseConnected(false);
        return;
      }
      // SSE endpoint is under /api (not /api/v1) and uses the Sanctum
      // cookie. withCredentials is required to forward it.
      const streamUrl = apiBase.replace(/\/v1\/?$/, '') + '/notifications/stream';
      es = new EventSource(streamUrl, { withCredentials: true });

      es.addEventListener('open', () => setSseConnected(true));

      es.addEventListener('notification', (event: MessageEvent) => {
        // Parse the SSE data frame and surface as a popup. Invalidating
        // the React Query cache keeps the bell count + dropdown list in
        // sync (cheaper than manual cache writes for rare events).
        try {
          const payload = JSON.parse(event.data);
          showNotificationPopup(payload, {
            seenIds: seenPopupIds.current,
            onAction: handleNotificationAction,
            enableDesktop: desktopPermissionState() === 'granted',
          });
        } catch {
          // If parsing fails, still invalidate — the user will pick up
          // the new notification on the next bell dropdown open.
        }
        qc.invalidateQueries({ queryKey: ['notifications'] });
      });

      es.addEventListener('close', () => {
        es?.close();
        if (!aborted) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 500);
        }
      });

      es.addEventListener('error', () => {
        setSseConnected(false);
        if (es?.readyState === EventSource.CLOSED && !aborted) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 5_000);
        }
      });
    };

    connect();

    return () => {
      aborted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      setSseConnected(false);
    };
  }, [handleNotificationAction, isAuthenticated, qc, sseEnabled]);

  const { data } = useQuery<UnreadPayload>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await notificationsApi.unread();
      // Notification endpoints don't use the envelope — raw shape.
      // Handle both possibilities (envelope or raw) for safety.
      const maybeWrapped = res as unknown as { data?: UnreadPayload } & Partial<UnreadPayload>;
      return (maybeWrapped?.data ?? maybeWrapped) as UnreadPayload;
    },
    enabled: isAuthenticated,
    // Polling cadence: when SSE is live, we can poll slowly (safety net
    // against missed events). Without SSE, we poll every 60s. When the
    // tab is hidden, we pause polling entirely.
    refetchInterval: !isTabVisible ? false : sseConnected ? 300_000 : 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  // Polling-path popup: when React Query data refreshes with unread items
  // we haven't popup'd yet, toast them. This path covers the fallback
  // case (browser blocks SSE) AND the safety-net poll that still runs
  // every 5 minutes even when SSE is healthy.
  //
  // First data arrival seeds `seenPopupIds` WITHOUT toasting — otherwise
  // every page load would flood the user with toasts for existing
  // unreads. Only DELTAS after first load surface as popups.
  const hasSeededSeen = useRef(false);
  useEffect(() => {
    const items = data?.notifications ?? [];
    if (items.length === 0) return;

    if (!hasSeededSeen.current) {
      items.forEach((n) => seenPopupIds.current.add(n.id));
      hasSeededSeen.current = true;
      return;
    }

    for (const n of items) {
      showNotificationPopup(n, {
        seenIds: seenPopupIds.current,
        onAction: handleNotificationAction,
        enableDesktop: desktopPermissionState() === 'granted',
      });
    }
  }, [data, handleNotificationAction]);

  // Prefetch the full-page history when user hovers the bell — makes
  // "Lihat semua" feel instant.
  const prefetchIndex = () => {
    if (!isAuthenticated) return;
    qc.prefetchQuery({
      queryKey: ['notifications', 'index', { status: 'all', priority: '', dateFrom: '', dateTo: '', page: 1 }],
      queryFn: async () => {
        const res = await notificationsApi.index({ status: 'all', page: 1, per_page: 20 });
        const maybe = res as unknown as { data?: unknown } & Record<string, unknown>;
        return (maybe?.data ?? maybe) as unknown;
      },
      staleTime: 30_000,
    });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'unread'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'unread'] }),
  });

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = data?.unread_count ?? 0;
  const items = data?.notifications ?? [];
  const badgeCount = Math.min(items.length || unreadCount, 15);
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (n: NotificationItem) => {
    markRead.mutate(n.id);
    if (n.action) {
      router.push(n.action);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
          onMouseEnter={prefetchIndex}
          onFocus={prefetchIndex}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--profile-muted)] hover:bg-[color:var(--profile-soft)] hover:text-[color:var(--profile-text)] transition-colors ${className ?? ''}`}
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {hasUnread && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm"
              aria-live="polite"
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[calc(100vw-1rem)] max-w-[24rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:w-96"
        >
          <header className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[color:var(--profile-text)]">Notifikasi</p>
              <p className="text-[11px] text-[color:var(--profile-muted)]">
                {hasUnread
                  ? `${unreadCount} belum dibaca`
                  : 'Semua sudah dibaca'}
              </p>
            </div>
            {hasUnread && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-[11px] font-semibold text-cyan-700 shadow-sm hover:bg-cyan-50 disabled:opacity-50 sm:w-auto"
              >
                <CheckCheck size={12} /> Tandai semua dibaca
              </button>
            )}
          </header>

          <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-[color:var(--profile-muted)] opacity-40 mb-2" />
                <p className="text-xs text-[color:var(--profile-muted)]">
                  Tidak ada notifikasi baru.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--profile-border)]">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-cyan-50/70"
                    >
                      <div className="flex items-start gap-3">
                        <PriorityIcon priority={n.priority} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug text-slate-900">
                            {n.title ?? 'Notifikasi'}
                          </p>
                          {n.message && (
                            <p className="mt-1 text-xs leading-5 text-slate-600 line-clamp-3">
                              {n.message}
                            </p>
                          )}
                          {n.created_at && (
                            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                              {n.created_at}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer — always show the "Lihat semua" escape hatch to full page */}
          <footer className="border-t border-slate-100 bg-white px-4 py-2.5">
            <Link
              href="/notifikasi"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-transparent py-2 text-xs font-semibold text-cyan-700 hover:border-cyan-100 hover:bg-cyan-50"
            >
              Lihat semua notifikasi
              <ArrowRight size={13} />
            </Link>
          </footer>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
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
  return <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${meta.cls}`} />;
}
