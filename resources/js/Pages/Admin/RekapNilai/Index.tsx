import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    CheckBadgeIcon,
    DocumentArrowDownIcon,
    ExclamationCircleIcon,
    EyeIcon,
    XMarkIcon,
    CheckCircleIcon,
    FunnelIcon,
    ChartPieIcon,
    IdentificationIcon,
    ArchiveBoxIcon,
    BoltIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { route } from 'ziggy-js';

interface ScoreRow {
    id: number;
    student_id: number;
    nim: string;
    nama: string;
    prodi: string;
    fakultas: string;
    n_dpl: number | string | null;
    n_mitra: number | string | null;
    n_admin: number | string | null;
    total: number | string | null;
    grade: string | null;
    is_finalized: boolean;
    status_submit: {
        dpl: boolean;
        mitra: boolean;
        admin: boolean;
    };
}

interface Stats {
    total: number;
    finalized: number;
    pending: number;
    avg_score: number;
}

interface Props {
    scores: ScoreRow[];
    stats: Stats | null;
    periodeId: number | null;
    filters: any;
    finalizeProgress?: {
        status: string;
        current: number;
        total: number;
        percentage: number;
    };
}

const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-white/10 bg-white/5 border-white/5';
    const firstLetter = grade.charAt(0).toUpperCase();
    switch (firstLetter) {
        case 'A': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-glow shadow-emerald-500/40';
        case 'B': return 'text-primary-light bg-primary/10 border-primary/20';
        case 'C': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
};

export default function RekapNilaiIndex({ scores = [], stats, periodeId, filters, finalizeProgress }: Props) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<ScoreRow | null>(null);
    const [localFilters, setLocalFilters] = useState({
        is_finalized: '',
        fakultas: '',
        ...filters
    });

    const filteredScores = useMemo(() => {
        return scores.filter(s =>
            (s.nama.toLowerCase().includes(search.toLowerCase()) || s.nim.includes(search)) &&
            (localFilters.is_finalized === '' || String(s.is_finalized) === localFilters.is_finalized) &&
            (localFilters.fakultas === '' || s.fakultas === localFilters.fakultas)
        );
    }, [scores, search, localFilters]);

    const handleExport = () => {
        if (!periodeId) return;
        window.open(route('admin.rekap-nilai.export', { period_id: periodeId, ...localFilters }), '_blank');
    };

    const handleFinalizeMass = () => {
        if (!confirm('CRITICAL ACTION: DO YOU WISH TO FINALIZE ALL COMPLETED RECORDS IN THE ACTIVE STACK?')) return;
        router.post(route('admin.rekap-nilai.finalize-mass'), { period_id: periodeId, ...localFilters });
    };

    return (
        <AppLayout title="Academic Archive Nexus">
            <Head title="Strategic Merit Ledger" />

            <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-12 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">GLOBAL MERIT ARCHIVE</div>
                            {stats && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">{stats.total} PERSISTED ENTRIES</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Archive <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-6 font-medium uppercase tracking-[0.2em]">Strategic aggregation of final scholastic performance and merit indices.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 relative z-10">
                        <button
                            onClick={handleExport}
                            disabled={!periodeId}
                            className="group flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-20 italic shadow-2xl"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                            EXPORT LEDGER
                        </button>
                        <button
                            onClick={() => router.get(route('admin.rekap-nilai.bulk-certificates'), { period_id: periodeId, ...localFilters })}
                            disabled={!periodeId || stats?.finalized === 0}
                            className="group flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-20 italic shadow-2xl"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5 text-primary-light group-hover:scale-110 transition-transform" />
                            BULK CERTIFICATES
                        </button>
                        <button
                            onClick={handleFinalizeMass}
                            disabled={!periodeId || (finalizeProgress?.status === 'processing')}
                            className="group flex items-center gap-5 px-10 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 border border-white/10 italic"
                        >
                            <CheckBadgeIcon className="w-5 h-5 text-accent-gold" />
                            {finalizeProgress?.status === 'processing' ? 'SYNCING...' : 'FINALIZE STACK'}
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass p-10 rounded-[3rem] border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white group-hover:rotate-12 transition-transform duration-700">
                                <ChartPieIcon className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">AGGREGATED MEAN</p>
                                <p className="text-5xl font-black text-white italic tracking-tighter group-hover:text-accent-gold transition-colors">{stats.avg_score.toFixed(1)}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 text-accent-gold border border-white/10 shadow-glow-sm relative z-10">
                                <ChartPieIcon className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="glass p-10 rounded-[3rem] border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white group-hover:rotate-12 transition-transform duration-700">
                                <CheckCircleIcon className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">LEGALIZED RECORDS</p>
                                <p className="text-5xl font-black text-white italic tracking-tighter group-hover:text-primary-light transition-colors">{stats.finalized}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 text-primary-light border border-white/10 shadow-glow-sm relative z-10">
                                <CheckCircleIcon className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="glass p-10 rounded-[3rem] border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white group-hover:rotate-12 transition-transform duration-700">
                                <ExclamationCircleIcon className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">INCOMPLETE STACK</p>
                                <p className="text-5xl font-black text-white italic tracking-tighter group-hover:text-rose-400 transition-colors">{stats.pending}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 text-rose-400 border border-white/10 shadow-glow-sm relative z-10">
                                <ExclamationCircleIcon className="w-10 h-10" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tactical Console Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between glass p-6 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-md">
                    <div className="flex-1 w-full md:max-w-2xl relative group">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN ARCHIVE FOR SCHOLAR IDENTIFIERS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white outline-none focus:border-accent-gold/50 shadow-2xl transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <select
                            value={localFilters.is_finalized}
                            onChange={(e) => setLocalFilters({ ...localFilters, is_finalized: e.target.value })}
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 outline-none focus:border-accent-gold/50 transition-all cursor-pointer shadow-2xl italic"
                        >
                            <option value="" className="bg-slate-900">ALL PERSISTENCE STATES</option>
                            <option value="true" className="bg-slate-900">FINALIZED</option>
                            <option value="false" className="bg-slate-900">PENDING</option>
                        </select>

                        <div className="flex items-center gap-4 px-8 py-4 bg-primary/10 rounded-2xl border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary-light shadow-2xl italic">
                            <FunnelIcon className="w-5 h-5" />
                            FILTERS ACTIVE
                        </div>
                    </div>
                </div>

                {/* Archive Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                        <ArchiveBoxIcon className="h-96 w-96 rotate-12" />
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scholar Identification</th>
                                    <th className="px-8 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Nexus Ingestion</th>
                                    <th className="px-8 py-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Aggregation</th>
                                    <th className="px-8 py-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Grade Index</th>
                                    <th className="px-10 py-10 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Operation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredScores.map(student => (
                                    <tr key={student.id} className="group hover:bg-white/[0.05] transition-all duration-300">
                                        <td className="px-10 py-10">
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-primary-dark/10 border border-white/10 flex items-center justify-center text-2xl font-black text-primary-light shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all italic">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white italic uppercase tracking-widest text-base leading-none group-hover:text-accent-gold transition-colors">{student.nama}</p>
                                                    <p className="text-[10px] font-mono font-black text-white/20 mt-3 uppercase tracking-widest flex items-center gap-2">
                                                        <IdentificationIcon className="h-3 w-3" /> ID // {student.nim}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-3 py-0.5 bg-white/5 rounded-lg text-[8px] font-black text-white/30 uppercase tracking-widest border border-white/5">{student.prodi}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-5">
                                                <MiniScore label="ALPHA" active={student.status_submit.dpl} value={student.n_dpl} />
                                                <MiniScore label="BETA" active={student.status_submit.mitra} value={student.n_mitra} />
                                                <MiniScore label="GAMMA" active={student.status_submit.admin} value={student.n_admin} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <span className="text-3xl font-black font-mono text-white italic tabular-nums group-hover:text-accent-gold transition-colors">{student.total ?? '—'}</span>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex justify-center">
                                                <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border italic transition-all duration-500 shadow-2xl backdrop-blur-md ${getGradeColor(student.grade)}`}>
                                                    {student.grade ?? 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <div className="flex items-center justify-end gap-5">
                                                {student.is_finalized && (
                                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-glow-sm" title="FINALIZED">
                                                        <CheckBadgeIcon className="w-5 h-5 shadow-2xl" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/20 hover:text-accent-gold hover:border-accent-gold/40 hover:bg-accent-gold/5 shadow-2xl transition-all active:scale-90"
                                                >
                                                    <EyeIcon className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredScores.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <ArchiveBoxIcon className="w-20 h-20 text-white" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white italic">Archive streams are clear</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Strategic Detail Nexus (Modal) */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="glass rounded-[4rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="p-12 border-b border-white/5 flex items-center justify-between relative bg-white/[0.01]">
                            <div className="flex items-center gap-8">
                                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-4xl font-black shadow-glow transform -rotate-3 italic mt-[-10px]">
                                    {selectedStudent.nama.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">{selectedStudent.nama}</h4>
                                    <p className="text-xs font-black text-white/20 flex items-center gap-3 mt-3 uppercase tracking-widest italic">
                                        {selectedStudent.nim} <div className="w-1 h-1 rounded-full bg-white/10" /> {selectedStudent.prodi}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-4 hover:bg-white/5 rounded-3xl text-white/20 hover:text-rose-500 transition-all active:rotate-90">
                                <XMarkIcon className="w-9 h-9" />
                            </button>
                        </div>

                        <div className="p-12 space-y-12">
                            <div className="grid grid-cols-3 gap-8">
                                <DetailMetric label="MODULE ALPHA" value={selectedStudent.n_dpl} active={selectedStudent.status_submit.dpl} />
                                <DetailMetric label="MODULE BETA" value={selectedStudent.n_mitra} active={selectedStudent.status_submit.mitra} />
                                <DetailMetric label="MODULE GAMMA" value={selectedStudent.n_admin} active={selectedStudent.status_submit.admin} />
                            </div>

                            <div className="bg-black/40 rounded-[3rem] p-10 border border-white/5 flex items-center justify-between shadow-inner relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/0 via-accent-gold/[0.02] to-accent-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 italic flex items-center gap-3">
                                        <SparklesIcon className="h-4 w-4 text-accent-gold" />
                                        Aggregated Quantum
                                    </p>
                                    <p className="text-7xl font-black text-white tabular-nums italic leading-none">{selectedStudent.total ?? '--'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 italic text-right">Merit Index</p>
                                    <span className={`text-6xl font-black text-glow-gold transition-all duration-700 ${getGradeColor(selectedStudent.grade).replace('bg-', 'text-').split(' ')[0]}`}>
                                        {selectedStudent.grade ?? 'Ø'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-12 bg-white/[0.02] border-t border-white/5 flex gap-6">
                            {!selectedStudent.is_finalized ? (
                                <button
                                    onClick={() => {
                                        if (confirm('AUTHORIZE FINALIZATION: COMMIT THIS RECORD TO PERMANENT ARCHIVE?')) {
                                            router.post(route('admin.rekap-nilai.finalize', selectedStudent.student_id));
                                            setSelectedStudent(null);
                                        }
                                    }}
                                    disabled={!selectedStudent.total}
                                    className="flex-1 py-6 bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 border border-white/10 italic"
                                >
                                    AUTHORIZE FINALIZATION
                                </button>
                            ) : (
                                <div className="flex-1 py-6 bg-white/5 border border-white/10 text-emerald-400 text-xs font-black uppercase tracking-[0.3em] rounded-[2.5rem] text-center flex items-center justify-center gap-4 italic shadow-2xl backdrop-blur-md">
                                    <CheckBadgeIcon className="w-6 h-6 text-accent-gold" />
                                    RECORD PERSISTED IN ARCHIVE
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function MiniScore({ label, active, value }: { label: string, active: boolean, value: any }) {
    return (
        <div className="flex flex-col gap-2 min-w-[70px]">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] text-center italic">{label}</span>
            <div className={`py-2 rounded-xl border text-center font-mono text-[10px] font-black shadow-2xl transition-all duration-500 backdrop-blur-md italic ${active ? 'bg-primary/10 text-primary-light border-primary/20 shadow-glow-sm' : 'bg-white/5 text-white/10 border-white/10'}`}>
                {value ?? '0'}
            </div>
        </div>
    );
}

function DetailMetric({ label, value, active }: any) {
    return (
        <div className="space-y-4 group">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center italic group-hover:text-white transition-colors">{label}</p>
            <div className={`py-10 rounded-[2.5rem] text-center border shadow-2xl transition-all duration-700 backdrop-blur-md relative overflow-hidden ${active ? 'bg-white/[0.03] text-white border-white/20 group-hover:border-accent-gold/40' : 'bg-white/[0.01] text-white/5 border-white/5'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-4xl font-black font-mono italic relative z-10">{value ?? '--'}</span>
            </div>
            <div className="flex justify-center transform transition-transform group-hover:scale-125 duration-500">
                {active ? (
                    <BoltIcon className="w-6 h-6 text-accent-gold animate-pulse" />
                ) : (
                    <XMarkIcon className="w-6 h-6 text-white/5" />
                )}
            </div>
        </div>
    );
}
