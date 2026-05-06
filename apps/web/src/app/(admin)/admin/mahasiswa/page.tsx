'use client';

import { useQuery } from '@tanstack/react-query';

import { api, adminApi } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

export default function MahasiswaIndexPage() {
  
  const [search, setSearch] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [page, setPage] = useState(1);

const { data, isLoading } = useQuery<any[]>({
  queryKey: ['admin', 'mahasiswa', { search, fakultas_id: fakultasId, page }],
  queryFn: async () => {
    const res = await adminApi.users.index({ search, fakultas_id: fakultasId, page, role: 'student' });
    return (res as any).data;
  },
});

const students = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Data Mahasiswa</h1>
      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari NIM/Nama..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64" />
        <select value={fakultasId} onChange={(e) => { setFakultasId(e.target.value); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Semua Fakultas</option>
        </select>
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="p-4">NIM</th><th className="p-4">Nama</th><th className="p-4">Prodi</th><th className="p-4">Angkatan</th><th className="p-4">Aksi</th>
            </tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={String(s.id)} className="border-b border-slate-50">
                  <td className="p-4 font-mono text-xs">{String((s as Record<string, unknown>)?.nim || (s as Record<string, unknown>)?.username || '-')}</td>
                  <td className="p-4 font-medium">{String(s.name || '-')}</td>
                  <td className="p-4 text-slate-600">{String(((s as Record<string, unknown>)?.prodi as Record<string, unknown>)?.nama || '-')}</td>
                  <td className="p-4 text-slate-600">{String((s as Record<string, unknown>)?.batch_year || '-')}</td>
                  <td className="p-4"><Link href={`/admin/mahasiswa/${s.id}`} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
