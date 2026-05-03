'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RegistrationStatusPage() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.status,
    queryFn: async () => {
      const res = await endpoints.registration.status();
      return (res.data as { success: boolean; data: { registrations: unknown[] } }).data;
    },
  });

  const registrations = (data?.registrations as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Status Pendaftaran</h1>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : registrations.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">📝</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Pernah Mendaftar</p>
          <Link href="/mahasiswa/daftar" className="mt-4 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Daftar KKN</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id as number} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Periode</p>
                  <p className="font-semibold text-slate-800">{((reg.periode as Record<string, unknown>)?.name as string) || '-'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : reg.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {reg.status === 'approved' ? '✅ Disetujui' : reg.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu'}
                </span>
              </div>
              {String(reg.rejection_reason || '') && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  Alasan: {String(reg.rejection_reason)}
                </p>
              )}
              {(reg.kelompok as Record<string, unknown>) && (
                <div className="mt-3 rounded-lg bg-teal-50 px-3 py-2">
                  <p className="text-sm font-medium text-teal-700">Kelompok: {String((reg.kelompok as Record<string, unknown>)?.name || '-')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
