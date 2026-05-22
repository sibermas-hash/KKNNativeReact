'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import { PageHeader, StatusBadge } from '@/components/ui/shared';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus, Calendar, MapPin, Clock, Users, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Trash2, Search, Filter
} from 'lucide-react';

type Schedule = {
  id: number;
  periode_id: number;
  interview_date: string;
  interview_time_start: string;
  interview_time_end: string;
  location?: string;
  notes?: string;
  participants_count: number;
  pending_count: number;
  passed_count: number;
  failed_count: number;
  periode?: { name?: string; periode?: number; jenis_kkn?: { name?: string } };
  creator?: { name?: string };
  created_at: string;
};

type Meta = { current_page: number; per_page: number; total: number; last_page: number };

const fmtDate = (v?: string) => v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(v)) : '-';
const fmtTime = (v?: string) => v ? v.slice(0, 5) : '-';

type PesertaWawancara = {
  id: number;
  status: string;
  mahasiswa?: { nama?: string; nim?: string; prodi?: { nama?: string }; fakultas?: { nama?: string } };
  periode?: { name?: string; jenis_kkn?: { name?: string } };
};

function PesertaWawancaraSection({ angkatan }: { angkatan: string }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading } = useQuery<{ data: PesertaWawancara[] }>({
    queryKey: ['admin', 'peserta-wawancara', angkatan, search],
    queryFn: async () => {
      const res = await rawApi.get('/admin/peserta-wawancara', {
        params: { angkatan: angkatan || undefined, search: search || undefined, per_page: 100 },
      });
      return ((res.data as { data?: unknown }).data ?? res.data) as { data: PesertaWawancara[] };
    },
  });

  const peserta = data?.data ?? [];

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-amber-500" />
          <h3 className="text-sm font-black text-slate-900">Peserta Menunggu Wawancara</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{peserta.length}</span>
        </div>
        <ChevronRight size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5 pt-3">
          <p className="mb-3 text-xs text-slate-500">Peserta yang sudah di-approve dari jenis KKN wajib wawancara. Belum masuk daftar Peserta KKN sampai lulus wawancara.</p>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari NIM/Nama..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : peserta.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Tidak ada peserta menunggu wawancara.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">No</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">NIM</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">Nama</th>
                    <th className="hidden px-3 py-2 text-left text-[10px] font-bold text-slate-500 md:table-cell">Prodi</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">Jenis KKN</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {peserta.map((p, i) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.mahasiswa?.nim ?? '-'}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-800">{p.mahasiswa?.nama ?? '-'}</td>
                      <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{p.mahasiswa?.prodi?.nama ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{p.periode?.jenis_kkn?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Menunggu</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WawancaraPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [angkatan, setAngkatan] = useState('58');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ periode_id: '', interview_date: '', interview_time_start: '', interview_time_end: '', location: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<Schedule | null>(null);

  // Fetch periods for dropdown
  const { data: periods = [] } = useQuery<{ id: number; name: string; periode: number; jenis_kkn?: { name?: string } }[]>({
    queryKey: ['admin', 'periods', 'for-interview'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/periode', { params: { angkatan: angkatan || undefined, per_page: 50 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as { id: number; name: string; periode: number; jenis_kkn?: { name?: string } }[];
    },
    staleTime: 60000,
  });

  // Fetch schedules
  const { data, isLoading } = useQuery<{ data: Schedule[]; meta: Meta }>({
    queryKey: ['admin', 'wawancara', { angkatan, page }],
    queryFn: async () => {
      const res = await rawApi.get('/admin/wawancara', { params: { angkatan: angkatan || undefined, page, per_page: 20 } });
      return (res.data as { data?: { data: Schedule[]; meta: Meta } }).data ?? res.data;
    },
    placeholderData: (prev) => prev,
  });

  const schedules = data?.data ?? [];
  const meta = data?.meta;

  // Create schedule
  const createMutation = useMutation({
    mutationFn: async () => {
      await rawApi.post('/admin/wawancara', { ...form, periode_id: Number(form.periode_id) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara'] });
      toast.success('Jadwal wawancara dibuat');
      setShowForm(false);
      setForm({ periode_id: '', interview_date: '', interview_time_start: '', interview_time_end: '', location: '', notes: '' });
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal membuat jadwal'),
  });

  // Delete schedule
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await rawApi.delete(`/admin/wawancara/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara'] });
      toast.success('Jadwal dihapus');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600';

  return (
    <div className="space-y-6">
      <PageHeader title="Wawancara KKN" subtitle="Kelola jadwal dan hasil wawancara peserta KKN." />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={angkatan} onChange={(e) => { setAngkatan(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="58">Angkatan 58</option>
            <option value="">Semua Angkatan</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700">
          <Plus size={16} /> Buat Jadwal
        </button>
      </div>

      {/* Peserta Menunggu Wawancara */}
      <PesertaWawancaraSection angkatan={angkatan} />

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Buat Jadwal Wawancara</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Periode *</label>
                <select value={form.periode_id} onChange={(e) => setForm(f => ({ ...f, periode_id: e.target.value }))} className={INPUT}>
                  <option value="">— Pilih Periode —</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.jenis_kkn?.name ?? p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Tanggal *</label>
                  <input type="date" value={form.interview_date} onChange={(e) => setForm(f => ({ ...f, interview_date: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Mulai *</label>
                  <input type="time" value={form.interview_time_start} onChange={(e) => setForm(f => ({ ...f, interview_time_start: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Selesai *</label>
                  <input type="time" value={form.interview_time_end} onChange={(e) => setForm(f => ({ ...f, interview_time_end: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Lokasi</label>
                <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Gedung A Lt.2 / Online via Zoom" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Catatan</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Catatan tambahan..." className={INPUT} />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => createMutation.mutate()} disabled={!form.periode_id || !form.interview_date || !form.interview_time_start || !form.interview_time_end || createMutation.isPending} className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Hapus Jadwal?</h3>
            <p className="mt-2 text-sm text-slate-600">Jadwal {fmtDate(deleteConfirm.interview_date)} dan semua peserta di dalamnya akan dihapus.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-bold">Batal</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white disabled:opacity-50">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Calendar className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Belum ada jadwal wawancara</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-cyan-200 transition-all">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-900">{fmtDate(s.interview_date)}</span>
                    <Clock size={14} className="text-slate-400 ml-2" />
                    <span className="text-sm text-slate-600">{fmtTime(s.interview_time_start)} - {fmtTime(s.interview_time_end)}</span>
                  </div>
                  {s.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><span className="text-sm text-slate-600">{s.location}</span></div>}
                  <p className="text-xs text-slate-500">{s.periode?.jenis_kkn?.name ?? s.periode?.name ?? '-'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-600"><Users size={12} />{s.participants_count}</span>
                    <span className="flex items-center gap-1 text-amber-600">{s.pending_count} pending</span>
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} />{s.passed_count}</span>
                    <span className="flex items-center gap-1 text-rose-600"><XCircle size={12} />{s.failed_count}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/wawancara/${s.id}`} className="rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100">Detail</Link>
                    <button onClick={() => setDeleteConfirm(s)} className="rounded-lg bg-rose-50 px-2 py-2 text-rose-600 hover:bg-rose-100"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">Hal {meta.current_page}/{meta.last_page} • {meta.total} jadwal</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// cache-bust-20260523
