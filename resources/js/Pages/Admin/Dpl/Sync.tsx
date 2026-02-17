import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge } from '@/Components/ui';
import { route } from 'ziggy-js';
import {
    CloudArrowDownIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface AvailableDosen {
    nip: string;
    name: string;
    email: string | null;
    organization_id: number | null;
    organization_name: string | null;
}

interface Props {
    availableDosen: AvailableDosen[];
    filters: {
        search?: string;
    };
    title: string;
}

export default function DplSync({ availableDosen, filters, title }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.dpl.sync'), { search }, { preserveState: true });
    };

    const handleSync = (dosen: AvailableDosen) => {
        router.post(route('admin.dpl.sync.store'), {
            nip: dosen.nip,
            name: dosen.name,
            email: dosen.email,
            organization_id: dosen.organization_id,
            birth_date: (dosen as any).birth_date,
            gender: (dosen as any).gender,
        });
    };

    return (
        <AppLayout title="Command Officer Commissioning">
            <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">OFFICER DEPLOYMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Command <span className="text-accent-gold text-glow-gold">Officer</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Commissioning faculty members as Field Command Officers (DPL).</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6">
                        <CpuChipIcon className="h-6 w-6 text-accent-gold" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">MAINFRAME BRIDGE</span>
                            <span className="text-[9px] font-bold text-primary-light mt-1 tracking-widest uppercase">ACTIVE POOL SCANNING</span>
                        </div>
                    </div>
                </div>

                {/* Tactical Controls */}
                <div className="flex flex-col md:flex-row gap-6 p-4 glass rounded-[2.5rem] border-white/5 shadow-2xl backdrop-blur-md">
                    <form onSubmit={handleSearch} className="flex-1 relative group">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            type="text"
                            placeholder="SCAN MAINFRAME FOR NIP OR OFFICER NAME..."
                            className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white outline-none focus:border-accent-gold/50 shadow-2xl transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <button
                        onClick={() => router.reload()}
                        className="h-16 px-10 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center gap-4 italic"
                    >
                        <ArrowPathIcon className="w-5 h-5 group-hover:rotate-180 duration-1000" />
                        Refresh API Pool
                    </button>
                </div>

                {/* Commissioning Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                        <ShieldCheckIcon className="h-64 w-64" />
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Candidate Identity</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30 text-center">Unit Designation</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {availableDosen.length > 0 ? (
                                    availableDosen.map((dosen) => (
                                        <tr key={dosen.nip} className="group hover:bg-white/[0.04] transition-all duration-300">
                                            <td className="px-10 py-10">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{dosen.name}</span>
                                                    <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase mt-2">NIP // {dosen.nip}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="inline-flex px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary-light text-[9px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md">
                                                    {dosen.organization_name || 'GENERAL CORE'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <button
                                                    onClick={() => handleSync(dosen)}
                                                    className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 italic disabled:opacity-50"
                                                    disabled={processing}
                                                >
                                                    <UserPlusIcon className="w-5 h-5 text-accent-gold" />
                                                    Commission Officer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-2xl">
                                                    <CloudArrowDownIcon className="w-16 h-16 text-white/5" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-white tracking-widest uppercase italic">No Candidates Located</p>
                                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">STREAMS ARE CLEAR OR NO MATCHES DETECTED IN ACTIVE POOL SCAN.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Strategic Intel */}
                <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <InformationCircleIcon className="h-24 w-24" />
                    </div>
                    <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        Officer Genesis Protocol
                    </h4>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8 max-w-4xl">
                        COMMISSIONED OFFICERS WILL RECEIVE SYSTEM IDENTITY TOKENS. USERNAME: <span className="text-white">NIP</span>.
                        ACCESS KEY: <span className="text-white italic">DDMMYYYY</span> (BIRTH DATE VECTOR).
                        FALLBACK KEY: <span className="text-white">password123</span>.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
