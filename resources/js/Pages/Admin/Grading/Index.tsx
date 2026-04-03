import React, { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Activity,
    CheckCircle,
    Clock,
    GraduationCap,
    Home,
    ShieldCheck,
    Calculator,
    Search,
    Cpu,
    Scale,
    FileText,
    Bolt,
    X,
    Info,
    Save
} from 'lucide-react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';

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

interface GroupOption {
    id: number;
    code?: string;
    name: string;
}

interface Props {
    summary: Summary | null;
    groups: GroupOption[];
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
            <AppLayout title="Protokol Penilaian">
                <div className="flex h-[75vh] items-center justify-center p-8">
                    <div className="text-center p-14 bg-white rounded-[4rem] border border-slate-100 max-w-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-14 opacity-[0.02] text-slate-900 group-hover:rotate-12 transition-transform">
                            <GraduationCap className="h-64 w-64" />
                        </div>
                        <div className="mx-auto mb-10 h-24 w-24 text-primary bg-primary/5rounded-lg border border-primary/10 flex items-center justify-center
                            <FileText className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-6  uppercase italic">Seleksi_Unit_Operasional</h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed mb-12 max-w-md mx-auto italic opacity-70">
                            {error || 'Silakan pilih kelompok untuk memulai sinkronisasi data mahasiswa dan eksekusi parameter penilaian akademik.'}
                        </p>

                        <div className="relative group/select">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary z-10">
                                <Cpu className="h-5 w-5" />
                            </div>
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-8 text-slate-900 text-[11px] font-black uppercase  focus:bg-white focus:border-primary/40 transition-all outline-none cursor-pointer italic"
                            >
                                <option value="">PILIH IDENTITAS KELOMPOK...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        KELOMPOK: {g.code || g.name}
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
        <AppLayout title="Evaluasi & Capaian Akademik">
            <Head title="Evaluasi & Penilaian" />

            <div className="space-y-12 pb-24">
                
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group transition-all">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                ACADEMIC_GRADING_CENTER_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Analisis <span className="text-emerald-300 text-glow-emerald italic">Nilai Mahasiswa</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Orkestrasi pembobotan nilai multisumber: DPL (50%) | Mitra/Desa (30%) | Admin/Hub (20%). Evaluasi presisi untuk integritas capaian pengabdian.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-8 min-w-[280px] group/stat">
                            <div className="flex items-center gap-6 border-r border-white/10 pr-6">
                                <div className="text-center">
                                    <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic leading-none">RATA-RATA</span>
                                    <span className="text-3xl font-black text-white tabular-nums italic leading-none">{Math.round(summary.average_score)}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic leading-none">PROGRES_INPUT</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">
                                    {summary.fully_graded} <span className="text-[10px] text-white/30 lowercase italic  font-medium ml-1">/ {summary.total_students}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-20 lg:mx-2">
                    <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto flex-1">
                        <div className="relative group/search flex-1 max-w-lg">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within/search:text-primary transition-colors z-10" />
                            <input
                                placeholder="Cari berdasarkan NIM atau Identitas Nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-16 pr-8 py-5.5 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900  outline-none transition-all focus:border-primary/50 italic uppercase placeholder:opacity-30"
                            />
                        </div>
                        <div className="relative group/select">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-primary pointer-events-none z-10">
                                <Cpu className="h-full w-full" />
                            </div>
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="bg-white border border-slate-100 rounded-[1.75rem] h-17 pl-14 pr-12 text-[10px] font-black uppercase  text-slate-600 outline-none focus:border-primary/50 transition-all cursor-pointer italic"
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>KELOMPOK: {g.code || g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-6 overflow-hidden bg-slate-50 border border-slate-100 rounded-lg h-14">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-300 first:z-40 italic">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden relative group mx-1">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50 text-left italic">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-7 text-[11px] font-black uppercase  text-slate-400 italic">Entitas_Mahasiswa</th>
                                    <th className="px-6 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Status_DPL</th>
                                    <th className="px-6 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Status_Sektor</th>
                                    <th className="px-6 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Skor_Total</th>
                                    <th className="px-6 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Indeks_Akhir</th>
                                    <th className="px-10 py-7 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-14">Operasi_Lppm</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-primary font-black text-lg group-hover/row:scale-110 transition-all italic">
                                                    {student.user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col gap-1.5 min-w-0">
                                                    <span className="text-[15px] font-black text-slate-900 uppercase  italic group-hover/row:text-primary transition-colors truncate leading-none">{student.user.name}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase  italic opacity-60 leading-none">NIM: {student.user.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            {student.execution_score ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black  uppercase border border-emerald-100 italic
                                                    <CheckCircle className="h-3.5 w-3.5" /> DONE
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[9px] font-black  uppercase border border-slate-100 italic">
                                                    <Clock className="h-3.5 w-3.5" /> PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            {student.attitude_score ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black  uppercase border border-emerald-100 italic
                                                    <CheckCircle className="h-3.5 w-3.5" /> DONE
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[9px] font-black  uppercase border border-slate-100 italic">
                                                    <Clock className="h-3.5 w-3.5" /> PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="text-3xl font-black text-slate-900 italic tabular-nums leading-none">{student.total_score || '—'}</span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className={clsx(
                                                "inline-flex px-8 py-2.5 rounded-lg border text-[14px] font-black  uppercase italic transition-all",
                                                student.letter_grade === 'A' ? "bg-slate-900 text-emerald-400 border-emerald-500/20 :
                                                student.letter_grade?.startsWith('B') ? "bg-slate-900 text-primary border-primary/20 :
                                                "bg-slate-50 text-slate-300 border-slate-100
                                            )}>
                                                {student.letter_grade || '-'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right pr-14">
                                            <button
                                                onClick={() => openGradingModal(student)}
                                                disabled={student.is_finalized}
                                                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] font-black text-[10px] uppercase  transition-all italic hover:-translate-y-1 active:scale-95 disabled:opacity-20 disabled:translate-y-0"
                                            >
                                                <Bolt className="h-4 w-4 text-primary" />
                                                Input_Nilai
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {summary.students.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-40 text-center">
                                            <p className="text-slate-300 font-black uppercase  text-[12px] italic opacity-40">TIDAK ADA DATA ENTITAS DALAM KELOMPOK INI</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-1">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <Scale className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">GRADING_GOVERNANCE_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: CALIBRATION_ENGINE_READY</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Seluruh parameter penilaian yang diinjeksikan akan diolah secara herarkis untuk mendapatkan skor akhir absolut. 
                                Protokol evaluasi LPPM menjamin objektivitas melalui pembobotan multisumber yang tervalidasi oleh sistem inti. 
                                Gunakan fitur <span className="text-primary font-black uppercase italic">"Input Nilai"</span> untuk mengaktifkan antarmuka kalibrasi manual.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">CALCULATION_SYNC_OK</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Info className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ingestion Modal - Emerald Tactical Overhaul */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80">
                    <div className="bg-white rounded-[4rem] w-full max-w-5xl border border-white/10 overflow-hidden zoom-in-95 group/modal relative">
                        {/* Modal Header Section */}
                        <div className="px-12 py-14 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 bg-slate-50/50 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-14 opacity-[0.03] text-slate-900 pointer-events-none group-hover/modal:rotate-12 group-hover/modal:scale-125 transition-transform">
                                <Calculator className="h-64 w-64" />
                            </div>
                            
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/20 text-primary rounded-xl
                                        <Bolt className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase  italic">MODUL_KALIBRASI_AKADEMIK_V3</span>
                                </div>
                                <h3 className="text-4xl font-black text-slate-900  uppercase italic leading-none">{selectedStudent?.user.name}</h3>
                                <div className="flex items-center gap-4 mt-6">
                                    <div className="px-4 py-1.5 bg-slate-900 text-primary rounded-lg text-[10px] font-black uppercase  italic {selectedStudent?.user.nim}</div>
                                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase  italic border border-emerald-100
                                </div>
                            </div>

                            <div className="flex items-center gap-10 px-12 py-8 bg-white rounded-lg border border-slate-100 relative z-10 group/preview hover:-translate-y-1 transition-transform">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase  mb-4 italic leading-none">ESTIMASI_AKHIR_ABSOLUT</p>
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end">
                                            <span className="text-6xl font-black text-primary tabular-nums italic  leading-none text-glow-emerald">{preview.score}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase italic mt-2  opacity-60">SKOR NUMERIK</span>
                                        </div>
                                        <div className="w-px h-16 bg-slate-100" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl font-black px-6 py-3 bg-slate-900 text-white rounded-lg italic leading-none
                                             <span className="text-[9px] font-black text-slate-400 uppercase italic mt-2  opacity-60">INDEKS</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedStudent(null)} className="absolute -top-4 -right-4 h-12 w-12 bg-white text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center border border-slate-100 hover:rotate-90 transition-all active:scale-90">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="px-10 py-6 bg-slate-50 flex gap-4 border-b border-slate-100">
                            {([
                                { id: 'dpl', icon: GraduationCap, label: 'Evaluasi DPL' },
                                { id: 'village', icon: Home, label: 'Laporan Mitra' },
                                { id: 'admin', icon: ShieldCheck, label: 'Kapasitas Hub' }
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex-1 py-5 px-8 rounded-lg font-black text-[11px] uppercase  flex items-center justify-center gap-4 transition-all italic border hover:shadow-md",
                                        activeTab === tab.id 
                                            ? "bg-slate-900 text-white border-slate-900 -translate-y-1" 
                                            : "bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-200"
                                    )}
                                >
                                    <tab.icon className={clsx("h-5 w-5", activeTab === tab.id ? "text-primary" : "text-slate-300")} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Ingestion Form Area */}
                        <div className="p-14 min-h-[400px] flex items-center justify-center">
                            {activeTab === 'dpl' && (
                                <form onSubmit={submitDpl} className="w-full space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        {[
                                            { id: 'final_report_score' as const, label: 'LAPO_AKHIR (30%)', sub: 'Submission Final' },
                                            { id: 'execution_score' as const, label: 'EKSEKUSI (40%)', sub: 'Lapangan & Aksi' },
                                            { id: 'article_score' as const, label: 'ARTIKEL (30%)', sub: 'Karya Ilmiah' }
                                        ].map((field) => (
                                            <div key={field.id} className="space-y-4 text-center">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase  italic">{field.label}</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        value={dplForm.data[field.id]}
                                                        onChange={e => dplForm.setData(field.id, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 text-5xl font-black text-slate-900 h-28rounded-lg focus:bg-white focus:border-primary/40 transition-all outline-none text-center italic tabular-nums placeholder:opacity-20"
                                                        placeholder="00"
                                                    />
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase  italic opacity-0 group-focus-within/input:opacity-100 transition-opacity">{field.sub}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-12 border-t border-slate-50 gap-6">
                                        <button type="button" onClick={() => setSelectedStudent(null)} className="px-10 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase  rounded-lg hover:bg-slate-50 transition-all italic leading-none hover:text-slate-600">MENUNDA_SESI</button>
                                        <button type="submit" disabled={dplForm.processing} className="px-12 py-5 bg-slate-900 text-white text-[11px] font-black uppercase  rounded-lg hover:bg-slate-800 transition-all italic leading-none hover:-translate-y-1 active:scale-95 flex items-center gap-4 group/submit">
                                            <Save className="h-4.5 w-4.5 text-primary group-hover/submit:rotate-12 transition-transform" />
                                            COMMIT_NILAI_DPL
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'village' && (
                                <form onSubmit={submitVillage} className="w-full space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                         {[
                                            { id: 'attitude_score' as const, label: 'ETIKA_PERILAKU (50%)', sub: 'Observasi Mitra' },
                                            { id: 'discipline_score' as const, label: 'KEDISIPLINAN (50%)', sub: 'Absensi & Kepatuhan' },
                                        ].map((field) => (
                                            <div key={field.id} className="space-y-4 text-center">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase  italic">{field.label}</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        value={villageForm.data[field.id]}
                                                        onChange={e => villageForm.setData(field.id, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 text-6xl font-black text-slate-900 h-32 rounded-[2.5rem] focus:bg-white focus:border-primary/40 transition-all outline-none text-center italic tabular-nums placeholder:opacity-20"
                                                        placeholder="00"
                                                    />
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase  italic opacity-0 group-focus-within/input:opacity-100 transition-opacity">{field.sub}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-12 border-t border-slate-50 gap-6 max-w-4xl mx-auto w-full">
                                        <button type="button" onClick={() => setSelectedStudent(null)} className="px-10 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase  rounded-lg hover:bg-slate-50 transition-all italic leading-none hover:text-slate-600">MENUNDA_SESI</button>
                                        <button type="submit" disabled={villageForm.processing} className="px-12 py-5 bg-slate-900 text-white text-[11px] font-black uppercase  rounded-lg hover:bg-slate-800 transition-all italic leading-none hover:-translate-y-1 active:scale-95 flex items-center gap-4 group/submit">
                                            <Save className="h-4.5 w-4.5 text-primary group-hover/submit:rotate-12 transition-transform" />
                                            COMMIT_NILAI_SEKTOR
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'admin' && (
                                <form onSubmit={submitAdmin} className="w-full space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                         {[
                                            { id: 'workshop_score' as const, label: 'PEMBEKALAN (50%)', sub: 'Monitoring Workshop' },
                                            { id: 'administration_score' as const, label: 'ADMINISTRASI (50%)', sub: 'Audit Kelengkapan' },
                                        ].map((field) => (
                                            <div key={field.id} className="space-y-4 text-center">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase  italic">{field.label}</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        value={adminForm.data[field.id]}
                                                        onChange={e => adminForm.setData(field.id, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 text-6xl font-black text-slate-900 h-32 rounded-[2.5rem] focus:bg-white focus:border-primary/40 transition-all outline-none text-center italic tabular-nums placeholder:opacity-20"
                                                        placeholder="00"
                                                    />
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase  italic opacity-0 group-focus-within/input:opacity-100 transition-opacity">{field.sub}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-12 border-t border-slate-50 gap-6 max-w-4xl mx-auto w-full">
                                        <button type="button" onClick={() => setSelectedStudent(null)} className="px-10 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase  rounded-lg hover:bg-slate-50 transition-all italic leading-none hover:text-slate-600">MENUNDA_SESI</button>
                                        <button type="submit" disabled={adminForm.processing} className="px-12 py-5 bg-slate-900 text-white text-[11px] font-black uppercase  rounded-lg hover:bg-slate-800 transition-all italic leading-none hover:-translate-y-1 active:scale-95 flex items-center gap-4 group/submit">
                                            <Save className="h-4.5 w-4.5 text-primary group-hover/submit:rotate-12 transition-transform" />
                                            COMMIT_NILAI_ADMIN
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Tactical Ingestion Footer */}
                        <div className="px-14 py-8 bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <Calculator className="h-6 w-6 text-primary />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-white uppercase  italic leading-none">Automated_Calculation_Active</span>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase  italic mt-2">SINKRONISASI REALTIME KE BASIS DATA PUSAT</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4 px-6 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 hidden md:flex">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase  italic leading-none">STREAMS_SECURED_BY_COMMAND_V3</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
