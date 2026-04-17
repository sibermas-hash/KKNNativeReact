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
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';

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
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<'toggle' | 'delete' | null>(null);

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
          title="Manajemen Tahun Akademik"
          subtitle="Daftar tahun ajaran aktif yang digunakan untuk mengelompokkan periode pelaksanaan KKN."
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
              title="Tambah Tahun Akademik"
              description="Daftarkan formasi tahun ajaran baru."
              icon={Plus}
            >
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="academic-year" className="block text-sm font-medium text-gray-900">
                    Tahun Akademik
                  </label>
                  <input
                    id="academic-year"
                    type="text"
                    placeholder="Contoh: 2026/2027"
                    value={form.data.year}
                    onChange={(event) => form.setData('year', event.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-[#1a7a4a] focus:ring-1 focus:ring-[#1a7a4a] outline-none transition-all placeholder:text-gray-400"
                  />
                  {form.errors.year && (
                    <p className="text-xs text-red-500 mt-1">{form.errors.year}</p>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5 pt-0.5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={form.data.is_active}
                      onChange={(e) => form.setData('is_active', e.target.checked)}
                      className="w-4 h-4 text-[#16a34a] bg-white border-gray-300 rounded focus:ring-[#16a34a] cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Jadikan Aktif
                    </label>
                    <p className="text-xs text-gray-700 mt-0.5">Otomatis diatur sebagai tahun ajaran berjalan.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={form.processing}
                  className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {form.processing ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Simpan Data
                </button>
              </form>
            </ContentPanel>
          </div>

          {/* DATA LIST PANEL (Right 2/3) */}
          <div className="lg:col-span-2">
            <ContentPanel
              title="Daftar Tahun Akademik"
              icon={Calendar}
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="Cari tahun..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-56"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">
                    Menampilkan {rows.length} baris
                  </span>
                  {paginationMeta && <Pagination meta={paginationMeta} />}
                </div>
              }
            >
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tahun Akademik</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-sm text-gray-700">
                        Belum ada data tahun akademik.
                      </td>
                    </tr>
                  ) : (
                    rows.map((year) => (
                      <tr key={year.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-base font-semibold text-gray-900">{year.year}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusTag status={year.is_active ? 'Aktif' : 'Nonaktif'} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleStatus(year)}
                              className="h-8 px-3.5 rounded-md text-sm font-medium border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                            >
                              {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              onClick={() => destroy(year)}
                              className="h-8 w-8 flex items-center justify-center text-[#ef4444] hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
