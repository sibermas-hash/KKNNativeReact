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
        <AppLayout title="TAHUN AKADEMIK">
            <Head title="Tahun Akademik | KKN UIN SAIZU" />

            <div className="space-y-6">
                
                {/* --- COMPACT HEADER --- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Tahun Akademik</h2>
                            <p className="text-sm text-slate-500 font-medium">Pengaturan referensi waktu sistem</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* --- ADD FORM --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus size={16} className="text-emerald-500" />
                                Tambah Tahun Baru
                            </h3>
                            
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Format Tahun</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 2026/2027"
                                        value={form.data.year}
                                        onChange={(event) => form.setData('year', event.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium"
                                    />
                                    {form.errors.year && <p className="text-[10px] font-bold text-rose-500 mt-1">{form.errors.year}</p>}
                                </div>

                                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                    <div className={clsx(
                                        "w-10 h-5 rounded-full relative transition-colors duration-200",
                                        form.data.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                                    )}>
                                        <div className={clsx(
                                            "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                                            form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                        )} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Langsung Aktifkan</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Tahun'}
                                </button>
                            </form>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
                                Pastikan format tahun sesuai standar sistem untuk sinkronisasi data yang akurat.
                            </p>
                        </div>
                    </div>

                    {/* --- MASTER LIST --- */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                                <div className="text-sm font-bold text-slate-800">Daftar Referensi</div>
                                <div className="relative w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        placeholder="Cari tahun..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identitas Tahun</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Opsi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rows.length > 0 ? (
                                            rows.map((year) => (
                                                <tr key={year.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200">
                                                                AY
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800">{year.year}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            {year.is_active ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                                    <CheckCircle2 size={12} />
                                                                    Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">
                                                                    Non-aktif
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleStatus(year)}
                                                                className={clsx(
                                                                    "h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-90",
                                                                    year.is_active ? 'bg-white border-slate-200 text-amber-500 hover:border-amber-200' : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                                                                )}
                                                                title={year.is_active ? 'Non-aktifkan' : 'Aktifkan'}
                                                            >
                                                                {year.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => destroy(year)}
                                                                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 shadow-sm"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                                                    Belum ada data tahun akademik.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {paginationMeta && (
                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
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
