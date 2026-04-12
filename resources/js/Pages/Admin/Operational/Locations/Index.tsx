import { useEffect, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    Building2, 
    House, 
    MapPin, 
    MapPinned, 
    Pencil, 
    Plus, 
    Search, 
    Trash2, 
    X,
    Shield,
    ChevronRight,
    ArrowRight,
    Zap,
    Activity,
    Target,
    Database,
    Cpu,
    ShieldCheck,
    Layers3,
    UserCheck,
    Briefcase,
    type LucideIcon 
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationData {
    id: number;
    village_code: string | null;
    village_name: string;
    district_name: string | null;
    regency_name: string | null;
    capacity: number | null;
    full_name: string;
    groups_count: number;
    posko_count: number;
    can_delete: boolean;
    delete_blocker: string | null;
}

interface Props extends PageProps {
    locations: {
        data: LocationData[];
        links: unknown[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
    summary: {
        total_locations: number;
        assigned_groups: number;
        reported_posko: number;
    };
    workflow: {
        primary_source: 'groups_import' | 'manual';
        groups_import_url: string;
    };
}

interface LocationFormData {
    village_name: string;
    district_name: string;
    regency_name: string;
    village_code: string;
    capacity: string;
}

const emptyForm: LocationFormData = {
    village_name: '',
    district_name: '',
    regency_name: '',
    village_code: '',
    capacity: '',
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function LocationsIndex({ locations, filters, summary, workflow }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<LocationData | null>(null);
    const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<LocationFormData>(emptyForm);
    const deleteForm = useForm({});

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/lokasi',
                    { search: search || undefined },
                    { preserveState: true, replace: true, preserveScroll: true },
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, filters.search]);

    function openCreateModal() {
        setEditingLocation(null);
        setShowForm(true);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function openEditModal(location: LocationData) {
        setEditingLocation(location);
        setShowForm(true);
        form.clearErrors();
        form.setData({
            village_name: location.village_name ?? '',
            district_name: location.district_name ?? '',
            regency_name: location.regency_name ?? '',
            village_code: location.village_code ?? '',
            capacity: location.capacity != null ? String(location.capacity) : '',
        });
    }

    function closeModal() {
        setShowForm(false);
        setEditingLocation(null);
        form.clearErrors();
        form.reset();
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => closeModal() };
        if (editingLocation) {
            form.put(`/admin/lokasi/${editingLocation.id}`, options);
            return;
        }
        form.post('/admin/lokasi', options);
    }

    return (
        <AppLayout title="Geospatial Hub">
            <Head title="Manajemen Wilayah | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Geospatial Assets</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Tactical <span>Geospace.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Inventarisasi Wilayah Operasional. <br />
                            <span className="text-slate-900 not-italic">Manajemen desa penempatan, kapasitas kluster unit, dan pemetaan koordinat posko taktis.</span>
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="h-20 px-10 rounded-[2.5rem] bg-emerald-600 text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 group/btn"
                    >
                        <Plus size={22} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Register New Region</span>
                    </button>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <MetricCard label="Registered Villages" value={summary.total_locations} icon={Building2} color="emerald" />
                    <MetricCard label="Occupied Slots" value={summary.assigned_groups} icon={MapPinned} color="slate" />
                    <MetricCard label="Tactical Infrastructure" value={summary.reported_posko} icon={House} color="amber" />
                </motion.div>

                {/* --- AUTOMATIC INGESTION CTA --- */}
                {workflow.primary_source === 'groups_import' && (
                    <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-12 text-slate-900 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-6 transition-transform duration-1000">
                             <Database size={200} strokeWidth={1} />
                        </div>
                        <div className="flex items-center gap-10 relative z-10">
                            <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <MapPin size={40} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Automatic Regional Ingestion</h3>
                                <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">— Disarankan menggunakan protokol impor kelompok untuk membangun basis data wilayah secara sistematis.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.get(workflow.groups_import_url)}
                            className="h-20 px-10 rounded-3xl bg-slate-900 text-white hover:bg-emerald-600 transition-all flex items-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-2xl relative z-10 active:scale-95"
                        >
                            Open Unit Terminal
                            <ChevronRight size={18} />
                        </button>
                    </motion.div>
                )}

                {/* --- TACTICAL GEO-LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Layers3 size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Regional Inventory</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Daftar Wilayah Target</p>
                              </div>
                         </div>
                         <div className="relative w-full md:w-96 group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH VILLAGE / DISTRICT / CODE..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-0 focus:border-emerald-500 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-500"
                            />
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Node / Village</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Regional Cluster</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">BPS Identifier</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Load Factor</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {locations.data.length > 0 ? (
                                    locations.data.map((l) => (
                                        <tr key={l.id} className="group hover:bg-emerald-50/20 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{l.village_name}</span>
                                                    <div className="flex items-center gap-2 opacity-40">
                                                         <MapPin size={12} className="text-rose-500" />
                                                         <span className="text-[10px] font-bold uppercase tracking-widest leading-none truncate max-w-xs">{l.full_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight leading-none">{l.district_name || '-'}</span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-1">{l.regency_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all uppercase">
                                                    {l.village_code || 'UNMAPPED'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                     <div className="flex items-center gap-2">
                                                          <span className="text-sm font-black text-slate-900">{l.groups_count}</span>
                                                          <span className="text-xs font-black text-slate-200">/</span>
                                                          <span className="text-sm font-black text-slate-400">{l.capacity ?? 0}</span>
                                                     </div>
                                                     <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                          <div 
                                                               className="h-full bg-emerald-500" 
                                                               style={{ width: `${Math.min(((l.groups_count || 0) / (l.capacity || 1)) * 100, 100)}%` }} 
                                                          />
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <button
                                                        onClick={() => openEditModal(l)}
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleting(l)}
                                                        disabled={!l.can_delete}
                                                        className={clsx(
                                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                                                            l.can_delete 
                                                                ? "bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100" 
                                                                : "bg-slate-50 border-slate-50 text-slate-100 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic opacity-50">Geo-Manifest Offline</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Hal. {locations.meta.current_page} OF {locations.meta.last_page}
                            </span>
                        </div>
                        <Pagination meta={locations.meta} />
                    </div>
                </motion.section>
            </motion.div>

            {/* --- INDUSTRIAL FORM MODAL --- */}
            <Modal
                show={showForm}
                onClose={closeModal}
                title={editingLocation ? 'CALIBRATE REGIONAL DATA' : 'REGISTER NEW TACTICAL NODE'}
                maxWidth="2xl"
            >
                <div className="p-12 space-y-12">
                    <form onSubmit={submitForm} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Village Identification</label>
                                <input
                                    type="text"
                                    value={form.data.village_name}
                                    onChange={(e) => form.setData('village_name', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                    placeholder="VILLAGE NAME..."
                                />
                                {form.errors.village_name && <p className="text-[10px] text-rose-500 font-bold uppercase ml-1">{form.errors.village_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">District Cluster</label>
                                <input
                                    type="text"
                                    value={form.data.district_name}
                                    onChange={(e) => form.setData('district_name', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                    placeholder="DISTRICT..."
                                />
                                {form.errors.district_name && <p className="text-[10px] text-rose-500 font-bold uppercase ml-1">{form.errors.district_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Regency / Zone</label>
                                <input
                                    type="text"
                                    value={form.data.regency_name}
                                    onChange={(e) => form.setData('regency_name', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                    placeholder="REGENCY..."
                                />
                                {form.errors.regency_name && <p className="text-[10px] text-rose-500 font-bold uppercase ml-1">{form.errors.regency_name}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">BPS Vector Code</label>
                                <input
                                    type="text"
                                    value={form.data.village_code}
                                    onChange={(e) => form.setData('village_code', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black font-mono tracking-tight transition-all"
                                    placeholder="00.00.00.0000"
                                />
                                {form.errors.village_code && <p className="text-[10px] text-rose-500 font-bold uppercase ml-1">{form.errors.village_code}</p>}
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cluster Load Capacity (Max Units)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.data.capacity}
                                    onChange={(e) => form.setData('capacity', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black transition-all"
                                />
                                {form.errors.capacity && <p className="text-[10px] text-rose-500 font-bold uppercase ml-1">{form.errors.capacity}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all"
                            >
                                Abort Protocol
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-16 px-10 rounded-2xl bg-emerald-600 text-white hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-20"
                            >
                                {form.processing ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
                                Synchronize Registry
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => {
                    if (!deleting) return;
                    deleteForm.delete(`/admin/lokasi/${deleting.id}`, {
                        preserveScroll: true,
                        onSuccess: () => setDeleting(null),
                    });
                }}
                title="PURGE REGIONAL DATA"
                message={
                    deleting?.can_delete
                        ? `Yakin ingin menghapus wilayah "${deleting.village_name}"? Tindakan ini bersifat permanen dan tidak dapat dipulihkan.`
                        : (deleting?.delete_blocker || 'Data wilayah terikat dengan data lain dan tidak dapat dihapus.')
                }
                confirmLabel="Purge Node"
            />
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: 'emerald' | 'amber' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-6 relative z-10">
                <div className={clsx(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-slate-900 group-hover:text-white",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 opacity-60 italic leading-none">{label}</p>
                   <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{value.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
