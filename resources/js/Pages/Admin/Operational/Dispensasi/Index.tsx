import { type FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    ShieldCheck, 
    Plus, 
    Trash2, 
    Search, 
    X,
    Activity,
    Target,
    Zap,
    Briefcase,
    Building2,
    LayoutDashboard,
    Globe,
    Camera,
    Info,
    CheckCircle2,
    UserCheck,
    Lock,
    ExternalLink,
    ChevronRight,
    UserPlus,
    Cpu,
    ArrowRight,
    ShieldAlert,
    Database,
    Fingerprint,
    Layers3,
    ArrowLeft
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface Dispensasi {
    id: number;
    nim: string;
    alasan: string;
    bypassed_requirements: string[] | null;
    is_active: boolean;
    created_at: string;
    periode?: { id: number; name: string; periode: number } | null;
    granted_by_user?: { id: number; name: string } | null;
}

interface Period {
    id: number;
    name: string;
    periode: number;
}

interface Props {
    dispensasi: {
        data: Dispensasi[];
        meta: PaginationMeta;
    };
    periods: Period[];
    filters: { search?: string };
}

const REQUIREMENT_OPTIONS = [
    { value: 'min_sks', label: 'SKS MINIMUM' },
    { value: 'min_gpa', label: 'IPK MINIMUM' },
    { value: 'bta_ppi', label: 'BTA / PPI' },
    { value: 'documents', label: 'DOCUMENTS' },
    { value: 'personal_status', label: 'STATUS' },
    { value: 'program_prodi', label: 'PRODI' },
];

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function DispensasiIndex({ dispensasi, periods, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showForm, setShowForm] = useState(false);
    const [revokingId, setRevokingId] = useState<number | null>(null);

    const form = useForm({
        nim: '',
        period_id: '',
        alasan: '',
        bypassed_requirements: [] as string[],
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/dispensasi', { search: search || undefined }, { preserveState: true, replace: true });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/dispensasi', {
            onSuccess: () => {
                form.reset();
                setShowForm(false);
            },
        });
    };

    const handleRevoke = () => {
        if (!revokingId) return;
        router.delete(`/admin/dispensasi/${revokingId}`, { 
            preserveScroll: true,
            onSuccess: () => setRevokingId(null)
        });
    };

    const toggleRequirement = (value: string) => {
        const current = form.data.bypassed_requirements;
        form.setData(
            'bypassed_requirements',
            current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value],
        );
    };

    return (
        <AppLayout title="Exception Registry">
            <Head title="Dispensasi KKN | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Exception Authority</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Waiver <span>Protocol.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Manajemen dispensasi operasional. <br />
                            <span className="text-slate-900 not-italic">Otorisasi pengecualian kriteria pendaftaran KKN untuk entitas mahasiswa melalui mekanisme bypass terpusat.</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={clsx(
                            "h-20 px-10 rounded-[2.5rem] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 group/btn",
                            showForm ? "bg-slate-900 text-white" : "bg-emerald-600 text-white hover:bg-slate-900"
                        )}
                    >
                        {showForm ? <X size={22} strokeWidth={3} /> : <Plus size={22} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{showForm ? 'Abort Protocol' : 'Initialize Exception'}</span>
                    </button>
                </motion.div>

                {/* --- BYPASS MATRIX HUB --- */}
                <AnimatePresence>
                    {showForm && (
                        <motion.section 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-50 border-2 border-emerald-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-emerald-200/50"
                        >
                            <div className="p-12 space-y-12">
                                <div className="flex items-center gap-6">
                                     <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                          <Zap size={24} strokeWidth={3} />
                                     </div>
                                     <div className="space-y-1">
                                          <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] leading-none">Bypass Terminal</h2>
                                          <p className="text-2xl font-black text-emerald-950 uppercase tracking-tighter italic">Register New Exception</p>
                                     </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">NIM Identification</label>
                                            <div className="relative group/input">
                                                <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300 group-focus-within/input:text-emerald-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={form.data.nim}
                                                    onChange={(e) => form.setData('nim', e.target.value)}
                                                    required
                                                    className="w-full h-16 pl-16 pr-6 bg-white border-2 border-emerald-100 rounded-[1.5rem] focus:border-emerald-500 focus:ring-0 outline-none transition-all text-sm font-black uppercase tracking-tight font-mono"
                                                    placeholder="SCAN NIM..."
                                                />
                                            </div>
                                            {form.errors.nim && <p className="text-[10px] text-rose-500 font-bold uppercase ml-2">{form.errors.nim}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Temporal Period</label>
                                            <div className="relative group/input">
                                                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300 group-focus-within/input:text-emerald-600 transition-colors" />
                                                <select
                                                    value={form.data.period_id}
                                                    onChange={(e) => form.setData('period_id', e.target.value)}
                                                    className="w-full h-16 pl-16 pr-6 bg-white border-2 border-emerald-100 rounded-[1.5rem] focus:border-emerald-500 focus:ring-0 outline-none transition-all text-sm font-black uppercase tracking-tight appearance-none"
                                                >
                                                    <option value="">GLOBAL (ALL PERIODS)</option>
                                                    {periods.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Exception Rationale</label>
                                            <div className="relative group/input">
                                                <Info className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300 group-focus-within/input:text-emerald-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={form.data.alasan}
                                                    onChange={(e) => form.setData('alasan', e.target.value)}
                                                    required
                                                    className="w-full h-16 pl-16 pr-6 bg-white border-2 border-emerald-100 rounded-[1.5rem] focus:border-emerald-500 focus:ring-0 outline-none transition-all text-sm font-black uppercase tracking-tight"
                                                    placeholder="SPECIFY RATIONALE..."
                                                />
                                            </div>
                                            {form.errors.alasan && <p className="text-[10px] text-rose-500 font-bold uppercase ml-2">{form.errors.alasan}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Requirement Bypass Matrix</label>
                                        <div className="flex flex-wrap gap-4">
                                            {REQUIREMENT_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => toggleRequirement(opt.value)}
                                                    className={clsx(
                                                        "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic border-2 active:scale-95 shadow-sm",
                                                        form.data.bypassed_requirements.includes(opt.value)
                                                            ? "bg-slate-900 border-slate-900 text-emerald-500 scale-[1.05]"
                                                            : "bg-white border-emerald-100 text-emerald-700 hover:border-emerald-500"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-8 border-t border-emerald-100/50">
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="h-20 px-12 bg-emerald-600 text-white hover:bg-slate-900 transition-all rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 flex items-center gap-4 active:scale-95 disabled:opacity-20 translate-y-4"
                                        >
                                            {form.processing ? <Activity size={20} className="animate-spin" /> : <ShieldCheck size={20} strokeWidth={3} />}
                                            Authorize Waiver
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* --- TACTICAL WAIVER GRID --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Layers3 size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Audit Ledger</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Manifest Dispensasi Aktif</p>
                              </div>
                         </div>
                         <div className="relative w-full md:w-96 group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-emerald-500 transition-colors" />
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="SEARCH NIM / RATIONALE..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-0 focus:border-emerald-500 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-500"
                                />
                            </form>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Identify / NIM</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Contextual Period</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Bypass Vector</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Authorized By</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Transmission</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dispensasi.data.length > 0 ? (
                                    dispensasi.data.map((item) => (
                                        <tr key={item.id} className="group hover:bg-emerald-50/20 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1.5">
                                                     <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic font-mono">{item.nim}</span>
                                                     <div className="flex items-center gap-2 opacity-60">
                                                          <ShieldAlert size={10} className="text-rose-500" />
                                                          <span className="text-[9px] font-black uppercase tracking-widest leading-none truncate max-w-[200px]">{item.alasan}</span>
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                                    {item.periode?.name ?? 'GLOBAL SCOPE'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                                    {(item.bypassed_requirements ?? []).map((req) => (
                                                        <span
                                                            key={req}
                                                            className="inline-flex rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest italic"
                                                        >
                                                            {REQUIREMENT_OPTIONS.find((o) => o.value === req)?.label ?? req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3">
                                                     <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{item.granted_by_user?.name ?? '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono leading-none">{formatDate(item.created_at)}</span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    {item.is_active ? (
                                                        <button
                                                            onClick={() => setRevokingId(item.id)}
                                                            className="h-12 px-6 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-2xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                        >
                                                            <Trash2 size={16} />
                                                            Revoke
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic">Deactivated</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-32 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic opacity-50">Waiver Manifest Offline</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{dispensasi.meta.total} Exceptions Registered</span>
                        </div>
                        <Pagination meta={dispensasi.meta} />
                    </div>
                </motion.section>
            </motion.div>

            <ConfirmDialog
                open={!!revokingId}
                onClose={() => setRevokingId(null)}
                onConfirm={handleRevoke}
                title="PURGE EXCEPTION AUTHORITY"
                message="Yakin ingin mencabut dispensasi ini? Mahasiswa akan kembali dikenakan verifikasi syarat normal secara sistematis. Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Purge Waiver"
            />
        </AppLayout>
    );
}
