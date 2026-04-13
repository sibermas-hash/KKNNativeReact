import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  Power,
  PowerOff,
  CheckCircle2,
  Database,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface PaginationPayload<T> {
  data: T[];
  meta?: PaginationMeta;
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number | null;
  to?: number | null;
  links?: PaginationMeta['links'];
  path?: string;
}

interface Props {
  academicYears: PaginationPayload<AcademicYear>;
  filters: { search?: string };
}

function resolvePaginationMeta(payload: PaginationPayload<unknown>): PaginationMeta | null {
  if (payload.meta) return payload.meta;
  if (typeof payload.last_page === 'number' && Array.isArray(payload.links)) {
    return {
      current_page: payload.current_page ?? 1,
      last_page: payload.last_page,
      per_page: payload.per_page ?? payload.data.length,
      total: payload.total ?? payload.data.length,
      from: payload.from ?? null,
      to: payload.to ?? null,
      links: payload.links,
      path: payload.path ?? '',
    };
  }
  return null;
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmVariant: 'primary' | 'danger';
    confirmLabel: string;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmVariant: 'primary',
    confirmLabel: '',
  });

  const form = useForm({
    year: '',
    is_active: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        router.get(
          '/admin/tahun-akademik',
          { search: search || undefined },
          { preserveState: true, replace: true },
        );
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.search, search]);

  const paginationMeta = resolvePaginationMeta(academicYears);
  const rows = academicYears.data ?? [];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    form.post('/admin/tahun-akademik', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    });
  };

  const toggleStatus = (year: AcademicYear) => {
    setConfirmDialog({
      open: true,
      title: 'Ubah Status Aktivitas',
      message: `Tahun akademik "${year.year}" akan diubah status aktivitasnya. Lanjutkan?`,
      confirmVariant: 'primary',
      confirmLabel: 'Ya, Ubah Status',
      onConfirm: () => {
        router.patch(
          `/admin/tahun-akademik/${year.id}`,
          { year: year.year, is_active: !year.is_active },
          {
            preserveScroll: true,
            onSuccess: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
          },
        );
      },
    });
  };

  const destroy = (year: AcademicYear) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Data Tahun',
      message: `Data "${year.year}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
      confirmVariant: 'danger',
      confirmLabel: 'Hapus Sekarang',
      onConfirm: () => {
        router.delete(`/admin/tahun-akademik/${year.id}`, {
          preserveScroll: true,
          onSuccess: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
        });
      },
    });
  };

  return (
    <AppLayout title="Tahun Akademik">
      <Head title="Manajemen Tahun Akademik" />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmVariant={confirmDialog.confirmVariant}
        confirmLabel={confirmDialog.confirmLabel}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Administrasi Data Master</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Tahun <span className="text-emerald-500">Akademik.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Manajemen Data Master Tahun Operasional dan Penjadwalan Akademik Institusi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Database size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Unit</span>
                            <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{paginationMeta?.total || 0} TERDAFTAR</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- PANEL TAMBAH DATA --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Plus size={20} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-black">Registrasi Baru</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Tambah periode tahun pendaftaran</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2.5">
                  <label htmlFor="academic-year" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Label Tahun Akademik
                  </label>
                  <input
                    id="academic-year"
                    type="text"
                    placeholder="Contoh: 2026/2027"
                    value={form.data.year}
                    onChange={(event) => form.setData('year', event.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-semibold focus:border-emerald-500 transition-all outline-none"
                  />
                  {form.errors.year && (
                    <p className="text-xs font-bold text-red-500 ml-1">{form.errors.year}</p>
                  )}
                </div>

                <div 
                  className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors"
                  onClick={() => form.setData('is_active', !form.data.is_active)}
                >
                  <div className={clsx(
                    "w-10 h-6 rounded-full p-1 transition-all duration-300 flex",
                    form.data.is_active ? "bg-emerald-500 flex-row-reverse shadow-inner" : "bg-slate-200"
                  )}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Akses Awal</span>
                      <span className={clsx("text-xs font-bold leading-none mt-1.5", form.data.is_active ? "text-emerald-700" : "text-slate-400")}>
                        {form.data.is_active ? 'Status Aktif' : 'Status Draft'}
                      </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={form.processing}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {form.processing ? <RefreshCw size={16} className="animate-spin" /> : <Database size={18} />}
                  Simpan Data
                </button>
              </form>
            </div>
          </div>

          {/* --- PANEL DAFTAR DATA --- */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
              <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <Database size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-black uppercase">Indeks Tahun Akademik</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sesi Institusi Terdaftar</p>
                  </div>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    placeholder="Cari Tahun..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:border-emerald-500 transition-all outline-none transition-all placeholder:text-slate-300 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                    <tr className="bg-white text-left border-b border-slate-50">
                      <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Karakteristik Tahun</th>
                      <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Status Akses</th>
                      <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.length > 0 ? (
                      rows.map((year) => (
                        <tr key={year.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-300 flex items-center justify-center font-bold text-sm group-hover:border-emerald-200 group-hover:text-emerald-600 transition-all shadow-sm">
                                    #{year.id}
                                </div>
                                <span className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase">{year.year}</span>
                             </div>
                          </td>
                          <td className="px-10 py-6 text-center">
                            {year.is_active ? (
                              <div className="inline-flex flex-col items-center">
                                  <div className="h-1.5 w-14 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200" />
                                  <span className="text-[9px] font-bold text-emerald-600 mt-2 tracking-widest uppercase">AKTIF</span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center opacity-30">
                                  <div className="h-1.5 w-14 bg-slate-300 rounded-full" />
                                  <span className="text-[9px] font-bold text-slate-400 mt-2 tracking-widest uppercase">NONAKTIF</span>
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-6 text-right">
                             <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => toggleStatus(year)}
                                    title={year.is_active ? 'Matikan Sesi' : 'Aktifkan Sesi'}
                                    className={clsx(
                                        "h-10 px-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                                        year.is_active 
                                            ? "bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200" 
                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                    )}
                                >
                                    {year.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                                    {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                    onClick={() => destroy(year)}
                                    className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-200 rounded-2xl hover:text-red-600 hover:border-red-200 hover:bg-rose-50 transition-all shadow-sm"
                                    title="Hapus Data"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="px-10 py-24 text-center">
                                <div className="flex flex-col items-center gap-4 text-slate-200">
                                    <Database size={60} strokeWidth={1} />
                                    <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database Terdaftar Kosong</p>
                                </div>
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {paginationMeta && (
                <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Halaman {paginationMeta.current_page} — {paginationMeta.last_page}
                  </span>
                  <Pagination meta={paginationMeta} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
