'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', category: 'berita' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => { const res = await endpoints.announcements.index(); return res.data as { success: boolean; data: unknown[] }; },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => endpoints.announcements.store(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }); setShowForm(false); setForm({ title: '', content: '', excerpt: '', category: 'berita' }); toast.success('Berita berhasil dipublikasikan'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => endpoints.announcements.destroy(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }); toast.success('Berita berhasil dihapus'); },
  });

  const announcements = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Berita & Pengumuman</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">+ Tulis Berita</button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div><label className="mb-1 block text-sm font-medium">Judul</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
          <div><label className="mb-1 block text-sm font-medium">Ringkasan</label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium">Konten</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required /></div>
          <div className="flex gap-3"><button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publikasikan</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">Batal</button></div>
        </form>
      )}

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id as number} className="flex items-start justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{a.title as string}</p>
                <p className="text-sm text-slate-500">{a.published_at as string} | {a.category as string}</p>
              </div>
              <button onClick={() => { if (confirm('Hapus berita ini?')) deleteMutation.mutate(a.id as number); }} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
