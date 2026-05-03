'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, FileText } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function DplEvaluationsPage() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});

  const { data } = useQuery({
    queryKey: QUERY_KEYS.dpl.evaluations,
    queryFn: async () => { const res = await endpoints.evaluations.index(); return (res.data as { success: boolean; data: Record<string, unknown> }).data; },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => endpoints.evaluations.store(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'evaluations'] }); toast.success('Nilai disimpan'); },
    onError: () => toast.error('Gagal menyimpan nilai'),
  });

  const students = (data?.students as Record<string, unknown>[]) || [];
  const aspects = ['dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score'];
  const aspectLabels: Record<string, string> = { dpl_relevansi_score: 'Relevansi', dpl_ketercapaian_score: 'Ketercapaian', dpl_inovasi_score: 'Inovasi', dpl_administrasi_score: 'Administrasi', dpl_artikel_score: 'Artikel' };

  const updateScore = (studentId: number, aspect: string, value: number) => {
    setScores((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [aspect]: value } }));
  };

  const handleSave = (studentId: number, groupId: number) => {
    saveMutation.mutate({ student_id: studentId, kelompok_id: groupId, scores: scores[studentId] || {} });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Evaluasi Mahasiswa" subtitle="Input nilai per aspek penilaian" />

      {students.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Belum ada mahasiswa" />
      : (
        <div className="space-y-6">
          {students.map((s) => (
            <div key={String(s.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div><p className="font-black text-slate-900">{String(s.name || '-')}</p><p className="text-xs text-slate-400">NIM: {String(s.nim || '-')} | {String(s.group_name || '-')}</p></div>
                <button onClick={() => handleSave(s.id as number, s.group_id as number)} disabled={saveMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase">Simpan</button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {aspects.map((aspect) => (
                  <div key={aspect}>
                    <label className="text-[10px] font-black text-slate-400 uppercase">{aspectLabels[aspect]}</label>
                    <input type="number" min={0} max={100} value={scores[s.id as number]?.[aspect] ?? ''} onChange={(e) => updateScore(s.id as number, aspect, Number(e.target.value))} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold mt-1" placeholder="0-100" />
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
