import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    History,
    Search,
    Filter,
    Eye,
    ShieldCheck,
    User,
    Activity,
    ShieldAlert,
    ArrowRight,
    Fingerprint,
    Database,
    Clock,
    Zap,
    Shield,
    Terminal,
    ChevronRight,
    SearchCheck,
    Network,
    Binary
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    causer?: { name: string; };
    properties: Record<string, unknown>;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
}

export default function AuditLogIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.audit-log.index'), { search }, { preserveState: true });
    };

    return (
        <AppLayout title="Audit Pelacakan Sistem">
            <Head title="Buku Besar Audit | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL: PUSAT PEMANTAUAN AUDIT */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Core Audit Monitoring System</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            CENTRAL <span className="text-emerald-500">AUDIT REGISTRY</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <ShieldAlert size={12} className="text-emerald-500" />
                             Pemantauan komprehensif seluruh aktivitas personel, mutasi data, dan interaksi sistem inti secara permanen.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                         <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20 text-right">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">AUDIT ENTITIES</span>
                               <div className="flex items-center gap-3">
                                   <History size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{logs.meta.total} LOGS</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* OPERATIONS TOOLBAR TACTICAL */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="absolute inset-0 bg-emerald-50/10 -skew-x-12 translate-x-full group-hover:translate-x-3/4 transition-transform duration-1000" />
                        
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Filter size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Audit Search Instrument</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Otoritas Penelusuran Jejak Digital</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                                TRACEABLE PARAMETER
                            </div>
                        </div>

                        <div className="p-10 relative z-10 flex flex-col md:flex-row items-end gap-10">
                            <form onSubmit={handleSearch} className="flex-1 w-full space-y-3">
                                <label className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.2em] italic ml-1">Kueri Deskripsi / Aktor / Tipe Subjek</label>
                                <div className="relative group/search">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-focus-within/search:text-emerald-500 transition-colors" />
                                    <input
                                        type="search"
                                        placeholder="CARI JEJAK AKTIVITAS..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-16 border border-emerald-50 bg-emerald-50/10 pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 outline-none transition focus:border-emerald-500 focus:bg-white shadow-inner"
                                    />
                                </div>
                            </form>
                            
                            <button
                                onClick={handleSearch}
                                className="h-16 px-12 bg-emerald-950 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.4em] italic transition-all active:scale-95 flex items-center justify-center gap-4 group/btn shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                            >
                                EKSEKUSI PENCARIAN
                                <Zap size={16} className="group-hover/btn:animate-pulse" />
                            </button>
                        </div>
                    </section>

                    {/* TACTICAL AUDIT LEDGER */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                         <div className="absolute right-0 top-0 h-full w-1/4 bg-emerald-50/5 skew-x-12 translate-x-20 pointer-events-none" />
                        
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Activity size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">System Activity Ledger</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Registry Log Keluar Masuk Data Transaksional</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase italic tracking-widest shadow-xl tabular-nums">
                                {logs.meta.total} ENTRI TERLOG
                            </div>
                        </div>

                        <div className="divide-y divide-emerald-50 relative z-10">
                            {logs.data.length > 0 ? logs.data.map((log) => (
                                <div key={log.id} className="p-10 hover:bg-emerald-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-10 group/row">
                                    <div className="flex items-start gap-8">
                                        <div className="h-16 w-16 bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800 shadow-2xl group-hover/row:bg-emerald-600 transition-all duration-500 italic font-black">
                                            <History size={24} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 border border-emerald-100 italic">
                                                    PROTOCOL_AUDIT_LOG
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-200 tabular-nums uppercase italic">
                                                    ID. #{log.id.toString().padStart(6, '0')}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight italic group-hover/row:text-emerald-600 transition-colors leading-tight">
                                                {log.description.toUpperCase()}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-8 italic">
                                                <div className="flex items-center gap-3">
                                                    <User size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AKTOR:</span>
                                                    <span className="text-[11px] font-black text-emerald-950 uppercase">{log.causer?.name || 'SISTEM INTI'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Network size={14} className="text-emerald-200" />
                                                    <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">SUBJEK:</span>
                                                    <span className="text-[11px] font-black text-emerald-900 uppercase">{log.subject_type?.split('\\').pop() || 'AKTIVITAS'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-6">
                                        <div className="bg-emerald-50 px-6 py-2.5 border border-emerald-100 shadow-sm italic">
                                            <div className="flex items-center gap-3">
                                                <Clock size={12} className="text-emerald-400" />
                                                <span className="text-[11px] font-black text-emerald-950 tabular-nums uppercase tracking-widest group-hover/row:scale-105 transition-transform">
                                                    {log.created_at.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                            <Link 
                                                href={route('admin.audit-log.show', log.id)}
                                                className="h-14 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 flex items-center gap-5 group/btn"
                                            >
                                                INSPEKSI DETAIL
                                                <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform shadow-xl" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-48 text-center bg-emerald-50/5">
                                    <div className="flex flex-col items-center gap-8 opacity-20">
                                        <ShieldAlert size={80} strokeWidth={1} className="text-emerald-950" />
                                        <span className="text-[14px] font-black uppercase tracking-[0.6em] italic text-emerald-950">DATABASE AUDIT NIHIL</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-emerald-50/10 p-12 border-t border-emerald-50 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 italic">
                             <div className="flex items-center gap-6">
                                <div className="p-3 bg-emerald-950 shadow-lg italic">
                                    <Database size={16} className="text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em]">Buku Besar Audit Feed</span>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest font-black italic leading-none">Total Registry: {logs.meta.total} Entitas Terpeta</p>
                                </div>
                            </div>
                            <Pagination meta={logs.meta} />
                        </div>
                    </section>

                    {/* SECURITY FOOTER MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                             <div className="space-y-8 flex-1">
                                 <div className="flex items-center gap-8">
                                    <div className="p-6 bg-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700 font-black">
                                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Otoritas Integritas Audit</h4>
                                        <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-4xl">
                                            Seluruh jejak audit dienkripsi dan dipermanenkan dalam database registry terpusat. 
                                            Sesuai protokol keamanan POS-KKN, rekaman ini berfungsi sebagai rantai bukti tak terbantahkan untuk memantau integritas data operasional universitas dan akuntabilitas personel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-4">
                                     <Fingerprint className="w-6 h-6" />
                                     <span className="text-xl tracking-tighter italic">AUDIT_VERIFIED_STAMP_V4_{new Date().getFullYear()}</span>
                                 </div>
                                 <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL AUDIT COMMAND</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
