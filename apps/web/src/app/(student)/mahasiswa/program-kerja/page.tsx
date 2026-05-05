'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, studentApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Presentation } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';

export default function WorkProgramsPage() {
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: async () => { const res = await studentApi.workPrograms.index() as unknown as { success: boolean; data: Record<string, unknown> }; return res.data; },
  });

  const programs = (data?.programs as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Presentation size={28} /></div>
          <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Program Kerja</h1><p className="text-sm text-slate-400">Kelola program kerja kelompok</p></div>
        </div>
        <Link href="/mahasiswa/program-kerja/buat" className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"><Plus size={16} /> Buat Program</Link>
      </div>

      {isLoading ? <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : programs.length === 0 ? <EmptyState icon={<Presentation size={48} />} title="Belum Ada Program Kerja" />
      : (
        <div className="space-y-4">
          {programs.map((p) => (
            <Link key={String(p.id)} href={`/mahasiswa/program-kerja/${p.id}`} className="block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div><h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">{String(p.title || '')}</h3><p className="mt-1 text-sm text-slate-500 line-clamp-2">{String(p.description || '-')}</p></div>
                <StatusBadge status={String(p.status || 'draft')} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
