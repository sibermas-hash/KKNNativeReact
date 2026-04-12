import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, 
    Search, 
    Plus, 
    Trash2, 
    Power, 
    PowerOff, 
    Eye, 
    Edit2,
    ShieldCheck,
    Settings2,
    SearchX,
    Filter,
    Activity,
    Lock,
    Binary,
    ArrowRight,
    Component,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface JenisKkn {
    id: number;
    code: string;
    name: string;
    description: string | null;
    registration_mode: string;
    placement_mode: string;
    registration_mode_label: string;
    placement_mode_label: string;
    min_sks: number;
    min_gpa: string;
    color: string;
    is_active: boolean;
    sort_order: number;
    periodes_count: number;
}

interface Props {
    jenisKkn: JenisKkn[];
    filters: { search?: string };
    registrationModes: { value: string; label: string }[];
    placementModes: { value: string; label: string }[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export default function JenisKknIndex({ jenisKkn, filters, registrationModes, placementModes }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJenis, setEditingJenis] = useState<JenisKkn | null>(null);

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        code: '',
        name: '',
        description: '',
        registration_mode: 'open',
        placement_mode: 'automatic_after_approval',
        min_sks: 100,
        min_gpa: '0.00',
        color: 'emerald',
        is_active: true,
        sort_order: 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/jenis-kkn', { search }, {
            preserveState: true,
            replace: true
        });
    };

    const openCreateForm = () => {
        setEditingJenis(null);
        reset();
        setIsFormOpen(true);
    };

    const openEditForm = (jenis: JenisKkn) => {
        setEditingJenis(jenis);
        setData({
            code: jenis.code,
            name: jenis.name,
            description: jenis.description || '',
            registration_mode: jenis.registration_mode,
            placement_mode: jenis.placement_mode,
            min_sks: jenis.min_sks,
            min_gpa: jenis.min_gpa,
            color: jenis.color,
            is_active: jenis.is_active,
            sort_order: jenis.sort_order,
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jenis KKN ini?')) {
            router.delete(`/admin/jenis-kkn/${id}`);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingJenis) {
            patch(`/admin/jenis-kkn/${editingJenis.id}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/admin/jenis-kkn', {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        }
    };

    return (
        <AppLayout title="Master Data - Strategic Schema Matrix">
            <Head title="Strategic Schema Matrix | KKN UIN SAIZU" />

            <div className="max-w-[1600px] mx-auto space-y-12 pb-32">
                {/* --- AUTHORITATIVE HEADER --- */}
                <motion.section 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-[3.5rem] bg-slate-900 p-12 lg:p-16 text-white overflow-hidden shadow-2xl shadow-slate-200 group"
                >
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-emerald-600 opacity-5 -skew-x-12 translate-x-1/2 pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6 max-w-3xl">
                            <div className="flex items-center gap-4">
                                <span className="px-4 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/20">
                                    Operational Core
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                                Strategic <span className="text-emerald-500">Schema Matrix.</span>
                            </h1>
                            <p className="text-base font-bold text-slate-400 leading-relaxed uppercase tracking-wide opacity-80 max-w-xl">
                                System configuration for academic engagement protocols. Define requirements, deployment logic, and enrollment behavior across the system.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                variant="primary" 
                                className="h-20 px-10 rounded-[2rem] bg-white text-slate-950 hover:bg-emerald-500 hover:text-white shadow-2xl flex items-center gap-4 transition-all active:scale-95 group/btn"
                                onClick={openCreateForm}
                            >
                                <span className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-emerald-600 transition-colors">
                                    <Plus className="w-6 h-6 stroke-[3]" />
                                </span>
                                <span className="text-sm font-black uppercase tracking-widest">Register New Schema</span>
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {/* --- SEARCH & CONTROL PLANE --- */}
                <motion.section 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3"
                >
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e as any)}
                            placeholder="Search by code or program name..."
                            className="w-full pl-16 pr-6 h-16 bg-slate-50 border-transparent rounded-[1.8rem] text-sm font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none uppercase tracking-tight"
                        />
                    </div>
                    <Button 
                        onClick={handleSearch}
                        className="px-12 h-16 rounded-[1.8rem] bg-slate-900 text-white hover:bg-emerald-600 text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all"
                    >
                        Filter Matrix
                    </Button>
                </motion.section>

                {/* --- DATA MATRIX --- */}
                <motion.section 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden"
                >
                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Schema Profile</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Logic</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Volume</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Status</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Deployment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {jenisKkn.length > 0 ? jenisKkn.map((jenis) => (
                                    <motion.tr 
                                        key={jenis.id} 
                                        variants={itemVariants}
                                        className="hover:bg-slate-50/30 group transition-all relative"
                                    >
                                        <td className="px-10 py-10">
                                            <div className="flex items-center gap-6">
                                                <div 
                                                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg shadow-inner ring-1 ring-inset ring-black/5"
                                                    style={{ backgroundColor: jenis.color === 'emerald' ? '#f0fdf4' : '#eff6ff', color: jenis.color === 'emerald' ? '#166534' : '#1e40af' }}
                                                >
                                                    <Component size={28} strokeWidth={2.5} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-lg font-black text-slate-900 tracking-tighter uppercase">{jenis.name}</div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">ID: {jenis.code}</span>
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">MIN: {jenis.min_sks} SKS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{jenis.registration_mode_label}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-400">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{jenis.placement_mode_label}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-center">
                                            <div className="inline-flex flex-col">
                                                <span className="text-xl font-black text-slate-900 leading-none">{jenis.periodes_count}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Cycles</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-center">
                                            <div className={clsx(
                                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                                                jenis.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                                            )}>
                                                <div className={clsx("h-2 w-2 rounded-full", jenis.is_active ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-slate-400")} />
                                                {jenis.is_active ? 'Active' : 'Archived'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                <Link 
                                                    href={`/admin/jenis-kkn/${jenis.id}`}
                                                    className="h-12 px-6 flex items-center gap-3 bg-slate-900 text-white hover:bg-emerald-600 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
                                                >
                                                    <Eye size={16} strokeWidth={2.5} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Console</span>
                                                </Link>
                                                <button 
                                                    onClick={() => openEditForm(jenis)}
                                                    className="h-12 w-12 flex items-center justify-center bg-white border-2 border-slate-50 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 rounded-2xl transition-all active:scale-95"
                                                >
                                                    <Edit2 size={18} strokeWidth={2.5} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(jenis.id)}
                                                    className={clsx(
                                                        "h-12 w-12 flex items-center justify-center bg-white border-2 border-slate-50 text-slate-400 transition-all active:scale-95 rounded-2xl",
                                                        jenis.periodes_count > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-rose-600 hover:border-rose-100"
                                                    )}
                                                    disabled={jenis.periodes_count > 0}
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                                    <SearchX size={48} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Schemas Found</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust filters or register a new engaging model.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>
            </div>

            {/* --- CONFIGURATION OVERLAY --- */}
            <AnimatePresence>
                {isFormOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormOpen(false)}
                            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 z-[110] w-full max-w-xl h-full bg-white shadow-[-40px_0_80px_rgba(0,0,0,0.1)] flex flex-col"
                        >
                            <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em]">
                                        <Settings2 size={14} /> Matrix Configuration
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                                        {editingJenis ? 'Update Schema' : 'New Protocol'}
                                    </h2>
                                </div>
                                <button onClick={() => setIsFormOpen(false)} className="h-14 w-14 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all group">
                                    <Plus className="w-8 h-8 rotate-45 stroke-[3] group-hover:rotate-[135deg] transition-transform duration-500" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="flex-1 overflow-y-auto p-12 space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Identity</label>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="SCHEMA NAME (E.G. KKN REGULER)"
                                                className="h-16 w-full px-6 text-sm font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none uppercase placeholder:text-slate-300"
                                            />
                                            {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-4">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                disabled={!!editingJenis}
                                                placeholder="PROTOCOL CODE (E.G. REG-01)"
                                                className="h-16 w-full px-6 text-sm font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none uppercase placeholder:text-slate-300 disabled:opacity-50"
                                            />
                                            {errors.code && <p className="text-[10px] text-rose-500 font-bold ml-4">{errors.code}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Requirement Threshold</label>
                                        <div className="relative">
                                            <Binary className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="number"
                                                value={data.min_sks}
                                                onChange={(e) => setData('min_sks', parseInt(e.target.value))}
                                                className="h-16 w-full pl-12 pr-6 text-sm font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">SKS</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">GPA Base</label>
                                        <div className="relative">
                                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                value={data.min_gpa}
                                                onChange={(e) => setData('min_gpa', e.target.value)}
                                                className="h-16 w-full pl-12 pr-6 text-sm font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Deployment Logic</label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <select
                                                value={data.registration_mode}
                                                onChange={(e) => setData('registration_mode', e.target.value)}
                                                className="h-16 w-full px-6 text-xs font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none uppercase tracking-widest cursor-pointer"
                                            >
                                                {registrationModes.map(mode => (
                                                    <option key={mode.value} value={mode.value}>{mode.label.toUpperCase()}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={data.placement_mode}
                                                onChange={(e) => setData('placement_mode', e.target.value)}
                                                className="h-16 w-full px-6 text-xs font-black bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none uppercase tracking-widest cursor-pointer"
                                            >
                                                {placementModes.map(mode => (
                                                    <option key={mode.value} value={mode.value}>{mode.label.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden group/opt">
                                        <div className="absolute top-0 right-0 p-6 text-white/5 pointer-events-none group-hover/opt:rotate-12 transition-transform duration-700">
                                            <Zap size={100} />
                                        </div>
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black uppercase tracking-tight">Active Operation State</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Enable schema for public enrollment cycles</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="p-12 border-t border-slate-50 flex gap-4 bg-slate-50/20">
                                <Button 
                                    variant="secondary" 
                                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 hover:bg-slate-50" 
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 shadow-2xl shadow-slate-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95" 
                                    onClick={submit} 
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Sync Configuration'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
