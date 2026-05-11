'use client';

export const dynamic = 'force-dynamic';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function DosenIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<unknown[]>({
    queryKey: ['admin', 'dosen', { search }],
    queryFn: async () => {
      return await api.get('/admin/dosen', { params: { search } });
    },
  });

  const dosen = data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Data Dosen"
        subtitle="Daftar seluruh dosen yang terdaftar dalam sistem."
        actions={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIP/Nama..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : dosen.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Tidak ada dosen" description="Tidak ada dosen yang sesuai pencarian." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">NIP</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Nama</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Fakultas</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Jabatan</th>
              </tr>
            </thead>
            <tbody>
              {dosen.map((d: unknown) => {
                const item = d as Record<string, unknown>;
                return (
                  <tr key={String(item.id)} className="border-b border-slate-50 last:border-0">
                    <td className="p-4 font-mono text-xs text-slate-600">{String(item.nip || '-')}</td>
                    <td className="p-4 font-medium text-slate-800">{String(item.nama || '-')}</td>
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
