import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { Calendar, Search, Plus, Trash2, Power, PowerOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AcademicYear {
    id: number;
    year: string;
    is_active: boolean;
}

interface PaginationPayload<T> {
    data: T[];
    meta?: PaginationMeta;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
    links?: PaginationMeta['links'];
}

interface Props {
    academicYears: PaginationPayload<AcademicYear>;
    filters: { search?: string };
}

function resolvePaginationMeta(payload: PaginationPayload<unknown>): PaginationMeta | null {
    if (payload.meta) return payload.meta;
    if (typeof payload.last_page === 'number' && Array.isArray(payload.links)) {
        return {
            current_page: payload.current_page ?? 1,
            last_page: payload.last_page,
            per_page: payload.per_page ?? payload.data.length,
            total: payload.total ?? payload.data.length,
            from: payload.from ?? null,
            to: payload.to ?? null,
            links: payload.links,
        };
    }
    return null;
}

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const form = useForm({
        year: '',
        is_active: false,
    });

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/admin/tahun-akademik', { search: search || undefined }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => window.clearTimeout(timer);
    }, [filters.search, search]);

    const paginationMeta = resolvePaginationMeta(academicYears);
    const rows = academicYears.data ?? [];

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/tahun-akademik', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const toggleStatus = (year: AcademicYear) => {
        if (!window.confirm(`Ubah status tahun akademik "${year.year}"?`)) return;
        router.patch(
            `/admin/tahun-akademik/${year.id}`,
            { year: year.year, is_active: !year.is_active },
            { preserveScroll: true },
        );
    };

    const destroy = (year: AcademicYear) => {
        if (!window.confirm(`Hapus tahun akademik "${year.year}"?`)) return;
        router.delete(`/admin/tahun-akademik/${year.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Tahun Akademik">
            <Head title="Tahun Akademik | POS-KKN" />

            <div className="space-y-8 font-sans antialiased">
                {/* SYSTEM HEADER */}
                <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">TAHUN AKADEMIK</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            REFERENSI WAKTU OPERASIONAL SISTEM
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ADD FORM */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">ENTRI DATA BARU</h3>
                            
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">FORMAT TAHUN</label>
                                    <input
                                        type="text"
                                        placeholder="EX: 2026/2027"
                                        value={form.data.year}
                                        onChange={(event) => form.setData('year', event.target.value)}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded px-4 text-xs font-bold text-slate-700 uppercase tracking-wider focus:bg-white focus:border-emerald-500 outline-none transition-all"
                                    />
                                    {form.errors.year && <p className="text-[9px] font-black text-rose-600 mt-1 uppercase">{form.errors.year}</p>}
                                </div>

                                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                    <div className={clsx(
                                        "w-10 h-5 rounded relative transition-colors duration-200",
                                        form.data.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                                    )}>
                                        <div className={clsx(
                                            "absolute top-1 left-1 w-3 h-3 bg-white rounded transition-transform duration-200",
                                            form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                        )} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AKTIFKAN SEKARANG</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full h-12 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {form.processing ? 'SAVING...' : 'SIMPAN DATA'}
                                </button>
                            </form>
                        </div>

                        <div className="p-4 bg-emerald-50 border border-emerald-100 flex gap-3 text-emerald-700">
                            <AlertCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-black uppercase leading-relaxed tracking-widest">
                                PASTIKAN FORMAT TAHUN SESUAI STANDAR UNTUK AKURASI SINKRONISASI.
                            </p>
                        </div>
                    </div>

                    {/* MASTER LIST */}
                    <div className="lg:col-span-8">
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DAFTAR REFERENSI</span>
                                <div className="relative w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        placeholder="SEARCH..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="w-full h-8 pl-9 pr-3 bg-white border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID TAHUN</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">INSTRUMEN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rows.length > 0 ? (
                                            rows.map((year) => (
                                                <tr key={year.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
                                                                AY
                                                            </div>
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{year.year}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            {year.is_active ? (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-200">
                                                                    ACTIVE
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200">
                                                                    INACTIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right pr-6">
                                                        <div className="flex justify-end gap-2 text-white">
                                                            <button
                                                                onClick={() => toggleStatus(year)}
                                                                className={clsx(
                                                                    "h-8 w-8 flex items-center justify-center rounded transition-all active:scale-90",
                                                                    year.is_active ? 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'bg-emerald-600 text-white'
                                                                )}
                                                                title={year.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                                                            >
                                                                {year.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                                                            </button>
                                                            <button
                                                                onClick={() => destroy(year)}
                                                                className="h-8 w-8 flex items-center justify-center rounded bg-rose-600 text-white hover:bg-rose-700 transition-all active:scale-95 shadow-sm"
                                                                title="DELETE"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                                    NO DATA AVAILABLE
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {paginationMeta && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL: {paginationMeta.total}</span>
                                    <Pagination meta={paginationMeta} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
