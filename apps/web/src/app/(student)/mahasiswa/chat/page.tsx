'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { QUERY_KEYS } from '@sibermas/constants';
import { toast } from 'sonner';
import { MessageCircle, Search, X, ShieldCheck, Sparkles } from 'lucide-react';

type Conversation = {
  id: number;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'normal' | 'urgent';
  last_message_at: string | null;
  created_at: string;
  last_message: { body: string; sender_id: number; is_read: boolean } | null;
  unread_count: number;
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function ChatListPage() {
  const qc = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [to, setTo] = useState('Admin SIBERMAS');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.chat,
    queryFn: async () => {
      const res = await studentApi.chat.index();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    refetchInterval: 30_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const finalSubject = subject.trim() || `Pesan untuk ${to || 'Admin SIBERMAS'}`;
      const res = await studentApi.chat.store({ subject: finalSubject, message, priority });
      return ((res as unknown as { data?: { id: number } })?.data ?? res) as { id: number };
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.student.chat });
      toast.success('Pesan terkirim');
      setShowComposer(false);
      setSubject(''); setMessage(''); setPriority('normal'); setTo('Admin SIBERMAS');
      window.location.href = `/mahasiswa/chat/${conv.id}`;
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal mengirim pesan');
    },
  });

  const conversations: Conversation[] = (data as { data?: Conversation[] })?.data ?? [];
  const recipients = useMemo(() => [
    { name: 'Admin SIBERMAS', desc: 'Bantuan akademik, akun, KKN', icon: ShieldCheck, verified: true, color: 'from-teal-400 to-emerald-500' },
    { name: 'Helpdesk KKN', desc: 'Pendaftaran, kelompok, lokasi', icon: MessageCircle, verified: true, color: 'from-blue-400 to-indigo-500' },
    { name: 'LP2M Support', desc: 'Laporan, sertifikat, verifikasi', icon: Sparkles, verified: false, color: 'from-amber-400 to-orange-500' },
  ].filter((r) => r.name.toLowerCase().includes(to.toLowerCase()) || to === ''), [to]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100/70 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <Search size={18} className="text-slate-400" />
            <span className="text-sm text-slate-500">Cari percakapan</span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <MessageCircle size={42} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada pesan</p>
            <p className="mt-1 text-xs text-slate-500">Klik tombol pensil untuk chat admin.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            {conversations.map((c) => (
              <Link key={c.id} href={`/mahasiswa/chat/${c.id}`}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 last:border-0">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-sm">
                  <MessageCircle size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950">{c.subject}</p>
                    {c.priority === 'urgent' && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">URGENT</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.last_message?.body || 'Pesan baru'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-400">{formatTime(c.last_message_at)}</span>
                  {c.unread_count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{c.unread_count}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowComposer(true)} aria-label="Pesan baru"
        className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-white text-slate-950 shadow-xl ring-1 ring-slate-200 transition hover:scale-105 hover:bg-slate-50">
        <MessageCircle size={24} />
      </button>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-3 py-8 sm:justify-end sm:pr-10">
          <div className="flex h-[86vh] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-base font-bold text-slate-950">New message</h2>
              <button onClick={() => setShowComposer(false)} className="rounded-full p-1 text-violet-600 hover:bg-violet-50">
                <X size={22} strokeWidth={3} />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
              <span className="text-sm font-semibold text-slate-700">To:</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} autoFocus
                className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Admin SIBERMAS" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              {recipients.map((r) => {
                const Icon = r.icon;
                return (
                  <button key={r.name} onClick={() => setTo(r.name)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${r.color} text-white`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                        {r.name} {r.verified && <ShieldCheck size={14} className="text-blue-500" />}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{r.desc}</span>
                    </span>
                  </button>
                );
              })}
              <div className="mt-2 border-t border-slate-100 px-4 pt-3 space-y-2">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255}
                  placeholder="Subjek (opsional)"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-violet-100" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={5}
                  placeholder="Tulis pesan..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-100" />
                <select value={priority} onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button onClick={() => createMut.mutate()} disabled={!message.trim() || createMut.isPending}
                  className="h-10 w-full rounded-xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
                  {createMut.isPending ? 'Mengirim...' : 'Kirim ke Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
