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
            <Head title="Audit Log Ledger" />

            <div className="space-y-8 pb-20">
                 {/* Simple Clean Header */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jejak Audit Sistem</h1>
                        <p className="text-sm text-slate-500 mt-1">Pemantauan mutasi data dan aktivitas operasional seluruh personel.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <form onSubmit={handleSearch} className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Cari Rekaman (Deskripsi / Aktor / Tipe)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10 italic font-bold"
                        />
                    </form>
                    <div className="flex gap-3 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm italic">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            Filter Data
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="divide-y divide-slate-100 relative z-10 italic">
                        {logs.data.length > 0 ? logs.data.map((log) => (
                            <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group/row">
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary flex items-center justify-center shadow-lg group-hover/row:scale-110 transition-transform italic text-lg font-black">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded leading-none">Security_OK</span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">ID: #{log.id.toString().padStart(6, '0')}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 tracking-tighter text-sm leading-none group-hover/row:text-emerald-600 transition-colors uppercase italic">{log.description}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{log.causer?.name || 'SYSTEM_INTERNAL'}</span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50 truncate max-w-[150px]">{log.subject_type?.split('\\').pop() || 'UNDEFINED_RESOURCE'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-5">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">{log.created_at}</span>
                                    <Link 
                                        href={route('admin.audit-logs.show', log.id)}
                                        className="h-10 px-6 bg-slate-900 text-primary border border-slate-800 rounded-xl font-bold uppercase italic tracking-widest text-[9px] shadow-lg shadow-slate-900/10 flex items-center gap-3 transition-all active:scale-95 group/btn hover:bg-emerald-600 hover:text-white"
                                    >
                                        <Eye className="w-4 h-4 shadow-sm" />
                                        Inspect_Log
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="py-32 text-center opacity-20 italic">
                                <ShieldAlert className="h-16 w-16 mx-auto mb-6 text-slate-900 stroke-[1.5]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em]">NO_DATA_TRAFFIC_DETECTED</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={logs.meta} />
                </div>

                {/* Footer Governance Info */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="space-y-3">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                <h4 className="text-sm font-bold text-white uppercase italic tracking-widest">Permanent Surveillance Protocol</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-4xl opacity-75 italic uppercase">
                                Seluruh rekaman audit bersifat permanen dan tidak dapat dimodifikasi. Ledger ini berfungsi sebagai basis kedaulatan data dan integritas operasional universitas.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-emerald-500 text-[10px] font-bold">
                                DATA_INTEGRITY_SECURED
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
