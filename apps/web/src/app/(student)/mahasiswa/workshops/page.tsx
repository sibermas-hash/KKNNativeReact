'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/shared';

export default function WorkshopsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'workshops'],
    queryFn: async () => { const res = await api.get('/student/workshops'); return (res.data as { success: boolean; data: { workshops: unknown[] } }).data; },
  });

  const workshops = data?.workshops || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BookOpen size={28} /></div>
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Workshop & Pembekalan</h1><p className="text-sm text-slate-400">Jadwal dan sertifikat workshop</p></div>
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      : workshops.length === 0 ? <EmptyState icon={<BookOpen size={48} />} title="Belum Ada Workshop" />
      : (
        <div className="space-y-4">
          {(workshops as Record<string, unknown>[]).map((w) => (
            <div key={String(w.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm">
              <p className="text-lg font-black text-slate-900">{String(w.title || '-')}</p>
              <p className="text-sm text-slate-500 mt-1">{String(w.workshop_date || '-')} | {String(w.location || '-')}</p>
              <p className="text-sm text-slate-500">Pembicara: {String(w.speaker || '-')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
