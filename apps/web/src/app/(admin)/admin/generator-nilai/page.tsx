'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Users, Download, Save, ChevronRight } from 'lucide-react';

type Group = { id: number; name: string; code: string; member_count: number };
type Student = { id: number; user_id: number; nama: string; nim: string; nilai: Record<string, unknown> | null };

const SCORE_FIELDS = [
  { key: 'discipline_score', label: 'Disiplin' },
  { key: 'attitude_score', label: 'Sikap' },
  { key: 'execution_score', label: 'Pelaksanaan' },
  { key: 'article_score', label: 'Artikel' },
  { key: 'final_report_score', label: 'Laporan Akhir' },
  { key: 'workshop_score', label: 'Workshop' },
  { key: 'administration_score', label: 'Administrasi' },
];

export default function GeneratorNilaiPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [scores, setScores] = useState<Record<number, Record<string, string>>>({});

  const { data: groupsData, isLoading } = useQuery<{ groups: Group[] }>({
    queryKey: ['admin', 'generator-nilai'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/generator-nilai');
      return ((res.data as { data?: unknown }).data ?? res.data) as { groups: Group[] };
    },
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery<{ students: Student[] }>({
    queryKey: ['admin', 'generator-nilai', 'students', selectedGroup?.id],
    queryFn: async () => {
      const res = await rawApi.get(`/admin/generator-nilai/kelompok/${selectedGroup!.id}/mahasiswa`);
      return ((res.data as { data?: unknown }).data ?? res.data) as { students: Student[] };
    },
    enabled: !!selectedGroup,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const studentById = new Map(students.map((student) => [student.id, student]));
      const payload = Object.entries(scores).map(([mahasiswaId, s]) => ({
        user_id: studentById.get(Number(mahasiswaId))?.user_id,
        kelompok_id: selectedGroup!.id,
        scores: Object.fromEntries(Object.entries(s).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])),
      })).filter((item): item is { user_id: number; kelompok_id: number; scores: Record<string, number> } => typeof item.user_id === 'number');
      await rawApi.post('/admin/generator-nilai/skor', { scores: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'generator-nilai', 'students', selectedGroup?.id] });
      toast.success('Nilai berhasil disimpan');
    },
    onError: () => toast.error('Gagal menyimpan nilai'),
  });

  const groups = groupsData?.groups ?? [];
  const students = studentsData?.students ?? [];

  const initScores = (studs: Student[]) => {
    const init: Record<number, Record<string, string>> = {};
    studs.forEach(s => {
      init[s.id] = {};
      SCORE_FIELDS.forEach(f => {
        init[s.id][f.key] = s.nilai ? String((s.nilai as Record<string, unknown>)[f.key] ?? '') : '';
      });
    });
    setScores(init);
  };

  const selectGroup = (g: Group) => {
    setSelectedGroup(g);
    setScores({});
  };

  // Init scores when students load
  if (students.length > 0 && Object.keys(scores).length === 0) {
    initScores(students);
  }

  const exportXlsx = () => { window.open(`${(rawApi.defaults as { baseURL?: string }).baseURL}/admin/generator-nilai/ekspor/${selectedGroup!.id}`, '_blank'); };

  return (
    <div className="space-y-6">
      <PageHeader title="Generator Nilai" subtitle="Input dan kelola nilai KKN per kelompok." />

      {!selectedGroup ? (
        <>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">Belum ada kelompok.</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g)} className="flex items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 hover:ring-cyan-300 transition-all">
                  <div>
                    <p className="font-black text-slate-900">{g.code}</p>
                    <p className="text-xs text-slate-500">{g.name} • {g.member_count} anggota</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedGroup(null)} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">← Kembali</button>
            <div className="flex gap-2">
              <button onClick={exportXlsx} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"><Download size={14} /> Export</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"><Save size={14} /> Simpan</button>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-black text-slate-900">{selectedGroup.code} — {selectedGroup.name}</p>
          </div>

          {loadingStudents ? (
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada mahasiswa di kelompok ini.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">NIM</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Nama</th>
                    {SCORE_FIELDS.map(f => <th key={f.key} className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">{f.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">{s.nim}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-800 max-w-[150px] truncate">{s.nama}</td>
                      {SCORE_FIELDS.map(f => (
                        <td key={f.key} className="px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={scores[s.id]?.[f.key] ?? ''}
                            onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], [f.key]: e.target.value } }))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
