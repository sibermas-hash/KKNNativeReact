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
    Archive
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
        <AppLayout title="Valuation Deployment Center">
            <Head title="Generator Nilai" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">VALUATION_CORE_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Cpu className="w-10 h-10 text-emerald-600" />
                            GENERATOR <span className="text-emerald-600">NILAI</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Otorisasi massal rekonsiliasi nilai, deployment blanko penilaian, dan audit integritas grade unit operasional.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Active Units</span>
                                <div className="flex items-center gap-3">
                                    <Archive className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{activeGroups.length} GROUPS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full lg:max-w-4xl flex flex-col sm:flex-row gap-6">
                        <div className="relative group flex-1 px-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 shadow-sm focus-within:border-emerald-500 focus-within:ring-8 focus-within:ring-emerald-500/5 transition-all">
                            <Filter className="w-5 h-5 text-emerald-600" />
                            <div className="flex-1 flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">Operational_Period_Channel</span>
                                <select 
                                    value={selectedPeriodId}
                                    onChange={(event) => setSelectedPeriodId(event.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-black italic text-slate-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                >
                                    <option value="">ALL_CHANNELS</option>
                                    {periods.map((period) => (
                                        <option key={period.id} value={period.id}>
                                            {period.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-10 w-px bg-slate-100" />
                            <Zap className="w-5 h-5 text-slate-200" />
                        </div>

                        <a
                            href={selectedPeriodId ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}` : '/admin/generator-nilai/export-zip'}
                            className="h-20 px-10 bg-slate-950 text-white rounded-[2rem] flex items-center gap-6 group hover:bg-emerald-600 transition-all shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                            <FileBox className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col relative z-10 text-left">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Bulk Archive</span>
                                <span className="text-sm font-black italic tracking-tighter leading-none whitespace-nowrap">EXTRACT_ZIP_BUNDLE</span>
                            </div>
                        </a>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] italic opacity-50">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        CORE_GEN_READY
                    </div>
                </div>

                {/* Tactical Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL_UNIT_CODE</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">LOKASI_GEO_ZONE</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">TACTICAL_COMMANDER_(DPL)</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">COMMAND_DECK</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeGroups.length > 0 ? (
                                    activeGroups.map((group, idx) => (
                                        <motion.tr 
                                            key={group.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                        >
                                            <td className="px-12 py-8 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors">{group.name}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">HASH_CODE: {group.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-4">
                                                    <Navigation className="w-4 h-4 text-emerald-500" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{group.desa}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{group.kecamatan}, {group.kabupaten}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-emerald-500 font-black italic shadow-lg group-hover:scale-110 transition-transform">
                                                        {group.dpl?.charAt(0) || '-'}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-emerald-700 transition-colors">{group.dpl || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <Link
                                                        href={`/admin/grades?group_id=${group.id}`}
                                                        className="h-12 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic text-slate-900 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                        INPUT_VAL
                                                    </Link>
                                                    <a
                                                        href={`/admin/generator-nilai/${group.id}/export`}
                                                        className="h-12 w-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                        title="Download Excel"
                                                    >
                                                        <FileSpreadsheet className="w-5 h-5" />
                                                    </a>
                                                    <a
                                                        href={`/admin/generator-nilai/${group.id}/export-pdf`}
                                                        className="h-12 w-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                        title="Download PDF"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20">
                                                <Binary className="h-20 w-20 text-slate-300" />
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">SYSTEM_INFO: NO_ACTIVE_UNITS_IN_FILTER</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Footer Stamp */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase leading-none">Valuation_Matrix_Deployment_Core_V4</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Generator nilai merupakan terminal akhir pemrosesan grade akademik KKN. Seluruh deployment blanko disinkronisasi dengan master registry untuk menjamin konsistensi evaluasi unit operasional.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             VALUATION_PROTOCOL • {new Date().getFullYear()}
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-10 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">
                         <div className="flex items-center gap-3">
                             <SearchCheck className="w-4 h-4 text-emerald-600" />
                             VALUATION_INTEGRITY_CHECK_OK
                         </div>
                         <div className="flex items-center gap-3">
                             ENCRYPTED_STATE_AUTHORITY
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
