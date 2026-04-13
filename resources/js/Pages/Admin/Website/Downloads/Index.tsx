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
    X,
    ExternalLink,
    FileText,
    FileDown,
    Link as LinkIcon,
    CloudUpload,
    Save,
    FileIcon,
    Globe,
    ShieldCheck,
    Database,
    Archive,
    RefreshCw,
    Activity,
    Target,
    Zap,
    Cpu,
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

interface Props extends PageProps {
    downloads: { data: Download[]; meta: PaginationMeta; };
}

export default function DownloadIndex({ downloads }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDownload, setEditingDownload] = useState<Download | null>(null);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        title: '', file: null as File | null, external_url: '', is_active: true,
    });

    const openCreateModal = () => { setEditingDownload(null); reset(); clearErrors(); setIsModalOpen(true); };
    const openEditModal = (d: Download) => { setEditingDownload(d); setData({ title: d.title, file: null, external_url: d.external_url || '', is_active: d.is_active }); clearErrors(); setIsModalOpen(true); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingDownload ? route('admin.unduhan.update', editingDownload.id) : route('admin.unduhan.store');
        router.post(url, { ...data, _method: editingDownload ? 'PATCH' : 'POST', is_active: data.is_active ? 1 : 0 }, { forceFormData: true, onSuccess: () => { setIsModalOpen(false); reset(); } });
    };

    return (
    <AppLayout title="Manajemen Pusat Unduhan">
      <Head title="Pusat Unduhan" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <FileDown size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Konten Publik & Repositori</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Pusat <span className="text-emerald-500">Unduhan.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Repositori Aset Digital, Panduan Operasional, dan Berkas Administrasi Utama Mahasiswa KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Archive size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Aset</span>
                            <span className="text-sm font-black text-slate-900 tabular-nums leading-none tracking-tight">{downloads.meta?.total || 0} BERKAS</span>
                        </div>
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center gap-3 text-sm transition-all active:scale-95 uppercase tracking-wider"
                    >
                        <Plus size={20} className="text-white" /> TAMBAH ASET
                    </button>
                </div>
            </div>
        </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <AssetMetric label="Active Vaults" value={downloads.data.filter(d => d.is_active).length} icon={Database} />
                    <AssetMetric label="IOPS Status" value="LATENCY_LOW" icon={Activity} />
                    <AssetMetric label="Storage" value="vBINARY 1.2" icon={Cpu} />
                    <AssetMetric label="Broadcast" value="GLOBAL_CDN" icon={Globe} />
                </div>

                {/* --- LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <FileIcon size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Global Binary Archive Ledger</span>
                         </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Asset Identifier</th>
                                    <th className="px-6 py-4 text-center">Infrastructure Source</th>
                                    <th className="px-6 py-4 text-center">Release Status</th>
                                    <th className="px-6 py-4 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {downloads.data.map((d) => (
                                    <tr key={d.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-slate-50 border border-slate-100 text-slate-300 rounded-lg flex items-center justify-center italic group-hover:bg-emerald-600 group-hover:text-white transition-all"><FileDown size={18} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-900 uppercase italic group-hover:text-emerald-700 transition-colors truncate max-w-[300px]">{d.title}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest mt-1 opacity-60">ID_{String(d.id).padStart(4,'0')} • {dayjs(d.created_at).format('YYYY-MM-DD')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className={clsx('inline-flex h-6 items-center px-4 rounded-md text-[8px] font-black tracking-widest italic border transition-all', d.file_path ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100')}>
                                                {d.file_path ? 'LOCAL_VAULT' : 'EXTERNAL_CDN'}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className={clsx('inline-flex h-7 items-center px-4 rounded-full text-[8px] font-black tracking-widest italic border transition-all', d.is_active ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50 text-slate-300 border-slate-100')}>
                                                {d.is_active ? 'RELEASED' : 'DRAFT_STG'}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <button onClick={() => openEditModal(d)} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-lg flex items-center justify-center transition-all shadow-sm"><Edit2 size={14} /></button>
                                                <button onClick={() => { if(confirm('Hapus aset?')) router.delete(route('admin.unduhan.destroy', d.id)) }} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg flex items-center justify-center transition-all shadow-sm"><Trash2 size={14} /></button>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                                {downloads.data.length === 0 && (
                                    <tr><td colSpan={4} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Vault buffer null.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Binary Integrity 0xBF32 • Sync Nominal.</span>
                        <Pagination meta={downloads.meta} />
                    </div>
                </section>

                {/* MODAL */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden rounded-xl border border-slate-100 flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-emerald-600 text-white flex items-center justify-center rounded-lg shadow-lg"><CloudUpload size={20} /></div>
                                        <h3 className="text-sm font-black uppercase tracking-widest italic">{editingDownload ? 'Asset_Revision' : 'Binary_Injection'}</h3>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                                </div>
                                <form onSubmit={submit} className="p-6 space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset_Identifier_Title</label>
                                        <input value={data.title} onChange={e => setData('title', e.target.value.toUpperCase())} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-lg px-6 text-[14px] font-black text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all uppercase italic" placeholder="OPERATIONAL_GUIDE_2026" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Binary_Source</label>
                                            <div className="relative h-24 w-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 overflow-hidden group/img transition-colors hover:border-emerald-200">
                                                <input type="file" onChange={e => setData('file', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                {data.file ? <CheckCircle2 className="text-emerald-500" size={20} /> : <FileDown size={20} className="text-slate-200" />}
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{data.file ? 'BINARY_QUEUED' : 'INJECT_LOCAL_FILE'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">External_Proxy</label>
                                            <div className="h-24 w-full bg-slate-100 border border-slate-200 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center gap-2"><Globe size={10} className="text-emerald-500"/><span className="text-[8px] font-black text-slate-400 uppercase">CDN_Link</span></div>
                                                <input value={data.external_url} onChange={e => setData('external_url', e.target.value)} className="w-full h-8 bg-white/50 border border-slate-200 rounded-md px-3 text-[9px] font-black italic outline-none focus:bg-white" placeholder="https://drive.google.com/..." />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                         <div className="flex items-center gap-3">
                                            <ShieldCheck size={16} className={clsx(data.is_active ? "text-emerald-500" : "text-slate-300")} />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Broadcast Visibility</span>
                                         </div>
                                         <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold uppercase text-slate-300 hover:text-slate-900 transition-colors">Abort_Dep</button>
                                        <Button type="submit" disabled={processing} className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95">{processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} className="text-white" />} COMMIT_DEP</Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Cpu size={200} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md text-white"><Zap size={28} strokeWidth={1.5} /></div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black uppercase tracking-tight leading-none italic">Institutional Binary Oversight</h4>
                                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl">Repositori ini adalah aset intelektual UIN Saizu. Setiap pembaruan binary dicatat otomatis dalam audit log sistem untuk menjamin integritas dataset publik.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AssetMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
