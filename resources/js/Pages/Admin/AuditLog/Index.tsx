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
} from 'lucide-react';
import { Pagination } from '@/Components/ui';
import { PaginationMeta } from '@/Components/ui/Pagination';

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
        <AppLayout title="Jejak Audit">
            <Head title="Buku Besar Audit" />

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
                            placeholder="Cari log (deskripsi, aktor, atau tipe)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-sm font-medium"
                        />
                    </form>
                    <div className="flex gap-3 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            Filter Lanjutan
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {logs.data.length > 0 ? logs.data.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group/row">
                                <div className="flex items-start gap-5">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Security Log</span>
                                            <span className="text-[10px] font-medium text-slate-400">#{log.id.toString().padStart(6, '0')}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm group-hover/row:text-emerald-600 transition-colors">{log.description}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-semibold text-slate-500">{log.causer?.name || 'Sistem'}</span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-400">{log.subject_type?.split('\\').pop() || 'Aktivitas'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end gap-4">
                                    <span className="text-[11px] font-medium text-slate-400">{log.created_at}</span>
                                    <Link 
                                        href={route('admin.audit-log.show', log.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Buka Detail
                                    </Link>
                                </div>
                            </div>
                        ))
 : (
                            <div className="py-32 text-center italic">
                                <ShieldAlert className="h-16 w-16 mx-auto mb-6 text-emerald-900" />
                                <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">TIDAK ADA DATA TERDETEKSI</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={logs.meta} />
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <h4 className="text-sm font-bold text-slate-900">Integritas Data Terjamin</h4>
                            </div>
                            <p className="text-sm text-slate-500 font-medium max-w-4xl">
                                Seluruh rekaman audit bersifat permanen dan tidak dapat dimodifikasi untuk menjamin akuntabilitas operasional sistem KKN UIN SAIZU.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
