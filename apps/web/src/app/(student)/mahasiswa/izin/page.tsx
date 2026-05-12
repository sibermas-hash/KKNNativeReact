'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Plane } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';

export default function IzinPage(): React.JSX.Element {
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.leaveRequests,
    queryFn: async () => { const res = await studentApi.leaveRequests.index(); return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>; },
  });

  const izinList = (data?.izin as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Plane size={28} /></div>
          <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Izin Meninggalkan Lokasi</h1><p className="text-sm text-slate-400">Kelola pengajuan izin</p></div>
        </div>
        <Link href="/mahasiswa/izin/buat" className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"><Plus size={16} /> Ajukan Izin</Link>
      </div>

      {isLoading ? <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      : izinList.length === 0 ? <EmptyState icon={<Plane size={48} />} title="Belum Ada Pengajuan Izin" />
      : (
        <div className="space-y-4">
          {(izinList as Record<string, unknown>[]).map((izin) => (
            <div key={String(izin.id)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900 capitalize">{String(izin.type || '-')}</p>
                  <p className="text-sm text-slate-600 mt-1">{String(izin.reason || '')}</p>
                  <p className="text-xs text-slate-400 mt-2">{String(izin.start_date || '')} — {String(izin.end_date || '')}</p>
                </div>
                <StatusBadge status={String(izin.status || 'pending')} size="md" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
