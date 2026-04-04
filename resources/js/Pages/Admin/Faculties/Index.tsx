import { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { School, Search, Building2 } from 'lucide-react';

interface FacultyWithCount {
    id: number;
    code: string;
    name: string;
    programs_count: number;
}

interface Props extends PageProps {
    faculties: {
        data: FacultyWithCount[];
        links: unknown[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
    syncInfo: {
        mode: 'sync-only';
        source: string;
        last_synced_at?: string | null;
    };
}

export default function FacultiesIndex({ faculties, filters, syncInfo }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/faculties', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search]);

    return (
        <AppLayout title="Manajemen Fakultas">
            <Head title="Manajemen Fakultas" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-slate-900">Direktori Fakultas</h1>
                    <span className="text-sm text-slate-500">Sumber: {syncInfo.source}</span>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Cari fakultas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">Kode</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">Nama Fakultas</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-600">Jumlah Prodi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {faculties.data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        Tidak ada data fakultas
                                    </td>
                                </tr>
                            ) : (
                                faculties.data.map((f) => (
                                    <tr key={f.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-semibold text-slate-700">{f.code}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-semibold text-slate-700">{f.programs_count}</span>
                                            <span className="text-xs text-slate-400 ml-1">prodi</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {faculties.meta && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                            <Pagination meta={faculties.meta} />
                        </div>
                    )}
                </div>

                {syncInfo.last_synced_at && (
                    <p className="text-xs text-slate-400">Terakhir sinkronisasi: {syncInfo.last_synced_at}</p>
                )}
            </div>
        </AppLayout>
    );
}
