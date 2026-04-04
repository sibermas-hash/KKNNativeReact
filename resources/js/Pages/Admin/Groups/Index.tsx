import { useState } from 'react';
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
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface Group {
    id: number;
    name: string;
    posko_name: string | null;
    location?: {
        name: string;
        kecamatan: string;
        kabupaten: string;
    };
    members_count: number;
    dosen?: {
        name: string;
    };
}

interface Props {
    groups: {
        data: Group[];
        meta: any;
    };
    filters: { search?: string };
}

export default function GroupsIndex({ groups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.groups.index'), { search }, { preserveState: true });
    };

    return (
        <AppLayout title="Kelompok KKN">
            <Head title="Manajemen Kelompok" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Direktori Kelompok</h1>
                        <p className="text-sm text-slate-500 mt-1">Pantau dan kelola seluruh unit kelompok KKN operasional.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">
                                {groups.meta?.total || 0} Unit Terdaftar
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <form onSubmit={handleSearch} className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Cari Identitas Kelompok, Lokasi, atau DPL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm"
                        />
                    </form>

                    <div className="flex gap-3 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                            <Filter className="w-4 h-4" />
                            Filter Data
                        </button>
                    </div>
                </div>

                {/* Grid Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.data.map((group) => (
                        <div key={group.id} className="bg-white rounded-lg border border-slate-100 overflow-hidden hover:border-emerald-300 transition-all group shadow-sm hover:shadow-xl hover:shadow-emerald-900/5">
                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 font-bold italic shadow-lg">
                                            {group.name.replace('Kelompok ', '').slice(0, 3)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight line-clamp-1">{group.name}</h3>
                                            <p className="text-[11px] font-semibold text-slate-400 tracking-wider">UNIT_REF: #{group.id.toString().padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href={route('admin.groups.show', group.id)}
                                        className="p-2 bg-slate-50 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:text-emerald-600 transition-colors">
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="truncate">{group.location ? `${group.location.kecamatan}, ${group.location.kabupaten}` : 'LOKASI_BELUM_SET'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:text-emerald-600 transition-colors">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{group.members_count} Personel Terdaftar</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Penanggung Jawab</span>
                                        <span className="text-xs font-bold text-slate-700">{group.dosen?.name || 'BELUM_DITETAPKAN'}</span>
                                    </div>
                                    <Link 
                                        href={route('admin.groups.show', group.id)}
                                        className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {groups.data.length === 0 && (
                    <div className="py-24 text-center bg-white rounded-lg border border-slate-100 italic">
                        <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="font-bold text-slate-900 opacity-20 tracking-widest">DATA_KELOMPOK_EMPTY</p>
                    </div>
                )}

                <div className="mt-8">
                    <Pagination meta={groups.meta} />
                </div>
            </div>
        </AppLayout>
    );
}
