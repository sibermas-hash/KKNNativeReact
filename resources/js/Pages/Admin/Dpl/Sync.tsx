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
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gerbang Aktivasi DPL</h1>
                        <p className="text-sm text-slate-500 mt-1">Otorisasi dan aktivasi personel bimbingan dari repositori dosen.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="Cari Identitas (NIP / Nama)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-sm font-semibold tracking-tight text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500 outline-none italic"
                        />
                    </div>
                    <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 shadow-sm flex items-center gap-3">
                        <CloudDownload className="w-4 h-4" />
                        {availableDpls.length} Personel Terdeteksi
                    </div>
                </form>

                {/* Main Table Matrix */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-100 italic font-bold">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Officer_Manifest_Data</th>
                                    <th className="px-8 py-6 text-right text-xs font-bold text-slate-500 uppercase tracking-widest pr-12">Authorization</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {availableDpls.map((dpl) => (
                                    <tr key={dpl.nip} className="group/row hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary text-lg font-black flex items-center justify-center italic shadow-2xl  transition-transform">
                                                    {dpl.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tighter truncate max-w-[450px] group-hover/row:text-emerald-600 transition-colors  mb-2">{dpl.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-50">NIP: {dpl.nip}</span>
                                                        <span className="text-xs font-bold text-slate-300 italic opacity-30 lowercase">[{dpl.email || 'NO_MAIL_CHANNEL'}]</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right pr-12">
                                            <button
                                                onClick={() => handleSync(dpl)}
                                                disabled={processing}
                                                className="group/btn h-12 px-8 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs uppercase italic tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 ml-auto opacity-70 group-hover/row:opacity-100"
                                            >
                                                <UserCheck className="w-4 h-4 text-emerald-400 group-hover/btn:text-white" />
                                                Activate_Personel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {availableDpls.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-8 py-32 text-center opacity-20 italic">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100">
                                                    <ShieldAlert className="h-12 w-12 text-slate-900" />
                                                </div>
                                                <span className="text-xs font-black text-slate-900 uppercase italic tracking-[0.4em]">NO_OFFICER_RECORDS_FOUND</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Governance Section */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 text-center xl:text-left">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 justify-center xl:justify-start">
                                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                                    <ShieldCheck className="h-6 w-6 text-primary shadow-sm" />
                                </div>
                                <h4 className="text-sm font-black text-white italic tracking-widest uppercase ">Authentication_Gateway_V3.2</h4>
                            </div>
                            <p className="text-sm text-slate-500 font-bold  max-w-4xl opacity-75 italic uppercase">
                                Protokol Otorisasi: Aktivasi personel akan memberikan hak akses kontrol penuh terhadap evaluasi akademik unit kelompok yang ditugaskan. Pastikan integritas akun terverifikasi melalui jalur internal.
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center xl:justify-end">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-emerald-500 text-xs font-bold">
                                ACCESS_FEDERATION_OK
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
