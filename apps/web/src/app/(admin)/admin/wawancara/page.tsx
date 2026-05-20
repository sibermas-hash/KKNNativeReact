'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/ui/shared';
import { CalendarDays, Plus, Trash2, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Period { id: number; name: string; jenis_kkn?: { code?: string; name?: string }; }
interface Interview { id: number; interview_date: string; interview_time_start: string; interview_time_end: string; location?: string; notes?: string; participants_count?: number; periode?: Period; }

const SELECTIVE = ['NUSANTARA', 'INTERNASIONAL', 'KOLABORASI_PTKIN'];
const emptyForm = { periode_id: '', interview_date: '', interview_time_start: '08:00', interview_time_end: '16:00', location: '', notes: '' };

function unwrap<T>(res: unknown): T {
  const r = res as { data?: unknown };
  const d = r.data as { data?: unknown } | undefined;
  return ((d?.data ?? r.data ?? res) as T);
}

export default function WawancaraPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: periods = [] } = useQuery<Period[]>({
    queryKey: ['admin', 'periods', 'selective-interview'],
    queryFn: async () => {
      const res = await adminApi.periods.index({ is_active: true, per_page: 100 });
      const payload = unwrap<Period[] | { data?: Period[] }>(res);
      const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
      return rows.filter((p) => SELECTIVE.includes(p.jenis_kkn?.code || ''));
    },
  });

  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: ['admin', 'interviews'],
    queryFn: async () => {
      const res = await adminApi.interviews.index({ per_page: 100 });
      const payload = unwrap<Interview[] | { data?: Interview[] }>(res);
      return Array.isArray(payload) ? payload : (payload.data ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.interviews.store({
      periode_id: Number(form.periode_id),
      interview_date: form.interview_date,
      interview_time_start: form.interview_time_start,
      interview_time_end: form.interview_time_end,
      location: form.location || null,
      notes: form.notes || null,
    }),
    onSuccess: () => { toast.success('Jadwal wawancara dibuat'); setForm(emptyForm); qc.invalidateQueries({ queryKey: ['admin', 'interviews'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal membuat jadwal'),
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => adminApi.interviews.sync(id),
    onSuccess: () => { toast.success('Peserta approved tersinkron ke jadwal'); qc.invalidateQueries({ queryKey: ['admin', 'interviews'] }); },
    onError: () => toast.error('Gagal sinkron peserta'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.interviews.destroy(id),
    onSuccess: () => { toast.success('Jadwal dihapus'); qc.invalidateQueries({ queryKey: ['admin', 'interviews'] }); setConfirmDelete(null); },
    onError: () => toast.error('Gagal menghapus jadwal'),
  });

  const submit = () => {
    if (!form.periode_id || !form.interview_date || !form.interview_time_start || !form.interview_time_end) {
      toast.error('Periode, tanggal, jam mulai, jam selesai wajib diisi');
      return;
    }
    createMutation.mutate();
  };

  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader title="Jadwal Wawancara KKN" subtitle="Superadmin mengatur jadwal wawancara serentak untuk KKN Nusantara, Internasional, dan Kolaborasi PTKIN." />

    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-black text-slate-900">Buat Jadwal</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select value={form.periode_id} onChange={(e) => setForm({ ...form, periode_id: e.target.value })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
          <option value="">Pilih KKN seleksi</option>
          {periods.map((p) => <option key={p.id} value={p.id}>{p.jenis_kkn?.name} — {p.name}</option>)}
        </select>
        <input type="date" value={form.interview_date} onChange={(e) => setForm({ ...form, interview_date: e.target.value })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
        <div className="grid grid-cols-2 gap-2">
          <input type="time" value={form.interview_time_start} onChange={(e) => setForm({ ...form, interview_time_start: e.target.value })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
          <input type="time" value={form.interview_time_end} onChange={(e) => setForm({ ...form, interview_time_end: e.target.value })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
        </div>
        <input placeholder="Lokasi / link meeting" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold md:col-span-2" />
        <button onClick={submit} disabled={createMutation.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50"><Plus size={16}/> Buat Jadwal</button>
      </div>
      <textarea placeholder="Catatan untuk peserta" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-3 h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" />
      <p className="mt-2 text-xs font-semibold text-slate-500">Saat jadwal dibuat, semua peserta berstatus approved pada periode tersebut otomatis masuk interview_scheduled.</p>
    </div>

    {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : interviews.length === 0 ? <EmptyState icon={<CalendarDays size={48}/>} title="Belum ada jadwal wawancara" /> : <div className="grid gap-4 md:grid-cols-2">
      {interviews.map((item) => <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">{item.periode?.jenis_kkn?.name || '-'}</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{item.periode?.name || '-'}</h3>
          </div>
          <div className="flex gap-2"><button onClick={() => syncMutation.mutate(item.id)} disabled={syncMutation.isPending} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50">Sync</button><button onClick={() => setConfirmDelete(item.id)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 size={16}/></button></div>
        </div>
        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
          <p className="flex items-center gap-2"><CalendarDays size={16}/> {new Date(item.interview_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p className="flex items-center gap-2"><Clock size={16}/> {item.interview_time_start} - {item.interview_time_end}</p>
          <p className="flex items-center gap-2"><Users size={16}/> {item.participants_count ?? 0} peserta</p>
          {item.location && <p className="text-xs text-slate-500">Lokasi: {item.location}</p>}
          {item.notes && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{item.notes}</p>}
        </div>
      </div>)}
    </div>}

    <ConfirmDialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete)} title="Hapus jadwal wawancara?" description="Jadwal dan daftar peserta wawancara akan dihapus." confirmText="Hapus" variant="danger" />
  </div>;
}
