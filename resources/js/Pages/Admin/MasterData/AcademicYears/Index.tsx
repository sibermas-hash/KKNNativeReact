import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { 
    Calendar, 
    Search, 
    Plus, 
    Trash2, 
    Power, 
    PowerOff, 
    Info, 
    CheckCircle2, 
    ChevronRight,
    Target,
    Activity,
    Database,
    Binary,
    ShieldCheck,
    Zap,
    Cpu,
    Fingerprint,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function AcademicYearsIndex({ academicYears, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmVariant: 'primary' | 'danger';
        confirmLabel: string;
    }>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmVariant: 'primary',
        confirmLabel: '',
    });

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
        setConfirmDialog({
            open: true,
            title: 'PROTOCOL CONFIRMATION',
            message: `Ganti status transmisi tahun akademik "${year.year}"?`,
            confirmVariant: 'primary',
            confirmLabel: 'EXECUTE SWAP',
            onConfirm: () => {
                router.patch(
                    `/admin/tahun-akademik/${year.id}`,
                    { year: year.year, is_active: !year.is_active },
                    { 
                        preserveScroll: true,
                        onSuccess: () => setConfirmDialog(prev => ({ ...prev, open: false }))
                    },
                );
            }
        });
    };

    const destroy = (year: AcademicYear) => {
        setConfirmDialog({
            open: true,
            title: 'PURGE DATA PACKET',
            message: `Hapus permanent data "#{year.year}" dari katalog pusat?`,
            confirmVariant: 'danger',
            confirmLabel: 'EXECUTE PURGE',
            onConfirm: () => {
                router.delete(`/admin/tahun-akademik/${year.id}`, { 
                    preserveScroll: true,
                    onSuccess: () => setConfirmDialog(prev => ({ ...prev, open: false }))
                });
            }
        });
    };

    return (
        <AppLayout title="Academic Timeline Protocol">
            <Head title="Tahun Akademik | SIKKKN" />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmVariant={confirmDialog.confirmVariant}
                confirmLabel={confirmDialog.confirmLabel}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
            />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Academic Calendar Protocol</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Academic <span>Timeline.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Konfigurasi tahun ajaran inti. <br />
                            <span className="text-slate-900 not-italic">Penetapan parameter temporal dasar untuk sinkronisasi operasional KKN trans-fakultas.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                         <div className="h-24 px-10 bg-slate-900 rounded-[2.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                   <Calendar size={80} strokeWidth={1} />
                              </div>
                              <div className="flex flex-col justify-center">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-2">Registry Load</span>
                                   <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-black text-white tracking-tighter leading-none">{(paginationMeta?.total || 0).toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nodes</span>
                                   </div>
                              </div>
                         </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* --- INGESTION SIDEBAR --- */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
                        <section className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm group/panel">
                            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 bg-slate-900 text-emerald-500 rounded-xl flex items-center justify-center">
                                          <Plus size={20} strokeWidth={2.5} />
                                     </div>
                                     <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Data Ingestion</h2>
                                </div>
                            </div>
                            
                            <form onSubmit={submit} className="p-10 space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Timeline Vector (YYYY/YYYY)</label>
                                    <input
                                        type="text"
                                        placeholder="2026/2027"
                                        value={form.data.year}
                                        onChange={(event) => form.setData('year', event.target.value)}
                                        className="w-full h-16 px-8 rounded-2xl border-2 border-slate-50 bg-slate-50/50 text-sm font-black focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-slate-200 tracking-widest"
                                    />
                                    {form.errors.year && <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mt-2 ml-2 italic">{form.errors.year}</p>}
                                </div>

                                <div 
                                    className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                            form.data.is_active ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white border-slate-200'
                                        )}>
                                             {form.data.is_active && <CheckCircle2 size={12} strokeWidth={3} className="text-white" />}
                                        </div>
                                        <span className={clsx(
                                            "text-xs font-black uppercase tracking-widest transition-colors",
                                            form.data.is_active ? 'text-emerald-700 italic' : 'text-slate-400'
                                        )}>Enable Broadcast</span>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="h-20 w-full bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl transition-all text-xs tracking-[0.3em] uppercase active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {form.processing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                                    {form.processing ? 'TRANSMITTING...' : 'INJECT DATA PACKET'}
                                </Button>
                            </form>
                        </section>

                        <div className="bg-slate-900 rounded-[2.5rem] p-10 flex gap-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Info size={120} strokeWidth={1} />
                            </div>
                            <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 shadow-2xl">
                                <Activity size={20} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic leading-none">Protocol Hint</h4>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic opacity-80">
                                    Pastikan format penulisan (YYYY/YYYY) sudah benar. Data ini akan menjadi basis sinkronisasi pada seluruh periode KKN aktif.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- CATALOGUE DATA LEDGER --- */}
                    <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
                        <section className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                            <div className="px-10 py-10 bg-white border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                     <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                          <Database size={24} />
                                     </div>
                                     <div className="space-y-1">
                                          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Timeline Grid</h3>
                                          <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Catalogued Vectors</p>
                                     </div>
                                </div>
                                <div className="relative w-full sm:w-80 group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        placeholder="SEARCH VECTOR ID..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="w-full h-14 pl-16 pr-6 rounded-[1.25rem] bg-slate-50 border-none text-[10px] font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-200 uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                            <th className="px-12 py-8">Academic Vector</th>
                                            <th className="px-12 py-8 text-center">Transmission Status</th>
                                            <th className="px-12 py-8 text-right">Kernel Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-sans">
                                        {rows.length > 0 ? (
                                            rows.map((year) => (
                                                <tr key={year.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                                    <td className="px-12 py-10">
                                                        <div className="flex items-center gap-8">
                                                            <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 text-slate-200 flex items-center justify-center font-black text-[10px] group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm italic">
                                                                #{year.id}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <span className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-emerald-700 transition-colors leading-none">{year.year}</span>
                                                                <div className="flex items-center gap-3">
                                                                     <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full group-hover:animate-ping" />
                                                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">Verified Segment</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-10 text-center">
                                                        {year.is_active ? (
                                                            <span className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-900 text-emerald-500 rounded-2xl text-[9px] font-black tracking-[0.25em] shadow-2xl italic">
                                                                <Zap size={12} strokeWidth={3} className="animate-pulse" />
                                                                BROADCASTING
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-3 px-6 py-2.5 bg-white text-slate-300 rounded-2xl text-[9px] font-black tracking-[0.25em] border border-slate-100 italic">
                                                                STANDBY
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-12 py-10 text-right">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                            <button
                                                                onClick={() => toggleStatus(year)}
                                                                className={clsx(
                                                                    "h-12 px-6 rounded-2xl transition-all border shadow-sm text-[9px] font-black uppercase tracking-widest italic flex items-center gap-3",
                                                                    year.is_active ? 'bg-white border-slate-100 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-slate-900 text-emerald-500 border-slate-800 hover:bg-emerald-600 hover:text-white'
                                                                )}
                                                            >
                                                                {year.is_active ? <PowerOff size={14} strokeWidth={2.5} /> : <Power size={14} strokeWidth={2.5} />}
                                                                {year.is_active ? 'HALT' : 'IGNITE'}
                                                            </button>
                                                            <button
                                                                onClick={() => destroy(year)}
                                                                className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-200 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center active:scale-95"
                                                            >
                                                                <Trash2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-40 text-sm font-black text-slate-200 uppercase tracking-[0.4em] italic leading-none bg-slate-50/10">
                                                    NO TRANSMISSIONS RECORDED
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {paginationMeta && (
                                <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                                    <div className="flex items-center gap-4 text-emerald-600">
                                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">PAGE {paginationMeta.current_page} / {paginationMeta.last_page} OF INVENTORY</span>
                                    </div>
                                    <Pagination meta={paginationMeta} />
                                </div>
                            )}
                        </section>
                    </motion.div>
                </div>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Fingerprint className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Node Integrity</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Global Academic Segmentation</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Konfigurasi tahun akademik adalah pilar temporal sistem. Kesalahan input segmentasi ini akan mengakibatkan desinkronisasi masif pada seluruh data pendaftaran dan plotting kelompok.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Cpu size={28} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Processing Logic Active</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
