'use client';

import { rawApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { Circle, Clock3, MonitorSmartphone, PanelRightClose, PanelRightOpen, Wifi } from 'lucide-react';
import { useState } from 'react';

type OnlineUser = {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  roles: string[];
  session_count: number;
  ip_address?: string | null;
  user_agent?: string | null;
  last_seen_human: string;
};

type OnlineUsersResponse = {
  users: OnlineUser[];
  total: number;
  window_minutes: number;
  checked_at: string;
};

export function AdminOnlineUsersSidebar(): React.JSX.Element | null {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperadmin = (currentUser?.roles ?? []).includes('superadmin');
  const [open, setOpen] = useState(false);

  const onlineUsersQuery = useQuery<OnlineUsersResponse>({
    queryKey: ['admin', 'online-users'],
    queryFn: async () => {
      const response = await rawApi.get<{ data: OnlineUsersResponse }>('/admin/online-users', { params: { minutes: 5, limit: 24 } });
      return response.data.data;
    },
    enabled: isSuperadmin,
    refetchInterval: 30000,
  });

  if (!isSuperadmin) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 top-24 z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-[0_14px_40px_rgba(15,23,42,0.18)] hover:bg-emerald-50"
        aria-label="Buka user online"
        title="Buka user online"
      >
        <PanelRightOpen size={20} />
      </button>
    );
  }

  return (
    <aside className="fixed bottom-5 right-5 top-24 z-40 flex w-[min(360px,calc(100vw-2.5rem))] flex-col rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100"
            aria-label="Minimize user online"
            title="Minimize user online"
          >
            <PanelRightClose size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              <Wifi size={13} /> User Online
            </div>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">Aktif {onlineUsersQuery.data?.window_minutes ?? 5} menit</h2>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Auto-refresh 30 detik.</p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Online</p>
            <p className="text-2xl font-black leading-none">{onlineUsersQuery.data?.total ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {(onlineUsersQuery.data?.users ?? []).map((onlineUser) => (
          <div key={onlineUser.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
              {onlineUser.avatar_url ? <img src={onlineUser.avatar_url} alt={onlineUser.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-black uppercase">{onlineUser.name.slice(0, 2)}</span>}
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-black text-slate-950">{onlineUser.name}</p>
                <Circle size={8} className="shrink-0 fill-emerald-500 text-emerald-500" />
              </div>
              <p className="truncate text-[11px] font-bold text-slate-500">@{onlineUser.username} · {onlineUser.roles[0] ?? 'user'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {onlineUser.last_seen_human}</span>
                <span className="inline-flex items-center gap-1"><MonitorSmartphone size={11} /> {onlineUser.session_count} sesi</span>
              </div>
            </div>
          </div>
        ))}
        {!onlineUsersQuery.isLoading && (onlineUsersQuery.data?.users ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">Belum ada user online.</div>
        )}
        {onlineUsersQuery.isLoading && (
          <div className="rounded-2xl border border-dashed border-emerald-100 p-5 text-sm font-semibold text-emerald-700">Memuat user online...</div>
        )}
      </div>
    </aside>
  );
}
