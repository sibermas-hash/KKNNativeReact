import { useState, useEffect } from 'react';
import { useForm, router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    MapPin,
    Calendar,
    ChevronRight,
    ArrowRight,
    Filter,
    ShieldCheck,
    Layers,
    Activity,
    Database,
    Zap,
    Flag,
    UserCheck,
    Navigation,
    Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Badge } from '@/Components/ui';
import { PaginationMeta } from '@/Components/ui/Pagination';
import { motion } from 'framer-motion';

interface Group {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    period?: { id: number; name: string };
    location?: { id: number; village_name: string; full_name: string };
    dosen?: { id: number; name: string }; // Standardized to 'dosen' based on view_file output
}

interface Props {
    groups: {
        data: Group[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
}

export default function GroupsIndex({ groups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/kelompok', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout title="Direktori Kelompok Taktis">
            <Head title="Kelompok KKN" />

            <div className="space-y-8 pb-24">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <Layers className="w-8 h-8 text-emerald-600" />
                            DEPLOYMENT <span className="text-emerald-600">GROUPS</span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active Unit Tactical Registry
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 shadow-inner group overflow-hidden relative">
                             <div className="absolute inset-0 bg-emerald-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                             <Users className="w-5 h-5 text-emerald-600 relative z-10" />
                             <div className="flex flex-col relative z-10">
                                 <span className="text-xl font-black text-slate-900 italic leading-none">{groups.meta?.total || 0}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Units</span>
                             </div>
                         </div>
                         <button className="h-16 w-16 bg-slate-900 text-white hover:bg-emerald-600 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 group">
                             <Zap className="w-5 h-5 group-hover:fill-white transition-all" />
                         </button>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="relative group flex-1 w-full max-w-3xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="SEARCH_BY_CODE_OR_LOCATION..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10 font-medium"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-4 italic shadow-sm">
                            <Filter className="w-4 h-4" />
                            DATA_SEQUENCE
                        </button>
                    </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groups.data.map((group, idx) => (
                        <motion.div 
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:border-emerald-500 transition-all group shadow-sm hover:shadow-2xl hover:-translate-y-2 relative"
                        >
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <Flag size={120} className="-rotate-12" />
                            </div>

                            <div className="p-8 space-y-8 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-950 flex items-center justify-center text-emerald-500 font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                            {group.name.replace('Kelompok ', '').charAt(0) || group.code.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight text-lg uppercase italic">{group.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">UNIT_HASH: #{group.code || group.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link 
                                        href={`/admin/kelompok/${group.id}`}
                                        className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center active:scale-90"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-emerald-100 min-h-[72px]">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500 mt-1">
                                            <Navigation size={14} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Deployed Location</span>
                                            <span className="text-xs font-bold text-slate-700 truncate italic">{group.location ? group.location.full_name : 'GEO_TARGET_UNDEFINED'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-emerald-100">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                                            <Globe size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Period Scope</span>
                                            <span className="text-xs font-bold text-slate-700 italic">{group.period?.name || 'TEMPORAL_ERROR'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-end justify-between gap-4">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 italic">
                                            <UserCheck className="w-3 h-3 text-emerald-500" />
                                            LEAD_SUPERVISOR
                                        </span>
                                        <span className="text-sm font-black text-slate-900 truncate italic uppercase group-hover:text-emerald-700 transition-colors">{group.dosen?.name || 'SUPERVISOR_UNASSIGNED'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">CAPACITY</span>
                                        <Badge variant="success" className="px-3 py-1 font-black text-[10px] italic bg-slate-950 text-emerald-500 border-none shadow-lg">
                                            {group.registrations_count} / {group.capacity}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {groups.data.length === 0 && (
                    <div className="py-40 text-center relative overflow-hidden bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed">
                        <Database className="h-24 w-24 text-slate-200 mx-auto mb-8 animate-pulse" />
                        <h4 className="text-lg font-black text-slate-400 uppercase tracking-[0.3em] italic">No active unit deployments found</h4>
                        <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-widest tracking-widest italic">Database integrity check: Cleared</p>
                    </div>
                )}

                {/* Tactical Pagination */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                     <div className="flex items-center gap-4 text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em] italic opacity-50">
                         <Activity className="w-4 h-4 text-emerald-500" />
                         Real-time Sync Operations Active
                     </div>
                     <Pagination meta={groups.meta} />
                </div>

                {/* Tactical Footer */}
                <div className="p-8 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-3xl flex flex-col md:flex-row md:items-center justify-between gap-8 group relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
                     <div className="flex items-center gap-6 relative z-10">
                         <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                             <Database className="h-8 w-8 text-emerald-500" />
                         </div>
                         <div className="space-y-1">
                             <h4 className="text-sm font-black text-white uppercase tracking-widest italic">GROUP_DEPLOYMENT_REGISTRY</h4>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Systematic organization of cross-functional volunteer units. <br/><span className="text-emerald-500 italic">Integrity Verification: PASS</span></p>
                         </div>
                     </div>
                     <div className="flex items-center gap-6 text-slate-700 relative z-10">
                         <ShieldCheck size={28} className="hover:text-emerald-500 transition-colors" />
                         <ArrowRight size={28} className="hover:text-emerald-500 transition-colors" />
                     </div>
                </div>
            </div>
        </AppLayout>
    );
}
