'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Send, Trash2, Sparkles, Megaphone, BarChart3, FileText, TrendingUp, FlaskConical, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';

type Provider = {
  id: 'primary' | 'fallback' | 'tertiary';
  name: string;
  base_url: string;
  has_key: boolean;
  default_model: string;
  models: Array<{ id: string; name: string; category: string }>;
};

type QuickPrompt = { label: string; icon: string; prompt: string };

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  provider?: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
  timestamp: number;
};

import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  'bar-chart': BarChart3,
  'file-text': FileText,
  'trending-up': TrendingUp,
  'flask-conical': FlaskConical,
};

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<string>('primary');
  const [model, setModel] = useState<string>('');
  const [temperature, setTemperature] = useState(0.7);
  const [injectContext, setInjectContext] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: modelsData } = useQuery({
    queryKey: ['admin', 'playground', 'models'],
    queryFn: async () => {
      const res = await api.get('/admin/playground/models');
      return ((res as unknown as { data?: unknown })?.data ?? res) as { providers?: Provider[]; quick_prompts?: QuickPrompt[] };
    },
  });

  const providers: Provider[] = modelsData?.providers ?? [];
  const quickPrompts: QuickPrompt[] = modelsData?.quick_prompts ?? [];
  const currentProvider = providers.find((p) => p.id === provider) ?? providers[0];
  const availableModels = currentProvider?.models ?? [];

  useEffect(() => {
    if (currentProvider && !model) {
      setModel(currentProvider.default_model);
    }
  }, [currentProvider, model]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = useMutation({
    mutationFn: async (message: string) => {
      const payload = {
        message,
        provider,
        model,
        temperature,
        inject_context: injectContext,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      };
      const res = await api.post('/admin/playground/chat', payload);
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    onSuccess: (data: { answer?: string; model_used?: string; provider_used?: string; usage?: { input_tokens: number; output_tokens: number; total_tokens: number } }, _variables) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || '',
          model: data.model_used,
          provider: data.provider_used,
          usage: data.usage,
          timestamp: Date.now(),
        },
      ]);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error?.message || (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI error';
      toast.error(msg);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendChat.isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed, timestamp: Date.now() }]);
    setInput('');
    sendChat.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat chat?')) {
      setMessages([]);
    }
  };

  if (providers.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader title="AI Playground" subtitle="Eksperimen dengan AI untuk Superadmin" />
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">⚠️ AI belum terkonfigurasi</p>
          <p className="mt-1">
            Silakan set minimal satu API key di <code className="bg-amber-100 px-1 rounded">.env</code>: <code className="bg-amber-100 px-1 rounded">AI_PRIMARY_KEY</code>,{' '}
            <code className="bg-amber-100 px-1 rounded">AI_FALLBACK_KEY</code>, atau <code className="bg-amber-100 px-1 rounded">AI_TERTIARY_KEY</code>.
          </p>
          <p className="mt-2">Generate key gratis di: <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
      <PageHeader
        title="AI Playground"
        subtitle="Chat AI multi-provider dengan konteks SIBERMAS (Superadmin)"
      />

      {/* Config bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Provider</label>
            <select value={provider} onChange={(e) => { setProvider(e.target.value); setModel(''); }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Temperature ({temperature})</label>
            <input type="range" min="0" max="2" step="0.1" value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-2 w-full" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={injectContext} onChange={(e) => setInjectContext(e.target.checked)}
                className="accent-teal-600" />
              Sertakan konteks SIBERMAS
            </label>
          </div>
        </div>

        {/* Quick prompts */}
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Quick Prompts</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp) => {
              const Icon = ICON_MAP[qp.icon] || Sparkles;
              return (
                <button key={qp.label} onClick={() => applyQuickPrompt(qp.prompt)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                  <Icon size={12} /> {qp.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 flex flex-col" style={{ minHeight: '400px', maxHeight: '600px' }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Sparkles size={14} className="text-teal-600" />
            {messages.length === 0 ? 'Belum ada pesan' : `${messages.length} pesan`}
          </div>
          {messages.length > 0 && (
            <button onClick={clearHistory} className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800">
              <Trash2 size={11} /> Hapus riwayat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Sparkles size={40} className="mb-2 text-teal-300" />
              <p className="text-sm font-semibold">Mulai percakapan dengan AI</p>
              <p className="text-xs mt-1">Pilih quick prompt di atas atau ketik pesan Anda di bawah.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.model && (
                    <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-teal-100' : 'text-slate-500'}`}>
                      {msg.model} · {msg.provider}
                      {msg.usage && ` · ${msg.usage.total_tokens} tokens`}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {sendChat.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" /> AI sedang berpikir...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (Ctrl+Enter untuk kirim)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
            <button onClick={handleSend} disabled={!input.trim() || sendChat.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Send size={14} /> Kirim
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">Ctrl+Enter untuk mengirim. Riwayat max 10 pesan terakhir dikirim ke AI sebagai konteks.</p>
        </div>
      </div>
    </div>
  );
}
