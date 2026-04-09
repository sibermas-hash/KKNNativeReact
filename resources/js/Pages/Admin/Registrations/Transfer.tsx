import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    ArrowRightLeft,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Fingerprint,
    Zap,
    ShieldAlert,
    Database,
    Binary,
    ShieldCheck,
    ChevronRight,
    SearchCheck,
    Target,
    Activity,
    Info,
    ArrowLeft,
    UserCircle,
    Layers,
    LayoutDashboard,
    Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
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
            
            if (!response.ok) {
                throw new Error('Failed to fetch transfer targets');
            }

            const data = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            // Handle error silently
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleTransfer = () => {
        if (!selectedStudent || !targetPeriodId || !reason.trim()) return;

        if (confirm(`OPERASI KRITIKAL: PINDAHKAN ${selectedStudent.mahasiswa.nama.toUpperCase()} KE UNIT/PERIODE BARU?`)) {
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
        <AppLayout title="Protokol Transfer Peserta">
            <Head title="Transfer Peserta | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950 uppercase tracking-tight">
                {/* HEADER TACTICAL: REDEPLOYMENT COMMAND */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Peserta Redeployment Protocol Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            TRANSFER <span className="text-emerald-500">UNIT PESERTA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                             <ArrowRightLeft size={12} className="text-emerald-500" />
                             Otoritas mutasi peserta antar periode, penugasan ulang unit kelompok, dan audit log perpindahan.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1 text-center">SYSTEM_STATUS</span>
                               <div className="flex items-center gap-3">
                                   <ShieldCheck size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">OPERATIONAL</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                        {/* LEFT: PESERTA REGISTRY SOURCE */}
                        <div className="xl:col-span-4 space-y-8">
                            <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all flex flex-col h-[700px]">
                                <div className="px-8 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-950 text-emerald-400">
                                            <Users size={16} />
                                        </div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Source Registry</h2>
                                    </div>
                                </div>

                                <div className="p-8 border-b border-emerald-50 bg-white relative group">
                                    <Search className="absolute left-14 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-focus-within:text-emerald-500 transition-colors" />
                                    <form onSubmit={handleSearch}>
                                        <input
                                            type="search"
                                            placeholder="CARI NAMA / NIM..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value.toUpperCase())}
                                            className="w-full h-16 pl-16 pr-8 bg-emerald-50/20 border border-emerald-50 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-900 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-3 bg-white scrollbar-thin scrollbar-thumb-emerald-50">
                                    {students.data.map((student) => (
                                        <button
                                            key={student.id}
                                            onClick={() => setSelectedStudent(student)}
                                            className={clsx(
                                                "w-full p-6 text-left transition-all border group relative overflow-hidden",
                                                selectedStudent?.id === student.id 
                                                    ? "bg-emerald-950 border-emerald-900 text-white shadow-xl" 
                                                    : "bg-white border-emerald-50 hover:border-emerald-500 hover:bg-emerald-50/30"
                                            )}
                                        >
                                            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 transform translate-x-1 group-hover:translate-x-0 transition-transform" />
                                            <div className="space-y-1 relative z-10">
                                                <p className={clsx(
                                                    "text-[12px] font-black uppercase tracking-tight italic leading-none truncate",
                                                    selectedStudent?.id === student.id ? "text-white" : "text-emerald-950"
                                                )}>{getStudentName(student)}</p>
                                                <div className="flex items-center gap-3">
                                                    <Fingerprint size={10} className={selectedStudent?.id === student.id ? "text-emerald-400" : "text-emerald-100"} />
                                                    <p className={clsx("text-[9px] font-bold uppercase tracking-widest tabular-nums", selectedStudent?.id === student.id ? "text-emerald-400" : "text-emerald-200")}>{getStudentNim(student)}</p>
                                                </div>
                                                {getGroupName(student) && (
                                                    <p className={clsx("text-[8px] mt-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black", selectedStudent?.id === student.id ? "text-emerald-500/60" : "text-emerald-100")}>
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {getGroupName(student)}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}

                                    {students.data.length === 0 && (
                                        <div className="py-24 text-center opacity-20 flex flex-col items-center gap-6">
                                            <SearchCheck size={48} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">REGISTRY_EMPTY</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 border-t border-emerald-50 bg-emerald-50/10 flex justify-center">
                                    <Pagination meta={students.meta} />
                                </div>
                            </section>

                            <div className="bg-amber-950 p-8 border border-amber-900 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-white -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                    <ShieldAlert size={80} />
                                </div>
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className="p-2 bg-amber-500 shadow-lg">
                                        <AlertTriangle size={16} className="text-amber-950" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic">Operational Warning</h4>
                                        <p className="text-[9px] font-bold text-amber-100/40 uppercase tracking-widest leading-relaxed italic border-l border-amber-500/20 pl-4 mt-3">
                                            Proses transfer unit akan menyebabkan pergeseran logistik dan administrasi kelompok secara permanen. Seluruh mutasi akan dicatat dalam audit trail KKN.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: REDEPLOYMENT TARGET COMMAND */}
                        <div className="xl:col-span-8">
                            <AnimatePresence mode="wait">
                                {selectedStudent ? (
                                    <motion.section 
                                        key={selectedStudent.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all flex flex-col"
                                    >
                                        <div className="px-10 py-8 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-emerald-950 text-emerald-400 shadow-lg">
                                                    <Target size={20} />
                                                </div>
                                                <div>
                                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Target Redeployment Payload</h2>
                                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Konfigurasi Destinasi Unit Baru</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedStudent(null)}
                                                className="h-12 w-12 bg-white border border-emerald-50 text-emerald-100 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center active:scale-90 shadow-sm"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                        </div>

                                        <div className="p-10 space-y-12">
                                            {/* SOURCE MANIFEST */}
                                            <div className="flex flex-col md:flex-row items-stretch gap-8">
                                                <div className="flex items-center gap-8 p-10 bg-emerald-950 text-white shadow-2xl relative overflow-hidden group/source flex-1">
                                                    <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-500/5 -skew-x-12 translate-x-10 pointer-events-none" />
                                                    <div className="h-20 w-20 bg-emerald-600 text-white flex items-center justify-center text-3xl font-black shadow-3xl rotate-3 group-hover/source:rotate-0 transition-transform">
                                                        {getStudentName(selectedStudent).charAt(0)}
                                                    </div>
                                                    <div className="space-y-2 relative z-10">
                                                        <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.4em] italic mb-1">Dismantling Identity</p>
                                                        <p className="text-2xl font-black italic tracking-tighter uppercase leading-none">{getStudentName(selectedStudent)}</p>
                                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest tabular-nums mt-3">REG_ID: #{selectedStudent.id} • NIM.{getStudentNim(selectedStudent)}</p>
                                                    </div>
                                                </div>

                                                <div className="p-10 bg-emerald-50/20 border border-emerald-50 flex-1 flex flex-col justify-center gap-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">Current Deployment</p>
                                                        <h4 className="text-xl font-black text-emerald-950 uppercase italic tracking-tighter">{getGroupName(selectedStudent) || 'NO_UNIT_ASSIGNED'}</h4>
                                                    </div>
                                                    {getLocationLabel(selectedStudent) && (
                                                        <div className="flex items-center gap-3 text-emerald-400 group-hover:text-emerald-600 transition-colors">
                                                            <MapPin size={12} strokeWidth={2.5} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">{getLocationLabel(selectedStudent)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* TARGET CONFIGURATION */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                                        <Clock size={12} className="text-emerald-500" />
                                                        Periode Target
                                                    </label>
                                                    <div className="relative group/sel">
                                                        <select
                                                            value={targetPeriodId}
                                                            onChange={(e) => {
                                                                const id = e.target.value;
                                                                setTargetPeriodId(id);
                                                                setTargetGroupId('');
                                                                fetchGroups(id);
                                                            }}
                                                            className="w-full h-20 px-8 bg-emerald-50/10 border border-emerald-50 text-[11px] font-black uppercase italic tracking-[0.2em] text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner appearance-none relative z-10"
                                                        >
                                                            <option value="">PILIH PERIODE_DESTINASI...</option>
                                                            {targetPeriods.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-100 rotate-90 z-20" />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                                        <Layers size={12} className="text-emerald-500" />
                                                        Kelompok Target
                                                    </label>
                                                    <div className="relative group/sel">
                                                        <select
                                                            value={targetGroupId}
                                                            onChange={(e) => setTargetGroupId(e.target.value)}
                                                            disabled={!targetPeriodId || isLoadingGroups}
                                                            className="w-full h-20 px-8 bg-emerald-50/10 border border-emerald-50 text-[11px] font-black uppercase italic tracking-[0.2em] text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner appearance-none relative z-10 disabled:opacity-30"
                                                        >
                                                            <option value="">{isLoadingGroups ? 'INITIALIZING_GROUPS...' : 'OPSIONAL: SEMUA UNIT...'}</option>
                                                            {groups
                                                                .filter(g => g.id !== selectedStudent.kelompok?.id)
                                                                .map(g => (
                                                                    <option key={g.id} value={g.id.toString()}>
                                                                        {g.nama.toUpperCase()} {g.available != null ? ` (CAPACITY: ${g.available})` : ''}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        <ChevronRight size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-100 rotate-90 z-20" />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-4">
                                                    <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                                        <Binary size={12} className="text-emerald-500" />
                                                        Log Otoritas / Alasan Transfer
                                                    </label>
                                                    <textarea
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value.toUpperCase())}
                                                        placeholder="MASUKKAN NARASI PEMINDAHAN UNTUK AUDIT LOG..."
                                                        rows={5}
                                                        className="w-full p-8 bg-emerald-50/10 border border-emerald-50 text-[12px] font-black italic tracking-[0.1em] text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner uppercase"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-12 border-t border-emerald-50">
                                                <div className="flex-1 flex items-center gap-6 opacity-30 italic hidden sm:flex">
                                                    <Info size={20} className="text-emerald-100" />
                                                    <p className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.4em] leading-relaxed">Seluruh data redeploy tervalidasi oleh sistem audit terpusat.</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(null);
                                                        setTargetGroupId('');
                                                        setTargetPeriodId('');
                                                        setReason('');
                                                    }}
                                                    className="w-full sm:w-auto h-18 px-12 bg-white text-rose-300 font-black text-[11px] uppercase tracking-[0.3em] italic border border-rose-50 hover:bg-rose-600 hover:text-white hover:border-transparent transition-all active:scale-95"
                                                >
                                                    BATALKAN_MUTASI
                                                </button>
                                                <button
                                                    onClick={handleTransfer}
                                                    disabled={!targetPeriodId || !reason.trim()}
                                                    className="w-full sm:w-auto h-18 px-12 bg-emerald-950 text-white font-black text-[11px] uppercase tracking-[0.4em] italic hover:bg-emerald-600 transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-6 group/btn disabled:opacity-20"
                                                >
                                                    EKSEKUSI REDEPLOYMENT
                                                    <CheckCircle2 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.section>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full min-h-[500px] flex flex-col items-center justify-center bg-emerald-50/5 border-4 border-dashed border-emerald-50 p-12 transition-all relative overflow-hidden group"
                                    >
                                         <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                         <div className="relative z-10 flex flex-col items-center">
                                            <ArrowRightLeft className="w-24 h-24 text-emerald-50 mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" strokeWidth={1} />
                                            <h3 className="text-xl font-black text-emerald-200 uppercase tracking-[0.5em] italic">READY_FOR_COMMMAND</h3>
                                            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-6 italic border-b border-emerald-50 pb-2">
                                                SILAHKAN PILIH ENTITAS PESERTA DARI REGISTRY SUMBER
                                            </p>
                                         </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* STATUS FOOTER TACTICAL */}
                <div className="flex flex-col items-center justify-center py-12 gap-8 relative group mb-12 italic">
                     <div className="flex items-center gap-8 opacity-20">
                        <Binary size={20} className="text-emerald-200" />
                        <div className="h-px w-32 bg-emerald-50" />
                        <div className="p-3 bg-emerald-950 text-emerald-400 font-black text-[9px] tracking-[0.5em] uppercase">TRANSFER_PROTOCOL_READY</div>
                        <div className="h-px w-32 bg-emerald-50" />
                        <ShieldCheck size={20} className="text-emerald-200" />
                     </div>
                     <p className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700">
                         OTORITAS MUTASI PUSAT • UIN SAIZU COMMAND CENTER
                     </p>
                </div>
            </div>
        </AppLayout>
    );
}
