'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Layers3, Plus, Save, Trash2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';
interface SchemeItem { title: string; description: string; color: SchemeColor }

const COLOR_OPTIONS: Array<{ value: SchemeColor; dot: string; label: string }> = [
  { value: 'emerald', dot: 'bg-emerald-500', label: 'Hijau' },
  { value: 'blue', dot: 'bg-blue-500', label: 'Biru' },
  { value: 'amber', dot: 'bg-amber-500', label: 'Kuning' },
  { value: 'slate', dot: 'bg-slate-400', label: 'Abu-abu' },
];

const COLOR_CLASSES: Record<SchemeColor, string> = {
  emerald: 'border-emerald-200 bg-emerald-50',
  blue: 'border-blue-200 bg-blue-50',
  amber: 'border-amber-200 bg-amber-50',
  slate: 'border-slate-200 bg-slate-50',
};

export default function AdminKontenSkemaPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', intro: '', schemes: [] as SchemeItem[] });
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'konten-publik', 'skema'],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        publicContent: { schemes: () => Promise<unknown> };
      }).publicContent.schemes();
      return (res as { data?: { title?: string; intro?: string; items?: SchemeItem[] } }).data ?? {};
    },
  });

  useEffect(() => {
    if (data) setForm({ title: data.title ?? '', intro: data.intro ?? '', schemes: data.items ?? [] });
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return (adminApi as unknown as {
        publicContent: { updateSchemes: (d: Record<string, unknown>) => Promise<unknown> };
      }).publicContent.updateSchemes({ title: form.title, intro: form.intro, items: form.schemes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'konten-publik', 'skema'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addScheme = () => setForm((p) => ({ ...p, schemes: [...p.schemes, { title: '', description: '', color: 'emerald' }] }));
  const removeScheme = (i: number) => setForm((p) => ({ ...p, schemes: p.schemes.filter((_, idx) => idx !== i) }));
  const updateScheme = (i: number, field: keyof SchemeItem, value: string) =>
    setForm((p) => { const s = [...p.schemes]; s[i] = { ...s[i], [field]: value }; return { ...p, schemes: s }; });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <PageHeader
        title="Skema KKN"
        subtitle="Kelola daftar skema/jenis KKN yang ditampilkan di halaman publik"
        actions={
          <a href="/admin/konten-publik/profil" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">
            ← Profil Lembaga
          </a>
        }
      />

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
          {/* Header Content */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Layers3 size={20} />
              </div>
              <p className="text-sm font-black text-slate-900">Konten Header</p>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Judul Seksi</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Contoh: Skema KKN UIN Saizu"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Intro / Deskripsi</label>
              <textarea
                value={form.intro}
                onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
          </div>

          {/* Scheme Items */}
          <div className="space-y-3">
            {form.schemes.map((scheme, i) => (
              <div key={i} className={`rounded-2xl border-2 p-5 space-y-3 ${COLOR_CLASSES[scheme.color]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Skema #{i + 1}</span>
                  <button type="button" onClick={() => removeScheme(i)} className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={scheme.title}
                  onChange={(e) => updateScheme(i, 'title', e.target.value)}
                  placeholder="Nama skema..."
                  className="w-full rounded-xl border border-white/80 bg-white px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  value={scheme.description}
                  onChange={(e) => updateScheme(i, 'description', e.target.value)}
                  placeholder="Deskripsi skema..."
                  rows={2}
                  className="w-full rounded-xl border border-white/80 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Warna:</span>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateScheme(i, 'color', c.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${scheme.color === c.value ? 'bg-white shadow ring-2 ring-indigo-400' : 'hover:bg-white/60'}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} /> {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addScheme}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all uppercase tracking-wider"
            >
              <Plus size={14} /> Tambah Skema
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-indigo-200"
            >
              {mutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saved ? 'Tersimpan!' : mutation.isPending ? 'Menyimpan...' : 'Simpan Skema'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
