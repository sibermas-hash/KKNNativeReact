'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function GroupDetailPage() {
  const { id } = useParams();
  const endpoints = adminEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'group', Number(id)],
    queryFn: async () => {
      const res = await endpoints.groups.show(Number(id));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Kelompok tidak ditemukan</div>;

  const members = (data.members as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{String(data.nama_kelompok || 'Detail Kelompok')}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Kode</p><p className="font-semibold">{String(data.code || '-')}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Lokasi</p><p className="font-semibold">{String(((data.lokasi as Record<string, unknown>)?.village_name as string) || '-')}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Kapasitas</p><p className="font-semibold">{String(data.capacity || '-')}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">DPL</p><p className="font-semibold">{String(((data.dosen as Record<string, unknown>[])?.[0]?.nama as string) || '-')}</p></div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Anggota ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="p-3">NIM</th><th className="p-3">Nama</th><th className="p-3">Role</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={String(m.id)} className="border-b border-slate-50">
                  <td className="p-3">{String((m.mahasiswa as Record<string, unknown>)?.nim || '-')}</td>
                  <td className="p-3 font-medium">{String((m.mahasiswa as Record<string, unknown>)?.nama || '-')}</td>
                  <td className="p-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{String(m.role || 'Anggota')}</span></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${m.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{String(m.status || '-')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
