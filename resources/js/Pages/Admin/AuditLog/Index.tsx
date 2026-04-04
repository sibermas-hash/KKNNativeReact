import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    History,
    Search,
    RefreshCw,
    Filter,
    ArrowRight,
    Eye,
    ShieldCheck,
    AlertCircle,
    User,
    Activity,
    ShieldAlert,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    causer?: { name: string; };
    properties: any;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        meta: any;
    };
    filters: { search?: string };
}

export default function AuditLogIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.audit-logs.index'), { search }, { preserveState: true });
    };

    return (
        <AppLayout title="Jejak Audit">
            <Head title="Ledger Keamanan Sistem" />

            <div className="space-y-8 pb-20">
                 {/* Clean Header */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-emerald-600 font-mono italic">SYSTEM_AUDIT_LEDGER_V3</h1>
                        <p className="text-sm text-slate-500 mt-1 uppercase italic tracking-widest font-black opacity-50">Surveilans permanen terhadap seluruh mutasi entitas data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={() => router.reload()}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            SYNC_RECORDS
                        </button>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <form onSubmit={handleSearch} className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Cari Rekaman Audit (Deskripsi / Aktor / Tipe)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm italic font-bold placeholder:italic placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                    </form>
                    <div className="flex gap-3 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-8 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase italic tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm italic">
                            <Filter className="w-4 h-4" />
                            Set_Filter
                        </button>
                    </div>
                </div>

                {/* Audit Registry List */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden group">
                    <div className="divide-y divide-slate-50 relative z-10">
                        {logs.data.length > 0 ? logs.data.map((log) => (
                            <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group/row">
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary flex items-center justify-center shadow-lg group-hover/row:scale-110 transition-transform italic">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest leading-none bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">SURVEILLANCE_OK</span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest font-mono">ID: #{log.id.toString().padStart(6, '0')}</span>
                                        </div>
                                        <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm leading-none group-hover/row:text-primary transition-colors">{log.description}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase italic">{log.causer?.name || 'SYSTEM_INTERNAL'}</span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest opacity-50">{log.subject_type?.split('\\').pop() || 'UNDEFINED_RESOURCE'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-5">
                                    <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-[0.2em]">{log.created_at}</span>
                                    <Link 
                                        href={route('admin.audit-logs.show', log.id)}
                                        className="h-12 px-6 bg-slate-900 text-primary rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-lg shadow-slate-900/10 flex items-center gap-3 transition-all active:scale-95 group/btn border border-slate-800 hover:bg-emerald-600 hover:text-white"
                                    >
                                        <Eye className="w-4 h-4" />
                                        INSPECT_LOG
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="py-32 text-center opacity-20 italic">
                                <ShieldAlert className="h-16 w-16 mx-auto mb-6 stroke-[1.5]" />
                                <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-[0.4em]">NO_SECURITY_EVENTS_RECORDED</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={logs.meta} />
                </div>
            </div>
        </AppLayout>
    );
}
