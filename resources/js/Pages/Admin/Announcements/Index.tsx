import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PageProps, Announcement } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    CheckCircle2,
    XCircle,
    X
} from 'lucide-react';
import dayjs from 'dayjs';

interface Props extends PageProps {
    announcements: {
        data: Announcement[];
        links: any[];
        meta: PaginationMeta;
    };
}

export default function AnnouncementIndex({ announcements }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        title: '',
        category: 'PENGUMUMAN',
        content: '',
        is_active: true,
        published_at: dayjs().format('YYYY-MM-DD HH:mm'),
    });

    const openCreateModal = () => {
        setEditingAnnouncement(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setData({
            title: announcement.title,
            category: announcement.category,
            content: announcement.content,
            is_active: announcement.is_active,
            published_at: dayjs(announcement.published_at).format('YYYY-MM-DD HH:mm'),
        });
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAnnouncement) {
            patch(route('admin.announcements.update', editingAnnouncement.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.announcements.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteAnnouncement = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            router.delete(route('admin.announcements.destroy', id));
        }
    };

    return (
        <AppLayout title="Arsip Pengumuman Publik">
            <Head title="Manajemen Pengumuman" />

            <div className="space-y-8 pb-24">
                {/* Header */}
                <div className="relative overflow-hidden rounded-lg bg-white p-6 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200">
                                <Megaphone className="h-4 w-4 text-emerald-300" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-100 italic uppercase tracking-widest">
                                CONTENT_MANAGEMENT_UNIT
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white ">
                            Arsip <span className="text-emerald-300">Pengumuman</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                            Kelola publikasi informasi strategis, jadwal pendaftaran, dan pedoman operasional KKN untuk akses publik.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <button 
                            onClick={openCreateModal}
                            className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center gap-3 shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            BUAT_PUBLIKASI_BARU
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Konten_Daring</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Klasifikasi</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status_Publikasi</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest pr-10">Aksi_Operasional</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {announcements.data.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{a.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>DIUNGGAH: {dayjs(a.published_at).format('DD MMM YYYY HH:mm')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] tracking-widest">
                                                {a.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            {a.is_active ? (
                                                <div className="flex items-center gap-2 text-emerald-500 text-[11px] tracking-widest">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    LIVE_ACTIVE
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 text-[11px] tracking-widest">
                                                    <XCircle className="w-4 h-4" />
                                                    ARCHIVED_DRAFT
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right pr-6">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => openEditModal(a)}
                                                    className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteAnnouncement(a.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {announcements.meta && (
                        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100">
                            <Pagination meta={announcements.meta} />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingAnnouncement ? 'MODIFIKASI_PENGUMUMAN' : 'PUBLIKASI_DATA_BARU'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">Judul_Publikasi</label>
                                    <input 
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                                        placeholder="Masukkan judul pengumuman..."
                                    />
                                    {errors.title && <p className="text-xs text-red-500 italic">{errors.title}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">Kategori_Mistar</label>
                                    <select 
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                                    >
                                        <option value="PENGUMUMAN">PENGUMUMAN_UMUM</option>
                                        <option value="PENDAFTARAN">STATUS_PENDAFTARAN</option>
                                        <option value="PEDOMAN">DIREKTORI_PEDOMAN</option>
                                        <option value="HASIL_SELEKSI">HASIL_SELEKSI_FINAL</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">Waktu_Publikasi</label>
                                    <input 
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={e => setData('published_at', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">Konten_Visual_Teks</label>
                                    <textarea 
                                        rows={6}
                                        value={data.content}
                                        onChange={e => setData('content', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none"
                                        placeholder="Tuliskan isi pengumuman secara detail di sini..."
                                    />
                                    {errors.content && <p className="text-xs text-red-500 italic">{errors.content}</p>}
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        <span className="ml-3 text-xs font-black text-slate-900 uppercase tracking-widest">STATUS_LIVE</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-5">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-10 h-14 rounded-xl text-[11px] font-black tracking-widest"
                                >
                                    BATALKAN
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="px-10 h-14 rounded-xl text-[11px] font-black tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                                >
                                    {processing ? 'MENGIRIM_DATA...' : 'SIMPAN_PEMBARUAN'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
        </AppLayout>
    );
}
