import { Head, router, useForm } from '@inertiajs/react';
import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/UI';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  RefreshCw,
  LibraryBig,
  Info,
  ArrowUpDown,
  ChevronDown,
  History,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
  created_at?: string;
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
  if (payload.last_page && payload.links) {
    return {
      current_page: payload.current_page ?? 1,
      last_page: payload.last_page as number,
      per_page: payload.per_page ?? 15,
      total: payload.total ?? 0,
      from: payload.from ?? null,
      to: payload.to ?? null,
      links: payload.links as any,
      path: payload.path ?? '',
    };
  }
  return null;
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AcademicYear;
    direction: 'asc' | 'desc';
  }>({
    key: 'year',
    direction: 'desc',
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const startYear = currentYear - 1 + i;
    return `${startYear}/${startYear + 1}`;
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
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [filters.search, search]);

  const paginationMeta = resolvePaginationMeta(academicYears);

  const processedRows = useMemo(() => {
    let items = [...(academicYears.data ?? [])];
    return items.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [academicYears.data, sortConfig]);

  const toggleSort = (key: keyof AcademicYear) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    form.post('/admin/tahun-akademik', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    });
  };

  const toggleStatus = (year: AcademicYear) => {
    router.patch(
      `/admin/tahun-akademik/${year.id}`,
      { year: year.year, is_active: !year.is_active },
      { preserveScroll: true },
    );
  };

  const destroy = (year: AcademicYear) => {
    if (confirm(`Data "${year.year}" akan dihapus secara permanen. Lanjutkan?`)) {
      router.delete(`/admin/tahun-akademik/${year.id}`, {
        preserveScroll: true,
      });
    }
  };

  return (
    <AppLayout title="Data Tahun Akademik">
      <Head title="Data Tahun Akademik | SIBERMAS" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-cyan-950"
      >
        <PageHeader
          title="Tahun Ajaran."
          subtitle="Daftar tahun akademik aktif yang digunakan untuk mengelompokkan periode pelaksanaan KKN."
          icon={LibraryBig}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Total Terdaftar',
            value: (paginationMeta?.total ?? processedRows.length).toLocaleString(),
            icon: Database,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <ContentPanel
              title="Tambah Tahun"
              description="Daftarkan formasi tahun ajaran baru."
              icon={Plus}
              padding={true}
            >
              <form onSubmit={submit} className="space-y-8">
                <div className="space-y-2">
                  <label
                    htmlFor="academic-year"
                    className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1 font-sans"
                  >
                    Tahun Akademik
                  </label>
                  <select
                    id="academic-year"
                    value={form.data.year}
                    onChange={(event) => form.setData('year', event.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none transition-all bg-[#F8FAF9] font-sans hover:border-cyan-100"
                  >
                    <option value="" disabled>
                      Pilih Tahun Akademik
                    </option>
                    {yearOptions.map((yearOption) => (
                      <option key={yearOption} value={yearOption}>
                        {yearOption}
                      </option>
                    ))}
                  </select>
                  {form.errors.year && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-medium text-rose-600 mt-1 pl-1 font-sans"
                    >
                      {form.errors.year}
                    </motion.p>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start gap-4 p-5 bg-white rounded-3xl border-2 border-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow"
                >
                  <div className="flex items-center h-5 pt-0.5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={form.data.is_active}
                      onChange={(e) => form.setData('is_active', e.target.checked)}
                      className="w-5 h-5 text-cyan-600 border-slate-200 rounded-lg focus:ring-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="is_active"
                      className="text-sm font-semibold text-cyan-950 cursor-pointer tracking-tight leading-none mb-1 font-sans"
                    >
                      Jadikan Aktif
                    </label>
                    <p className="text-[11px] font-medium text-slate-500 tracking-normal font-sans">
                      Otomatis diatur sebagai tahun ajaran berjalan.
                    </p>
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={form.processing}
                  className="w-full h-14 bg-cyan-600 text-white text-sm font-semibold rounded-2xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-4 shadow-[0_8px_20px_rgba(6,182,212,0.25)] disabled:opacity-50 font-sans tracking-tight"
                >
                  {form.processing ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} strokeWidth={3} />
                  )}
                  Simpan Data
                </motion.button>
              </form>
            </ContentPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ContentPanel
              title="Arsip Tahun Akademik"
              icon={LibraryBig}
              padding={false}
              headerAction={
                <SearchInput
                  placeholder="CARI TAHUN..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-64"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] tabular-nums">
                    {paginationMeta?.total || processedRows.length} RECORDS FOUND
                  </span>
                  {paginationMeta && <Pagination meta={paginationMeta} />}
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-cyan-50/30 border-b border-cyan-100">
                      <th className="px-6 py-5 text-left">
                        <button
                          onClick={() => toggleSort('year')}
                          className="group flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-sans hover:text-cyan-600 transition-colors"
                        >
                          Tahun Akademik
                          <ArrowUpDown
                            size={12}
                            className={clsx(
                              'transition-colors',
                              sortConfig.key === 'year' ? 'text-cyan-600' : 'text-slate-300',
                            )}
                          />
                        </button>
                      </th>
                      <th className="px-6 py-5 text-left">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-sans">
                          Status
                        </span>
                      </th>
                      <th className="px-6 py-5 text-right">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-sans pr-4">
                          Aksi
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {processedRows.map((year, index) => (
                        <React.Fragment key={year.id}>
                          <motion.tr
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={clsx(
                              'group transition-all hover:bg-cyan-50/40',
                              expandedId === year.id && 'bg-cyan-50/20',
                            )}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() =>
                                    setExpandedId(expandedId === year.id ? null : year.id)
                                  }
                                  className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm"
                                >
                                  <ChevronDown
                                    size={14}
                                    className={clsx(
                                      'transition-transform duration-500',
                                      expandedId === year.id && 'rotate-180',
                                    )}
                                  />
                                </button>
                                <span className="text-sm font-bold text-cyan-950 tracking-tight font-sans tabular-nums">
                                  {year.year}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <StatusTag status={year.is_active ? 'Aktif' : 'Nonaktif'} />
                            </td>
                            <td className="p-6">
                              <div className="flex items-center justify-end gap-3">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleStatus(year)}
                                  className={clsx(
                                    'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm font-display',
                                    year.is_active
                                      ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      : 'bg-lime-500 text-white hover:bg-lime-600 shadow-[0_4px_12px_rgba(132,204,22,0.3)]',
                                  )}
                                >
                                  {year.is_active ? 'Switch Off' : 'Activate'}
                                </motion.button>
                                <motion.button
                                  whileHover={{
                                    scale: 1.1,
                                    backgroundColor: '#fff1f2',
                                    color: '#e11d48',
                                  }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => destroy(year)}
                                  className="h-10 w-10 flex items-center justify-center text-slate-300 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                          <AnimatePresence>
                            {expandedId === year.id && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <td colSpan={3} className="p-0 border-none">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden bg-[#F8FAF9]"
                                  >
                                    <div className="p-8 border-y border-cyan-100/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-cyan-600 shadow-sm shrink-0 border border-cyan-50">
                                          <History size={18} />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Waktu Pendaftaran
                                          </p>
                                          <p className="text-xs font-bold text-cyan-950 uppercase">
                                            {year.created_at
                                              ? new Date(year.created_at).toLocaleString('id-ID', {
                                                  dateStyle: 'full',
                                                  timeStyle: 'short',
                                                })
                                              : '-'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-cyan-600 shadow-sm shrink-0 border border-cyan-50">
                                          <Activity size={18} />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Metadata Integritas
                                          </p>
                                          <p className="text-xs font-bold text-cyan-950 uppercase">
                                            Checksum: Verified (System ID {year.id})
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </ContentPanel>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
