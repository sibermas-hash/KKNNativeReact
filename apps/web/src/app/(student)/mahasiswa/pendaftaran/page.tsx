'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, studentApi } from '@/lib/api';
import Link from 'next/link';

export default function RegistrationFormPage() {
  

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.form,
    queryFn: async () => {
      const res = await studentApi.registration.form();
      return res;
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;

  const periods = (data?.periods as Record<string, unknown>[]) || [];
  const eligibility = data?.eligibility as Record<string, unknown> | undefined;
  const existing = data?.existing_registration as Record<string, unknown> | null | undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Pendaftaran KKN</h1>

      {existing && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Status Pendaftaran Saat Ini</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Periode: {String((existing.periode as Record<string, unknown>)?.name || '-')}</p>
              <p className="text-sm text-slate-500">Status: {String(existing.status || '-')}</p>
            </div>
            <Link href="/mahasiswa/cek-pendaftaran" className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Lihat Status</Link>
          </div>
        </div>
      )}

      {eligibility && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Kelayakan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">SKS</p>
              <p className="font-semibold">{String((eligibility as Record<string, unknown>)?.sks_completed || '-')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">IPK</p>
              <p className="font-semibold">{String((eligibility as Record<string, unknown>)?.gpa || '-')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">Periode Tersedia</h2>
        {periods.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-4xl">📝</p>
            <p className="mt-4 text-lg font-semibold text-slate-700">Tidak Ada Periode Aktif</p>
            <p className="mt-2 text-sm text-slate-500">Pendaftaran KKN belum dibuka.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((p) => (
              <div key={String(p.id)} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{String(p.name || '-')}</p>
                    <p className="text-sm text-slate-500">Periode {String(p.periode || '-')} | Kuota: {String(p.kuota || '-')}</p>
                    <p className="text-xs text-slate-500 mt-1">{String(p.start_date || '-')} — {String(p.end_date || '-')}</p>
                  </div>
                  <Link href={`/mahasiswa/pendaftaran/${p.id}/dokumen`} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Daftar</Link>
                </div>
                {p.jenis_kkn ? (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-sm text-slate-600">Jenis: {String((p.jenis_kkn as Record<string, unknown>)?.name || '-')}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
