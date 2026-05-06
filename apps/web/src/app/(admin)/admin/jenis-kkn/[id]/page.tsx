'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function JenisKknDetailPage() {
  const { id } = useParams();
  

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'jenis-kkn', Number(id)],
    queryFn: async () => {
      const res = await api.get(`/admin/jenis-kkn/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Jenis KKN tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{String(data.name || 'Detail Jenis KKN')}</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">Kode</p><p className="font-semibold">{String(data.code || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Nama</p><p className="font-semibold">{String(data.name || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Mode Pendaftaran</p><p className="font-semibold">{String(data.registration_mode_label || data.registration_mode || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Mode Penempatan</p><p className="font-semibold">{String(data.placement_mode_label || data.placement_mode || '-')}</p></div>
        </div>
        {data.description ? <p className="mt-4 text-sm text-slate-600">{String(data.description)}</p> : null}
      </div>
    </div>
  );
}
