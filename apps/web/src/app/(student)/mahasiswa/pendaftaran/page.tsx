'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function RegistrationFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.form,
    queryFn: async () => {
      const res = await studentApi.registration.form();
      return (res as any).data ?? res;
    },
  });

  // Step 1: POST /student/registration → buat PesertaKkn dulu
  const registerMutation = useMutation({
    mutationFn: (periodeId: number) => studentApi.registration.store({ periode_id: periodeId }),
    onSuccess: (_data, periodeId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.form });
      router.push(`/mahasiswa/pendaftaran/${periodeId}/dokumen`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Gagal mendaftar. Periksa kelayakan Anda.';
      toast.error(msg);
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;

  const periods = (data?.periods as Record<string, unknown>[]) || [];
  const eligibility = data?.eligibility as Record<string, unknown> | undefined;
  const existing = data?.existing_registration as Record<string, unknown> | null | undefined;
  const isEligible = (eligibility as any)?.eligible === true;

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
          <div className="space-y-2">
            {((eligibility as any).checks as Array<{ key: string; label: string; met: boolean; message?: string }> || []).map((check) => (
              <div key={check.key} className="flex items-center gap-3">
                {check.met
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                <span className={`text-sm ${check.met ? 'text-slate-700' : 'text-red-600'}`}>
                  {check.label}{check.message ? ` — ${check.message}` : ''}
                </span>
              </div>
            ))}
            {/* Fallback jika backend tidak kirim checks array */}
            {!((eligibility as any).checks) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">SKS</p>
                  <p className="font-semibold">{String((eligibility as any)?.sks_completed || '-')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">IPK</p>
                  <p className="font-semibold">{String((eligibility as any)?.gpa || '-')}</p>
                </div>
              </div>
            )}
          </div>
          {!isEligible && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              Anda belum memenuhi syarat pendaftaran KKN.
            </p>
          )}
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
                  <button
                    onClick={() => registerMutation.mutate(Number(p.id))}
                    disabled={!isEligible || registerMutation.isPending}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {registerMutation.isPending ? 'Memproses...' : 'Daftar'}
                  </button>
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
