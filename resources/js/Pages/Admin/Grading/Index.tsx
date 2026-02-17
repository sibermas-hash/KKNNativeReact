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
    CalculatorIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    BeakerIcon,
    BoltIcon
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
        dplForm.setData({
            student_id: student.student_id,
            group_id: student.group_id,
            final_report_score: student.final_report_score?.toString() || '',
            execution_score: student.execution_score?.toString() || '',
            article_score: student.article_score?.toString() || '',
        });
        villageForm.setData({
            student_id: student.student_id,
            group_id: student.group_id,
            discipline_score: student.discipline_score?.toString() || '',
            attitude_score: student.attitude_score?.toString() || '',
        });
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
            onSuccess: () => router.reload({ only: ['summary'] })
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
            <AppLayout title="Merit Analytics Hub">
                <div className="flex h-[70vh] items-center justify-center p-8 animate-in fade-in duration-1000">
                    <div className="text-center p-16 glass rounded-[3.5rem] border-white/10 max-w-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-white group-hover:rotate-12 transition-transform duration-700">
                            <ChartBarIcon className="h-48 w-48" />
                        </div>
                        <div className="mx-auto mb-10 h-24 w-24 text-accent-gold bg-accent-gold/10 rounded-3xl border border-accent-gold/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                            <BeakerIcon className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic">Select Target Brigade</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-10 italic italic">
                            {error || 'INITIALIZE MERIT ANALYSIS BY SELECTING A SCHOLASTIC BRIGADE FROM THE COMMAND CONSOLE.'}
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-accent-gold/50 transition-all outline-none"
                            >
                                <option value="" className="bg-slate-900">SELECT OPERATIONAL BRIGADE</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                                        BRIGADE {g.code || g.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const preview = calculatePreview();

    return (
        <AppLayout title="Merit Analytics Hub">
            <Head title="Quantum Merit Analysis" />

            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">SCHOLASTIC QUANTUM ANALYSIS</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Merit <span className="text-accent-gold text-glow-gold">Analytics</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrated merit evaluation hub utilizing LPPM unified weighting (50:30:20).</p>
                    </div>

                    <div className="flex items-center gap-6 px-10 py-6 glass rounded-[2.5rem] border-white/5 shadow-2xl">
                        <div className="text-center px-4">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-2">AVG QUANTUM</p>
                            <p className="text-3xl font-black text-accent-gold leading-none italic">{Math.round(summary.average_score)}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center px-4">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-2">FINALIZED</p>
                            <p className="text-3xl font-black text-primary-light leading-none italic">{summary.fully_graded} <span className="text-[10px] text-white/10 uppercase">/ {summary.total_students}</span></p>
                        </div>
                    </div>
                </div>

                {/* Tactical Console Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between glass p-6 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto flex-1">
                        <div className="relative group flex-1 max-w-md">
                            <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                            <input
                                placeholder="SCAN SCHOLAR IDENTIFIERS..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/50 shadow-2xl transition-all"
                            />
                        </div>
                        <select
                            value={selectedGroupId || ''}
                            onChange={(e) => handleGroupChange(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-2xl py-4 px-8 text-[10px] font-black uppercase tracking-widest text-accent-gold outline-none focus:border-accent-gold/50 transition-all cursor-pointer shadow-2xl"
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id} className="bg-slate-900 text-white">BRIGADE {g.code || g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-6 px-10">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-2xl ring-2 ring-luxury-dark">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Active Analysts</span>
                    </div>
                </div>

                {/* Analysis Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                        <BoltIcon className="h-64 w-64" />
                    </div>
                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scholar Module</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Module A (DPL)</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Module B (SECTOR)</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Quantum</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Grade Index</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Operation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-10 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-white/10 flex items-center justify-center text-primary-light font-black text-2xl group-hover:scale-110 transition-transform shadow-2xl uppercase italic">
                                                    {student.user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white uppercase tracking-widest italic leading-none group-hover:text-accent-gold transition-colors">{student.user.name}</span>
                                                    <span className="text-[10px] font-mono font-black text-white/20 mt-2 tracking-widest uppercase">ID // {student.user.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            {student.execution_score ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest uppercase shadow-2xl">
                                                    <CheckCircleIcon className="h-3 w-3" /> ANALYZED
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/20 text-[8px] font-black tracking-widest uppercase italic">
                                                    <ClockIcon className="h-3 w-3" /> PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            {student.attitude_score ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest uppercase shadow-2xl">
                                                    <CheckCircleIcon className="h-3 w-3" /> ANALYZED
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/20 text-[8px] font-black tracking-widest uppercase italic">
                                                    <ClockIcon className="h-3 w-3" /> PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <span className="text-3xl font-black text-white tabular-nums italic leading-none">{student.total_score || '—'}</span>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <div className={`inline-flex px-6 py-2 rounded-2xl border text-sm font-black tracking-[0.3em] uppercase italic shadow-2xl backdrop-blur-md transition-all ${student.letter_grade === 'A' ? 'bg-emerald-500 text-white border-emerald-400 shadow-glow' :
                                                    student.letter_grade?.startsWith('B') ? 'bg-primary text-white border-primary-light' :
                                                        'bg-white/5 text-white/10 border-white/10'
                                                }`}>
                                                {student.letter_grade || 'Ø'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <button
                                                onClick={() => openGradingModal(student)}
                                                disabled={student.is_finalized}
                                                className="px-8 py-4 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all italic flex items-center gap-3 ml-auto shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-20 border border-white/10"
                                            >
                                                <BoltIcon className="h-5 w-5 text-accent-gold" />
                                                INGEST QUANTUM
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Ingestion Modal */}
            <Modal
                open={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                maxWidth="3xl"
            >
                <div className="p-0 overflow-hidden glass rounded-[3.5rem] border-white/10 relative">
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/[0.01]">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-[8px] font-black uppercase tracking-[0.3em]">QUANTUM CALIBRATION</div>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{selectedStudent?.user.name}</h3>
                            <p className="text-white/30 text-xs font-black uppercase tracking-[0.2em] mt-2 italic flex items-center gap-3">
                                <IdentificationIcon className="h-4 w-4" /> ID // {selectedStudent?.user.nim}
                            </p>
                        </div>
                        <div className="flex items-center gap-8 px-10 py-6 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-2xl">
                            <div className="text-right">
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1 italic text-right">LIVE PROJECTION</p>
                                <div className="flex items-center gap-6">
                                    <span className="text-5xl font-black text-accent-gold tabular-nums italic text-glow-gold leading-none">{preview.score}</span>
                                    <div className="w-px h-8 bg-white/10" />
                                    <span className="text-2xl font-black px-5 py-2 bg-white/10 text-white rounded-2xl border border-white/10 italic">{preview.grade}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-white/[0.02] flex gap-3 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('dpl')}
                            className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 italic ${activeTab === 'dpl' ? 'bg-primary text-white shadow-glow' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                        >
                            <AcademicCapIcon className="h-5 w-5" /> MODULE ALPHA (DPL)
                        </button>
                        <button
                            onClick={() => setActiveTab('village')}
                            className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 italic ${activeTab === 'village' ? 'bg-primary text-white shadow-glow' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                        >
                            <HomeModernIcon className="h-5 w-5" /> MODULE BETA (SECTOR)
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 italic ${activeTab === 'admin' ? 'bg-primary text-white shadow-glow' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                        >
                            <ShieldCheckIcon className="h-5 w-5" /> MODULE GAMMA (HUB)
                        </button>
                    </div>

                    <div className="p-12">
                        {/* Tab DPL */}
                        {activeTab === 'dpl' && (
                            <form onSubmit={submitDpl} className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">FIELD REPORT (30%)</label>
                                        <FormInput
                                            type="number"
                                            value={dplForm.data.final_report_score}
                                            onChange={e => dplForm.setData('final_report_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-black/40 border-white/10 text-lg font-black tracking-widest text-accent-gold h-16 rounded-2xl focus:border-accent-gold/50 text-center"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">EXECUTION (40%)</label>
                                        <FormInput
                                            type="number"
                                            value={dplForm.data.execution_score}
                                            onChange={e => dplForm.setData('execution_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-black/40 border-white/10 text-lg font-black tracking-widest text-accent-gold h-16 rounded-2xl focus:border-accent-gold/50 text-center"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">PUBLICATION (30%)</label>
                                        <FormInput
                                            type="number"
                                            value={dplForm.data.article_score}
                                            onChange={e => dplForm.setData('article_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-black/40 border-white/10 text-lg font-black tracking-widest text-accent-gold h-16 rounded-2xl focus:border-accent-gold/50 text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-10 border-t border-white/5">
                                    <button type="submit" disabled={dplForm.processing} className="px-16 py-6 bg-gradient-to-br from-primary-light to-primary text-white text-[11px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 italic">
                                        COMMIT ALPHA PARAMETERS
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tab Village */}
                        {activeTab === 'village' && (
                            <form onSubmit={submitVillage} className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">ATTITUDE ANALYSIS (50%)</label>
                                        <FormInput
                                            type="number"
                                            value={villageForm.data.attitude_score}
                                            onChange={e => villageForm.setData('attitude_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-black/40 border-white/10 text-2xl font-black tracking-widest text-primary-light h-20 rounded-[2rem] focus:border-primary-light/50 text-center"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">DISCIPLINE METRICS (50%)</label>
                                        <FormInput
                                            type="number"
                                            value={villageForm.data.discipline_score}
                                            onChange={e => villageForm.setData('discipline_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-black/40 border-white/10 text-2xl font-black tracking-widest text-primary-light h-20 rounded-[2rem] focus:border-primary-light/50 text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-10 border-t border-white/5">
                                    <button type="submit" disabled={villageForm.processing} className="px-16 py-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-500/40 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 italic">
                                        COMMIT BETA PARAMETERS
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tab Admin */}
                        {activeTab === 'admin' && (
                            <form onSubmit={submitAdmin} className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">TRAINING PERFORMANCE (50%)</label>
                                        <FormInput
                                            type="number"
                                            value={adminForm.data.workshop_score}
                                            onChange={e => adminForm.setData('workshop_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-white/5 border-white/10 text-2xl font-black tracking-widest text-white h-20 rounded-[2rem] focus:border-white/40 text-center"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">ADMINISTRATIVE STATUS (50%)</label>
                                        <FormInput
                                            type="number"
                                            value={adminForm.data.administration_score}
                                            onChange={e => adminForm.setData('administration_score', e.target.value)}
                                            placeholder="0-100"
                                            className="bg-white/5 border-white/10 text-2xl font-black tracking-widest text-white h-20 rounded-[2rem] focus:border-white/40 text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-10 border-t border-white/5">
                                    <button type="submit" disabled={adminForm.processing} className="px-16 py-6 bg-white text-luxury-dark text-[11px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl hover:bg-slate-100 transition-all border border-white/10 italic">
                                        COMMIT GAMMA PARAMETERS
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="px-12 py-8 bg-black/40 border-t border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-accent-gold/10 rounded-xl text-accent-gold">
                            <CalculatorIcon className="h-6 w-6" />
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                            QUANTUM ENGINE IS AUTOMATICALLY COMPUTING FINAL MERIT INDICES BASED ON PERSISTED PARAMETERS (A:50% | B:30% | C:20%).
                        </p>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
