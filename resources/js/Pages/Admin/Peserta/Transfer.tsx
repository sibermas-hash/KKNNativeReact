import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    ArrowRightLeft,
    ChevronRight,
    MapPin,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ShieldAlert,
    Cpu,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface Student {
    id: number;
    nim: string;
    user: { name: string; };
    group?: {
        id: number;
        name: string;
        location?: {
            kecamatan: string;
            kabupaten: string;
        };
    };
}

interface Group {
    id: number;
    name: string;
    location?: {
        kecamatan: string;
        kabupaten: string;
    };
}

interface Props {
    students: {
        data: Student[];
        meta: any;
    };
    groups: Group[];
    filters: { search?: string };
}

export default function StudentTransfer({ students, groups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.peserta.transfer'), { search }, { preserveState: true });
    };

    const handleTransfer = () => {
        if (!selectedStudent || !targetGroupId) return;
        
        if (confirm(`Apakah Anda yakin ingin melakukan transmisi personel ${selectedStudent.user.name} ke unit baru?`)) {
            router.post(route('admin.peserta.transfer.store'), {
                student_id: selectedStudent.id,
                target_group_id: targetGroupId,
            }, {
                onSuccess: () => {
                    setSelectedStudent(null);
                    setTargetGroupId('');
                }
            });
        }
    };

    return (
        <AppLayout title="Mobilitas Peserta">
            <Head title="Transfer Mahasiswa" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-emerald-600">Mobilitas Peserta</h1>
                        <p className="text-sm text-slate-500 mt-1">Orkestrasi sistem transmisi dan relokasi personel antar unit operasional.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Search & Select Panel - Side Column */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-200/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Search className="w-5 h-5 shadow-sm" />
                                </div>
                                <h3 className="font-bold text-slate-900 uppercase italic tracking-widest text-[11px]">Cari Personel</h3>
                            </div>
                            
                            <form onSubmit={handleSearch} className="relative group mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="search"
                                    placeholder="NIM / NAMA_PESERTA..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase italic focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                                />
                            </form>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {students.data.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl border text-left transition-all group flex items-center justify-between",
                                            selectedStudent?.id === student.id 
                                                ? "bg-slate-900 border-slate-800 shadow-lg scale-[1.02]" 
                                                : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "h-10 w-10 flex items-center justify-center rounded-lg font-black text-xs italic",
                                                selectedStudent?.id === student.id ? "bg-primary text-slate-900" : "bg-slate-900 text-primary"
                                            )}>
                                                {student.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={clsx(
                                                    "text-xs font-black uppercase italic leading-none truncate max-w-[150px]",
                                                    selectedStudent?.id === student.id ? "text-white" : "text-slate-900"
                                                )}>{student.user.name}</p>
                                                <p className={clsx(
                                                    "text-[9px] font-bold uppercase tracking-widest mt-1.5",
                                                    selectedStudent?.id === student.id ? "text-primary/50" : "text-slate-400"
                                                )}>{student.nim}</p>
                                            </div>
                                        </div>
                                        {selectedStudent?.id === student.id && (
                                            <div className="h-2 w-2 rounded-lg bg-primary animate-pulse shadow-[0_0_10px_rgba(16,168,83,0.5)]" />
                                        )}
                                        <ChevronRight className={clsx(
                                            "w-4 h-4 transition-transform group-hover:translate-x-1",
                                            selectedStudent?.id === student.id ? "text-primary" : "text-slate-200"
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Transfer Governance Protocol */}
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 relative overflow-hidden group shadow-xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-8 text-emerald-500 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                                <ShieldAlert className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <Cpu className="w-10 h-10 text-emerald-500 mb-2 shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
                                <div>
                                    <h4 className="text-[11px] font-bold text-white uppercase italic tracking-widest leading-none mb-2">Relocation_Protocol_V3.2</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed opacity-75">
                                        Seluruh relokasi personel antar unit operasional akan memicu pembaharuan ledger logistik secara otomatis. Pastikan integrasi data valid.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Command Center - Main Column */}
                    <div className="xl:col-span-8">
                        {selectedStudent ? (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden">
                                <div className="p-10 border-b border-slate-50 space-y-8">
                                    <div className="flex items-center gap-8 justify-center">
                                        <div className="flex flex-col items-center gap-4 group">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Source_Vector</span>
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-primary text-3xl font-black italic shadow-2xl group-hover:scale-110 transition-transform">
                                                {selectedStudent.user.name.charAt(0)}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-slate-900 uppercase italic tracking-tighter text-sm mb-1">{selectedStudent.user.name}</p>
                                                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-400 font-mono italic">#{selectedStudent.nim}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-6 px-10">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-8 bg-slate-100 rounded-full" />
                                                <div className="h-12 w-12 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center animate-pulse">
                                                    <ArrowRightLeft className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="h-1 w-8 bg-slate-100 rounded-full" />
                                            </div>
                                            <div className="px-4 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase italic tracking-[0.2em] shadow-sm">TRANSMISSION_ACTIVE</div>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Target_Vector</span>
                                            <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-dashed border-slate-200 flex items-center justify-center animate-pulse">
                                                <ArrowRight className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest opacity-20 italic">AWAITING_SIGNAL</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 pt-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Current_Base_Station</span>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5">{selectedStudent.group?.name || 'UNASSIGNED_STATION'}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest opacity-50 truncate">
                                                    {selectedStudent.group?.location ? `${selectedStudent.group.location.kecamatan}, ${selectedStudent.group.location.kabupaten}` : 'COORDINATES_UNKNOWN'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <RefreshCw className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Destination_Target</span>
                                            </div>
                                            <select
                                                value={targetGroupId}
                                                onChange={(e) => setTargetGroupId(e.target.value)}
                                                className="w-full min-h-[44px] bg-white border border-emerald-100 rounded-xl px-4 text-xs font-black uppercase italic italic tracking-widest focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                            >
                                                <option value="">SELECT_TARGET_UNIT</option>
                                                {groups.filter(g => g.id !== selectedStudent.group?.id).map(g => (
                                                    <option key={g.id} value={g.id.toString()}>{g.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-slate-50/50 flex items-center justify-between gap-10">
                                    <div className="flex items-center gap-5 italic opacity-40">
                                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Seluruh log aktivitas transmisi akan terekam secara permanen dalam ledger kedaulatan data.</p>
                                    </div>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={!targetGroupId}
                                        className="h-16 px-10 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-[0.25em] text-[11px] shadow-2xl shadow-slate-900/40 relative active:scale-95 group/submit disabled:opacity-30 disabled:grayscale transition-all hover:bg-emerald-600"
                                    >
                                        <span className="relative z-10 flex items-center gap-4">
                                            <CheckCircle2 className="w-5 h-5 text-primary group-hover/submit:text-white" />
                                            EXECUTE_TRANSMISSION
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-10 space-y-8 italic">
                                <div className="p-12 bg-slate-50 rounded-[2.5rem] text-slate-100">
                                    <ArrowRightLeft className="w-24 h-24 stroke-[1.5px]" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest opacity-20 leading-none">Awaiting_Personnel_Selection</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-30 leading-none">SELECT_PERSONNEL_FROM_THE_REGISTRY_LEDGER_TO_INITIALIZE_TRANSMISSION</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
