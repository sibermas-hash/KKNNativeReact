'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MessageCircle, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';

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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: typeof Clock | typeof CheckCircle2 | typeof XCircle }> = {
  open: { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Menunggu', icon: Clock },
  replied: { bg: 'bg-emerald-100', text: 'text-emerald-900', label: 'Dibalas', icon: CheckCircle2 },
  closed: { bg: 'bg-slate-200', text: 'text-slate-600', label: 'Ditutup', icon: XCircle },
};

function formatTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return d.toLocaleDateString('id-ID');
}

export default function ChatListPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'chat', 'conversations'],
    queryFn: async () => {
      const res = await api.get('/chat');
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    refetchInterval: 30_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/chat', { subject, message, priority });
      return ((res as unknown as { data?: { id: number } })?.data ?? res) as { id: number };
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['student', 'chat', 'conversations'] });
      toast.success('Percakapan berhasil dibuat');
      setShowForm(false);
      setSubject(''); setMessage(''); setPriority('normal');
      window.location.href = `/mahasiswa/chat/${conv.id}`;
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal membuat percakapan');
    },
  });

  const conversations: Conversation[] = (data as { data?: Conversation[] })?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle size={24} className="text-teal-600" /> Chat Konsultasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tanya atau sampaikan komplain ke Admin SIBERMAS.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
          <Plus size={16} /> Baru
        </button>
      </header>

      {showForm && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Percakapan Baru</h2>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Subjek</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255}
              placeholder="Contoh: Kesulitan login akun"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Pesan</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={5}
              placeholder="Jelaskan keluhan/pertanyaan Anda..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
            <p className="mt-0.5 text-[10px] text-slate-400">{message.length}/2000</p>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Prioritas</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => createMut.mutate()} disabled={!subject || !message || createMut.isPending}
              className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-teal-700">
              {createMut.isPending ? 'Mengirim...' : 'Kirim'}
            </button>
            <button onClick={() => { setShowForm(false); setSubject(''); setMessage(''); }}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Batal
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <MessageCircle size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada percakapan</p>
          <p className="mt-1 text-xs text-slate-500">Klik tombol &quot;Baru&quot; untuk mulai konsultasi dengan admin.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const status = STATUS_STYLES[c.status];
            const StatusIcon = status.icon;
            return (
              <li key={c.id}>
                <Link href={`/mahasiswa/chat/${c.id}`}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-teal-300 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.subject}</p>
                      {c.priority === 'urgent' && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">URGENT</span>
                      )}
                    </div>
                    {c.last_message && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.last_message.body}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.text}`}>
                        <StatusIcon size={10} /> {status.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatTime(c.last_message_at)}</span>
                      {c.unread_count > 0 && (
                        <span className="ml-auto rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {c.unread_count} baru
                        </span>
                      )}
                    </div>
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
