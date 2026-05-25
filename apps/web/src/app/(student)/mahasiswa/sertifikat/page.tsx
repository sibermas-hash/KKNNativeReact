'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { Download, GraduationCap, Award, AlertCircle, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Score = {
  id: number;
  total_score?: number | null;
  letter_grade?: string | null;
  grade?: string | null;
  is_finalized?: boolean;
  evaluator_name?: string | null;
  notes?: string | null;
  components?: { criterion: string; score: number; weight: number }[];
};

type Certificate = {
  id: number;
  certificate_number?: string;
  nama_mahasiswa?: string;
  nim?: string;
  issued_at?: string;
  status?: string;
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'A-': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200',
  B: 'text-blue-700 bg-blue-50 border-blue-200',
  'B-': 'text-blue-700 bg-blue-50 border-blue-200',
  'C+': 'text-amber-700 bg-amber-50 border-amber-200',
  C: 'text-amber-700 bg-amber-50 border-amber-200',
  D: 'text-orange-700 bg-orange-50 border-orange-200',
  E: 'text-rose-700 bg-rose-50 border-rose-200',
};

export default function CertificatesPage(): React.JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.certificates,
    queryFn: async () => {
      const res = await studentApi.certificates.index();
      return ((res as { data?: unknown }).data ?? res) as { scores?: Score[]; certificates?: Certificate[] };
    },
    retry: false,
  });

  const scores: Score[] = useMemo(() => data?.scores ?? [], [data]);
  const certificates: Certificate[] = useMemo(() => data?.certificates ?? [], [data]);

  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  const downloadCertificate = async (c: Certificate) => {
    try {
      const res = await studentApi.certificates.download(c.id);
      const blob = res instanceof Blob ? res : new Blob([res as unknown as BlobPart], { type: 'application/pdf' });

      if (blob.type && !blob.type.includes('pdf')) {
        const text = await blob.text();
        try {
          const parsed = JSON.parse(text);
          toast.error(parsed?.error?.message ?? 'Gagal mengunduh sertifikat');
        } catch {
          toast.error('Gagal mengunduh sertifikat');
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sertifikat_KKN_${c.nim ?? c.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Sertifikat diunduh');
    } catch {
      toast.error('Gagal mengunduh sertifikat');
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sertifikat & Nilai</h1>
          <p className="text-sm text-slate-500">Hasil penilaian dan sertifikat resmi KKN Anda</p>
        </div>
      </div>

      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-black text-amber-900">Belum Tersedia</h2>
          <p className="text-sm text-amber-800">{phaseMessage ?? 'Sertifikat dan nilai akan tersedia setelah masa penilaian selesai.'}</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      )}

      {!isLoading && !isPhaseBlocked && scores.length === 0 && certificates.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <GraduationCap className="h-14 w-14 text-slate-300 mx-auto" />
          <p className="font-black text-slate-900 text-lg">Belum Ada Nilai atau Sertifikat</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Nilai akan muncul setelah DPL/admin menginput penilaian Anda. Sertifikat akan diterbitkan setelah seluruh proses KKN selesai dan disetujui LP2M.
          </p>
        </div>
      )}

      {/* Scores */}
      {scores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 inline-flex items-center gap-2">
            <Star size={14} className="text-amber-600" /> Nilai KKN
          </h2>
          {scores.map((s) => {
            const grade = (s.letter_grade ?? s.grade ?? '').toUpperCase();
            const gradeColor = GRADE_COLORS[grade] ?? 'text-slate-700 bg-slate-50 border-slate-200';
            return (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Skor</p>
                    <p className="text-3xl font-black text-emerald-600 tabular-nums">{s.total_score ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grade</p>
                    {grade ? (
                      <span className={'mt-1 inline-block rounded-lg border px-3 py-1 text-xl font-black ' + gradeColor}>
                        {grade}
                      </span>
                    ) : (
                      <p className="text-xl text-slate-300">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</p>
                    <span className={'mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-black ' + (s.is_finalized
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200')}>
                      <CheckCircle2 size={10} /> {s.is_finalized ? 'Final' : 'Sementara'}
                    </span>
                  </div>
                  {s.evaluator_name && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Penilai</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{s.evaluator_name}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(s.components) && s.components.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Komponen Penilaian</p>
                    <div className="space-y-1.5">
                      {s.components.map((c, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm">
                          <span className="text-slate-700">{c.criterion}</span>
                          <span className="text-slate-500 text-xs">×{c.weight}</span>
                          <span className="font-black text-slate-900 tabular-nums">{c.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.notes && (
                  <p className="mt-3 text-xs text-slate-500 italic">Catatan: {s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 inline-flex items-center gap-2">
            <Award size={14} className="text-purple-600" /> Sertifikat
          </h2>
          {certificates.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                  <Award size={22} />
                </div>
                <div>
                  <p className="font-black text-slate-900">{c.nama_mahasiswa ?? '-'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No. {c.certificate_number ?? '-'}
                    {c.nim ? ` • NIM ${c.nim}` : ''}
                    {c.issued_at ? ` • Terbit ${new Date(c.issued_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadCertificate(c)}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow"
              >
                <Download size={14} /> Unduh PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
