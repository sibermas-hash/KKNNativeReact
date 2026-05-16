'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/shared';
import { Users } from 'lucide-react';

export default function EligibilityCheckPage(): React.JSX.Element {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<unknown>({
    queryKey: ['admin', 'eligibility', { search }],
    queryFn: async () => {
      return await api.get('/admin/audit-kualifikasi', { params: { search } });
    },
  });

  const payload = (data ?? {}) as Record<string, unknown>;
  const students = Array.isArray(data)
    ? data
    : Array.isArray(payload.students)
      ? payload.students
      : Array.isArray((payload.data as Record<string, unknown> | undefined)?.students)
        ? ((payload.data as Record<string, unknown>).students as unknown[])
        : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Kualifikasi"
        subtitle="Periksa kelayakan mahasiswa untuk mengikuti KKN berdasarkan SKS, IPK, dan persyaratan lainnya."
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari NIM/Nama..."
        className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Tidak ada data mahasiswa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s: unknown) => {
            const r = s as Record<string, unknown>;
            return (
              <div key={String(r.id)} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="font-semibold text-slate-800">{String(r.nama || '-')}</p>
                <p className="text-sm text-slate-500">
                  NIM: {String(r.nim || '-')} | SKS: {String(r.sks_completed || '-')} | IPK: {String(r.gpa || '-')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
