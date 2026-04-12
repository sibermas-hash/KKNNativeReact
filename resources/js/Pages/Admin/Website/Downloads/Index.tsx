import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PageProps, Download } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    X,
    ExternalLink,
    FileText,
    Link as LinkIcon,
    Search,
    CloudUpload,
    Save,
    FileIcon,
    Globe,
    ShieldCheck,
    AlertCircle,
    FileDown,
    Database,
    Layers,
    Activity,
    Target,
    Zap,
    Cpu,
    Fingerprint,
    Archive,
    SearchIcon,
    RefreshCw,
    Shield,
    Lock,
    Unlock,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

interface Props extends PageProps {
    downloads: {
        data: Download[];
        meta: PaginationMeta;
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function DownloadIndex({ downloads }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDownload, setEditingDownload] = useState<Download | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        file: null as File | null,
        external_url: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingDownload(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (download: Download) => {
        setEditingDownload(download);
        setData({
            title: download.title,
            file: null,
            external_url: download.external_url || '',
            is_active: download.is_active,
        });
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDownload) {
            router.post(route('admin.unduhan.update', editingDownload.id), {
                _method: 'patch',
                title: data.title,
                file: data.file,
                external_url: data.external_url,
                is_active: data.is_active ? 1 : 0,
            }, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.unduhan.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteDownload = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus berkas ini?')) {
            router.delete(route('admin.unduhan.destroy', id));
        }
    };

    return (
        <AppLayout title="Digital Asset Repository">
            <Head title="Manajemen Unduhan | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Digital Asset Repository Command</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Digital <span>Archives.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pusat distribusi aset digital. <br />
                            <span className="text-slate-900 not-italic">Manajemen berkas pedoman, formulir resmi, dan templat KKN yang dihosting pada infrastruktur cloud universitas.</span>
                        </p>
                    </div>

                    <Button 
                        onClick={openCreateModal}
                        className="h-24 px-12 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500"
                    >
                        <Plus size={24} className="text-emerald-500 group-hover:rotate-90 transition-transform" />
                        INJECT_NEW_ASSET
                    </Button>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Active Assets" value={downloads.meta?.total || 0} icon={FileIcon} color="emerald" desc="Total personnel record in vault" />
                    <MetricCard label="Cloud Status" value="LATENCY_NOMINAL" icon={CloudUpload} color="emerald" desc="Global delivery network active" />
                    <MetricCard label="Protocol Engine" value="vSTORAGE 1.2" icon={Cpu} color="emerald" desc="Binary integrity verified" />
                </motion.div>

                {/* --- ASSET LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Layers size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Asset stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Global Repository Ledger</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Meta</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {downloads.data.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Asset Identifier</th>
                                    <th className="px-12 py-8 text-center">Infrastucture Source</th>
                                    <th className="px-12 py-8 text-center">Release Status</th>
                                    <th className="px-12 py-8 text-right">Kernel Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {downloads.data.length > 0 ? (
                                    downloads.data.map((d) => (
                                        <tr key={d.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-20 w-20 bg-slate-50 border border-slate-100 text-slate-200 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all group-hover:rotate-6">
                                                        <FileIcon size={30} strokeWidth={1} />
                                                    </div>
                                                    <div className="flex flex-col gap-2 leading-none">
                                                        <span className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight uppercase italic">{d.title}</span>
                                                        <div className="flex items-center gap-3">
                                                             <div className={clsx("h-1.5 w-1.5 rounded-full transition-all", d.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                                             <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase italic">ID_{String(d.id).padStart(4, '0')} // SYNC_{dayjs(d.created_at).format('YYYY-MM-DD')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {d.file_path ? (
                                                        <div className="flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                                            <Database size={11} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">LOCAL_VAULT</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 px-6 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                                                            <Globe size={11} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">EXTERNAL_CDN</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {d.is_active ? (
                                                        <span className="inline-flex h-8 items-center px-6 bg-slate-900 text-emerald-500 rounded-2xl text-[9px] font-black tracking-[0.25em] shadow-xl italic">
                                                            RELEASED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex h-8 items-center px-6 bg-white text-slate-300 rounded-2xl text-[9px] font-black tracking-[0.25em] border border-slate-100 italic">
                                                            DRAFT_STG
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <button 
                                                        onClick={() => openEditModal(d)}
                                                        className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm transition-all active:scale-95"
                                                    >
                                                        <Edit2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteDownload(d.id)}
                                                        className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-2xl flex items-center justify-center shadow-sm transition-all active:scale-95"
                                                    >
                                                        <Trash2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Archive size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Archive Buffer Null</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO DATA ASSETS DETECTED IN MONITORING PIPELINE.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Asset Repository Stream Active. Binary Integrity 0xBF32.</span>
                        </div>
                        <Pagination 
                            meta={downloads.meta}
                            onPageChange={(page) => router.visit(route('admin.unduhan.index', { page }), { preserveState: true, preserveScroll: true })}
                        />
                    </div>
                </motion.section>

                {/* --- ASSET UPLOAD MODAL --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8 lg:p-12">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
                                onClick={() => setIsModalOpen(false)} 
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-4xl bg-white shadow-2xl overflow-hidden flex flex-col md:rounded-[4rem] border border-white/20"
                            >
                                {/* Modal Header */}
                                <div className="px-14 py-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                                    <div className="flex items-center gap-8">
                                        <div className="h-16 w-16 bg-slate-900 text-white flex items-center justify-center rounded-[1.5rem] shadow-2xl">
                                            <CloudUpload size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                                {editingDownload ? 'Asset_Revision' : 'Initial_Deployment'}
                                            </h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mt-1 leading-none">Global Binary Matrix Injection</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="h-14 w-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm border border-slate-100">
                                        <X size={24} strokeWidth={2.5} />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="flex-1 overflow-y-auto bg-slate-50/20 p-14 space-y-12">
                                     <div className="space-y-4">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Asset_Identifier_Title</label>
                                         <input
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value.toUpperCase())}
                                            className="w-full bg-white h-20 rounded-[1.5rem] px-10 text-[15px] font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 border-none outline-none shadow-xl shadow-slate-200 transition-all uppercase tracking-widest italic"
                                            placeholder="CONTOH: PANDUAN_OPERASIONAL_2026..."
                                         />
                                         {errors.title && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">VALIDATION_ERROR: {errors.title}</p>}
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                         {/* Local Vault Upload */}
                                         <div className="space-y-6">
                                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">Binary_Vault_Injection</label>
                                              <div className="relative group/upload overflow-hidden rounded-[2.5rem] bg-white border-4 border-dashed border-slate-100 hover:border-emerald-200 transition-all p-10 flex flex-col items-center gap-6 shadow-xl shadow-slate-100">
                                                   <input
                                                        type="file"
                                                        onChange={e => setData('file', e.target.files?.[0] || null)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                   />
                                                   <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover/upload:text-emerald-500 group-hover/upload:rotate-12 transition-all">
                                                        <FileIcon size={30} strokeWidth={1} />
                                                   </div>
                                                   <div className="space-y-2 text-center">
                                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">
                                                            {data.file ? data.file.name : 'UPLOAD_BINARY_SRC'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">MAX_CAPACITY: 10MB // PDF, DOC</p>
                                                   </div>
                                                   {data.file && (
                                                        <div className="absolute inset-0 bg-emerald-600 flex items-center justify-center pointer-events-none">
                                                            <CheckCircle2 className="text-white animate-bounce" size={40} />
                                                        </div>
                                                   )}
                                              </div>
                                         </div>

                                         {/* External CDN Proxy */}
                                         <div className="space-y-6">
                                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2 block ml-4">External_CDN_Proxy</label>
                                              <div className="bg-slate-900 rounded-[2.5rem] p-10 space-y-6 shadow-2xl relative overflow-hidden group/proxy h-full flex flex-col justify-between">
                                                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/proxy:rotate-12 transition-transform">
                                                        <LinkIcon size={60} />
                                                   </div>
                                                   <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                                        <Globe size={20} />
                                                   </div>
                                                   <div className="space-y-4 relative z-10">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Distribution_Link</span>
                                                        <input
                                                            value={data.external_url}
                                                            onChange={e => setData('external_url', e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 h-14 rounded-2xl px-6 text-white focus:ring-4 focus:ring-emerald-500/20 border-none outline-none text-[10px] font-black tracking-[0.1em] font-mono italic"
                                                            placeholder="https://drive.google.com/..."
                                                        />
                                                   </div>
                                              </div>
                                         </div>
                                     </div>

                                     {/* Visibility Status */}
                                     <div className="bg-slate-950 rounded-[3rem] p-10 flex items-center justify-between shadow-2xl relative overflow-hidden group/iv border border-white/5">
                                         <div className="flex items-center gap-8 relative z-10">
                                             <div className={clsx(
                                                 "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                                                 data.is_active ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30" : "bg-white/5 text-white/20"
                                             )}>
                                                 <ShieldCheck size={28} />
                                             </div>
                                             <div className="space-y-1">
                                                 <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Broadcast Status</h4>
                                                 <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic leading-none">Visibility on public interface node</p>
                                             </div>
                                         </div>
                                         <label className="relative inline-flex items-center cursor-pointer active:scale-95 transition-transform z-10">
                                             <input
                                                 type="checkbox"
                                                 checked={data.is_active}
                                                 onChange={e => setData('is_active', e.target.checked)}
                                                 className="sr-only peer"
                                             />
                                             <div className="w-16 h-9 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 transition-colors duration-500 shadow-inner"></div>
                                         </label>
                                     </div>

                                     {/* Control Actions */}
                                     <div className="flex items-center justify-end gap-8 pt-6">
                                         <button
                                             type="button"
                                             onClick={() => setIsModalOpen(false)}
                                             className="text-[11px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-[0.3em] transition-colors italic"
                                         >
                                             ABORT_DEP
                                         </button>
                                         <Button
                                             type="submit"
                                             disabled={processing}
                                             className="h-20 px-16 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500"
                                         >
                                             <AnimatePresence mode="wait">
                                                  {processing ? (
                                                      <RefreshCw size={24} className="animate-spin" />
                                                  ) : (
                                                      <Save size={24} className="text-emerald-500 group-hover:animate-pulse" />
                                                  )}
                                             </AnimatePresence>
                                             {processing ? 'EXECUTING_INJECTION...' : 'COMMIT_BINARY_DEP'}
                                         </Button>
                                     </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover/f:rotate-12 transition-transform duration-1000">
                         <Archive size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Database className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Asset Oversight</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Binary Repository</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Seluruh dokumen dalam repositori ini adalah aset intelektual UIN Saizu. Setiap pembaruan binary akan dicatat secara otomatis dalam audit log sistem untuk memastikan integritas dataset publik tetap terjaga.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Vault Integrity Nominal</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm border border-slate-50",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none tabular-nums">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
