'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';

export default function CertificatesPage() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.certificates,
    queryFn: async () => {
      const res = await endpoints.certificates.index();
      return (res.data as { success: boolean; data: { scores: unknown[]; certificates: unknown[] } }).data;
    },
  });

  const scores = (data?.scores as Record<string, unknown>[]) || [];
  const certificates = (data?.certificates as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Sertifikat & Nilai</h1>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <>
          {scores.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-700">Nilai KKN</h2>
              {scores.map((score) => (
                <div key={score.id as number} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Skor</p>
                      <p className="text-2xl font-bold text-teal-600">{(score.total_score as number)?.toFixed(1) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Grade</p>
                      <p className="text-2xl font-bold text-amber-600">{(score.letter_grade as string) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm font-medium">{score.is_finalized ? '✅ Final' : '⏳ Proses'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {certificates.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-700">Sertifikat</h2>
              {certificates.map((cert) => (
                <div key={cert.id as number} className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="font-semibold text-slate-800">{cert.nama_mahasiswa as string}</p>
                  <p className="text-sm text-slate-600">No: {cert.certificate_number as string}</p>
                  <p className="text-sm text-slate-600">NIM: {cert.nim as string}</p>
                </div>
              ))}
            </div>
          )}

          {scores.length === 0 && certificates.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <p className="text-4xl">🎓</p>
              <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Nilai atau Sertifikat</p>
              <p className="mt-2 text-sm text-slate-500">Nilai dan sertifikat akan muncul setelah KKN selesai dan difinalisasi</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
