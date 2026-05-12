'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Send, Paperclip, Lock } from 'lucide-react';

type Message = {
  id: number;
  sender: { id: number; name: string; is_admin: boolean };
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
};

type Conversation = {
  id: number;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'normal' | 'urgent';
  closed_at: string | null;
  user: { id: number; name: string; username: string; email: string } | null;
  messages: Message[];
};

export default function AdminChatRoomPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'chat', 'conversation', id],
    queryFn: async () => {
      const res = await api.get(`/admin/chat/${id}`);
      return ((res as unknown as { data?: Conversation })?.data ?? res) as Conversation;
    },
    refetchInterval: 5000,
  });

  const replyMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('body', body);
      if (file) fd.append('attachment', file);
      const res = await api.post(`/admin/chat/${id}/reply`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    onSuccess: () => {
      setBody(''); setFile(null);
      qc.invalidateQueries({ queryKey: ['admin', 'chat', 'conversation', id] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal mengirim balasan');
    },
  });

  const closeMut = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/admin/chat/${id}/close`);
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    onSuccess: () => {
      toast.success('Percakapan ditutup');
      qc.invalidateQueries({ queryKey: ['admin', 'chat', 'conversation', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'chat', 'conversations'] });
      setConfirmClose(false);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menutup percakapan');
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages?.length]);

  const handleSend = () => {
    if (!body.trim() || replyMut.isPending) return;
    replyMut.mutate();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading || !data) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-96 animate-pulse rounded-2xl bg-slate-200" /></div>;
  }

  const isClosed = data.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <header className="flex items-center gap-3 rounded-t-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <Link href="/admin/chat" className="rounded-lg p-1.5 hover:bg-slate-100">
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{data.subject}</p>
            {data.user && (
              <p className="text-[11px] text-slate-500">
                Dari <span className="font-semibold">{data.user.name}</span> ({data.user.username}) · {data.user.email}
              </p>
            )}
          </div>
          {data.priority === 'urgent' && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">URGENT</span>
          )}
          {!isClosed && (
            <button onClick={() => setConfirmClose(true)}
              className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">
              <Lock size={12} /> Tutup
            </button>
          )}
        </header>

        {/* Close confirmation */}
        {confirmClose && (
          <div className="bg-rose-50 border-x border-rose-200 p-3 flex items-center gap-2">
            <p className="flex-1 text-xs text-rose-800">Tutup percakapan ini? User tidak bisa kirim pesan lagi.</p>
            <button onClick={() => closeMut.mutate()} disabled={closeMut.isPending}
              className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50">
              Ya, Tutup
            </button>
            <button onClick={() => setConfirmClose(false)}
              className="rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
              Batal
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 border-x border-slate-200">
          {data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender.is_admin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                m.sender.is_admin ? 'bg-teal-600 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
              }`}>
                {!m.sender.is_admin && (
                  <p className="mb-0.5 text-[10px] font-bold opacity-75">{m.sender.name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                {m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer"
                    className={`mt-1 inline-flex items-center gap-1 text-[11px] underline ${m.sender.is_admin ? 'text-teal-100' : 'text-teal-700'}`}>
                    <Paperclip size={10} /> {m.attachment_name || 'lampiran'}
                  </a>
                )}
                <p className={`mt-1 text-[9px] ${m.sender.is_admin ? 'text-teal-100' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="rounded-b-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {isClosed ? (
            <p className="text-center text-xs text-slate-500 py-2">
              <Lock size={12} className="inline mr-1" /> Percakapan ini sudah ditutup pada {data.closed_at ? new Date(data.closed_at).toLocaleString('id-ID') : '-'}.
            </p>
          ) : (
            <>
              {file && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                  <Paperclip size={12} /> {file.name}
                  <button onClick={() => setFile(null)} className="ml-auto text-rose-600 hover:text-rose-800">×</button>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > 5 * 1024 * 1024) {
                      toast.error('File maksimal 5 MB');
                      return;
                    }
                    setFile(f);
                  }} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                  <Paperclip size={16} />
                </button>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleKey}
                  maxLength={2000} rows={1} placeholder="Ketik balasan..."
                  className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
                <button onClick={handleSend} disabled={!body.trim() || replyMut.isPending}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
