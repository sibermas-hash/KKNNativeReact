import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormSelect } from '@/Components/ui';
import {
  Star,
  Users,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Lock,
  Search,
  MapPin,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';

interface Student {
  id: number;
  nim: string;
  name: string;
  existing_evaluation?: {
    total_score: number;
    grade: string;
    items: Array<{ criterion: string; score: number }>;
  } | null;
  ai_performance?: {
    has_data: boolean;
    avg_compliance: number;
    avg_quality: number;
    total_reports: number;
    suggested_admin_score: number;
    top_tags: string[];
  };
}

interface Group {
  id: number;
  name: string;
  period_name: string;
  students: Student[];
}

interface Evaluation {
  id: number;
  student: { name: string; nim: string };
  group: { name: string };
  total_score: number;
  grade: string;
}

interface Props {
  groups: Group[];
  evaluations: Evaluation[];
  dplWeights: {
    final_report: number;
    execution: number;
    article: number;
  };
}

export default function DplBulkEvaluations({ groups, dplWeights }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);

  // Form for bulk submission
  const bulkForm = useForm({
    group_id: selectedGroupId,
    evaluations: [] as Array<{
      student_id: number;
      items: Array<{ criterion: string; score: number }>;
    }>,
  });

  const categories = [
    { key: 'report', label: 'Laporan', weight: 40, criterion: 'Laporan Akhir' },
    { key: 'execution', label: 'Pelaksana', weight: 30, criterion: 'Pelaksanaan Program' },
    { key: 'article', label: 'Artikel', weight: 30, criterion: 'Artikel Ilmiah' },
    {
      key: 'discipline',
      label: 'Disiplin',
      weight: 20,
      criterion: 'Kedisiplinan (Kades)',
      is_extra: true,
    },
    {
      key: 'attitude',
      label: 'Sikap',
      weight: 30,
      criterion: 'Etika & Sikap (Kades)',
      is_extra: true,
    },
  ];

  const getGrade = (score: number) => {
    if (score >= 80) return { label: 'A', color: 'text-emerald-600 bg-emerald-50' };
    if (score >= 70) return { label: 'B', color: 'text-blue-600 bg-blue-50' };
    if (score >= 60) return { label: 'C', color: 'text-amber-600 bg-amber-50' };
    if (score >= 50) return { label: 'D', color: 'text-orange-600 bg-orange-50' };
    return { label: 'E', color: 'text-rose-600 bg-rose-50' };
  };

  const handleScoreChange = (studentId: number, criterion: string, score: string) => {
    const val = score === '' ? 0 : Math.min(100, Math.max(0, parseInt(score)));

    const existingIdx = bulkForm.data.evaluations.findIndex((e) => e.student_id === studentId);
    let newEvals = [...bulkForm.data.evaluations];

    if (existingIdx > -1) {
      const itemIdx = newEvals[existingIdx].items.findIndex(
        (i: { criterion: string; score: number }) => i.criterion === criterion,
      );
      if (itemIdx > -1) {
        newEvals[existingIdx].items[itemIdx].score = val;
      } else {
        newEvals[existingIdx].items.push({ criterion, score: val });
      }
    } else {
      newEvals.push({
        student_id: studentId,
        items: categories.map((c) => ({
          criterion: c.criterion,
          score: c.criterion === criterion ? val : 0,
        })),
      });
    }

    bulkForm.setData('evaluations', newEvals);
  };

  const getScoreValue = (studentId: number, criterion: string) => {
    const eval_entry = bulkForm.data.evaluations.find((e) => e.student_id === studentId);
    if (eval_entry) {
      const item = eval_entry.items.find(
        (i: { criterion: string; score: number }) => i.criterion === criterion,
      );
      return item ? item.score : '';
    }
    return '';
  };

  const calculateTotal = (studentId: number) => {
    const eval_entry = bulkForm.data.evaluations.find((e) => e.student_id === studentId);
    if (!eval_entry) return 0;

    // Manual calculation based on simplified weights for UI feedback
    // In actual controller, it follows central rules
    let dplPart = 0;
    eval_entry.items.forEach((item: { criterion: string; score: number }) => {
      const cat = categories.find((c) => c.criterion === item.criterion);
      if (cat) dplPart += item.score * (cat.weight / 100);
    });
    return Math.round(dplPart);
  };

  const autofillAllAi = () => {
    if (!selectedGroup) return;

    const newEvals = [...bulkForm.data.evaluations];

    selectedGroup.students.forEach((student) => {
      if (student.ai_performance?.has_data) {
        const existingIdx = newEvals.findIndex((e) => e.student_id === student.id);
        const suggestedScore = student.ai_performance.suggested_admin_score;

        if (existingIdx > -1) {
          const itemIdx = newEvals[existingIdx].items.findIndex(
            (i: { criterion: string; score: number }) => i.criterion === 'Laporan Akhir',
          );
          if (itemIdx > -1) {
            newEvals[existingIdx].items[itemIdx].score = suggestedScore;
          } else {
            newEvals[existingIdx].items.push({ criterion: 'Laporan Akhir', score: suggestedScore });
          }
        } else {
          newEvals.push({
            student_id: student.id,
            items: categories.map((c) => ({
              criterion: c.criterion,
              score: c.key === 'report' ? suggestedScore : 0,
            })),
          });
        }
      }
    });

    bulkForm.setData('evaluations', newEvals);
    alert('Seluruh kolom Laporan Akhir telah diisi menggunakan saran AI!');
  };

  const submitBulk = (e: React.FormEvent) => {
    e.preventDefault();
    bulkForm.post(route('dpl.evaluations.store'), {
      preserveScroll: true,
      onSuccess: () => alert('Penyimpanan massal berhasil!'),
    });
  };

  const filteredStudents = useMemo(() => {
    const activeGroup = groups.find((g) => String(g.id) === selectedGroupId);
    if (!activeGroup) return [];
    return activeGroup.students.filter(
      (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nim.includes(searchTerm),
    );
  }, [selectedGroupId, groups, searchTerm]);

  return (
    <AppLayout title="Evaluasi & Nilai Mahasiswa">
      <Head title="Audit Kualitas & Nilai | DPL Dashboard" />

      <div className="mx-auto max-w-[1600px] space-y-10 pb-20 font-sans">
        {/* Academic Header */}
        <header className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-12 md:p-16 shadow-sm">
          <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-50 opacity-20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider text-xs font-semibold leading-none">
                  AKUNTABILITAS AKADEMIK
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                Input Nilai <span className="text-emerald-600">Terintegrasi.</span>
              </h1>
              <p className="max-w-xl text-gray-900 font-medium text-lg leading-relaxed">
                Evaluasi capaian pengabdian mahasiswa berbasis kompetensi. Pastikan seluruh komponen
                Laporan, Artikel, dan Kinerja Lapangan telah terverifikasi.
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="h-14 px-8 rounded-2xl border-2 border-gray-200/60 font-bold text-xs font-semibold uppercase text-xs gap-3"
                onClick={() => router.get(route('dpl.evaluations.index'))}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Unduh Template
              </Button>
            </div>
          </div>
        </header>

        {/* Workspace Selection */}
        <div className="grid gap-8 lg:grid-cols-[1fr,3fr]">
          {/* Left Side: Village Selector */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <Users size={16} className="text-gray-900" />
              <h3 className="text-sm font-bold text-gray-900 font-semibold uppercase text-xs leading-none">
                Pilih Kelompok Kerja
              </h3>
            </div>
            <div className="grid gap-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupId(String(group.id));
                    bulkForm.setData('group_id', String(group.id));
                  }}
                  className={clsx(
                    'group p-6 rounded-xl border-2 transition-all text-left relative overflow-hidden',
                    selectedGroupId === String(group.id)
                      ? 'bg-emerald-900 border-emerald-900 text-white shadow-xl shadow-slate-200'
                      : 'bg-white border-gray-200/60 text-gray-900 hover:border-emerald-200',
                  )}
                >
                  <div className="relative z-10 space-y-2">
                    <p className="text-sm font-bold font-semibold uppercase text-xs opacity-60">
                      #{group.id}
                    </p>
                    <p className="text-lg font-bold tracking-tight leading-none">{group.name}</p>
                    <p className="text-sm font-bold opacity-40">{group.period_name}</p>
                  </div>
                  <MapPin
                    size={48}
                    className={clsx(
                      'absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity',
                      selectedGroupId === String(group.id) ? 'text-white' : 'text-gray-900',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Bulk Spreadsheet */}
          <div className="space-y-6">
            {!selectedGroupId ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200/60 bg-emerald-50/30/30 p-20 text-center">
                <Search className="mx-auto h-16 w-16 text-slate-200" strokeWidth={1} />
                <h3 className="mt-8 text-xl font-bold text-slate-300 font-semibold uppercase text-xs leading-none">
                  Menunggu Pilihan
                </h3>
                <p className="mt-2 text-sm font-bold text-slate-300">
                  Silahkan pilih kelompok di samping untuk memulai penilaian massa.
                </p>
              </div>
            ) : (
              <form
                onSubmit={submitBulk}
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {/* Search & Meta */}
                <div className="bg-white rounded-[2.5rem] border border-gray-200/60 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4 bg-emerald-50/30 p-1 rounded-2xl border border-gray-200/60 w-full md:w-96">
                    <div className="pl-4 text-slate-300">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari NIM atau Nama Mahasiswa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 border-none bg-transparent text-sm font-bold focus:ring-0 w-full placeholder:text-slate-300"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-14 px-6 rounded-2xl bg-emerald-50 border border-gray-200 flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-sm font-bold text-gray-700 font-semibold uppercase text-xs">
                        Status: {bulkForm.data.evaluations.length} dari{' '}
                        {selectedGroup?.students.length} Terisi
                      </p>
                    </div>

                    {selectedGroup?.students.some((s) => s.ai_performance?.has_data) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={autofillAllAi}
                        className="h-14 px-6 rounded-2xl border-2 border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-sm uppercase tracking-[0.15em] flex items-center gap-3 transition-all"
                      >
                        <Star size={16} fill="currentColor" /> Auto-fill Semua (AI)
                      </Button>
                    )}
                    <Button
                      type="submit"
                      loading={bulkForm.processing}
                      className="h-14 px-6 rounded-2xl bg-emerald-900 text-white hover:bg-emerald-600 font-bold text-xs font-semibold uppercase text-xs flex items-center gap-3 shadow-xl active:scale-95"
                    >
                      <Save size={18} /> Simpan Semua Nilai
                    </Button>
                  </div>
                </div>

                {/* Spreadsheet Table */}
                <div className="bg-white rounded-xl border border-gray-200/60 shadow-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-white">
                        <th className="px-6 py-8 text-sm font-bold font-semibold uppercase text-xs sticky left-0 z-20 bg-emerald-900">
                          Mahasiswa & NIM
                        </th>
                        {categories.map((cat) => (
                          <th key={cat.key} className="px-6 py-8 text-center min-w-[120px]">
                            <p className="text-sm font-bold font-semibold uppercase text-xs text-emerald-400 leading-none mb-1">
                              {cat.label}
                            </p>
                            <p className="text-sm font-bold opacity-40 font-semibold uppercase text-xs">
                              {cat.weight}%
                            </p>
                          </th>
                        ))}
                        <th className="px-6 py-8 text-center min-w-[140px]">
                          <p className="text-sm font-bold font-semibold uppercase text-xs text-white leading-none mb-1">
                            Total Score
                          </p>
                          <p className="text-sm font-bold opacity-40 font-semibold uppercase text-xs">
                            BOBOT AKHIR
                          </p>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/60">
                      {filteredStudents.map((student) => {
                        const total = calculateTotal(student.id);
                        const grade = getGrade(total);

                        return (
                          <tr
                            key={student.id}
                            className="group/row hover:bg-emerald-50/30/50 transition-colors"
                          >
                            <td className="px-6 py-6 sticky left-0 z-10 bg-white group-hover/row:bg-emerald-50/30/50">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50/60 flex items-center justify-center text-gray-900 font-bold text-xs">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                    {student.name}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm font-bold text-gray-900 font-mono tracking-tighter">
                                      {student.nim}
                                    </p>
                                    {student.ai_performance?.has_data && (
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/50">
                                        <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                        <span className="text-sm font-bold text-indigo-600 uppercase">
                                          AI Audited • {student.ai_performance.avg_compliance}/10
                                          ABCD
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {categories.map((cat) => (
                              <td key={cat.key} className="px-6 py-6 text-center relative h-full">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={getScoreValue(student.id, cat.criterion)}
                                  onChange={(e) =>
                                    handleScoreChange(student.id, cat.criterion, e.target.value)
                                  }
                                  className={clsx(
                                    'h-12 w-20 text-center rounded-xl font-bold text-sm border-2 transition-all p-0 focus:ring-0',
                                    cat.is_extra
                                      ? 'bg-emerald-50/30 border-gray-200/60 focus:border-slate-400 focus:bg-white'
                                      : 'bg-white border-gray-200/60 focus:border-[#f3f4f6]0',
                                  )}
                                />
                                {cat.key === 'report' && student.ai_performance?.has_data && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleScoreChange(
                                        student.id,
                                        cat.criterion,
                                        String(student.ai_performance?.suggested_admin_score || 0),
                                      )
                                    }
                                    className="absolute -top-3 -right-3 h-8 w-8 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all group/ai"
                                    title={`AI Suggested: ${student.ai_performance.suggested_admin_score}`}
                                  >
                                    <Star size={12} fill="currentColor" />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translateX-1/2 opacity-0 group-hover/ai:opacity-100 transition-opacity bg-emerald-900 text-sm text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                      Saran AI: {student.ai_performance.suggested_admin_score}
                                    </div>
                                  </button>
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-6 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <span className="text-xl font-bold text-gray-900 tracking-tighter leading-none">
                                  {total}
                                </span>
                                <div
                                  className={clsx(
                                    'h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold font-semibold uppercase text-xs ring-1 ring-inset transition-all',
                                    grade.color,
                                  )}
                                >
                                  {grade.label}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Legend & SOP Notice */}
        <footer className="bg-emerald-900 rounded-xl p-12 text-white/50 text-sm font-bold uppercase tracking-wider text-xs font-semibold flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_emerald]" />
              <span>DPL Mandatory Components</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 hover:bg-emerald-400" />
              <span>Village Head Components</span>
            </div>
          </div>
          <p className="text-right">
            Sistem Penilaian Terpadu &bull; LPPM UIN SAIZU &bull; &copy; 2026
          </p>
        </footer>
      </div>
    </AppLayout>
  );
}
