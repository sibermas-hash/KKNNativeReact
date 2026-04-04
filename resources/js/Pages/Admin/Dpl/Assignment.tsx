import { useState } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    UserPlus,
    X,
    CheckCircle2,
    Briefcase,
    ShieldCheck,
    Dna,
    Zap,
    MapPin,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Dosen {
    id: number;
    nip: string;
    name: string;
}

interface Group {
    id: number;
    name: string;
    dosen_id: number | null;
    location?: {
        kecamatan: string;
        kabupaten: string;
    };
}

interface Props {
    groups: Group[];
    availableDosen: Dosen[];
    filters: { search?: string };
}

export default function DplAssignment({ groups, availableDosen, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { data, setData, post, processing, reset } = useForm({
        group_id: '',
        dosen_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.dpl.assignment'), { search }, { preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.dpl.assignment.store'), {
            onSuccess: () => reset(),
        });
    };

    // Calculate completion: groups that have a DPL assigned
    const assignedCount = groups.filter(g => g.dosen_id).length;
    const progressPercentage = groups.length > 0 ? (assignedCount / groups.length) * 100 : 0;

    return (
        <AppLayout title="Penugasan DPL">
            <Head title="Matriks Penugasan DPL" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Matriks Penugasan DPL</h1>
                        <p className="text-sm text-slate-500 mt-1">Delegasi tanggung jawab bimbingan lapangan ke personel dosen.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Form Assignment - Side Column */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-600/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-emerald-400 opacity-[0.03] rotate-12 transition-transform duration-1000">
                                <Dna className="w-48 h-48" />
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                                    <UserPlus className="w-5 h-5 shadow-sm shadow-emerald-600/20" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-slate-900 leading-none mb-1.5 uppercase tracking-widest text-[11px]">Deploy Personal</h3>
                                    <span className="text-[9px] font-bold text-emerald-500 italic opacity-50 uppercase tracking-widest leading-none">Status: Ready_Injection</span>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target_Unit</label>
                                    <select
                                        value={data.group_id}
                                        onChange={(e) => setData('group_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 appearance-none transition-all shadow-sm shadow-slate-100/10 text-slate-700"
                                    >
                                        <option value="">SELECT_UNIT_DESTINATION</option>
                                        {groups.filter(g => !g.dosen_id).map(g => (
                                            <option key={g.id} value={g.id.toString()}>{g.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Officer_Candidate</label>
                                    <select
                                        value={data.dosen_id}
                                        onChange={(e) => setData('dosen_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 appearance-none transition-all shadow-sm shadow-slate-100/10 text-slate-700"
                                    >
                                        <option value="">SELECT_DPL_OFFICER</option>
                                        {availableDosen.map(d => (
                                            <option key={d.id} value={d.id.toString()}>{d.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.group_id || !data.dosen_id}
                                    className="w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold uppercase italic tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-900/40 relative active:scale-95 group/btn transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-600"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover/btn:text-white" />
                                        Finalize_Assignment
                                    </span>
                                </button>
                            </form>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 relative overflow-hidden group/footer shadow-lg shadow-slate-900/10">
                            <div className="absolute top-0 right-0 p-8 text-emerald-500 opacity-5 group-hover/footer:rotate-12 transition-transform duration-1000">
                                <ShieldCheck className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <Zap className="w-10 h-10 text-emerald-500 mb-2 shadow-[0_0_15px_rgba(16,168,83,0.3)]" />
                                <div>
                                    <h4 className="text-[11px] font-bold text-white uppercase italic tracking-widest leading-none mb-2">Protocol_Authority</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed opacity-75">
                                        Delegasi tugas ini bersifat mutlak dan memicu pembaruan otentikasi pada gerbang dashboard personel DPL.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Matrix List - Main Column */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Summary Progress */}
                        <div className="bg-white px-10 py-8 rounded-xl border border-slate-100 shadow-xl shadow-slate-100/5 flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-emerald-600 border border-emerald-50 shadow-sm">
                                            <Briefcase className="w-5 h-5 shadow-sm shadow-emerald-500/20" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest leading-none mb-1.5">Penugasan Terverifikasi</h4>
                                            <span className="text-[9px] font-bold text-emerald-500 italic opacity-50 uppercase tracking-widest leading-none block">Status: {progressPercentage.toFixed(1)}% Completed</span>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold italic text-slate-900">{assignedCount} / {groups.length} <span className="text-[10px] uppercase tracking-widest text-slate-300">Unit</span></span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,168,83,0.3)]" 
                                        style={{ width: `${progressPercentage}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Toolbar */}
                        <form onSubmit={handleSearch} className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors z-10" />
                            <input
                                placeholder="SEARCH_UNIT_OR_OFFICER_MANIFEST..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-black italic uppercase tracking-[0.25em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500"
                            />
                        </form>

                        {/* Tactical Matrix Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map((group) => (
                                <div key={group.id} className="bg-white rounded-lg border border-slate-100 shadow-lg shadow-slate-100/5 overflow-hidden group/card hover:border-emerald-300 transition-all duration-500">
                                    <div className="p-8 space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary text-base font-black flex items-center justify-center italic shadow-2xl group-hover/card:scale-110 transition-transform">
                                                    {group.name.slice(-2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-bold text-slate-900 group-hover/card:text-emerald-600 transition-colors uppercase italic tracking-tighter text-sm leading-none mb-2">{group.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest truncate max-w-[150px]">{group.location ? `${group.location.kecamatan}` : 'UNDEFINED_LOCATION'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest mb-1.5">ID_REF</span>
                                                <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 font-mono italic">#{group.id.toString().padStart(4, '0')}</span>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group/officer overflow-hidden transition-all group-hover/card:bg-emerald-50/30 group-hover/card:border-emerald-100">
                                            {group.dosen_id ? (
                                                <div className="flex items-center gap-4 relative z-10 transition-all group-hover/card:translate-x-1">
                                                    <div className="p-2.5 bg-white border border-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                                                        <ShieldCheck className="w-4 h-4 shadow-sm shadow-emerald-500/20" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[9px] font-black text-emerald-500 italic uppercase tracking-widest leading-none mb-1.5 opacity-50">Assigned_Officer</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase italic tracking-tighter leading-none truncate max-w-[200px]">{availableDosen.find(d => d.id === group.dosen_id)?.name || 'ACTIVE_ACCOUNT'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 relative z-10 opacity-40 italic grayscale group-hover/card:opacity-100 group-hover/card:grayscale-0 transition-all group-hover/card:translate-x-1">
                                                    <div className="p-2.5 bg-white border border-rose-100 text-rose-500 rounded-xl shadow-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-rose-500 italic uppercase tracking-widest leading-none mb-1.5">No_Officer_Deployment</span>
                                                        <span className="text-xs font-black text-slate-400 uppercase italic tracking-tighter leading-none">WAITING_FOR_ASSIGNMENT_SIGNAL</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
