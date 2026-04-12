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
    ArrowRight
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
}

interface Group {
    id: number;
    name: string;
    period_name: string;
    students: Student[];
}

interface Props {
    groups: Group[];
    evaluations: any[]; // Existing formatted evaluations
    dplWeights: {
        final_report: number;
        execution: number;
        article: number;
    };
}

export default function DplBulkEvaluations({ groups, dplWeights }: Props) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedGroup = groups.find(g => String(g.id) === selectedGroupId);

    // Form for bulk submission
    const bulkForm = useForm({
        group_id: selectedGroupId,
        evaluations: [] as any[] // Array of { student_id, items: { criterion, score }[] }
    });

    const categories = [
        { key: 'report', label: 'Laporan', weight: 40, criterion: 'Laporan Akhir' },
        { key: 'execution', label: 'Pelaksana', weight: 30, criterion: 'Pelaksanaan Program' },
        { key: 'article', label: 'Artikel', weight: 30, criterion: 'Artikel Ilmiah' },
        { key: 'discipline', label: 'Disiplin', weight: 20, criterion: 'Kedisiplinan (Kades)', is_extra: true },
        { key: 'attitude', label: 'Sikap', weight: 30, criterion: 'Etika & Sikap (Kades)', is_extra: true },
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
        
        const existingIdx = bulkForm.data.evaluations.findIndex(e => e.student_id === studentId);
        let newEvals = [...bulkForm.data.evaluations];

        if (existingIdx > -1) {
            const itemIdx = newEvals[existingIdx].items.findIndex((i: any) => i.criterion === criterion);
            if (itemIdx > -1) {
                newEvals[existingIdx].items[itemIdx].score = val;
            } else {
                newEvals[existingIdx].items.push({ criterion, score: val });
            }
        } else {
            newEvals.push({
                student_id: studentId,
                items: categories.map(c => ({ 
                    criterion: c.criterion, 
                    score: c.criterion === criterion ? val : 0 
                }))
            });
        }

        bulkForm.setData('evaluations', newEvals);
    };

    const getScoreValue = (studentId: number, criterion: string) => {
        const eval_entry = bulkForm.data.evaluations.find(e => e.student_id === studentId);
        if (eval_entry) {
            const item = eval_entry.items.find((i: any) => i.criterion === criterion);
            return item ? item.score : '';
        }
        return '';
    };

    const calculateTotal = (studentId: number) => {
        const eval_entry = bulkForm.data.evaluations.find(e => e.student_id === studentId);
        if (!eval_entry) return 0;
        
        // Manual calculation based on simplified weights for UI feedback
        // In actual controller, it follows central rules
        let dplPart = 0;
        eval_entry.items.forEach((item: any) => {
            const cat = categories.find(c => c.criterion === item.criterion);
            if (cat) dplPart += (item.score * (cat.weight / 100));
        });
        return Math.round(dplPart);
    };

    const submitBulk = (e: React.FormEvent) => {
        e.preventDefault();
        bulkForm.post(route('dpl.evaluations.store'), {
            preserveScroll: true,
            onSuccess: () => alert('Penyimpanan massal berhasil!'),
        });
    };

    const filteredStudents = useMemo(() => {
        if (!selectedGroup) return [];
        return selectedGroup.students.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.nim.includes(searchTerm)
        );
    }, [selectedGroup, searchTerm]);

    return (
        <AppLayout title="Evaluasi & Nilai Mahasiswa">
            <Head title="Audit Kualitas & Nilai | DPL Dashboard" />

            <div className="mx-auto max-w-[1600px] space-y-10 pb-20 font-sans">
                {/* Academic Header */}
                <header className="relative overflow-hidden rounded-[3rem] border border-emerald-100 bg-white p-12 md:p-16 shadow-sm">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-50 opacity-20 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 text-left">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">
                                    AKUNTABILITAS AKADEMIK
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                                Input Nilai <span className="text-emerald-600">Terintegrasi.</span>
                            </h1>
                            <p className="max-w-xl text-slate-500 font-medium text-lg leading-relaxed">
                                Evaluasi capaian pengabdian mahasiswa berbasis kompetensi. Pastikan seluruh komponen Laporan, Artikel, dan Kinerja Lapangan telah terverifikasi.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest gap-3"
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
                            <Users size={16} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pilih Kelompok Kerja</h3>
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
                                        "group p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden",
                                        selectedGroupId === String(group.id)
                                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                                            : "bg-white border-slate-100 text-slate-600 hover:border-emerald-200"
                                    )}
                                >
                                    <div className="relative z-10 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">#{group.id}</p>
                                        <p className="text-lg font-black tracking-tight leading-none">{group.name}</p>
                                        <p className="text-[11px] font-bold opacity-40">{group.period_name}</p>
                                    </div>
                                    <MapPin size={48} className={clsx(
                                        "absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity",
                                        selectedGroupId === String(group.id) ? "text-white" : "text-slate-900"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Bulk Spreadsheet */}
                    <div className="space-y-6">
                        {!selectedGroupId ? (
                            <div className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/30 p-20 text-center">
                                <Search className="mx-auto h-16 w-16 text-slate-200" strokeWidth={1} />
                                <h3 className="mt-8 text-xl font-black text-slate-300 uppercase tracking-widest leading-none">Menunggu Pilihan</h3>
                                <p className="mt-2 text-sm font-bold text-slate-300">Silahkan pilih kelompok di samping untuk memulai penilaian massa.</p>
                            </div>
                        ) : (
                            <form onSubmit={submitBulk} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Search & Meta */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                                    <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-full md:w-96">
                                        <div className="pl-4 text-slate-300"><Search size={18} /></div>
                                        <input 
                                            type="text" 
                                            placeholder="Cari NIM atau Nama Mahasiswa..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-10 border-none bg-transparent text-sm font-bold focus:ring-0 w-full placeholder:text-slate-300"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 px-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                Status: {bulkForm.data.evaluations.length} dari {selectedGroup?.students.length} Terisi
                                            </p>
                                        </div>
                                        <Button 
                                            type="submit" 
                                            loading={bulkForm.processing}
                                            className="h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95"
                                        >
                                            <Save size={18} /> Simpan Semua Nilai
                                        </Button>
                                    </div>
                                </div>

                                {/* Spreadsheet Table */}
                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest sticky left-0 z-20 bg-slate-900">Mahasiswa & NIM</th>
                                                {categories.map((cat) => (
                                                    <th key={cat.key} className="px-6 py-8 text-center min-w-[120px]">
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 leading-none mb-1">{cat.label}</p>
                                                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{cat.weight}%</p>
                                                    </th>
                                                ))}
                                                <th className="px-10 py-8 text-center min-w-[140px]">
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-white leading-none mb-1">Total Score</p>
                                                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">BOBOT AKHIR</p>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.map((student) => {
                                                const total = calculateTotal(student.id);
                                                const grade = getGrade(total);
                                                
                                                return (
                                                    <tr key={student.id} className="group/row hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-10 py-6 sticky left-0 z-10 bg-white group-hover/row:bg-slate-50/50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{student.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.nim}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {categories.map((cat) => (
                                                            <td key={cat.key} className="px-6 py-6 text-center">
                                                                <input 
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={getScoreValue(student.id, cat.criterion)}
                                                                    onChange={(e) => handleScoreChange(student.id, cat.criterion, e.target.value)}
                                                                    className={clsx(
                                                                        "h-12 w-20 text-center rounded-xl font-black text-sm border-2 transition-all p-0 focus:ring-0",
                                                                        cat.is_extra 
                                                                            ? "bg-slate-50 border-slate-100 focus:border-slate-400 focus:bg-white" 
                                                                            : "bg-white border-slate-100 focus:border-emerald-500"
                                                                    )}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="px-10 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-4">
                                                                <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">{total}</span>
                                                                <div className={clsx(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest ring-1 ring-inset transition-all",
                                                                    grade.color
                                                                )}>
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
                <footer className="bg-slate-900 rounded-[3rem] p-12 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_emerald]" />
                            <span>DPL Mandatory Components</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-slate-600" />
                            <span>Village Head Components</span>
                        </div>
                    </div>
                    <p className="text-right">Sistem Penilaian Terpadu &bull; LPPM UIN SAIZU &bull; &copy; 2026</p>
                </footer>
            </div>
        </AppLayout>
    );
}
