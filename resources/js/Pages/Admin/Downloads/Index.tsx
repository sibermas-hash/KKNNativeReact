import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PageProps, Download } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download as DownloadIcon,
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    X,
    ExternalLink,
    FileText,
    Link as LinkIcon,
    Fingerprint,
    Database,
    ShieldCheck,
    Zap,
    Search,
    CloudUpload,
    Terminal,
    ChevronRight,
    SearchCheck,
    MonitorIcon,
    ShieldAlert,
    Save
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

interface Props extends PageProps {
    downloads: {
        data: Download[];
        links: unknown[];
        meta: PaginationMeta;
    };
}

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
        if (confirm('Apakah Anda yakin ingin menghapus file ini dari repositori publik?')) {
            router.delete(route('admin.unduhan.destroy', id));
        }
    };

    return (
        <AppLayout title="Repositori Pusat Unduhan">
            <Head title="Manajemen Repositori | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950 uppercase tracking-tight">
                {/* HEADER TACTICAL: REPOSITORI DOKUMEN PUBLIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Public Document Repository Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            CENTRAL <span className="text-emerald-500">DOWNLOAD REGISTRY</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Otoritas pengelolaan berkas operasional, pedoman, dan templat KKN untuk akses publik.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8 italic">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest leading-none">TOTAL_ASSET</span>
                            <span className="text-xl font-black text-emerald-950 mt-1 uppercase tracking-tighter tabular-nums">{downloads.meta?.total || 0} BERKAS</span>
                        </div>
                        <button 
                            onClick={openCreateModal}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-6 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            UNGGAH ASET BARU
                        </button>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* DATA GRID: LEDGER REPOSITORI */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                        <div className="px-10 py-8 border-b border-emerald-50 bg-emerald-50/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-950 text-emerald-400 shadow-lg">
                                    <Database size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Operational Ledger Documents</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1 italic">Manifest Berkas Publik Terverifikasi</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto relative z-10 bg-white">
                            <table className="w-full text-left border-collapse italic">
                                <thead>
                                    <tr className="bg-emerald-50/30 border-b border-emerald-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em]">Dokumen / Identitas</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em]">Sumber Data</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em]">Status Publikasi</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em] text-right">Otoritas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50 font-black">
                                    {downloads.data.map((d) => (
                                        <tr key={d.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                            <td className="px-10 py-8">
                                                <div className="flex items-start gap-6">
                                                    <div className="p-4 bg-white border border-emerald-50 text-emerald-600 shadow-sm group-hover/row:bg-emerald-950 group-hover/row:text-emerald-400 transition-all duration-500">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tighter leading-none group-hover/row:text-emerald-600 transition-colors">{d.title}</h4>
                                                        <div className="flex items-center gap-4 text-[9px] font-bold text-emerald-200 uppercase tracking-widest italic tabular-nums">
                                                            <span className="flex items-center gap-2"><Fingerprint size={10} className="text-emerald-400" /> REG: {String(d.id).padStart(4, '0')}</span>
                                                            <span className="w-2 h-0.5 bg-emerald-50" />
                                                            <span>TS: {dayjs(d.created_at).format('DD.MM.YY HH:MM')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                {d.file_path ? (
                                                    <div className="flex items-center gap-3 text-emerald-500 text-[10px] uppercase tracking-widest">
                                                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        LOCAL_BIN_STORAGE
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 text-amber-500 text-[10px] uppercase tracking-widest">
                                                        <ExternalLink className="w-4 h-4" />
                                                        EXT_CLOUD_LINK
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={clsx(
                                                    "inline-flex items-center gap-3 px-4 py-2 border text-[10px] uppercase tracking-widest",
                                                    d.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-emerald-950 text-emerald-400 border-emerald-900"
                                                )}>
                                                    {d.is_active ? (
                                                        <><CheckCircle2 className="w-4 h-4" /> LIVE_ON_PORTAL</>
                                                    ) : (
                                                        <><XCircle className="w-4 h-4" /> DRAFT_ENCRYPTED</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-20 group-hover/row:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openEditModal(d)}
                                                        className="h-12 w-12 flex items-center justify-center bg-white border border-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-emerald-400 hover:border-transparent transition-all active:scale-90"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteDownload(d.id)}
                                                        className="h-12 w-12 flex items-center justify-center bg-white border border-rose-50 text-rose-300 hover:bg-rose-600 hover:text-white hover:border-transparent transition-all active:scale-90"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {downloads.data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6 opacity-30">
                                                    <SearchCheck size={64} strokeWidth={1} />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic">NO_DATA_IN_REPOSITORI</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {downloads.meta && (
                            <div className="px-10 py-8 bg-emerald-50/10 border-t border-emerald-50 flex justify-center">
                                <Pagination meta={downloads.meta} />
                            </div>
                        )}
                    </section>
                </div>

                {/* STATUS FOOTER TACTICAL */}
                <div className="flex flex-col items-center justify-center py-12 gap-8 relative group mb-12 italic">
                     <div className="flex items-center gap-8 opacity-20">
                        <Terminal size={20} className="text-emerald-200" />
                        <div className="h-px w-32 bg-emerald-50" />
                        <div className="p-3 bg-emerald-950 text-emerald-400 font-black text-[9px] tracking-[0.5em] uppercase">REPOSITORY_SYNC_OK</div>
                        <div className="h-px w-32 bg-emerald-50" />
                        <ShieldCheck size={20} className="text-emerald-200" />
                     </div>
                     <p className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700">
                         MANAJEMEN REPOSITORI PUSAT • UIN SAIZU COMMAND
                     </p>
                </div>
            </div>

            {/* Modal for Create/Edit */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-12">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm" 
                            onClick={() => setIsModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-emerald-100 italic"
                        >
                            <div className="px-12 py-10 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between relative overflow-hidden group/header">
                                <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-3/4 pointer-events-none" />
                                <div className="flex items-center gap-6 relative z-10 italic">
                                    <div className="h-14 w-14 bg-emerald-600 text-white flex items-center justify-center shadow-2xl font-black">
                                        <CloudUpload size={28} className="animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">
                                            {editingDownload ? 'MODIFIKASI <ASET_UNIT>' : 'REGISTRASI <ASET_BARU>'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic">Otorisasi Konfigurasi Sumber Daya Digital</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="relative z-10 h-14 w-14 flex items-center justify-center text-emerald-200 hover:bg-white hover:text-emerald-950 transition-all border border-emerald-800 hover:border-transparent active:scale-90"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-12 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-black uppercase">
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                            <Zap size={12} className="text-emerald-500" />
                                            Nomenklatur Aset ( Title )
                                        </label>
                                        <input 
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value.toUpperCase())}
                                            className="h-18 w-full bg-emerald-50/10 border border-emerald-50 px-8 text-[13px] font-black text-emerald-950 uppercase italic tracking-[0.2em] focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                            placeholder="CONTOH: PEDOMAN KKN 2026..."
                                        />
                                        {errors.title && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest ml-1">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                            <MonitorIcon size={12} className="text-emerald-500" />
                                            Transmisi Biner ( File )
                                        </label>
                                        <div className="relative group/upload">
                                            <input 
                                                type="file"
                                                onChange={e => setData('file', e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="h-20 w-full bg-emerald-50/10 border-2 border-dashed border-emerald-100 flex items-center justify-between px-8 group-hover/upload:border-emerald-500 transition-all">
                                                <span className="text-[10px] font-black text-emerald-300 italic tracking-widest truncate max-w-[240px]">
                                                    {data.file ? data.file.name : 'PILIH BERKAS LOKAL...'}
                                                </span>
                                                <CloudUpload size={20} className="text-emerald-100 group-hover/upload:text-emerald-500 transition-all" />
                                            </div>
                                            <p className="mt-4 text-[9px] font-bold text-emerald-100 italic uppercase tracking-[0.2em] ml-1">MAX_CAPACITY: 10MB (PDF/DOC/XLS)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-emerald-950 italic tracking-[0.4em] ml-1 flex items-center gap-3">
                                            <ExternalLink size={12} className="text-amber-500" />
                                            Tautan Jaringan ( External )
                                        </label>
                                        <div className="relative group/link">
                                            <input 
                                                value={data.external_url}
                                                onChange={e => setData('external_url', e.target.value)}
                                                className="h-20 w-full bg-emerald-50/10 border border-emerald-50 px-8 text-[11px] font-bold text-emerald-600 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                                placeholder="HTTPS://DRIVE.GOOGLE.COM/..."
                                            />
                                            <LinkIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100 group-focus-within/link:text-emerald-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 bg-emerald-950 p-8 border border-emerald-900 shadow-2xl relative overflow-hidden group/status mt-4">
                                         <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-full group-hover/status:translate-x-1/2 transition-transform duration-1000" />
                                         <div className="relative z-10 flex items-center justify-between gap-12">
                                             <div className="flex items-center gap-6 italic">
                                                <div className="h-14 w-14 bg-emerald-600 text-white flex items-center justify-center shadow-xl font-black">
                                                    <ShieldCheck size={24} className="animate-pulse" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-black text-white italic tracking-[0.3em] uppercase leading-none">Otoritas Penayangan Publik</h4>
                                                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest italic leading-none">Konfirmasi Status Sinkronisasi Portal</p>
                                                </div>
                                             </div>
                                             <label className="relative inline-flex items-center cursor-pointer active:scale-95 transition-transform">
                                                <input 
                                                    type="checkbox" 
                                                    checked={data.is_active}
                                                    onChange={e => setData('is_active', e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-16 h-8 bg-emerald-900 border border-emerald-800 rounded-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-none after:h-6 after:w-7 after:transition-all peer-checked:bg-emerald-500 shadow-sm transition-colors duration-500"></div>
                                                <span className="ml-6 text-[10px] font-black text-white uppercase italic tracking-[0.2em] min-w-[80px]">{data.is_active ? 'LIVE_DATA' : 'DRAFT_MODE'}</span>
                                            </label>
                                         </div>
                                    </div>
                                </div>

                                <div className="pt-12 flex flex-col sm:flex-row items-center justify-end gap-6 relative z-10">
                                    <div className="flex-1 flex items-center gap-6 opacity-30 italic hidden sm:flex">
                                        <ShieldAlert size={20} className="text-emerald-100" />
                                        <p className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.4em] leading-relaxed">Pastikan seluruh data terverifikasi sebelum eksekusi penyimpanan sistem.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full sm:w-auto h-18 px-12 bg-white text-rose-300 font-black text-[11px] uppercase tracking-[0.3em] italic border border-rose-50 hover:bg-rose-600 hover:text-white hover:border-transparent transition-all active:scale-95"
                                    >
                                        TERMINASI
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto h-18 px-12 bg-emerald-950 text-white font-black text-[11px] uppercase tracking-[0.4em] italic hover:bg-emerald-600 transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-6 group/btn disabled:opacity-50"
                                    >
                                        {processing ? 'SYNCING_DATA...' : 'SIMPAN REGISTRY'}
                                        <Save size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
