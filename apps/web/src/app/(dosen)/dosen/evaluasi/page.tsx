'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Upload } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import Link from 'next/link';

export default function DplEvaluationsPage(): React.JSX.Element {
  
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});

  const { data } = useQuery({
    queryKey: QUERY_KEYS.dpl.evaluations,
    queryFn: async () => {
      const res = await dplApi.evaluations.index();
      // API client interceptor unwraps to res.data.data, so res is already the inner object
      return res as unknown as Record<string, unknown>;
    },
  });

  // Handle both cases: direct API call vs interceptor-unwrapped
  const responseData = (data as unknown as { data?: { students?: Record<string, unknown>[] } })?.data ?? (data as { students?: Record<string, unknown>[] });
  const students = (responseData?.students as Record<string, unknown>[]) || [];
  const aspects = ['dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score'];
  const aspectLabels: Record<string, string> = { dpl_relevansi_score: 'Relevansi', dpl_ketercapaian_score: 'Ketercapaian', dpl_inovasi_score: 'Inovasi', dpl_administrasi_score: 'Administrasi', dpl_artikel_score: 'Artikel' };

  const updateScore = (studentId: number, aspect: string, value: number) => {
    setScores((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [aspect]: value } }));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: { student_id: number; kelompok_id: number; scores: Record<string, number> }) =>
      dplApi.evaluations.store(payload),
    onSuccess: () => {
      toast.success('Nilai berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dpl.evaluations });
    },
    onError: () => toast.error('Gagal menyimpan nilai'),
  });

  const handleSave = (studentId: number, groupId: number) => {
    saveMutation.mutate({ student_id: studentId, kelompok_id: groupId, scores: scores[studentId] || {} });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Evaluasi Mahasiswa" subtitle="Input nilai per aspek penilaian"
        actions={
          <Link href="/dosen/evaluasi/import" className="flex items-center gap-2 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)] shadow-sm">
            <Upload size={15} /> Import CSV
          </Link>
        }
      />

      {students.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Belum ada mahasiswa" />
      : (
        <div className="space-y-6">
          {students.map((s) => (
            <div key={String(s.id)} className="bg-[color:var(--profile-surface)] rounded-2xl p-6 border border-[color:var(--profile-border)] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div><p className="font-black text-[color:var(--profile-text)]">{String(s.name || '-')}</p><p className="text-xs text-[color:var(--profile-muted)]">NIM: {String(s.nim || '-')} | {String(s.group_name || '-')}</p></div>
                <button onClick={() => handleSave(s.id as number, s.group_id as number)} disabled={saveMutation.isPending} className="px-4 py-2 bg-[color:var(--profile-primary)] text-white hover:opacity-90 rounded-xl text-xs font-black uppercase transition-all">Simpan</button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {aspects.map((aspect) => (
                  <div key={aspect}>
                    <label className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase">{aspectLabels[aspect]}</label>
                    <input type="number" min={0} max={100} value={scores[s.id as number]?.[aspect] ?? (s as Record<string, unknown>)[aspect] ?? ''} onChange={(e) => updateScore(s.id as number, aspect, Number(e.target.value))} className="w-full h-10 bg-[color:var(--profile-input-disabled)] border border-[color:var(--profile-border)] text-[color:var(--profile-text)] rounded-lg px-3 text-sm font-bold mt-1 focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]" placeholder="0-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
