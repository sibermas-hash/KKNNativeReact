'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Plus, Trash2, CheckCircle2, RefreshCw, LibraryBig, ArrowUpDown, ChevronDown, History, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { createTahunAkademik, toggleTahunAkademikStatus, deleteTahunAkademik } from './actions';

interface TahunAkademik {
  id: number;
  year: string;
  is_active: boolean;
  created_at?: string;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const s = currentYear - 1 + i;
  return `${s}/${s + 1}`;
});

export function TahunAkademikClient({
  initialData,
  loadError,
}: {
  initialData: TahunAkademik[];
  loadError?: string;
}): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [formYear, setFormYear] = useState('');
  const [formActive, setFormActive] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { data: fetched, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tahun-akademik'],
    queryFn: async () => {
      const res = await api.get('/admin/tahun-akademik');
      const root = (res as { data?: unknown })?.data ?? res;

      if (Array.isArray(root)) {
        return root as TahunAkademik[];
      }

      const payload = root as { data?: unknown };

      return Array.isArray(payload.data) ? (payload.data as TahunAkademik[]) : [];
    },
    initialData,
    enabled: !loadError,
  });
  const isReadOnly = Boolean(loadError) || isError;
  const sourceRows = fetched ?? initialData;

  const rows = useMemo(() => {
    const list = sourceRows.filter((ay) => ay.year.includes(search));
    return [...list].sort((a, b) =>
      sortDir === 'asc' ? a.year.localeCompare(b.year) : b.year.localeCompare(a.year)
    );
  }, [sourceRows, search, sortDir]);

  const handleCreate = () => {
    if (!formYear || isReadOnly) return;
    startTransition(async () => {
      try {
        const response = await createTahunAkademik(formYear, formActive);
        if (!response.ok) {
          toast.error(response.message);
          return;
        }

        await refetch();
        toast.success(response.message ?? 'Tahun akademik ditambahkan.');
        setFormYear('');
        setFormActive(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menambahkan tahun akademik.');
      }
    });
  };

  const handleToggle = (ay: TahunAkademik) => {
    if (isReadOnly) return;
    startTransition(async () => {
      try {
        const response = await toggleTahunAkademikStatus(ay.id, ay.year, ay.is_active);
        if (!response.ok) {
          toast.error(response.message);
          return;
        }

        await refetch();
        toast.success(
          response.message ??
            (ay.is_active ? 'Tahun akademik dinonaktifkan.' : 'Tahun akademik diaktifkan.')
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal memperbarui status tahun akademik.');
      }
    });
  };

  const handleDelete = (ay: TahunAkademik) => {
    if (isReadOnly) return;
    if (!confirm(`Data "${ay.year}" akan dihapus secara permanen. Lanjutkan?`)) return;
    startTransition(async () => {
      try {
        const response = await deleteTahunAkademik(ay.id);
        if (!response.ok) {
          toast.error(response.message);
          return;
        }

        await refetch();
        toast.success(response.message);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menghapus tahun akademik.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Form Panel */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-1">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/90 shadow-sm overflow-hidden backdrop-blur">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><Plus size={16} /></div>
            <div>
              <p className="text-sm font-black text-cyan-950 tracking-tight">Tambah Tahun</p>
              <p className="text-[11px] text-slate-400">Tambahkan tahun akademik untuk periode KKN berikutnya.</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1">Tahun Akademik</label>
              <select
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                disabled={isPending || isReadOnly}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none transition-all bg-slate-50/80 hover:border-cyan-100"
              >
                <option value="" disabled>Pilih tahun akademik</option>
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <input id="is_active" type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} disabled={isPending || isReadOnly} className="w-5 h-5 mt-0.5 text-cyan-600 border-slate-200 rounded-lg focus:ring-cyan-500 cursor-pointer disabled:cursor-not-allowed" />
              <div>
                <label htmlFor="is_active" className="text-sm font-semibold text-cyan-950 cursor-pointer tracking-tight leading-none mb-1 block">Set sebagai aktif</label>
                <p className="text-[11px] font-medium text-slate-500">Tahun ini akan menjadi default untuk periode baru.</p>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={isPending || isReadOnly || !formYear}
              className="w-full h-14 bg-cyan-600 text-white text-sm font-semibold rounded-2xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-4 shadow-[0_8px_20px_rgba(6,182,212,0.25)] disabled:opacity-50"
            >
              {isPending ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={3} />}
              Tambah Tahun Akademik
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Table Panel */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-2">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/90 shadow-sm overflow-hidden backdrop-blur">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><LibraryBig size={16} /></div>
              <p className="text-sm font-black text-cyan-950 tracking-tight">Daftar Tahun Akademik</p>
              {isLoading && <span className="text-[10px] font-bold text-slate-400">Memuat...</span>}
              {isError && !loadError && (
                <button onClick={() => refetch()} className="text-[10px] font-black text-rose-600">
                  API gagal · coba lagi
                </button>
              )}
            </div>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tahun akademik..."
              className="w-48 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-500 placeholder:text-slate-300 focus:outline-none focus:border-cyan-300"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyan-50/30 border-b border-cyan-100">
                  <th className="px-6 py-5">
                    <button onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-cyan-600 transition-colors">
                      Tahun Akademik <ArrowUpDown size={12} className="text-cyan-600" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((ay, index) => (
                  <Fragment key={ay.id}>
                      <motion.tr key={ay.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                        className={clsx('group transition-all hover:bg-cyan-50/40', expandedId === ay.id && 'bg-cyan-50/20')}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button onClick={() => setExpandedId(expandedId === ay.id ? null : ay.id)}
                              className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                              <ChevronDown size={14} className={clsx('transition-transform duration-500', expandedId === ay.id && 'rotate-180')} />
                            </button>
                            <span className="text-sm font-bold text-cyan-950 tracking-tight tabular-nums">{ay.year}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest', ay.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                            <span className={clsx('h-1.5 w-1.5 rounded-full', ay.is_active ? 'bg-emerald-500' : 'bg-slate-300')} />
                            {ay.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleToggle(ay)} disabled={isPending || isReadOnly}
                              className={clsx('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm', ay.is_active ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-lime-500 text-white hover:bg-lime-600 shadow-[0_4px_12px_rgba(132,204,22,0.3)]')}>
                              {ay.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1, backgroundColor: '#fff1f2', color: '#e11d48' }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(ay)}
                              disabled={isPending || isReadOnly}
                              className="h-10 w-10 flex items-center justify-center text-slate-300 rounded-xl transition-all">
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence key={`exp-${ay.id}`}>
                        {expandedId === ay.id && (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td colSpan={3} className="p-0 border-none">
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden bg-slate-50/80">
                                <div className="p-8 border-y border-cyan-100/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-cyan-600 shadow-sm shrink-0 border border-cyan-50"><History size={18} /></div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Pendaftaran</p>
                                      <p className="text-xs font-bold text-cyan-950 uppercase">
                                        {ay.created_at ? new Date(ay.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : '-'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-cyan-600 shadow-sm shrink-0 border border-cyan-50"><Activity size={18} /></div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan Sistem</p>
                                      <p className="text-xs font-bold text-cyan-950 uppercase">ID Sistem: {ay.id}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                  </Fragment>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada tahun akademik</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] tabular-nums">{rows.length} data ditemukan</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
