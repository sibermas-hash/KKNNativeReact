'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { adminApi, rawApi } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';

type FacultyOption = {
  id: number;
  nama: string;
};

type StudyProgramOption = {
  id: number;
  nama: string;
  fakultas_id: number | null;
  faculty?: FacultyOption | null;
};

type StudentRow = {
  id: number;
  nim: string;
  nama: string;
  fakultas_id: number | null;
  prodi_id: number | null;
  batch_year?: number | null;
  semester?: number | null;
  faculty?: FacultyOption | null;
  prodi?: {
    id: number;
    nama: string;
    fakultas_id: number | null;
  } | null;
};

type PaginatedStudentsResponse = {
  data: StudentRow[];
  meta?: PaginationMeta;
};

function normalizeOptionLabel(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function dedupeOptions<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default function MahasiswaIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [fakultasId, setFakultasId] = useState('');
  const [prodiId, setProdiId] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<PaginatedStudentsResponse>({
    queryKey: ['admin', 'mahasiswa', { search: deferredSearch, fakultasId, prodiId, page, perPage }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<StudentRow[]>>('/admin/mahasiswa', {
        params: {
          search: deferredSearch || undefined,
          fakultas_id: fakultasId || undefined,
          prodi_id: prodiId || undefined,
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

  const { data: facultiesData } = useQuery<FacultyOption[]>({
    queryKey: ['admin', 'fakultas', 'mahasiswa-filters'],
    queryFn: async () => {
      const response = await adminApi.master.faculties.index({});
      return response as unknown as FacultyOption[];
    },
  });

  const { data: programsData } = useQuery<StudyProgramOption[]>({
    queryKey: ['admin', 'prodi', 'mahasiswa-filters', fakultasId],
    queryFn: async () => {
      const response = await adminApi.master.studyPrograms.index({
        fakultas_id: fakultasId || undefined,
      });
      return response as unknown as StudyProgramOption[];
    },
  });

  const students = data?.data ?? [];
  const meta = data?.meta;
  const errorMessage = isError ? mutationErrorHandler(error) : null;
  const faculties = dedupeOptions(
    facultiesData ?? [],
    (faculty) => normalizeOptionLabel(faculty.nama) || `faculty:${faculty.id}`,
  );
  const programs = dedupeOptions(
    programsData ?? [],
    (program) => `${program.fakultas_id ?? 'none'}:${normalizeOptionLabel(program.nama) || `prodi:${program.id}`}`,
  );
  const activeFilterCount = [deferredSearch, fakultasId, prodiId].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const batchLabel = meta
    ? `Batch ${meta.current_page} dari ${meta.last_page} • ${meta.from ?? 0}-${meta.to ?? 0} dari ${meta.total} mahasiswa`
    : `Menampilkan ${students.length} mahasiswa`;

  const resetFilters = () => {
    setSearch('');
    setFakultasId('');
    setProdiId('');
    setPage(1);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Data Mahasiswa" subtitle="Daftar mahasiswa peserta KKN" />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="w-full xl:col-span-2">
                <label htmlFor="search-mahasiswa" className="text-[10px] font-black uppercase text-slate-500">
                  Cari Mahasiswa
                </label>
                <input
                  id="search-mahasiswa"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari NIM atau nama..."
                  autoComplete="off"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold"
                />
              </div>

              <div className="w-full">
                <label htmlFor="filter-fakultas" className="text-[10px] font-black uppercase text-slate-500">
                  Fakultas
                </label>
                <select
                  id="filter-fakultas"
                  value={fakultasId}
                  onChange={(event) => {
                    setFakultasId(event.target.value);
                    setProdiId('');
                    setPage(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold"
                >
                  <option value="">Semua Fakultas</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>{faculty.nama}</option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label htmlFor="filter-prodi" className="text-[10px] font-black uppercase text-slate-500">
                  Prodi
                </label>
                <select
                  id="filter-prodi"
                  value={prodiId}
                  onChange={(event) => {
                    setProdiId(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold"
                >
                  <option value="">Semua Prodi</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {fakultasId
                        ? program.nama
                        : `${program.nama}${program.faculty?.nama ? ` • ${program.faculty.nama}` : ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40">
                <label htmlFor="students-per-batch" className="text-[10px] font-black uppercase text-slate-500">
                  Per Batch
                </label>
                <select
                  id="students-per-batch"
                  value={perPage}
                  onChange={(event) => {
                    setPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size} mahasiswa</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase text-slate-600 hover:bg-slate-50"
                >
                  Reset Filter ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {isFetching && !isLoading ? 'Memuat batch baru...' : batchLabel}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">{errorMessage || 'Gagal memuat data mahasiswa.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={40} />}
          title="Belum ada mahasiswa"
          description={hasActiveFilters ? 'Tidak ada mahasiswa yang cocok dengan filter saat ini.' : 'Tidak ada data mahasiswa yang ditemukan.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="p-4">NIM</th>
                <th className="p-4">Nama</th>
                <th className="hidden p-4 md:table-cell">Fakultas</th>
                <th className="hidden p-4 md:table-cell">Prodi</th>
                <th className="hidden p-4 lg:table-cell">Angkatan</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-50">
                  <td className="p-4 font-mono text-xs">{student.nim || '-'}</td>
                  <td className="p-4 font-medium">{student.nama || '-'}</td>
                  <td className="hidden p-4 text-slate-600 md:table-cell">{student.faculty?.nama || '-'}</td>
                  <td className="hidden p-4 text-slate-600 md:table-cell">{student.prodi?.nama || '-'}</td>
                  <td className="hidden p-4 text-slate-600 lg:table-cell">{student.batch_year ?? '-'}</td>
                  <td className="p-4">
                    <Link
                      href={`/admin/mahasiswa/${student.id}`}
                      className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">{batchLabel}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={meta.current_page <= 1}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Halaman {meta.current_page} / {meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
              disabled={meta.current_page >= meta.last_page}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
