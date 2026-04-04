import { useState } from 'react';
import { useForm, router, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    CloudDownload,
    UserCheck,
    Search,
    RefreshCw,
    Cpu,
    ShieldCheck,
    Zap,
    ShieldAlert,
    ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AvailableDpl {
    id?: number | null;
    nip: string;
    name: string;
    email: string | null;
}

interface Props {
    availableDpls: AvailableDpl[];
    filters: {
        search?: string;
    };
}

export default function DplSync({ availableDpls, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.dpl.sync'), { search }, { preserveState: true });
    };

    const handleSync = (dpl: AvailableDpl) => {
        router.post(route('admin.dpl.sync.store'), {
            master_id: dpl.id,
            nip: dpl.nip,
            name: dpl.name,
            email: dpl.email,
        });
    };

    return (
        <AppLayout title="Aktivasi Personel">
            <Head title="Gerbang Aktivasi DPL" />
            
            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-emerald-600">Gerbang Aktivasi DPL</h1>
                        <p className="text-sm text-slate-500 mt-1">Otorisasi dan aktivasi personel bimbingan KKN dari repositori dosen.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="SEARCH_OFFICER_REPOSITORY (NIP / NAME)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 shadow-sm flex items-center gap-3">
                        <CloudDownload className="w-4 h-4" />
                        {availableDpls.length} Officers Detected
                    </div>
                </form>

                {/* Registry Ledger (Table) */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/5 overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-none">Officer_Manifest_Data</th>
                                    <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-none pr-12">Authorization_Involvement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {availableDpls.map((dpl) => (
                                    <tr key={dpl.nip} className="group/row hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary text-base font-black flex items-center justify-center italic shadow-2xl group-hover/row:scale-110 transition-transform">
                                                    {dpl.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter truncate max-w-[400px] group-hover/row:text-primary transition-colors leading-none mb-2">{dpl.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic opacity-50">NIP: {dpl.nip}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 italic opacity-30 lowercase">[{dpl.email || 'NO_MAIL_CHANNEL'}]</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right pr-12">
                                            <button
                                                onClick={() => handleSync(dpl)}
                                                disabled={processing}
                                                className="group/btn h-12 px-8 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 ml-auto shadow-emerald-900/5 group/btn"
                                            >
                                                <UserCheck className="w-4 h-4 text-emerald-400 group-hover/btn:text-white group-hover/btn:scale-110 transition-transform" />
                                                Activate_Personel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {availableDpls.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20 italic">
                                                <div className="p-10 bg-slate-50 rounded-lg border border-slate-100">
                                                    <CloudDownload className="h-12 w-12 text-slate-900 stroke-[1.5]" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-[0.4em]">NO_OFFICER_RECORDS_DETECTED</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Activation Monitor */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden group shadow-2xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <ShieldAlert className="h-6 w-6 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white italic tracking-widest uppercase leading-none">OFFICER_AUTHORIZATION_V3.2</h4>
                                    <p className="text-[10px] font-bold text-emerald-400 italic mt-2 uppercase">STATUS: ACTIVE_SURVEILLANCE_LINKED</p>
                                </div>
                            </div>
                            <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75 uppercase">
                                Protokol Otorisasi: Aktivasi personel akan memberikan hak akses kontrol penuh terhadap evaluasi akademik unit kelompok yang ditugaskan. Pastikan integritas akun terverifikasi.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
                                <span className="text-[9px] font-black text-slate-100 uppercase italic tracking-widest">PERSONNEL_VETTING_SECURED</span>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                                    <Zap className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
