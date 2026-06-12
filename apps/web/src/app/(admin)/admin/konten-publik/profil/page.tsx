'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { BookOpenText, Save, RefreshCw } from 'lucide-react';
import { BackButton, PageHeader } from '@/components/ui/shared';

export default function AdminKontenProfilPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState({ about: '', visi: '', misi: '' });
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'konten-publik', 'profil'],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        publicContent: { profile: () => Promise<unknown> };
      }).publicContent.profile();
      return (res as { data?: { about?: string; visi?: string; misi?: string } }).data ?? {};
    },
  });

  useEffect(() => {
    if (data) setForm({ about: data.about ?? '', visi: data.visi ?? '', misi: data.misi ?? '' });
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return (adminApi as unknown as {
        publicContent: { updateProfile: (d: Record<string, unknown>) => Promise<unknown> };
      }).publicContent.updateProfile(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'konten-publik', 'profil'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const field = (key: keyof typeof form, label: string, rows = 4) => (
    <div>
      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <textarea
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <BackButton href="/admin/dashboard" label="Kembali ke Dashboard" />
      <PageHeader
        title="Profil Lembaga"
        subtitle="Manajemen narasi institusional, visi, dan misi LPPM UIN SAIZU"
        actions={
          <div className="flex items-center gap-2">
            <a href="/admin/konten-publik/skema" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">
              Skema KKN →
            </a>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <BookOpenText size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Identitas Lembaga</p>
              <p className="text-xs text-slate-400">Konten yang ditampilkan di halaman publik</p>
            </div>
          </div>

          {field('about', 'Tentang / About', 6)}
          {field('visi', 'Visi', 3)}
          {field('misi', 'Misi', 5)}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-emerald-200"
            >
              {mutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saved ? 'Tersimpan!' : mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
