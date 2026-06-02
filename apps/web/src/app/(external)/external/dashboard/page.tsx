'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';

type Dashboard = { external_university?: { name:string }; stats: { participants:number; letters:number; submitted:number; verified:number; rejected:number; participants_by_status?: Record<string, number>; letters_by_status?: Record<string, number> } };

export default function ExternalDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey:['external','dashboard'], queryFn: async () => (await api.get('/external/dashboard')) as Dashboard });
  const s = data?.stats;
  return <div className="space-y-6">
    <PageHeader title="Dashboard Kampus Luar" subtitle={data?.external_university?.name || 'Ringkasan KKN kolaborasi'} />
    {isLoading ? 'Loading...' : <div className="grid gap-4 md:grid-cols-4">
      {[['Peserta', s?.participants], ['Surat', s?.letters], ['Disetujui', s?.verified], ['Ditolak', s?.rejected]].map(([label,val]) => <div key={label} className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-5"><div className="text-xs uppercase font-black opacity-60">{label}</div><div className="mt-2 text-3xl font-black">{val ?? 0}</div></div>)}
    </div>}
  </div>;
}
