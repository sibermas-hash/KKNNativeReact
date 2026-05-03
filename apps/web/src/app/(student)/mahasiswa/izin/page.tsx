'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function IzinPage() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.leaveRequests,
    queryFn: async () => {
      const res = await endpoints.leaveRequests.index();
      return (res.data as { success: boolean; data: { izin: unknown[] } }).data;
    },
  });

  const izinList = (data?.izin as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Izin Meninggalkan Lokasi</h1>
        <Link href="/mahasiswa/izin/buat" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ Ajukan Izin</Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : izinList.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">✈️</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Pengajuan Izin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {izinList.map((izin) => (
            <div key={izin.id as number} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800 capitalize">{izin.type as string}</p>
                  <p className="mt-1 text-sm text-slate-600">{izin.reason as string}</p>
                  <p className="mt-1 text-xs text-slate-500">{izin.start_date as string} — {izin.end_date as string}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${izin.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : izin.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {izin.status === 'approved' ? 'Disetujui' : izin.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
