'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, studentApi } from '@/lib/api';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';

export default function RegistrationStatusPage() {
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.status,
    queryFn: async () => { const res = await studentApi.registration.status() as unknown as { success: boolean; data: Record<string, unknown> }; return res.data; },
  });

  const registrations = data?.registrations || [];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileCheck size={28} /></div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Status Pendaftaran</h1>
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      : registrations.length === 0 ? <EmptyState icon={<FileCheck size={48} />} title="Belum Pernah Mendaftar" action={<Link href="/mahasiswa/daftar" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm">Daftar KKN</Link>} />
      : (
        <div className="space-y-4">
          {(registrations as Record<string, unknown>[]).map((reg) => (
            <div key={String(reg.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Periode</p>
                  <p className="font-black text-slate-900">{String((reg.periode as Record<string, unknown>)?.name || '-')}</p>
                </div>
                <StatusBadge status={String(reg.status || '-')} size="md" />
              </div>
              {reg.rejection_reason ? <p className="mt-3 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">Alasan: {String(reg.rejection_reason)}</p> : null}
              {reg.kelompok ? <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2"><p className="text-sm font-bold text-emerald-700">Kelompok: {String((reg.kelompok as Record<string, unknown>)?.name || '-')}</p></div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
