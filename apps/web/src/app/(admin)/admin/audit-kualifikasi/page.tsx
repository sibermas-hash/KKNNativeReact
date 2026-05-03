'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function EligibilityCheckPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'eligibility', { search }],
    queryFn: async () => {
      const res = await api.get('/admin/audit-kualifikasi', { params: { search } });
      return res.data as { success: boolean; data: unknown[] };
    },
  });

  const students = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Audit Kualifikasi</h1>
      <p className="text-sm text-slate-500">Periksa kelayakan mahasiswa untuk mengikuti KKN berdasarkan SKS, IPK, dan persyaratan lainnya.</p>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIM/Nama..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64" />

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={String(s.id)} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-800">{String((s as Record<string, unknown>)?.nama || '-')}</p>
              <p className="text-sm text-slate-500">NIM: {String((s as Record<string, unknown>)?.nim || '-')} | SKS: {String((s as Record<string, unknown>)?.sks_completed || '-')} | IPK: {String((s as Record<string, unknown>)?.gpa || '-')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
