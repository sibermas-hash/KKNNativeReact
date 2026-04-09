import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PageProps, Announcement } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    CheckCircle2,
    XCircle,
    X,
    Zap,
    Fingerprint,
    Database,
    Clock,
    Activity,
    Shield,
    ChevronRight,
    ArrowRight,
    Info,
    FileText,
    Target
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

interface Props extends PageProps {
    announcements: {
        data: Announcement[];
        links: unknown[];
        meta: PaginationMeta;
    };
}

export default function AnnouncementIndex({ announcements }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
        title: '',
        category: 'PENGUMUMAN',
        content: '',
        is_active: true,
        published_at: dayjs().format('YYYY-MM-DDTHH:mm'),
    });

    const openCreateModal = () => {
        setEditingAnnouncement(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setData({
            title: announcement.title,
            category: announcement.category,
            content: announcement.content,
            is_active: announcement.is_active,
            published_at: dayjs(announcement.published_at).format('YYYY-MM-DDTHH:mm'),
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAnnouncement) {
            patch(route('admin.warta-utama.update', editingAnnouncement.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.warta-utama.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteAnnouncement = (id: number) => {
        if (confirm('KONFIRMASI TERMINASI: Hapus pengumuman ini secara permanen dari publik?')) {
            router.delete(route('admin.warta-utama.destroy', id));
        }
    };

    return (
        <AppLayout title="Otoritas Informasi Publik">
            <Head title="Manajemen Warta | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: PUSAT INFORMASI STRATEGIS */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Information Dissemination Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            REGISTRY <span className="text-emerald-500">WARTA UTAMA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Megaphone size={12} className="text-emerald-500" />
                             Kelola publikasi informasi strategis, jadwal, dan pedoman operasional unit KKN.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <button
                            onClick={openCreateModal}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            BUAT PENGUMUMAN BARU
                        </button>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                     {/* STATS STRIP TACTICAL */}
                     <div className="flex items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4 italic shrink-0">
                            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.4em] italic leading-none">Status Publikasi Aktif</span>
                        </div>
                        <div className="h-px flex-1 bg-emerald-50" />
                        <div className="flex items-center gap-6 italic shrink-0">
                             <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest italic">VERSION CONTROL</span>
                                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] italic mt-1">DISSEMINATION V4.0</span>
                            </div>
                        </div>
                    </div>

                    {/* TACTICAL REGISTRY TABLE */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                        <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400 font-black">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Strategic Information Registry</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Daftar Pengumuman & Pedoman Operasional Sistem</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase italic tracking-widest border border-emerald-100 shadow-inner">
                                ARSIP PUBLIK TERDATA
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/10 border-b border-emerald-100">
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">NARASI & JUDUL WARTA</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">KATEGORI INFO</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">STATUS PUBLISH</th>
                                        <th className="px-10 py-5 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest italic pr-12">OPERASI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {announcements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-56 text-center">
                                                <div className="inline-flex flex-col items-center gap-6 opacity-20 capitalize">
                                                    <Megaphone size={64} strokeWidth={1} className="text-emerald-950" />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                        BELUM ADA WARTA TAYANG
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        announcements.data.map((a) => (
                                            <tr key={a.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-[15px] font-black text-emerald-950 uppercase tracking-tight italic group-hover/row:text-emerald-600 transition-colors leading-tight max-w-[500px]">
                                                            {a.title}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100">
                                                                <Clock size={10} className="text-emerald-400" />
                                                                <span className="text-[8px] font-black text-emerald-950 tabular-nums italic uppercase">PUBLISH: {dayjs(a.published_at).format('DD MMM YYYY HH:mm').toUpperCase()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Fingerprint size={10} className="text-emerald-100" />
                                                                <span className="text-[8px] font-black text-emerald-100 uppercase italic tracking-widest">ID: #{a.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-3 py-1.5 bg-white border border-emerald-100 text-emerald-950 text-[9px] font-black italic tracking-[0.2em] uppercase shadow-sm group-hover/row:bg-emerald-950 group-hover/row:text-white transition-all">
                                                        {a.category.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="flex justify-center">
                                                        {a.is_active ? (
                                                            <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-950 text-white border border-emerald-900 shadow-xl italic font-black text-[8px] tracking-[0.3em]">
                                                                <CheckCircle2 size={12} className="text-emerald-400" />
                                                                AKTIF
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3 px-4 py-1.5 bg-white border border-emerald-50 text-emerald-100 italic font-black text-[8px] tracking-[0.3em] opacity-40">
                                                                <XCircle size={12} />
                                                                DRAF
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                        <button 
                                                            onClick={() => openEditModal(a)}
                                                            className="h-10 w-10 bg-white border border-emerald-100 text-emerald-200 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                            title="EDIT WARTA"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteAnnouncement(a.id)}
                                                            className="h-10 w-10 bg-white border border-emerald-100 text-emerald-100 hover:text-rose-600 hover:border-rose-500 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                            title="DELETE WARTA"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <button className="h-10 w-10 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-10 py-8 border-t border-emerald-50 bg-emerald-50/10 italic">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 italic font-black text-[10px]">
                                     <div className="p-2 bg-emerald-950 text-emerald-500 shadow-lg">
                                        <Database size={14} strokeWidth={2.5} />
                                     </div>
                                     <span className="text-emerald-950 uppercase tracking-[0.2em]">Total Database Warta: {announcements.meta?.total ?? announcements.data.length} Entitas Terpublikasi</span>
                                </div>
                                <div className="flex items-center gap-8">
                                     <Pagination meta={announcements.meta} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECURITY FOOTER TACTICAL */}
                    <div className="bg-emerald-950 p-12 flex items-center justify-center gap-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                        <Shield size={24} className="text-emerald-500 relative z-10" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic relative z-10 leading-relaxed max-w-4xl text-center">
                            SELURUH INFORMASI YANG DITERBITKAN MELALUI TERMINAL INI AKAN DISINKRONISASI KE HALAMAN PUBLIK DAN DASBOR UNIT MAHASISWA SECARA REAL-TIME • PASTIKAN VALIDITAS NARASI SEBELUM PUBLIKASI.
                        </span>
                        <Target size={24} className="text-emerald-500 relative z-10" />
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit - Tactical Style */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md" 
                            onClick={() => setIsModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden italic font-black"
                        >
                            <div className="px-10 py-6 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 bg-emerald-950 text-emerald-400 flex items-center justify-center shadow-xl">
                                        <Edit2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.2em] leading-none">
                                            {editingAnnouncement ? `REVISI WARTA ID: #${editingAnnouncement.id}` : 'ENTRI WARTA STRATEGIS BARU'}
                                        </h3>
                                        <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mt-1.5 italic">PROTOKOL PUBLIKASI INFORMASI UNIT</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white border border-emerald-100 text-emerald-100 hover:text-rose-600 hover:border-rose-500 transition-all active:scale-90 shadow-sm">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-12 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Judul Strategis Pengumuman</label>
                                        <input 
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                            className="w-full h-14 bg-emerald-50/10 border border-emerald-50 px-6 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                            placeholder="INPUT JUDUL WARTA..."
                                        />
                                        {errors.title && <p className="text-[9px] font-black text-rose-600 uppercase italic tracking-widest">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Kategori Diseminasi</label>
                                        <select 
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="w-full h-14 bg-emerald-50/10 border border-emerald-50 px-6 text-[11px] font-black uppercase tracking-widest italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner appearance-none"
                                        >
                                            <option value="PENGUMUMAN">PENGUMUMAN UMUM</option>
                                            <option value="PENDAFTARAN">INFO PENDAFTARAN</option>
                                            <option value="PEDOMAN">PANDUAN & PEDOMAN</option>
                                            <option value="HASIL_SELEKSI">HASIL SELEKSI UNIT</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Waktu Penayangan Sistem</label>
                                        <input 
                                            type="datetime-local"
                                            value={data.published_at}
                                            onChange={e => setData('published_at', e.target.value)}
                                            className="w-full h-14 bg-emerald-50/10 border border-emerald-50 px-6 text-[11px] font-black uppercase tracking-widest italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner tabular-nums"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Narasi Konten Lengkap</label>
                                        <textarea 
                                            rows={8}
                                            value={data.content}
                                            onChange={e => setData('content', e.target.value)}
                                            className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner resize-none leading-relaxed"
                                            placeholder="TULISKAN NARASI INFORMASI SECARA DETAIL DAN FORMAL DI SINI..."
                                        />
                                        {errors.content && <p className="text-[9px] font-black text-rose-600 uppercase italic tracking-widest">{errors.content}</p>}
                                    </div>

                                    <div className="flex items-center gap-6 p-6 bg-emerald-50/50 border border-emerald-50">
                                        <label className="relative inline-flex items-center cursor-pointer group/toggle">
                                            <input 
                                                type="checkbox" 
                                                checked={data.is_active}
                                                onChange={e => setData('is_active', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-14 h-7 bg-emerald-100 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-emerald-200 after:border after:rounded-none after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-950 shadow-inner"></div>
                                            <span className="ml-5 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] italic">PUBLISH_AUTO_SYNC</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-6 pt-10 border-t border-emerald-50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-14 px-10 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300 hover:text-rose-600 transition-all italic"
                                    >
                                        BATALKAN OPERASI
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-14 px-12 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 group/submit disabled:opacity-30"
                                    >
                                        <Zap size={18} className="group-submit:animate-pulse" />
                                        {processing ? 'SEDANG MENULIS DATA...' : editingAnnouncement ? 'SIMPAN PERUBAHAN WARTA' : 'TERBITKAN WARTA UTAMA'}
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
