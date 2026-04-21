import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  RefreshCw,
  LibraryBig,
  Info,
  CalendarDays
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

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
  const rows = academicYears.data ?? [];

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
      <Head title="Data Tahun Akademik" />

      <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
        <PageHeader 
          title="Tahun Ajaran."
          subtitle="Daftar tahun akademik aktif yang digunakan untuk mengelompokkan periode pelaksanaan KKN."
          icon={LibraryBig}
          groupLabel="Data Master Sistem"
          stats={{
            label: 'Total Terdaftar',
            value: `${(paginationMeta?.total ?? rows.length).toLocaleString()} Data`,
            icon: Database
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* FORM PANEL (Left 1/3) */}
          <div className="lg:col-span-1">
            <ContentPanel
              title="Tambah Tahun"
              description="Daftarkan formasi tahun ajaran baru."
              icon={Plus}
              padding={true}
            >
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="academic-year" className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Tahun Akademik
                  </label>
                  <input
                    id="academic-year"
                    type="text"
                    placeholder="Contoh: 2026/2027"
                    value={form.data.year}
                    onChange={(event) => form.setData('year', event.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  />
                  {form.errors.year && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-tight">{form.errors.year}</p>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center h-5 pt-0.5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={form.data.is_active}
                      onChange={(e) => form.setData('is_active', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="is_active" className="text-xs font-black text-emerald-950 cursor-pointer uppercase tracking-tight">
                      Jadikan Aktif
                    </label>
                    <p className="text-[10px] font-bold text-emerald-800/60 mt-0.5 uppercase tracking-tighter">Otomatis diatur sebagai tahun ajaran berjalan.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={form.processing}
                  className="w-full h-11 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest disabled:opacity-50"
                >
                  {form.processing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Simpan Data
                </button>
              </form>
            </ContentPanel>

            <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100/30 flex items-start gap-4 mt-6">
               <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
                  <Info size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Integritas Data</h4>
                  <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-tighter leading-relaxed">
                    Hanya satu tahun akademik yang dapat aktif dalam satu waktu. Mengaktifkan tahun baru akan menonaktifkan tahun sebelumnya.
                  </p>
               </div>
            </div>
          </div>

          {/* DATA LIST PANEL (Right 2/3) */}
          <div className="lg:col-span-2">
            <ContentPanel
              title="Arsip Tahun Akademik"
              icon={CalendarDays}
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="CARI TAHUN..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-56"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    {paginationMeta?.total || rows.length} Data Terdaftar
                  </span>
                  {paginationMeta && <Pagination meta={paginationMeta} />}
                </div>
              }
            >
              <PremiumTable
                headers={['Tahun Akademik', 'Status', 'Aksi']}
                isEmpty={rows.length === 0}
                emptyText="Belum ada data tahun akademik."
              >
                {rows.map((year) => (
                  <PremiumTableRow key={year.id} className="group">
                    <PremiumTableCell>
                      <span className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">{year.year}</span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <StatusTag status={year.is_active ? 'Aktif' : 'Nonaktif'} />
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(year)}
                          className="h-8 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 text-emerald-900 bg-white hover:bg-gray-50 transition-all active:scale-95"
                        >
                          {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => destroy(year)}
                          className="h-8 w-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
