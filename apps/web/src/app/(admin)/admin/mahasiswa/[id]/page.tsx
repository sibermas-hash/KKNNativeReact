'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function MahasiswaDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'mahasiswa', Number(id)],
    queryFn: async () => {
      const res = await api.get(`/admin/mahasiswa/${id}`);
      return res;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Mahasiswa tidak ditemukan</div>;

  const mhs = data as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Detail Mahasiswa</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div><p className="text-xs text-slate-500">NIM</p><p className="font-semibold">{String(mhs.nim || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Nama</p><p className="font-semibold">{String(mhs.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">NIK</p><p className="font-semibold">{String(mhs.nik || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Fakultas</p><p className="font-semibold">{String((mhs.fakultas as Record<string, unknown>)?.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Prodi</p><p className="font-semibold">{String((mhs.prodi as Record<string, unknown>)?.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Angkatan</p><p className="font-semibold">{String(mhs.batch_year || '-')}</p></div>
          <div><p className="text-xs text-slate-500">IPK</p><p className="font-semibold">{String(mhs.gpa || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Semester</p><p className="font-semibold">{String(mhs.semester || '-')}</p></div>
          <div><p className="text-xs text-slate-500">SKS</p><p className="font-semibold">{String(mhs.sks_completed || '-')}</p></div>
        </div>
      </div>
    </div>
  );
}
