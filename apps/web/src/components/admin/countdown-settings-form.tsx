'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { Clock, Eye, EyeOff, Zap } from 'lucide-react';

interface CountdownConfig {
  periode_id: number;
  enabled: boolean;
  title: string;
  subtitle: string | null;
  countdown_start: string | null;
  countdown_end: string | null;
  display_location: string;
  style: string;
}

interface Props {
  periodeId: number | null;
  registrationStart?: string;
  periodeName?: string;
}

export function CountdownSettingsForm({ periodeId, registrationStart, periodeName }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CountdownConfig>({
    periode_id: periodeId ?? 0,
    enabled: false,
    title: 'Pendaftaran Dibuka Dalam',
    subtitle: periodeName || '',
    countdown_start: '',
    countdown_end: '',
    display_location: 'home',
    style: 'hero',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'countdown', periodeId],
    queryFn: async () => {
      if (!periodeId) return null;
      const res = await rawApi.get(`/admin/periode/${periodeId}/countdown`);
      return (res.data as { data: CountdownConfig })?.data;
    },
    enabled: !!periodeId,
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        countdown_start: data.countdown_start ? data.countdown_start.slice(0, 16) : '',
        countdown_end: data.countdown_end ? data.countdown_end.slice(0, 16) : '',
      });
    } else if (registrationStart && !data) {
      // Auto-suggest: countdown_end = registration_start at 00:00 UTC (07:00 WIB)
      const regDate = registrationStart.split('T')[0];
      setForm(f => ({
        ...f,
        countdown_end: regDate + 'T00:00',
        countdown_start: regDate ? computeStart(regDate) : '',
        subtitle: periodeName || f.subtitle,
      }));
    }
  }, [data, registrationStart, periodeName]);

  const save = useMutation({
    mutationFn: async () => {
      if (!periodeId) throw new Error('No periode');
      const payload = {
        enabled: form.enabled,
        title: form.title || 'Pendaftaran Dibuka Dalam',
        subtitle: form.subtitle || null,
        countdown_start: form.countdown_start ? new Date(form.countdown_start).toISOString() : null,
        countdown_end: form.countdown_end ? new Date(form.countdown_end).toISOString() : null,
        display_location: form.display_location,
        style: form.style,
      };
      await rawApi.post(`/admin/periode/${periodeId}/countdown`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'countdown', periodeId] });
      toast.success('Countdown settings disimpan!');
    },
    onError: () => toast.error('Gagal menyimpan countdown'),
  });

  if (!periodeId) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-400">Simpan periode terlebih dahulu untuk mengatur countdown.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-20 flex items-center justify-center text-xs text-slate-400">Loading...</div>;
  }

  const INPUT = 'w-full h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white';

  return (
    <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-emerald-600" />
          <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Countdown</span>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            form.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {form.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
          {form.enabled ? 'Aktif' : 'Nonaktif'}
        </button>
      </div>

      {form.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Judul</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT} placeholder="Pendaftaran Dibuka Dalam" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Subtitle</label>
              <input value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className={INPUT} placeholder="KKN Reguler 2026" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mulai Tampil (WIB)</label>
              <input type="datetime-local" value={form.countdown_start || ''} onChange={e => setForm(f => ({ ...f, countdown_start: e.target.value }))} className={INPUT} />
              <p className="text-[9px] text-slate-400">Kapan countdown mulai muncul</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Target Selesai (WIB)</label>
              <input type="datetime-local" value={form.countdown_end || ''} onChange={e => setForm(f => ({ ...f, countdown_end: e.target.value }))} className={INPUT} />
              <p className="text-[9px] text-slate-400">Kapan countdown habis (pendaftaran buka)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tampil Di</label>
              <select value={form.display_location} onChange={e => setForm(f => ({ ...f, display_location: e.target.value }))} className={INPUT}>
                <option value="home">Home Page</option>
                <option value="dashboard">Dashboard Mahasiswa</option>
                <option value="both">Keduanya</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Style</label>
              <select value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} className={INPUT}>
                <option value="hero">Hero (Besar)</option>
                <option value="banner">Banner (Sedang)</option>
                <option value="minimal">Minimal (Kecil)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="w-full flex items-center justify-center gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
          >
            <Zap size={12} />
            {save.isPending ? 'Menyimpan...' : 'Simpan Countdown'}
          </button>
        </div>
      )}
    </div>
  );
}

function computeStart(regDate: string): string {
  // Default: 7 jam sebelum target (00:01 WIB = 17:01 UTC hari sebelumnya)
  const d = new Date(regDate + 'T00:00:00.000Z');
  d.setHours(d.getHours() - 7);
  return d.toISOString().slice(0, 16);
}
