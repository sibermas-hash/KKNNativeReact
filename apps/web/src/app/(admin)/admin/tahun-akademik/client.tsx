'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2, CheckCircle2, RefreshCw, LibraryBig, ArrowUpDown, AlertCircle } from 'lucide-react';
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
  const [isPending, setIsPending] = useState(false);
  const [formYear, setFormYear] = useState('');
  const [formActive, setFormActive] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
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

  const handleCreate = async () => {
    if (!formYear || isReadOnly || isPending) return;
    setIsPending(true);
    try {
      const response = await createTahunAkademik(formYear, formActive);
      if (!response.ok) return toast.error(response.message);
      await refetch();
      toast.success(response.message ?? 'Tahun akademik ditambahkan.');
      setFormYear('');
      setFormActive(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan tahun akademik.');
    } finally {
      setIsPending(false);
    }
  };

  const handleToggle = async (ay: TahunAkademik) => {
    if (isReadOnly || isPending) return;
    setIsPending(true);
    try {
      const response = await toggleTahunAkademikStatus(ay.id, ay.year, ay.is_active);
      if (!response.ok) return toast.error(response.message);
      await refetch();
      toast.success(response.message ?? (ay.is_active ? 'Tahun akademik dinonaktifkan.' : 'Tahun akademik diaktifkan.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui status tahun akademik.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (ay: TahunAkademik) => {
    if (isReadOnly || isPending) return;
    if (!confirm(`Data "${ay.year}" akan dihapus secara permanen. Lanjutkan?`)) return;
    setIsPending(true);
    try {
      const response = await deleteTahunAkademik(ay.id);
      if (!response.ok) return toast.error(response.message);
      await refetch();
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus tahun akademik.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><Plus size={16} /></div>
          <div>
            <p className="text-sm font-black text-cyan-950">Tambah Tahun Akademik</p>
            <p className="text-xs text-slate-500">Contoh: 2025/2026.</p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {isReadOnly && <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertCircle size={16} /> Mode baca saja karena API gagal.</div>}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Tahun Akademik</label>
            <select value={formYear} onChange={(e) => setFormYear(e.target.value)} disabled={isPending || isReadOnly} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100">
              <option value="" disabled>Pilih Tahun Akademik</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input id="is_active" type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} disabled={isPending || isReadOnly} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-cyan-600" />
            <span><span className="block text-sm font-bold text-slate-800">Jadikan aktif</span><span className="text-xs text-slate-500">Dipakai sebagai tahun akademik berjalan.</span></span>
          </label>
          <button onClick={handleCreate} disabled={isPending || isReadOnly || !formYear} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-50">
            {isPending ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Simpan
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><LibraryBig size={16} /></div>
            <div><p className="text-sm font-black text-cyan-950">Daftar Tahun Akademik</p><p className="text-xs text-slate-500">{rows.length} data ditemukan</p></div>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tahun..." className="w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-cyan-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-5 py-3"><button onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2">Tahun Akademik <ArrowUpDown size={12} /></button></th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((ay) => <tr key={ay.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-black text-slate-900">{ay.year}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${ay.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{ay.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => handleToggle(ay)} disabled={isPending || isReadOnly} className={`rounded-xl px-3 py-2 text-xs font-black ${ay.is_active ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white'}`}>{ay.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button><button onClick={() => handleDelete(ay)} disabled={isPending || isReadOnly || ay.is_active} title={ay.is_active ? 'Tahun aktif tidak bisa dihapus' : 'Hapus'} className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600 disabled:opacity-40"><Trash2 size={14} /></button></div></td></tr>)}
              {rows.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400">Belum ada tahun akademik</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
