'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function RegistrationDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const queryClient = useQueryClient();
  

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pendaftaran', Number(id)],
    queryFn: async () => {
      const res = await adminApi.registrations.show(Number(id));
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.registrations.approve(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'pendaftaran', Number(id)] }); toast.success('Pendaftaran disetujui'); },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Pendaftaran tidak ditemukan</div>;

  const mhs = data.mahasiswa as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Detail Pendaftaran</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div><p className="text-xs text-slate-500">Nama</p><p className="font-semibold">{String(mhs?.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">NIM</p><p className="font-semibold">{String(mhs?.nim || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Status</p><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${data.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : data.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{String(data.status || '-')}</span></div>
          <div><p className="text-xs text-slate-500">Periode</p><p className="font-semibold">{String((data.periode as Record<string, unknown>)?.name || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Kelompok</p><p className="font-semibold">{String((data.kelompok as Record<string, unknown>)?.nama_kelompok || 'Belum ditugaskan')}</p></div>
          <div><p className="text-xs text-slate-500">Role</p><p className="font-semibold">{String(data.role || 'Anggota')}</p></div>
        </div>
        {data.status === 'pending' && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">✅ Setujui</button>
          </div>
        )}
      </div>
    </div>
  );
}
