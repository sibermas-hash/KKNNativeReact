import React, { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    PencilSquareIcon,
    AcademicCapIcon,
    HomeModernIcon,
    ShieldCheckIcon,
    CalculatorIcon
} from '@heroicons/react/24/outline';
import { route } from 'ziggy-js';
import { Modal, Button, FormInput } from '@/Components/ui';

interface StudentGrade {
    id: number;
    student_id: number;
    group_id: number;
    user: { name: string; nim: string };
    final_report_score: number | null;
    execution_score: number | null;
    article_score: number | null;
    discipline_score: number | null;
    attitude_score: number | null;
    workshop_score: number | null;
    administration_score: number | null;
    total_score: number | null;
    letter_grade: string | null;
    is_finalized: boolean;
}

interface Summary {
    total_students: number;
    fully_graded: number;
    average_score: number;
    students: StudentGrade[];
}

interface Props {
    summary: Summary | null;
    groups: any[];
    selectedGroupId: number | string | null;
    error?: string;
}

export default function GradingIndex({ summary, groups, selectedGroupId, error }: Props) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentGrade | null>(null);
    const [activeTab, setActiveTab] = useState<'dpl' | 'village' | 'admin'>('dpl');

    const handleGroupChange = (id: string) => {
        router.get(route('admin.evaluations.index'), { group_id: id }, { preserveState: true });
    };

    // Forms for each component
    const dplForm = useForm({
        student_id: 0,
        group_id: 0,
        final_report_score: '',
        execution_score: '',
        article_score: '',
    });

    const villageForm = useForm({
        student_id: 0,
        group_id: 0,
        discipline_score: '',
        attitude_score: '',
    });

    const adminForm = useForm({
        student_id: 0,
        group_id: 0,
        workshop_score: '',
        administration_score: '',
    });

    const filteredStudents = useMemo(() => {
        if (!summary?.students) return [];
        return summary.students.filter(s =>
            s.user.name.toLowerCase().includes(search.toLowerCase()) ||
            s.user.nim.includes(search)
        );
    }, [summary, search]);

    const openGradingModal = (student: StudentGrade) => {
        setSelectedStudent(student);

        // Populate DPL Form
        dplForm.setData({
            student_id: student.student_id,
            group_id: student.group_id,
            final_report_score: student.final_report_score?.toString() || '',
            execution_score: student.execution_score?.toString() || '',
            article_score: student.article_score?.toString() || '',
        });

        // Populate Village Form
        villageForm.setData({
            student_id: student.student_id,
            group_id: student.group_id,
            discipline_score: student.discipline_score?.toString() || '',
            attitude_score: student.attitude_score?.toString() || '',
        });

        // Populate Admin Form
        adminForm.setData({
            student_id: student.student_id,
            group_id: student.group_id,
            workshop_score: student.workshop_score?.toString() || '',
            administration_score: student.administration_score?.toString() || '',
        });
    };

    const submitDpl = (e: React.FormEvent) => {
        e.preventDefault();
        dplForm.post(route('admin.evaluations.submit-dpl'), {
            preserveScroll: true,
            onSuccess: () => {
                // Refresh local data after success
                router.reload({ only: ['summary'] });
            }
        });
    };

    const submitVillage = (e: React.FormEvent) => {
        e.preventDefault();
        villageForm.post(route('admin.evaluations.submit-village'), {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['summary'] })
        });
    };

    const submitAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        adminForm.post(route('admin.evaluations.submit-admin'), {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['summary'] })
        });
    };

    const calculatePreview = () => {
        if (!selectedStudent) return { score: 0, grade: 'D' };

        const a1 = parseFloat(dplForm.data.final_report_score) || 0;
        const a2 = parseFloat(dplForm.data.execution_score) || 0;
        const a3 = parseFloat(dplForm.data.article_score) || 0;
        const compA = (a1 * 0.3) + (a2 * 0.4) + (a3 * 0.3);

        const b1 = parseFloat(villageForm.data.attitude_score) || 0;
        const b2 = parseFloat(villageForm.data.discipline_score) || 0;
        const compB = (b1 * 0.5) + (b2 * 0.5);

        const c1 = parseFloat(adminForm.data.workshop_score) || 0;
        const c2 = parseFloat(adminForm.data.administration_score) || 0;
        const compC = (c1 * 0.5) + (c2 * 0.5);

        const total = (compA * 0.5) + (compB * 0.3) + (compC * 0.2);

        let grade = 'D';
        if (total >= 85) grade = 'A';
        else if (total >= 80) grade = 'A-';
        else if (total >= 75) grade = 'B+';
        else if (total >= 70) grade = 'B';
        else if (total >= 65) grade = 'B-';
        else if (total >= 60) grade = 'C+';
        else if (total >= 55) grade = 'C';

        return { score: total.toFixed(2), grade };
    };

    if (error || !summary) {
        return (
            <AppLayout title="Input Nilai">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="text-center p-12 glass-card rounded-3xl border border-white/10 max-w-lg">
                        <div className="mx-auto mb-6 h-20 w-20 text-blue-400 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <ChartBarIcon className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Pilih Kelompok Terlebih Dahulu</h2>
                        <p className="text-slate-400">{error || 'Gunakan filter pencarian untuk menemukan data mahasiswa.'}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const preview = calculatePreview();

    return (
        <AppLayout title="Input Nilai">
            <Head title="Input Nilai KKN" />

            <div className="space-y-8 pb-12">
                {/* Premium Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-10 border border-white/10 backdrop-blur-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                                Grading <span className="text-blue-400">Center</span>
                                <span className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full font-black uppercase tracking-widest">v2.0</span>
                            </h1>
                            <p className="text-slate-400 mt-2 text-lg font-medium">
                                Panel input nilai terpadu berdasarkan sistem bobot 50:30:20 LPPM UIN Saizu.
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md flex items-center gap-6">
                            <div className="text-center px-4">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Rata-rata</p>
                                <p className="text-2xl font-black text-blue-400 leading-none">{Math.round(summary.average_score)}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="text-center px-4">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Tuntas</p>
                                <p className="text-2xl font-black text-emerald-400 leading-none">{summary.fully_graded} <span className="text-xs text-slate-600">/ {summary.total_students}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-3xl border border-white/10">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <select
                            value={selectedGroupId || ''}
                            onChange={(e) => handleGroupChange(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-medium focus:ring-2 focus:ring-blue-500/50 transition-all outline-none min-w-[200px]"
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                                    Kelompok {g.code || g.name}
                                </option>
                            ))}
                        </select>
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Cari nama atau NIM..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-500 font-medium focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                            />
                            <AcademicCapIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3 overflow-hidden p-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-gradient-to-br from-blue-500 to-indigo-500 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Active Evaluators</span>
                    </div>
                </div>

                {/* Students Table */}
                <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Komponen A</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Komponen B</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Navigasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-blue-400 font-black text-lg group-hover:scale-110 transition-transform">
                                                {student.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{student.user.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{student.user.nim}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {student.execution_score ? (
                                            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                                <CheckCircleIcon className="h-4 w-4" /> Done
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5 italic">
                                                <ClockIcon className="h-4 w-4" /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {student.attitude_score ? (
                                            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                                <CheckCircleIcon className="h-4 w-4" /> Done
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5 italic">
                                                <ClockIcon className="h-4 w-4" /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="text-2xl font-black text-white">{student.total_score || '—'}</div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`px-4 py-1 rounded-xl text-sm font-black border transition-all ${student.letter_grade === 'A' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' :
                                            student.letter_grade?.startsWith('B') ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' :
                                                'bg-white/5 text-slate-500 border-white/10'
                                            }`}>
                                            {student.letter_grade || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => openGradingModal(student)}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-2 ml-auto shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                                            disabled={student.is_finalized}
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                            Input Nilai
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                maxWidth="2xl"
            >
                <div className="p-0 overflow-hidden bg-slate-950 border border-white/10 rounded-[2rem]">
                    <div className="p-8 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-blue-600/10 to-transparent">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Form Evaluasi Mahasiswa</h3>
                            <p className="text-slate-400 font-medium">
                                <span className="text-blue-400 font-bold">{selectedStudent?.user.name}</span> · {selectedStudent?.user.nim}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Live Result</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-blue-400">{preview.score}</span>
                                <span className="text-xl font-bold px-3 py-1 bg-white/10 text-white rounded-xl border border-white/10">{preview.grade}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 bg-white/5 flex gap-1 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('dpl')}
                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'dpl' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            <AcademicCapIcon className="h-4 w-4" /> Komponen A (DPL)
                        </button>
                        <button
                            onClick={() => setActiveTab('village')}
                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'village' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            <HomeModernIcon className="h-4 w-4" /> Komponen B (Desa)
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            <ShieldCheckIcon className="h-4 w-4" /> Komponen C (LPPM)
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Tab DPL */}
                        {activeTab === 'dpl' && (
                            <form onSubmit={submitDpl} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormInput
                                        id="final_report_score"
                                        label="Laporan Akhir (30%)"
                                        type="number"
                                        value={dplForm.data.final_report_score}
                                        onChange={e => dplForm.setData('final_report_score', e.target.value)}
                                        placeholder="0-100"
                                        error={dplForm.errors.final_report_score}
                                    />
                                    <FormInput
                                        id="execution_score"
                                        label="Pelaksanaan (40%)"
                                        type="number"
                                        value={dplForm.data.execution_score}
                                        onChange={e => dplForm.setData('execution_score', e.target.value)}
                                        placeholder="0-100"
                                        error={dplForm.errors.execution_score}
                                    />
                                    <FormInput
                                        id="article_score"
                                        label="Artikel Kampelmas (30%)"
                                        type="number"
                                        value={dplForm.data.article_score}
                                        onChange={e => dplForm.setData('article_score', e.target.value)}
                                        placeholder="0-100"
                                        error={dplForm.errors.article_score}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={dplForm.processing} className="w-full md:w-auto px-10 py-4 shadow-2xl">
                                        Simpan Komponen DPL
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Tab Village */}
                        {activeTab === 'village' && (
                            <form onSubmit={submitVillage} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        id="attitude_score"
                                        label="Nilai Sikap (50%)"
                                        type="number"
                                        value={villageForm.data.attitude_score}
                                        onChange={e => villageForm.setData('attitude_score', e.target.value)}
                                        placeholder="0-100"
                                        error={villageForm.errors.attitude_score}
                                    />
                                    <FormInput
                                        id="discipline_score"
                                        label="Kedisiplinan (50%)"
                                        type="number"
                                        value={villageForm.data.discipline_score}
                                        onChange={e => villageForm.setData('discipline_score', e.target.value)}
                                        placeholder="0-100"
                                        error={villageForm.errors.discipline_score}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={villageForm.processing} className="w-full md:w-auto px-10 py-4 shadow-2xl bg-indigo-600 hover:bg-indigo-500">
                                        Simpan Nilai Desa
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Tab Admin */}
                        {activeTab === 'admin' && (
                            <form onSubmit={submitAdmin} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        id="workshop_score"
                                        label="Nilai Workshop (50%)"
                                        type="number"
                                        value={adminForm.data.workshop_score}
                                        onChange={e => adminForm.setData('workshop_score', e.target.value)}
                                        placeholder="0-100"
                                        error={adminForm.errors.workshop_score}
                                    />
                                    <FormInput
                                        id="administration_score"
                                        label="Administrasi (50%)"
                                        type="number"
                                        value={adminForm.data.administration_score}
                                        onChange={e => adminForm.setData('administration_score', e.target.value)}
                                        placeholder="0-100"
                                        error={adminForm.errors.administration_score}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={adminForm.processing} className="w-full md:w-auto px-10 py-4 shadow-2xl bg-slate-100 text-slate-900 hover:bg-white">
                                        Simpan Nilai LPPM
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center gap-3 text-slate-500">
                        <CalculatorIcon className="h-5 w-5" />
                        <span className="text-xs font-medium">Sistem akan otomatis menghitung nilai akhir dan huruf mutu berdasarkan bobot setelah setiap komponen disimpan.</span>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}

