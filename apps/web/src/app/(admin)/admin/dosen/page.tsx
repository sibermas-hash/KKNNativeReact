'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function DosenIndexPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<unknown[]>({
    queryKey: ['admin', 'dosen', { search }],
    queryFn: async () => {
      const res = await api.get('/admin/dosen', { params: { search } });
      return (res as unknown as { success: boolean; data: unknown[] }).data;
    },
  });

  const dosen = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Data Dosen</h1>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIP/Nama..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64" />

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="p-4">NIP</th><th className="p-4">Nama</th><th className="p-4">Fakultas</th><th className="p-4">Jabatan</th>
            </tr></thead>
            <tbody>
              {dosen.map((d: unknown) => {
  const item = d as Record<string, unknown>;
  return (
    <tr key={String(item.id)} className="border-b border-slate-50">
      <td className="p-4 font-mono text-xs">{String(item.nip || '-')}</td>
      <td className="p-4 font-medium">{String(item.nama || '-')}</td>
      <td className="p-4 text-slate-600">{String((item.fakultas as Record<string, unknown>)?.nama || '-')}</td>
      <td className="p-4 text-slate-600">{String(item.jabatan || '-')}</td>
    </tr>
  );
})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
