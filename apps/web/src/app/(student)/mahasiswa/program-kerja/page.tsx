'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WorkProgramsPage() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: async () => {
      const res = await endpoints.workPrograms.index();
      return (res.data as { success: boolean; data: { programs: unknown[] } }).data;
    },
  });

  const programs = (data?.programs as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Program Kerja</h1>
        <Link href="/mahasiswa/program-kerja/buat" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ Buat Program</Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">🎯</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Program Kerja</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <Link key={p.id as number} href={`/mahasiswa/program-kerja/${p.id}`} className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
              <p className="font-semibold text-slate-800">{p.title as string}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{(p.description as string) || '-'}</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{p.status as string}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
