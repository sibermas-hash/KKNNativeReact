import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge } from '@/Components/ui';
import { route } from 'ziggy-js';
import {
    CloudArrowDownIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon
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
        });
    };

    return (
        <AppLayout title={title}>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Delegasi DPL</h1>
                        <p className="text-slate-500 font-medium mt-1">Tarik data dosen dari API Master untuk dijadikan DPL KKN.</p>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full max-w-md relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari NIP atau Nama Dosen..."
                            className="w-full pl-12 pr-4 h-14 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary/10 transition-all font-semibold text-slate-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <Button
                        variant="secondary"
                        onClick={() => router.reload()}
                        className="h-14 px-8 rounded-2xl flex items-center gap-2"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Refresh Data API
                    </Button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Dosen</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit / Organisasi</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {availableDosen.length > 0 ? (
                                    availableDosen.map((dosen) => (
                                        <tr key={dosen.nip} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{dosen.name}</span>
                                                    <span className="text-xs font-medium text-slate-500 tracking-tight">NIP. {dosen.nip}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="default" className="font-bold uppercase tracking-tighter text-[10px]">
                                                    {dosen.organization_name || 'UMUM'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button
                                                    onClick={() => handleSync(dosen)}
                                                    className="rounded-xl px-5 py-2.5 flex items-center gap-2 ml-auto"
                                                    disabled={processing}
                                                >
                                                    <UserPlusIcon className="w-4 h-4" />
                                                    Jadikan DPL
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <CloudArrowDownIcon className="w-12 h-12 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-slate-900">Tidak ada dosen baru ditemukan</p>
                                                    <p className="text-sm text-slate-500 font-medium font-medium">Semua dosen dari API mungkin sudah terdaftar atau tidak sesuai pencarian.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Note */}
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <p className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                        💡 Catatan Penting
                    </p>
                    <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">
                        Dosen yang Anda pilih akan otomatis dibuatkan akun sistem dengan username <span className="font-bold">NIP</span> dan password default <span className="font-bold">password123</span>. Mereka diwajibkan mengganti password pada saat pertama kali login.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
