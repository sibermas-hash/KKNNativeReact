'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function GroupDetailPage(): React.JSX.Element {
  const { id } = useParams();
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.group(Number(id)),
    queryFn: async () => {
      return await dplApi.groups.show(Number(id));
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Kelompok tidak ditemukan</div>;

  const d = data as any;
  const members = (d.members as Record<string, unknown>[]) || [];
  const workPrograms = (d.work_programs as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{d.name as string}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Kode</p>
          <p className="font-semibold">{d.code as string}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Lokasi</p>
          <p className="font-semibold">{d.village_name as string}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Kapasitas</p>
          <p className="font-semibold">{d.capacity}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Status</p>
          <p className="font-semibold capitalize">{(d.status as string) || '-'}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Anggota ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-2">NIM</th><th className="pb-2">Nama</th><th className="pb-2">Prodi</th><th className="pb-2">Role</th><th className="pb-2">Status Nilai</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id as number} className="border-b border-slate-50">
                  <td className="py-2">{(m.student as Record<string, unknown>)?.nim as string}</td>
                  <td className="py-2">{(m.student as Record<string, unknown>)?.name as string}</td>
                  <td className="py-2">{(m.student as Record<string, unknown>)?.program_name as string}</td>
                  <td className="py-2"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{m.role as string || 'Anggota'}</span></td>
                  <td className="py-2">{m.nilai ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {workPrograms.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Program Kerja</h2>
          <div className="space-y-2">
            {workPrograms.map((p) => (
              <div key={p.id as number} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2">
                <p className="text-sm font-medium">{p.title as string}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{p.status as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
