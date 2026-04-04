import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/UI';
import type { PageProps, Download } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
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
    Link as LinkIcon
} from 'lucide-react';
import dayjs from 'dayjs';

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

    const { data, setData, post, patch, processing, reset, errors } = useForm({
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
            // Using post with _method=PATCH for multipart/form-data
            router.post(route('admin.downloads.update', editingDownload.id), {
                _method: 'patch',
                title: data.title,
                external_url: data.external_url,
                is_active: data.is_active ? 1 : 0,
            }, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.downloads.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteDownload = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
            router.delete(route('admin.downloads.destroy', id));
        }
    };

    return (
        <AppLayout title="Repositori Pusat Unduhan">
            <Head title="Manajemen Repositori" />

            <div className="space-y-8 pb-24 text-slate-900">
                {/* Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-600 p-10 lg:p-14 border-4 border-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group shadow-2xl">
                    <div className="relative z-10 space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl border-2 border-white/20">
                                <DownloadIcon className="h-6 w-6 text-amber-400" />
                            </div>
                            <span className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.4em]">
                                DOCUMENT_CENTRAL_UNIT
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
                            Pusat <span className="text-amber-400 italic">Unduhan</span>
                        </h1>
                        <p className="text-emerald-50/80 text-lg font-bold leading-relaxed max-w-2xl italic">
                            Kelola pedoman operasional, formulir pendaftaran, dan templat pelaporan untuk akses publik mahasiswa.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 shrink-0 relative z-10">
                        <button 
                            onClick={openCreateModal}
                            className="bg-amber-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-sm hover:bg-white transition-all flex items-center gap-4 shadow-2xl shadow-amber-500/20 active:scale-95 uppercase tracking-widest border-2 border-slate-950"
                        >
                            <Plus className="w-6 h-6" />
                            UNGGAH_BARU
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y-4 divide-slate-900">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Dokumen_Garda</th>
                                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Sumber_Data</th>
                                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Status_Akses</th>
                                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] pr-12">Kontrol_Opersional</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-100">
                                {downloads.data.map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-8">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border-2 border-emerald-100">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-black text-slate-950 leading-tight uppercase tracking-tight">{d.title}</h4>
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <span>ID: {d.id}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span>TGL: {dayjs(d.created_at).format('DD/MM/YYYY')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            {d.file_path ? (
                                                <div className="flex items-center gap-2 text-cyan-600 font-black text-xs uppercase tracking-widest">
                                                    <DownloadIcon className="w-4 h-4" />
                                                    LOCAL_STORAGE
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
                                                    <LinkIcon className="w-4 h-4" />
                                                    EXTERNAL_LINK
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-8">
                                            {d.is_active ? (
                                                <div className="flex items-center gap-2 text-emerald-500 font-black text-[11px] uppercase tracking-[0.2em]">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    LIVE_PUBLIC
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">
                                                    <XCircle className="w-4 h-4" />
                                                    HIDDEN_DRAFT
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-8 text-right pr-8">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => openEditModal(d)}
                                                    className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all border-2 border-transparent hover:border-emerald-200"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteDownload(d.id)}
                                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {downloads.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <p className="text-slate-400 font-black uppercase tracking-[0.3em]">Belum_ada_dokumen_dalam_repositori</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {downloads.meta && (
                        <div className="px-8 py-6 bg-slate-50/50 border-t-4 border-slate-900">
                            <Pagination meta={downloads.meta} />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-slate-900"
                    >
                        <div className="px-10 py-8 bg-emerald-50 border-b-4 border-slate-900 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">
                                {editingDownload ? 'MODIFIKASI_DATA_REPOSITORI' : 'PUBLIKASI_REPOSITORI_BARU'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-colors border-2 border-transparent hover:border-slate-950">
                                <X className="w-7 h-7 text-slate-950" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 tracking-[0.4em] uppercase ml-1">Judul_Dokumen</label>
                                    <input 
                                        value={data.title}
                                        onChange={e => setData('judul', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-8 py-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none uppercase italic"
                                        placeholder="PEDOMAN KKN 2026..."
                                    />
                                    {errors.title && <p className="text-xs text-red-500 font-bold ml-1 italic">{errors.title}</p>}
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 tracking-[0.4em] uppercase ml-1">Unggah_File (Opsional)</label>
                                    <div className="relative">
                                        <input 
                                            type="berkas"
                                            onChange={e => setData('berkas', e.target.files?.[0] || null)}
                                            className="w-full bg-white border-2 border-dashed border-slate-300 rounded-2xl px-6 py-4 text-[10px] font-black text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-white hover:border-emerald-500 transition-colors"
                                        />
                                        <p className="mt-2 text-[9px] font-bold text-slate-400 ml-1">PDF, DOC, XLS (MAX 10MB)</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 tracking-[0.4em] uppercase ml-1">Tautan_Eksternal (Alt)</label>
                                    <div className="relative">
                                        <input 
                                            value={data.external_url}
                                            onChange={e => setData('external_url', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-12 py-5 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none"
                                            placeholder="https://drive.google.com/..."
                                        />
                                        <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm"></div>
                                        <span className="ml-5 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">PROSES_PUBLIKASI_LIVE</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-10 flex items-center justify-end gap-6">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-12 h-16 rounded-2xl text-[11px] font-black tracking-[0.4em] uppercase border-4 border-slate-900"
                                >
                                    ABORT_MISSION
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="px-12 h-16 rounded-2xl text-[11px] font-black tracking-[0.4em] uppercase bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 text-white border-4 border-slate-900"
                                >
                                    {processing ? 'EXECUTING...' : 'COMMIT_CHANGES'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AppLayout>
    );
}
