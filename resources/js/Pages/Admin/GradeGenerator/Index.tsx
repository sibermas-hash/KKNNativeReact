import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Cpu, 
    Download, 
    FileSpreadsheet, 
    FileText, 
    Filter, 
    Zap, 
    Layers, 
    Users, 
    Calendar, 
    Activity, 
    ArrowRight, 
    Database, 
    Globe, 
    Binary, 
    Fingerprint, 
    ShieldCheck, 
    Navigation,
    LayoutDashboard,
    Clock,
    Target,
    FileBox,
    Key,
    IdCard,
    SearchCheck,
    Archive,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface Period {
    id: number;
    name: string;
    grading_start?: string | null;
    grading_end?: string | null;
}

interface Group {
    id: number;
    period_id: number;
    code: string;
    name: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
    dpl: string;
}

interface Props {
    periods: Period[];
    groups: Group[];
}

export default function GradeGeneratorIndex({ periods, groups }: Props) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

    const activeGroups = useMemo(() => {
        if (!selectedPeriodId) {
            return groups;
        }

        return groups.filter((group) => String(group.period_id) === selectedPeriodId);
    }, [groups, selectedPeriodId]);

    const selectedPeriod = periods.find((period) => String(period.id) === selectedPeriodId) ?? null;

    return (
        <AppLayout title="Otoritas Distribusi Nilai">
            <Head title="Generator Nilai | POS-KKN" />

            <div className="min-h-screen bg-white font-black italic">
                {/* HEADER TACTICAL: SIERRA GENERATOR SYSTEM */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Grade Distribution Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            GENERATOR <span className="text-emerald-500">BLANKO NILAI</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Cpu size={12} className="text-emerald-500" />
                             Pusat distribusi blanko penilaian, ekspor masif kelompok, dan otomasi sinkronisasi berkas DPL.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">TOTAL UNIT ENTITIES</span>
                               <div className="flex items-center gap-3 text-nowrap">
                                   <Archive size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums">{activeGroups.length} KELOMPOK AKTIF</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* OPERATIONAL TOOLBAR TACTICAL */}
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-12 bg-white border border-emerald-100 p-10 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        
                        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-8 relative z-10 flex-1">
                            <div className="relative group flex-1 bg-emerald-50/30 border border-emerald-100 hover:border-emerald-500 transition-all shadow-inner focus-within:border-emerald-500">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" />
                                <div className="pl-16 pr-8 py-5 flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest mb-1 italic leading-none">Filter Periode Siklus</span>
                                    <select 
                                        value={selectedPeriodId}
                                        onChange={(event) => setSelectedPeriodId(event.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm font-black italic text-emerald-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                    >
                                        <option value="">SEMUA PERIODE SIKLUS</option>
                                        {periods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                PERIODE KKN: {period.name.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-hover:animate-pulse" />
                            </div>

                            <a
                                href={selectedPeriodId ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}` : '/admin/generator-nilai/export-zip'}
                                className="h-20 px-12 bg-emerald-950 text-white flex items-center gap-8 group hover:bg-emerald-600 transition-all shadow-2xl relative overflow-hidden flex-none"
                            >
                                <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                                <FileBox className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                                <div className="flex flex-col relative z-10 text-left">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5 leading-none">Mass Export Archive</span>
                                    <span className="text-sm font-black italic tracking-tighter leading-none whitespace-nowrap uppercase">UNDUH ARSIP ZIP MASSAL</span>
                                </div>
                            </a>
                        </div>

                        <div className="hidden xl:flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity relative z-10">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                            SYSTEM READY FOR DISTRIBUTION
                        </div>
                    </div>

                    {/* DATA GRID TACTICAL */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400 font-black">
                                    <Layers size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Registry Unit Kelompok</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Data Kolektif Unit & Otoritas Berkas Nilai</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl text-nowrap">
                                    OPERATIONAL LEDGER FEED
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100 italic">
                                        <th className="px-12 py-8 text-left text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">KELOMPOK & SINYAL IDENTITAS</th>
                                        <th className="px-8 py-8 text-left text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">LOKASI PENERJUNAN</th>
                                        <th className="px-8 py-8 text-left text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic">OTORITAS DPL</th>
                                        <th className="px-12 py-8 text-right text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em] italic pr-12">OPERATIONAL COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50/50">
                                    {activeGroups.length > 0 ? (
                                        activeGroups.map((group, idx) => (
                                            <tr key={group.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                                <td className="px-12 py-8 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1.5 group-hover/row:translate-x-2 transition-transform">
                                                        <span className="text-sm font-black text-emerald-950 uppercase italic tracking-widest leading-none group-hover/row:text-emerald-600 transition-colors uppercase">{group.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint size={10} className="text-emerald-100" />
                                                            <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest italic tabular-nums leading-none">UNIT_ID: #{group.code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-300 group-hover/row:bg-emerald-950 group-hover/row:text-emerald-400 group-hover/row:border-emerald-900 transition-all shadow-sm">
                                                            <Navigation size={16} />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-black text-emerald-900 uppercase italic tracking-tight uppercase leading-none">{group.desa}</span>
                                                            <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-1 uppercase leading-none tabular-nums italic">{group.kecamatan}, {group.kabupaten}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-12 w-12 bg-emerald-950 text-emerald-400 border border-emerald-900 flex items-center justify-center font-black text-sm italic shadow-xl group-hover/row:scale-110 group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500 uppercase">
                                                            {group.dpl?.charAt(0) || '-'}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black text-emerald-950 uppercase italic tracking-widest uppercase leading-none">{group.dpl || 'UNASSIGNED DPL'}</span>
                                                            <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest italic uppercase leading-none">VERIFIED FACULTY AUTHORITY</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-8 text-right pr-12">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0 duration-300">
                                                        <Link
                                                            href={`/admin/grades?group_id=${group.id}`}
                                                            className="h-12 px-6 bg-emerald-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-xl"
                                                        >
                                                            KOREKSI MANUAL
                                                            <ChevronRight size={14} className="ml-2" />
                                                        </Link>
                                                        <a
                                                            href={`/admin/generator-nilai/${group.id}/export`}
                                                            className="h-12 w-12 bg-white border border-emerald-50 text-emerald-950 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-500 transition-all shadow-sm active:scale-95 group/btn"
                                                            title="EKSPOR EXCEL (REKAP)"
                                                        >
                                                            <FileSpreadsheet className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                        </a>
                                                        <a
                                                            href={`/admin/generator-nilai/${group.id}/export-pdf`}
                                                            className="h-12 w-12 bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                                                            title="EKSPOR PDF (LAPORAN)"
                                                        >
                                                            <FileText className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-56 text-center opacity-20">
                                                <div className="flex flex-col items-center gap-8">
                                                    <Binary className="h-24 w-24 text-emerald-950 group-hover:scale-110 transition-transform duration-1000" strokeWidth={1} />
                                                    <p className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.6em] italic">DATABASE REGISTRY NIHIL</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-12 py-10 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between bg-emerald-50/10 gap-8 italic mt-1 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-emerald-950 shadow-lg">
                                    <Database size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Operational Data Registry</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic">Total Entitas Terdeteksi: {activeGroups.length} Unit Kelompok</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-emerald-100 text-[10px] font-black uppercase tracking-[0.5em] italic opacity-50">
                                DISTRIBUTED SYSTEM • VERIFIED DATA
                            </div>
                        </div>
                    </div>

                    {/* SECURITY FOOTER MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                             <div className="space-y-8 flex-1">
                                 <div className="flex items-center gap-8">
                                    <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
                                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Otoritas Distribusi Nilai</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                            Halaman ini berfungsi sebagai terminal pusat penyiapan blanko penilaian kolektif, manajemen ekspor masif (ZIP), 
                                            dan pintu akses cepat ke instrumen koreksi nilai manual untuk kepentingan audit data akademik.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pt-10 border-t border-white/5">
                                    <StatusStat icon={Binary} label="Encryption" value="AES_256_SSL" color="text-emerald-500" />
                                    <StatusStat icon={SearchCheck} label="Data Integrity" value="VERIFIED_DATA" color="text-emerald-500" />
                                    <StatusStat icon={FileBox} label="Export Module" value="ZIP_COMPRESS" color="text-emerald-500" />
                                    <StatusStat icon={Key} label="Access Control" value="ADMIN_AUTHORITY" color="text-emerald-500" />
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">PROTOCOL_STAMP_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL COMMAND CENTER</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatusStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <Icon size={12} className={color} />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic leading-none">{label}</span>
            </div>
            <span className={clsx("text-[10px] font-black italic tracking-widest uppercase", color)}>{value}</span>
        </div>
    );
}
