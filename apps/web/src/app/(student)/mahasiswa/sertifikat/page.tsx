'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { Download, GraduationCap } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';

export default function CertificatesPage(): React.JSX.Element {
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.certificates,
    queryFn: async () => { const res = await studentApi.certificates.index(); return (res as unknown as { data?: unknown })?.data ?? res; },
  });

  const scores = (data?.scores as Record<string, unknown>[]) || [];
  const certificates = (data?.certificates as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><GraduationCap size={28} /></div>
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sertifikat & Nilai</h1><p className="text-sm text-slate-400">Lihat nilai dan sertifikat KKN</p></div>
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      : scores.length === 0 && certificates.length === 0 ? <EmptyState icon={<GraduationCap size={48} />} title="Belum Ada Nilai atau Sertifikat" description="Nilai dan sertifikat akan muncul setelah KKN selesai" />
      : (
        <>
          {scores.length > 0 && (
            <div className="space-y-4"><h2 className="text-lg font-black text-slate-700">Nilai KKN</h2>
              {scores.map((s) => (
                <div key={String(s.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm grid grid-cols-3 gap-4">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Total Skor</p><p className="text-2xl font-black text-emerald-600">{String(s.total_score || '-')}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Grade</p><p className="text-2xl font-black text-amber-600">{String(s.letter_grade || '-')}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Status</p><StatusBadge status={s.is_finalized ? 'approved' : 'pending'} size="md" /></div>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div className="space-y-4"><h2 className="text-lg font-black text-slate-700">Sertifikat</h2>
              {certificates.map((c) => (
                <div key={String(c.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900">{String(c.nama_mahasiswa || '-')}</p>
                    <p className="text-sm text-slate-500">No: {String(c.certificate_number || '-')} | NIM: {String(c.nim || '-')}</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        // With responseType: 'blob', axios returns a Blob (via handleResponse
                        // the client returns `response.data` directly for blob responses).
                        // Validate it really is a PDF so an accidental JSON error envelope
                        // can't get masked as `.pdf` on disk.
const res = await studentApi.certificates.download(Number(c.id));
                         const blob = res instanceof Blob ? res : new Blob([res as unknown as BlobPart], { type: 'application/pdf' });

                        if (blob.type && !blob.type.includes('pdf')) {
                          // Backend likely returned JSON error envelope despite 200;
                          // try to surface a meaningful message.
                          const text = await blob.text();
                          try {
                            const parsed = JSON.parse(text);
                            toast.error(parsed?.error?.message || 'Gagal mengunduh sertifikat');
                          } catch {
                            toast.error('Gagal mengunduh sertifikat');
                          }
                          return;
                        }

                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Sertifikat_KKN_${String(c.nim || '')}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch { toast.error('Gagal mengunduh sertifikat'); }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 shadow-sm"
                  >
                    <Download size={14} /> Unduh
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
