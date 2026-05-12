'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function MahasiswaIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ['admin', 'mahasiswa', { search, fakultas_id: fakultasId, page }],
    queryFn: async () => {
      const res = await adminApi.users.index({ search, fakultas_id: fakultasId, page, role: 'student' });
      return (res as unknown as { data?: Record<string, unknown>[] }).data ?? [];
    },
  });

  const students = data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Data Mahasiswa" subtitle="Daftar mahasiswa peserta KKN" />

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari NIM/Nama..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-full sm:w-64"
        />
        <select
          value={fakultasId}
          onChange={(e) => { setFakultasId(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-full sm:w-auto"
        >
          <option value="">Semua Fakultas</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : students.length === 0 ? (
        <EmptyState icon={<GraduationCap size={40} />} title="Belum ada mahasiswa" description="Tidak ada data mahasiswa yang ditemukan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="p-4">NIM</th>
                <th className="p-4">Nama</th>
                <th className="p-4 hidden md:table-cell">Prodi</th>
                <th className="p-4 hidden lg:table-cell">Angkatan</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={String(s.id)} className="border-b border-slate-50">
                  <td className="p-4 font-mono text-xs">{String((s as Record<string, unknown>)?.nim || (s as Record<string, unknown>)?.username || '-')}</td>
                  <td className="p-4 font-medium">{String(s.name || '-')}</td>
                  <td className="p-4 text-slate-600 hidden md:table-cell">{String(((s as Record<string, unknown>)?.prodi as Record<string, unknown>)?.nama || '-')}</td>
                  <td className="p-4 text-slate-600 hidden lg:table-cell">{String((s as Record<string, unknown>)?.batch_year || '-')}</td>
                  <td className="p-4">
                    <Link
                      href={`/admin/mahasiswa/${s.id}`}
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
    </div>
  );
}
