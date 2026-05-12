'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MessageCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';

type Conversation = {
  id: number;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'normal' | 'urgent';
  last_message_at: string | null;
  closed_at: string | null;
  user: { id: number; name: string; username: string; email: string } | null;
  last_message_preview: string | null;
  created_at: string;
};

type StatusFilter = 'all' | 'open' | 'replied' | 'closed';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: typeof Clock | typeof CheckCircle2 | typeof XCircle }> = {
  open: { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Menunggu', icon: Clock },
  replied: { bg: 'bg-emerald-100', text: 'text-emerald-900', label: 'Dibalas', icon: CheckCircle2 },
  closed: { bg: 'bg-slate-200', text: 'text-slate-600', label: 'Ditutup', icon: XCircle },
};

function formatTime(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminChatListPage() {
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'chat', 'conversations', filter, priorityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get('/admin/chat', { params });
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    refetchInterval: 30_000,
  });

  const typed = data as { data?: Conversation[]; summary?: { open: number; replied: number; closed: number } } | undefined;
  const conversations: Conversation[] = typed?.data ?? [];
  const summary = typed?.summary ?? { open: 0, replied: 0, closed: 0 };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Chat Konsultasi"
        subtitle="Balas konsultasi/komplain dari mahasiswa dan dosen"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-[11px] font-bold uppercase text-amber-700">Menunggu</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{summary.open}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-[11px] font-bold uppercase text-emerald-700">Dibalas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{summary.replied}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-600">Ditutup</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.closed}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {(['open', 'replied', 'closed', 'all'] as StatusFilter[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              filter === s ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {s === 'open' ? 'Menunggu' : s === 'replied' ? 'Dibalas' : s === 'closed' ? 'Ditutup' : 'Semua'}
          </button>
        ))}
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="ml-auto h-8 rounded-lg border border-slate-200 px-2 text-xs">
          <option value="">Semua prioritas</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
          <MessageCircle size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Tidak ada percakapan</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const status = STATUS_STYLES[c.status];
            const StatusIcon = status.icon;
            return (
              <li key={c.id}>
                <Link href={`/admin/chat/${c.id}`}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-teal-300 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.subject}</p>
                      {c.priority === 'urgent' && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">URGENT</span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.text}`}>
                        <StatusIcon size={10} /> {status.label}
                      </span>
                    </div>
                    {c.user && (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">{c.user.name}</span>
                        <span className="text-slate-400"> · {c.user.username}</span>
                      </p>
                    )}
                    {c.last_message_preview && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.last_message_preview}</p>
                    )}
                    <p className="mt-1.5 text-[10px] text-slate-400">{formatTime(c.last_message_at)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
