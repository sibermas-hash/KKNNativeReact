'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { adminApi, rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader, ConfirmDialog } from '@/components/ui/shared';
import { Plus, Pencil, Trash2, Calendar, ChevronRight, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Period {
  id: number;
  name: string;
  periode: number;
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  kuota: number;
  current_phase?: string;
  is_active?: boolean;
  academic_year_id?: number;
  jenis_kkn_id?: number;
  academic_year?: { id: number; year: string };
  jenis_kkn?: { id: number; name: string; code: string; color?: string };
  participants_count?: number;
}

type PaginatedPeriodsResponse = {
  data: Period[];
  meta?: PaginationMeta;
};

const PHASE_LABEL: Record<string, string> = {
  upcoming: 'Pra-Pendaftaran', registration: 'Pendaftaran', placement: 'Penempatan',
  execution: 'Pelaksanaan', grading: 'Penilaian', finished: 'Selesai',
};
const PHASE_COLOR: Record<string, string> = {
  upcoming: 'bg-slate-100 text-slate-600', registration: 'bg-emerald-100 text-emerald-700',
  placement: 'bg-blue-100 text-blue-700', execution: 'bg-purple-100 text-purple-700',
  grading: 'bg-amber-100 text-amber-700', finished: 'bg-slate-200 text-slate-500',
};

const EMPTY_FORM = { name: '', periode: 1, start_date: '', end_date: '', registration_start: '', registration_end: '', kuota: 30, academic_year_id: 0, jenis_kkn_id: 0, is_active: false, current_phase: 'upcoming' };
const INPUT = 'w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-white';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-[11px] font-semibold text-rose-600 mt-1">{error}</p>;
}

export default function PeriodsPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data, isLoading, isFetching } = useQuery<PaginatedPeriodsResponse>({
    queryKey: ['admin', 'periods', { page, perPage }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<Period[]>>('/admin/periode', {
        params: {
          page,
          per_page: perPage,
        },
      });

      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const { data: tahunAkademikList } = useQuery({
    queryKey: ['admin', 'tahun-akademik'],
    queryFn: async () => {
      const res = await adminApi.master.academicYears.index();
      return ((res as { data: unknown })?.data ?? res) as Array<{ id: number; year: string; is_active: boolean }>;
    },
  });

  const { data: jenisKknList } = useQuery({
    queryKey: ['admin', 'jenis-kkn'],
    queryFn: async () => {
      const res = await adminApi.master.kknTypes.index();
      return ((res as { data: unknown })?.data ?? res) as Array<{ id: number; name: string; code: string }>;
    },
  });

  const save = useMutation({
    mutationFn: () => editingId ? adminApi.periods.update(editingId, form) : adminApi.periods.store(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'periods'] });
      if (editingId === null) {
        setPage(1);
      }
      toast.success(editingId ? 'Periode diperbarui' : 'Periode dibuat');
      setOpen(false); setEditingId(null); setForm(EMPTY_FORM); setFieldErrors({});
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { error?: { errors?: Record<string, string[]> } } } })?.response?.data?.error?.errors;
      if (errors) {
        const mapped: Record<string, string> = {};
        Object.entries(errors).forEach(([key, msgs]) => { mapped[key] = msgs[0]; });
        setFieldErrors(mapped);
        const firstKey = Object.keys(mapped)[0];
        toast.error(mapped[firstKey] || 'Data yang diberikan tidak valid.');
      } else {
        toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menyimpan');
      }
    },
  });

  const destroy = useMutation({
    mutationFn: (id: number) => adminApi.periods.destroy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'periods'] }); toast.success('Periode dihapus'); },
    onError: () => toast.error('Gagal menghapus — periode masih memiliki data terkait'),
  });

  const openEdit = (p: Period) => {
    setEditingId(p.id);
    setForm({
      name: p.name, periode: p.periode,
      start_date: p.start_date ?? '', end_date: p.end_date ?? '',
      registration_start: p.registration_start ?? '', registration_end: p.registration_end ?? '',
      kuota: p.kuota,
      academic_year_id: p.academic_year_id ?? p.academic_year?.id ?? 0,
      jenis_kkn_id: p.jenis_kkn_id ?? p.jenis_kkn?.id ?? 0,
      is_active: p.is_active ?? false,
      current_phase: p.current_phase ?? 'upcoming',
    });
    setFieldErrors({});
    setOpen(true);
  };

  const periods = data?.data ?? [];
  const meta = data?.meta;
  const activePeriods = periods.filter(p => p.is_active);
  const totalPeserta = periods.reduce((sum, p) => sum + (p.participants_count ?? 0), 0);
  const batchLabel = meta
    ? `Menampilkan ${meta.from ?? 0}-${meta.to ?? 0} dari ${meta.total} periode`
    : `Menampilkan ${periods.length} periode`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Periode Pelaksanaan"
        subtitle="Kelola periode KKN beserta jadwal pendaftaran dan pelaksanaan"
        actions={
          <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setFieldErrors({}); setOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 shadow-sm">
            <Plus size={15} strokeWidth={2.5} /> Tambah Periode
          </button>
        }
      />

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Periode</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{meta?.total ?? periods.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif di Tabel</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activePeriods.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peserta di Tabel</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalPeserta}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Sistem</p>
            <p className="text-sm font-bold text-emerald-600 mt-2">Stabil</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">{editingId ? 'Edit Periode' : 'Tambah Periode'}</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
              </div>
              <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="p-6 space-y-4">
                {/* Info */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                  Periode = <strong>Tahun Akademik</strong> + <strong>Jenis KKN</strong> + Angkatan. Pilih keduanya lalu isi detail jadwal.
                </div>
                {/* Tahun Akademik + Jenis KKN */}
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Akademik *</label>
                    <select value={form.academic_year_id} onChange={e => setForm(f => ({ ...f, academic_year_id: Number(e.target.value) }))} className={`${INPUT} ${fieldErrors.academic_year_id ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required>
                      <option value={0}>— Pilih —</option>
                      {(tahunAkademikList ?? []).map(ta => <option key={ta.id} value={ta.id}>{ta.year}{ta.is_active ? ' (Aktif)' : ''}</option>)}
                    </select>
                    <FieldError error={fieldErrors.academic_year_id} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis KKN *</label>
                    <select value={form.jenis_kkn_id} onChange={e => setForm(f => ({ ...f, jenis_kkn_id: Number(e.target.value) }))} className={`${INPUT} ${fieldErrors.jenis_kkn_id ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required>
                      <option value={0}>— Pilih —</option>
                      {(jenisKknList ?? []).map(jk => <option key={jk.id} value={jk.id}>{jk.name} ({jk.code})</option>)}
                    </select>
                    <FieldError error={fieldErrors.jenis_kkn_id} />
                  </div>
                </div>
                {/* Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Periode *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`${INPUT} ${fieldErrors.name ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} placeholder="KKN Reguler 2025/2026 Angkatan 1" required />
                  <FieldError error={fieldErrors.name} />
                </div>
                {/* Angkatan + Kuota */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Angkatan *</label>
                    <input type="number" min={1} value={form.periode} onChange={e => setForm(f => ({ ...f, periode: Number(e.target.value) }))} className={`${INPUT} ${fieldErrors.periode ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.periode} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kuota *</label>
                    <input type="number" min={1} value={form.kuota} onChange={e => setForm(f => ({ ...f, kuota: Number(e.target.value) }))} className={`${INPUT} ${fieldErrors.kuota ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.kuota} />
                  </div>
                </div>
                {/* Pendaftaran dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mulai Pendaftaran *</label>
                    <input type="date" value={form.registration_start}
                      min={editingId ? undefined : new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({
                          ...f,
                          registration_start: val,
                          registration_end: f.registration_end && f.registration_end < val ? val : f.registration_end,
                          start_date: f.start_date && f.start_date < val ? val : f.start_date,
                          end_date: f.end_date && f.end_date < val ? val : f.end_date,
                        }));
                        setFieldErrors(e => { const n = { ...e }; delete n.registration_start; return n; });
                      }}
                      className={`${INPUT} ${fieldErrors.registration_start ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.registration_start} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutup Pendaftaran *</label>
                    <input type="date" value={form.registration_end}
                      min={form.registration_start || (editingId ? undefined : new Date().toISOString().split('T')[0])}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({
                          ...f,
                          registration_end: val,
                          start_date: f.start_date && f.start_date < val ? val : f.start_date,
                          end_date: f.end_date && f.end_date < val ? val : f.end_date,
                        }));
                        setFieldErrors(e => { const n = { ...e }; delete n.registration_end; return n; });
                      }}
                      className={`${INPUT} ${fieldErrors.registration_end ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.registration_end} />
                  </div>
                </div>
                {/* Pelaksanaan dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Mulai KKN *</label>
                    <input type="date" value={form.start_date}
                      min={form.registration_end || form.registration_start || (editingId ? undefined : new Date().toISOString().split('T')[0])}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({
                          ...f,
                          start_date: val,
                          end_date: f.end_date && f.end_date < val ? val : f.end_date,
                        }));
                        setFieldErrors(e => { const n = { ...e }; delete n.start_date; return n; });
                      }}
                      className={`${INPUT} ${fieldErrors.start_date ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.start_date} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Selesai KKN *</label>
                    <input type="date" value={form.end_date}
                      min={form.start_date || form.registration_end || (editingId ? undefined : new Date().toISOString().split('T')[0])}
                      onChange={e => { setForm(f => ({ ...f, end_date: e.target.value })); setFieldErrors(e => { const n = { ...e }; delete n.end_date; return n; }); }}
                      className={`${INPUT} ${fieldErrors.end_date ? 'border-rose-400 ring-1 ring-rose-200' : ''}`} required />
                    <FieldError error={fieldErrors.end_date} />
                  </div>
                </div>
                {/* Hint: 7 hari gap */}
                <p className="text-[10px] text-slate-400">Catatan: Jarak minimal antara Tutup Pendaftaran dan Mulai KKN adalah 7 hari (untuk proses verifikasi admin).</p>

                {/* Fase + Publikasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fase Operasional</label>
                    <select value={form.current_phase} onChange={e => setForm(f => ({ ...f, current_phase: e.target.value }))} className={INPUT}>
                      <option value="upcoming">Belum Dimulai</option>
                      <option value="registration">Pendaftaran</option>
                      <option value="placement">Penempatan</option>
                      <option value="execution">Pelaksanaan</option>
                      <option value="grading">Penilaian</option>
                      <option value="finished">Selesai</option>
                    </select>
                    <FieldError error={fieldErrors.current_phase} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Publikasi</label>
                    <label className="flex items-center gap-3 h-10 px-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-600 accent-cyan-600" />
                      <span className="text-sm font-semibold text-slate-700">Publikasikan Periode</span>
                    </label>
                    <p className="text-[10px] text-slate-400">Draft hanya terlihat oleh admin. Centang untuk mempublikasikan ke mahasiswa.</p>
                    <FieldError error={fieldErrors.is_active} />
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
                  <button type="submit" disabled={save.isPending} className="flex-[2] h-10 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
                    {save.isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Periode'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : periods.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-12 text-center">
          <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Belum ada periode</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Data Periode</p>
              <p className="text-xs text-slate-400">{batchLabel}{isFetching ? ' • memperbarui...' : ''}</p>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Per Halaman
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                {['Nama & Skema', 'Thn Akademik', 'Linimasa Pendaftaran', 'Pelaksanaan', 'Fase', 'Aksi'].map(col => (
                  <th key={col} className="p-4 font-black uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {periods.map(p => {
                const phase = p.current_phase ?? 'upcoming';
                return (
                  <tr key={p.id} className="hover:bg-slate-50 group">
                    {/* Nama & Skema */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">Angkatan {p.periode}</span>
                        {p.jenis_kkn && (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                            <Layers size={9} /> {p.jenis_kkn.code}
                          </span>
                        )}
                        {p.is_active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Aktif" />}
                      </div>
                    </td>
                    {/* Tahun Akademik */}
                    <td className="p-4">
                      {p.academic_year ? (
                        <span className="text-xs font-semibold text-slate-700">{p.academic_year.year}</span>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    {/* Linimasa Pendaftaran */}
                    <td className="p-4">
                      {p.registration_start ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-700 tabular-nums">{formatDate(p.registration_start)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowRight size={9} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-500">s/d {formatDate(p.registration_end)}</span>
                          </div>
                        </div>
                      ) : <span className="text-xs text-slate-300">Belum diatur</span>}
                    </td>
                    {/* Pelaksanaan */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-semibold text-slate-600 tabular-nums">{formatDate(p.start_date)}</span>
                        <span className="text-[10px] text-slate-400">s/d {formatDate(p.end_date)}</span>
                      </div>
                    </td>
                    {/* Fase */}
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${PHASE_COLOR[phase] ?? PHASE_COLOR.upcoming}`}>
                        {PHASE_LABEL[phase] ?? phase}
                      </span>
                    </td>
                    {/* Aksi */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/periode/${p.id}`} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 border border-transparent hover:border-cyan-100" title="Detail">
                          <ChevronRight size={14} />
                        </Link>
                        <button onClick={() => openEdit(p)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setConfirmId(p.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100" title="Hapus">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs font-bold text-slate-500">
                Halaman {meta.current_page} / {meta.last_page}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={meta.current_page <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                  disabled={meta.current_page >= meta.last_page}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) destroy.mutate(confirmId); }}
        title="Hapus periode ini?"
        description="Periode akan dihapus dari daftar aktif. Proses ini bisa ditolak jika masih ada data terkait yang bergantung pada periode tersebut."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
