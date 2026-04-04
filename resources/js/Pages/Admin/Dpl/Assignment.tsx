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

    const assignedCount = groups.filter(g => g.dosen_id).length;
    const progressPercentage = groups.length > 0 ? (assignedCount / groups.length) * 100 : 0;

    return (
        <AppLayout title="Penugasan DPL">
            <Head title="Matriks Penugasan DPL" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Penugasan DPL</h1>
                        <p className="text-sm text-slate-500 mt-1">Delegasikan dosen pembimbing lapangan untuk setiap unit kelompok.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 text-emerald-500 pointer-events-none  transition-transform">
                                <UserPlus className="h-48 w-48" />
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shadow-sm shadow-emerald-600/5">
                                    <UserPlus className="w-5 h-5 shadow-sm" />
                                </div>
                                <h3 className="font-bold text-slate-900 tracking-tight">Input Penugasan Baru</h3>
                            </div>

                            <form onSubmit={submit} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Pilih Kelompok</label>
                                    <select
                                        value={data.group_id}
                                        onChange={(e) => setData('group_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 appearance-none transition-all shadow-sm outline-none"
                                    >
                                        <option value="">-- Pilih Kelompok --</option>
                                        {groups.filter(g => !g.dosen_id).map(g => (
                                            <option key={g.id} value={g.id.toString()}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Pilih Dosen (DPL)</label>
                                    <select
                                        value={data.dosen_id}
                                        onChange={(e) => setData('dosen_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 appearance-none transition-all shadow-sm outline-none"
                                    >
                                        <option value="">-- Pilih Dosen --</option>
                                        {availableDosen.map(d => (
                                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.group_id || !data.dosen_id}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                                >
                                    {processing ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4" /> Simpan Penugasan</>
                                    )}
                                </button>
                            </form>
                        </div>

                         <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-white relative overflow-hidden group/notice shadow-xl shadow-slate-900/10">
                            <div className="absolute top-0 right-0 p-8 text-emerald-500 opacity-5 group-hover/notice:rotate-12 transition-transform">
                                <Zap className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <AlertCircle className="w-8 h-8 text-emerald-500 mb-2 shadow-sm" />
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Informasi</h4>
                                    <p className="text-sm text-slate-400 font-medium italic">
                                        Perubahan penugasan akan secara otomatis memperbarui data di dashboard DPL yang bersangkutan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Matrix Section */}
                    <div className="xl:col-span-8 space-y-8">
                         <div className="bg-white px-8 py-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-50 shadow-sm">
                                            <Briefcase className="w-5 h-5 shadow-sm" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-slate-900  mb-1">Status Penugasan</h4>
                                            <span className="text-sm font-bold text-slate-400 uppercase">{progressPercentage.toFixed(1)}% Unit Terisi</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{assignedCount} / {groups.length} <span className="text-xs font-medium text-slate-400">Unit</span></span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-500/20" 
                                        style={{ width: `${progressPercentage}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="relative group flex-1 w-full max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="search"
                                placeholder="Cari Berdasarkan Nama Kelompok atau DPL..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10"
                            />
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {groups.map((group) => (
                                <div key={group.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group/card hover:border-emerald-300 transition-all duration-300">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 text-primary text-base font-bold flex items-center justify-center italic shadow-lg group-hover/card:scale-105 transition-transform">
                                                    {group.name.replace('Kelompok ', '').slice(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-bold text-slate-900 group-hover/card:text-emerald-600 transition-colors tracking-tighter text-sm mb-1">{group.name}</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{group.location ? `${group.location.kecamatan}` : 'Lokasi Belum Diatur'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 italic">#{group.id}</div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group/officer overflow-hidden transition-all group-hover/card:bg-emerald-50/50 group-hover/card:border-emerald-100/50">
                                            {group.dosen_id ? (
                                                <div className="flex items-center gap-3 relative z-10 transition-all">
                                                    <div className="p-2 bg-white border border-emerald-100 text-emerald-600 rounded-lg shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-emerald-500  mb-1">Dosen Pembimbing</span>
                                                        <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{availableDosen.find(d => d.id === group.dosen_id)?.name || 'Dosen Terdaftar'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 relative z-10 italic group-hover/card:opacity-100 transition-all">
                                                    <div className="p-2 bg-white border border-slate-200 text-slate-300 rounded-lg shadow-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-slate-400  mb-1">Penugasan Kosong</span>
                                                        <span className="text-xs font-bold text-slate-300 italic">BELUM_ADA_DPL_TERDETEKSI</span>
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
