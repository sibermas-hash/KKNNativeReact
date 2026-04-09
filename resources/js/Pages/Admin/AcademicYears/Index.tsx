import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { Calendar, Search, Plus, Trash2, Power, PowerOff, CheckCircle2, AlertCircle, Database, Binary, Zap, LayoutGrid, Clock, ShieldCheck, Activity, Fingerprint } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
    path?: string;
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
            path: payload.path ?? "",
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
        if (!window.confirm(`KONFIRMASI OPERASIONAL: Ganti status tahun akademik "${year.year}"?`)) return;
        router.patch(
            `/admin/tahun-akademik/${year.id}`,
            { year: year.year, is_active: !year.is_active },
            { preserveScroll: true },
        );
    };

    const destroy = (year: AcademicYear) => {
        if (!window.confirm(`TERMINASI REFERENSI: Hapus "${year.year}" secara permanen dari pangkalan data?`)) return;
        router.delete(`/admin/tahun-akademik/${year.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Otoritas Tahun Akademik">
            <Head title="Tahun Akademik | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS WAKTU GLOBAL */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Temporal Registry Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            TAHUN <span className="text-emerald-500">AKADEMIK</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Clock size={12} className="text-emerald-500" />
                             Konfigurasi parameter waktu global dan sinkronisasi pangkalan data periode KKN.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">DATA REFERENSI</span>
                               <div className="flex items-center gap-3">
                                   <Database size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{paginationMeta?.total || 0} UNIT REFERENSI</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* OPERATION FORM TACTICAL */}
                    <div className="lg:col-span-4 space-y-12">
                        <motion.section 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all"
                        >
                            <div className="px-10 py-6 border-b border-emerald-50 flex items-center gap-4 bg-emerald-50/10">
                                <div className="p-3 bg-emerald-950 text-emerald-400 shadow-lg">
                                    <Plus size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Registrasi Baru</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Input parameter tahun akademik baru</p>
                                </div>
                            </div>
                            
                            <form onSubmit={submit} className="p-10 space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-emerald-950 uppercase tracking-widest italic ml-1">Format Tahun Akademik</label>
                                    <input
                                        type="text"
                                        placeholder="INPUT EX: 2026/2027"
                                        value={form.data.year}
                                        onChange={(event) => form.setData('year', event.target.value)}
                                        className="w-full h-14 bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase italic tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-100 shadow-inner"
                                    />
                                    {form.errors.year && <p className="text-[9px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.year}</p>}
                                </div>

                                <div className="p-6 bg-emerald-50/50 border border-emerald-50 flex items-center justify-between cursor-pointer group/toggle" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                    <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest italic">Aktivasi Langsung</span>
                                    <div className={clsx(
                                        "w-12 h-6 border transition-all duration-500 flex items-center p-1",
                                        form.data.is_active ? 'bg-emerald-950 border-emerald-900' : 'bg-white border-emerald-100'
                                    )}>
                                        <div className={clsx(
                                            "w-4 h-4 transition-all duration-500",
                                            form.data.is_active ? 'translate-x-6 bg-emerald-500' : 'translate-x-0 bg-emerald-50'
                                        )} />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full h-16 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 disabled:opacity-30 border-none rounded-none flex items-center justify-center gap-4"
                                >
                                    <Zap size={16} />
                                    {form.processing ? 'SINKRONISASI...' : 'SIMPAN REFERENSI TAHUN'}
                                </Button>
                            </form>
                        </motion.section>

                        {/* SECURITY CARD */}
                        <div className="bg-emerald-950 p-10 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
                             <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                             <div className="flex items-center gap-4 relative z-10 border-b border-white/5 pb-6">
                                <ShieldCheck size={20} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Temporal Integrity Control</span>
                             </div>
                             <p className="text-[9px] font-bold text-emerald-500/40 uppercase tracking-[0.3em] italic leading-relaxed relative z-10">
                                Pastikan format tahun sesuai standar sistem (YYYY/YYYY) untuk akurasi sinkronisasi data antar seluruh modul operasional KKN.
                             </p>
                        </div>
                    </div>

                    {/* DATA GRID TACTICAL */}
                    <div className="lg:col-span-8">
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all"
                        >
                            <div className="px-10 py-6 bg-emerald-50/10 border-b border-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-950 text-emerald-400">
                                        <LayoutGrid size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Indeks Referensi Waktu</h2>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Registry Tahun Akademik Terverifikasi</p>
                                    </div>
                                </div>
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200" />
                                    <input
                                        placeholder="CARI REFERENSI..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="w-full h-12 pl-14 pr-6 bg-white border border-emerald-50 text-[10px] font-black uppercase italic tracking-widest focus:outline-none focus:border-emerald-500 transition-all text-emerald-950 shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-emerald-50 bg-emerald-50/5 font-black uppercase">
                                            <th className="px-10 py-5 text-[9px] text-emerald-400 tracking-widest italic uppercase">IDENTITAS TAHUN REFERENSI</th>
                                            <th className="px-8 py-5 text-[9px] text-emerald-400 tracking-widest italic text-center uppercase">STATUS OPERASIONAL</th>
                                            <th className="px-10 py-5 text-[9px] text-emerald-400 tracking-widest italic text-right pr-12 uppercase">OPERASI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-50">
                                        {rows.length > 0 ? (
                                            rows.map((year) => (
                                                <tr key={year.id} className="group/row hover:bg-emerald-50/20 transition-colors">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="h-14 w-14 bg-emerald-950 text-emerald-400 flex items-center justify-center font-black text-sm italic shadow-xl group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all uppercase tracking-tighter">
                                                                TA
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[14px] font-black text-emerald-950 uppercase italic tracking-widest">TAHUN {year.year}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Fingerprint size={10} className="text-emerald-100" />
                                                                    <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest">ID_ENTITY: #{year.id}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-8 text-center uppercase">
                                                        <div className="flex justify-center uppercase">
                                                            {year.is_active ? (
                                                                <div className="px-5 py-2 bg-emerald-950 text-white border border-emerald-900 shadow-xl text-[9px] font-black tracking-widest italic flex items-center gap-3">
                                                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                                                    AKTIF
                                                                </div>
                                                            ) : (
                                                                <div className="px-5 py-2 bg-white border border-emerald-50 text-emerald-100 text-[9px] font-black tracking-widest italic opacity-40">
                                                                    NON-AKTIF
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right pr-12">
                                                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                            <button
                                                                onClick={() => toggleStatus(year)}
                                                                className={clsx(
                                                                    "h-12 w-12 flex items-center justify-center transition-all active:scale-90 border shadow-sm",
                                                                    year.is_active ? 'bg-white border-emerald-50 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500' : 'bg-emerald-950 text-white border-emerald-900 hover:bg-emerald-600'
                                                                )}
                                                                title={year.is_active ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                                                            >
                                                                {year.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => destroy(year)}
                                                                className="h-12 w-12 flex items-center justify-center bg-white border border-emerald-50 text-emerald-100 hover:text-rose-600 hover:border-rose-500 transition-all active:scale-95 shadow-sm"
                                                                title="TERMINASI REFERENSI"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-10 py-56 text-center opacity-20">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <Database size={64} strokeWidth={1} className="text-emerald-950" />
                                                        <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-950">DATABASE REFERENSI KOSONG</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {paginationMeta && (
                                <div className="px-10 py-8 bg-emerald-50/10 border-t border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-4">
                                        <Activity size={14} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.2em] italic">Total Database: {paginationMeta.total} Entitas Referensi Terdeteksi</span>
                                    </div>
                                    <Pagination meta={paginationMeta} />
                                </div>
                            )}
                        </motion.section>

                        <div className="mt-12 flex flex-col items-center justify-center gap-6">
                             <div className="flex items-center gap-4 opacity-20">
                                <Binary size={18} className="text-emerald-200" />
                                <div className="h-px w-24 bg-emerald-50" />
                                <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.5em] uppercase italic px-4">TEMPORAL_LOCK</div>
                                <div className="h-px w-24 bg-emerald-50" />
                                <Zap size={18} className="text-emerald-200" />
                             </div>
                             <p className="text-[8px] font-black text-emerald-950 uppercase tracking-[0.8em] italic opacity-40 hover:opacity-100 transition-opacity duration-1000">
                                 SISTEM PARAMETER KKN • VERIFIKASI WAKTU GLOBAL • POS-KKN {new Date().getFullYear()}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
