import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    ArrowRightLeft,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Fingerprint,
    ShieldAlert,
    ChevronRight,
    SearchCheck,
    Target,
    Clock,
    UserCircle,
    Layers,
    Info,
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Activity,
    Database,
    Cpu,
    Zap,
    MoveRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
    id: number;
    mahasiswa: {
        nim: string;
        nama: string;
        user: { name: string };
    };
    user?: { name?: string };
    kelompok?: {
        id: number;
        nama_kelompok: string;
        code: string;
        location?: {
            district_name: string;
            village_name: string | null;
            regency_name: string;
        };
    };
    status: string;
}

interface TargetGroup {
    id: number;
    nama: string;
    capacity: number | null;
    current_count: number;
    available: number | null;
}

interface Props {
    students: {
        data: Student[];
        meta: PaginationMeta;
    };
    targetPeriods: Array<{ id: number; name: string; periode: number; jenis: string; kuota: number }>;
    filters: { search?: string };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function StudentTransfer({ students, targetPeriods, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');
    const [targetPeriodId, setTargetPeriodId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [groups, setGroups] = useState<TargetGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.peserta.pindah.index'), { search }, { preserveState: true });
    };

    const fetchGroups = async (periodId: string) => {
        if (!periodId) {
            setGroups([]);
            return;
        }

        setIsLoadingGroups(true);
        try {
            const response = await fetch(route('admin.api.transfer-targets', { target_period_id: periodId }));
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            // Error handled silently
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleTransfer = () => {
        if (!selectedStudent || !targetPeriodId || !reason.trim()) return;

        if (confirm(`EKSEKUSI MUTASI PESERTA: ${selectedStudent.mahasiswa.nama}?`)) {
            router.post(route('admin.peserta.pindah'), {
                peserta_kkn_id: selectedStudent.id,
                target_period_id: targetPeriodId,
                target_group_id: targetGroupId || null,
                reason: reason,
            }, {
                onSuccess: () => {
                    setSelectedStudent(null);
                    setTargetGroupId('');
                    setTargetPeriodId('');
                    setReason('');
                }
            });
        }
    };

    const getStudentName = (student: Student) => student.mahasiswa.nama || student.mahasiswa.user.name;
    const getStudentNim = (student: Student) => student.mahasiswa.nim;
    const getGroupName = (student: Student) => student.kelompok?.nama_kelompok || student.kelompok?.code;
    const getLocationLabel = (student: Student) => {
        const loc = student.kelompok?.location;
        if (!loc) return null;
        return loc.village_name ? `${loc.village_name}, ${loc.district_name}` : loc.district_name;
    };

    return (
        <AppLayout title="Redeployment Command Hub">
            <Head title="Transfer Peserta | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Student Redeployment</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Tactical <span>Mutations.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Manajemen mutasi unit operasional. <br />
                            <span className="text-slate-900 not-italic">Pemindahan peserta antar kelompok atau lintas periode dengan mekanisme verifikasi audit terpusat.</span>
                        </p>
                    </div>

                    <div className="hidden xl:flex items-center gap-6 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden relative group">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                         <div className="h-16 w-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 relative z-10 group-hover:rotate-12 transition-transform">
                              <ArrowRightLeft size={28} />
                         </div>
                         <div className="relative z-10">
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Authorization Status</p>
                              <p className="text-xl font-black tracking-tight uppercase leading-none">Command Granted</p>
                         </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    {/* --- ENTITY SELECTION SCANNER --- */}
                    <div className="xl:col-span-4 space-y-8">
                        <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col h-[800px] group">
                            <div className="px-10 py-10 bg-slate-950 flex items-center gap-6">
                                <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                     <Users size={24} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                     <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Target Selection</h3>
                                     <p className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Pilih Peserta Mutasi</p>
                                </div>
                            </div>

                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <div className="relative group/search">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-emerald-500 transition-colors" />
                                    <form onSubmit={handleSearch}>
                                        <input
                                            type="text"
                                            placeholder="SCAN NAME / NIM IDENTITY..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full h-16 pl-16 pr-6 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-emerald-500 focus:ring-0 outline-none transition-all text-xs font-black uppercase tracking-widest text-slate-900 placeholder:text-slate-200"
                                        />
                                    </form>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {students.data.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={clsx(
                                            "w-full p-6 text-left transition-all rounded-[2rem] relative group/btn flex flex-col gap-3",
                                            selectedStudent?.id === student.id 
                                                ? "bg-slate-900 text-white shadow-2xl translate-x-3 scale-[1.02]" 
                                                : "bg-white border-b border-slate-50 hover:bg-emerald-50 hover:translate-x-1"
                                        )}
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <p className={clsx(
                                                "text-base font-black leading-tight tracking-tight uppercase italic",
                                                selectedStudent?.id === student.id ? "text-emerald-500" : "text-slate-900"
                                            )}>{getStudentName(student)}</p>
                                            <div className="flex items-center gap-3">
                                                <p className={clsx(
                                                    "text-[10px] font-black font-mono tracking-widest",
                                                    selectedStudent?.id === student.id ? "text-slate-400" : "text-slate-400"
                                                )}>{getStudentNim(student)}</p>
                                                {getGroupName(student) && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <p className={clsx("text-[9px] font-black uppercase tracking-[0.2em] italic", selectedStudent?.id === student.id ? "text-emerald-300" : "text-emerald-600")}>
                                                            {getGroupName(student)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedStudent?.id === student.id && (
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <MoveRight size={24} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {students.data.length === 0 && (
                                    <div className="py-24 text-center text-slate-200 flex flex-col items-center gap-6 opacity-50">
                                        <SearchCheck size={64} strokeWidth={1} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-widest">No Matches Found</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest italic">Identity scanner returned null</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-center">
                                {students?.meta && <Pagination meta={students.meta} />}
                            </div>
                        </motion.section>

                        <motion.div 
                            variants={itemVariants} 
                            className="bg-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-200 flex items-start gap-6 relative overflow-hidden group/alert"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/alert:rotate-12 transition-transform">
                                 <ShieldAlert size={100} strokeWidth={1} />
                            </div>
                            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                                <AlertTriangle size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <h4 className="text-base font-black uppercase tracking-tighter leading-none">Security Warning</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80 italic">
                                    "Proses transfer akan mengubah penempatan peserta secara permanen. Seluruh riwayat akan dicatat dalam audit trail sistem untuk akuntabilitas."
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* --- REDEPLOYMENT PROTOCOL TERMINAL --- */}
                    <div className="xl:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedStudent ? (
                                <motion.section 
                                    key="terminal-active"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    className="bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col group"
                                >
                                    <div className="px-12 py-12 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-8">
                                            <div className="h-20 w-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30 group-hover:rotate-6 transition-transform">
                                                <Target size={32} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Target Configuration Hub</h2>
                                                <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Konfigurasi Mutasi Unit</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedStudent(null)}
                                            className="h-16 px-8 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-2xl transition-all flex items-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                                        >
                                            <ArrowLeft size={18} />
                                            Abort Operation
                                        </button>
                                    </div>

                                    <div className="p-12 space-y-12">
                                        {/* Profile Vector Preview */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-10 bg-slate-950 rounded-[2.5rem] text-white flex items-center gap-8 relative overflow-hidden group/p shadow-2xl">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/p:scale-125 transition-transform duration-1000">
                                                     <UserCircle size={140} strokeWidth={1} />
                                                </div>
                                                <div className="h-24 w-24 bg-emerald-600 text-white flex items-center justify-center text-4xl font-black rounded-[2rem] shadow-2xl relative z-10 shrink-0 italic">
                                                    {getStudentName(selectedStudent).charAt(0)}
                                                </div>
                                                <div className="space-y-2 relative z-10">
                                                    <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">{getStudentName(selectedStudent)}</p>
                                                    <div className="flex items-center gap-3">
                                                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">IDENTIFIER: {getStudentNim(selectedStudent)}</span>
                                                         <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Node Verified</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col justify-center gap-4 group/curr">
                                                <div className="space-y-1">
                                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1 italic">Current Deployment</p>
                                                     <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic group-hover/curr:text-emerald-700 transition-colors">{getGroupName(selectedStudent) || 'UNASSIGNED'}</h4>
                                                </div>
                                                {getLocationLabel(selectedStudent) && (
                                                    <div className="flex items-center gap-3 text-slate-400">
                                                        <MapPin size={16} className="text-rose-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{getLocationLabel(selectedStudent)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Control Matrix */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Operation Period</label>
                                                <div className="relative group/sel">
                                                    <Database className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/sel:text-emerald-500 transition-colors" />
                                                    <select
                                                        value={targetPeriodId}
                                                        onChange={(e) => {
                                                            const id = e.target.value;
                                                            setTargetPeriodId(id);
                                                            setTargetGroupId('');
                                                            fetchGroups(id);
                                                        }}
                                                        className="w-full h-20 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all appearance-none uppercase tracking-tight"
                                                    >
                                                        <option value="">SELECT DESTINATION PERIOD...</option>
                                                        {targetPeriods.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Strategic Unit</label>
                                                <div className="relative group/sel">
                                                    <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/sel:text-emerald-500 transition-colors" />
                                                    <select
                                                        value={targetGroupId}
                                                        onChange={(e) => setTargetGroupId(e.target.value)}
                                                        disabled={!targetPeriodId || isLoadingGroups}
                                                        className="w-full h-20 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-300 uppercase tracking-tight"
                                                    >
                                                        <option value="">{isLoadingGroups ? 'SCANNING UNITS...' : 'SELECT TARGET GROUP (AUTO-LOAD)...'}</option>
                                                        {groups
                                                            .filter(g => g.id !== selectedStudent.kelompok?.id)
                                                            .map(g => (
                                                                <option key={g.id} value={g.id.toString()}>
                                                                    {g.nama} {g.available != null ? `(FREE CAP: ${g.available})` : ''}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Redeployment Rationale (Audit Log Required)</label>
                                                <div className="relative group/txt">
                                                    <Info className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within/txt:text-emerald-500 transition-colors" />
                                                    <textarea
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        placeholder="BERIKAN ALASAN FORMAL MUTASI UNTUK KEPENTINGAN AUDIT OPERASIONAL..."
                                                        rows={4}
                                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all resize-none placeholder:text-slate-300 uppercase italic tracking-tight"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-12 border-t border-slate-100">
                                            <div className="flex items-center gap-4 text-emerald-600">
                                                <Zap size={24} strokeWidth={3} className="animate-pulse" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Awaiting Terminal Execution Command.</p>
                                            </div>
                                            <div className="flex items-center gap-6 w-full lg:w-auto">
                                                <button
                                                    onClick={() => setSelectedStudent(null)}
                                                    className="h-20 px-10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all flex-1 lg:flex-none"
                                                >
                                                    Abort Sync
                                                </button>
                                                <button
                                                    onClick={handleTransfer}
                                                    disabled={!targetPeriodId || !reason.trim()}
                                                    className="h-20 flex-2 lg:flex-none px-12 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-20"
                                                >
                                                    Authorize Redeployment
                                                    <ArrowRight size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                            ) : (
                                <motion.div 
                                    key="terminal-idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[700px] flex flex-col items-center justify-center bg-slate-50/20 border-4 border-dashed border-slate-100 rounded-[4rem] p-24 transition-all group/idle"
                                >
                                    <div className="relative">
                                         <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                         <UserCircle className="w-40 h-40 text-slate-100 relative z-10 group-hover/idle:text-emerald-100 group-hover/idle:rotate-12 transition-all duration-700" strokeWidth={1} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-200 uppercase tracking-[0.4em] mt-12 italic">Terminal Idle</h3>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-6 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-50 group-hover/idle:border-emerald-100 group-hover/idle:text-emerald-500 transition-all">
                                        Scan and Select Entity to begin Mutation
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- GOVERNANCE FOOTER --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white relative overflow-hidden group/footer shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover/footer:rotate-12 transition-transform duration-700">
                            <Cpu size={40} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Mutations Authority Cluster</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl opacity-80">
                                Seluruh aktivitas pemindahan peserta (Transfer) tunduk pada regulasi LPPM UIN SAIZU. Mutasi antar periode bersifat final pasca otorisasi. Log audit akan menyimpan 'Reason Rationale' secara permanen untuk keperluan pelaporan institusional.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10 opacity-30">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Registry Secured</span>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: 'emerald' | 'amber' | 'rose' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Icon size={100} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-5 relative z-10">
                <div className={clsx(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-slate-900 group-hover:text-white",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    color === 'amber' ? "bg-amber-50 text-amber-600" :
                    color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60 italic leading-none">{label}</p>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{value}</p>
                </div>
            </div>
        </div>
    );
}
