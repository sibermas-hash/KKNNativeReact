'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EvaluationsPage() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});

  const { data } = useQuery({
    queryKey: QUERY_KEYS.dpl.evaluations,
    queryFn: async () => {
      const res = await endpoints.evaluations.index();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => endpoints.evaluations.store(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'evaluations'] }); toast.success('Nilai disimpan'); },
    onError: () => toast.error('Gagal menyimpan nilai'),
  });

  const students = (data?.students as Record<string, unknown>[]) || [];
  const config = data?.config as Record<string, unknown> | null;

  const aspects = ['dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score'];
  const aspectLabels: Record<string, string> = {
    dpl_relevansi_score: 'Relevansi',
    dpl_ketercapaian_score: 'Ketercapaian',
    dpl_inovasi_score: 'Inovasi',
    dpl_administrasi_score: 'Administrasi',
    dpl_artikel_score: 'Artikel',
  };

  const updateScore = (studentId: number, aspect: string, value: number) => {
    setScores((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [aspect]: value } }));
  };

  const handleSave = (studentId: number, groupId: number) => {
    const studentScores = scores[studentId] || {};
    saveMutation.mutate({ student_id: studentId, kelompok_id: groupId, scores: studentScores });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Evaluasi Mahasiswa</h1>
      {config && <p className="text-sm text-slate-500">Bobot DPL: {config.dpl_weight as number}% | Desa: {config.village_weight as number}% | LPPM: {config.lppm_weight as number}%</p>}

      <div className="space-y-4">
        {students.map((s) => (
          <div key={s.id as number} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{s.name as string}</p>
                <p className="text-sm text-slate-500">NIM: {s.nim as string} | {s.group_name as string}</p>
              </div>
              <button onClick={() => handleSave(s.id as number, s.group_id as number)} disabled={saveMutation.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {aspects.map((aspect) => (
                <div key={aspect}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{aspectLabels[aspect]}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scores[s.id as number]?.[aspect] ?? ''}
                    onChange={(e) => updateScore(s.id as number, aspect, Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="0-100"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
