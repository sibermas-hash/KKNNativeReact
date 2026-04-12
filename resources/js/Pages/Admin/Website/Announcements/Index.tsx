import { useState, useEffect, useRef } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, Badge } from '@/Components/ui';
import type { PageProps, Announcement } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    X,
    Fingerprint,
    Database,
    Clock,
    ChevronRight,
    FileText,
    History,
    Zap,
    Shield,
    Bell,
    Globe,
    Image as ImageIcon,
    Search as SearchIcon,
    Link as LinkIcon,
    Type,
    Layout,
    ArrowUpRight,
    Activity,
    Target,
    Layers,
    Binary,
    Lock,
    Unlock,
    RefreshCw,
    ShieldCheck,
    Cpu,
    ArrowRight
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

// Dynamic Quill Loader with Premium Styling
const QuillEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<any>(null);

    useEffect(() => {
        const loadQuill = async () => {
            if (typeof window === 'undefined') return;
            if (!document.getElementById('quill-css')) {
                const link = document.createElement('link');
                link.id = 'quill-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
                document.head.appendChild(link);
            }
            if (!(window as any).Quill) {
                const script = document.createElement('script');
                script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
                script.async = true;
                script.onload = () => initQuill();
                document.body.appendChild(script);
            } else {
                initQuill();
            }
        };

        const initQuill = () => {
            if (editorRef.current && !quillInstance.current) {
                const Quill = (window as any).Quill;
                quillInstance.current = new Quill(editorRef.current, {
                    theme: 'snow',
                    placeholder: placeholder || 'ENTER_NARRATIVE_STREAM...',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                        ]
                    }
                });
                quillInstance.current.on('text-change', () => {
                    onChange(quillInstance.current.root.innerHTML);
                });
            }
        };
        loadQuill();
    }, []);

    useEffect(() => {
        if (quillInstance.current && value !== quillInstance.current.root.innerHTML) {
            quillInstance.current.root.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="bg-slate-50 border-none rounded-[2.5rem] overflow-hidden shadow-inner min-h-[500px] border-4 border-transparent focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <div ref={editorRef} />
        </div>
    );
};

interface Props extends PageProps {
    announcements: {
        data: (Announcement & {
            slug?: string;
            image?: string;
            meta_title?: string;
            meta_description?: string;
            meta_keywords?: string;
        })[];
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

export default function AnnouncementIndex({ announcements }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

    const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
        title: '',
        slug: '',
        category: 'PENGUMUMAN',
        content: '',
        image: null as File | null,
        is_active: true,
        published_at: dayjs().format('YYYY-MM-DDTHH:mm'),
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });

    const openCreateModal = () => {
        setEditingAnnouncement(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (a: any) => {
        setEditingAnnouncement(a);
        setData({
            title: a.title,
            slug: a.slug || '',
            category: a.category,
            content: a.content,
            image: null,
            is_active: a.is_active,
            published_at: dayjs(a.published_at).format('YYYY-MM-DDTHH:mm'),
            meta_title: a.meta_title || '',
            meta_description: a.meta_description || '',
            meta_keywords: a.meta_keywords || '',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAnnouncement) {
            router.post(route('admin.warta-utama.update', editingAnnouncement.id), {
                ...data,
                _method: 'PATCH',
            }, {
                forceFormData: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.warta-utama.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteAnnouncement = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini secara permanen?')) {
            router.delete(route('admin.warta-utama.destroy', id));
        }
    };

    const generateSlug = (val: string) => {
        const slug = val.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
        setData('slug', slug);
    };

    return (
        <AppLayout title="Public Communication Command">
            <Head title="CMS Warta Utama | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Public Communication Command</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Narrative <span>Matrix.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pusat distribusi warta publik. <br />
                            <span className="text-slate-900 not-italic">Editor profesional untuk optimalisasi narasi institusional, manajemen konten dinamis, dan indexasi SEO global.</span>
                        </p>
                    </div>

                    <Button 
                        onClick={openCreateModal}
                        className="h-24 px-12 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500"
                    >
                        <Plus size={24} className="text-emerald-500 group-hover:rotate-90 transition-transform" />
                        INITIALIZE_NARRATIVE
                    </Button>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Broadcast Total" value={announcements.meta?.total || 0} icon={Megaphone} color="emerald" desc="Total narrative vectors published" />
                    <MetricCard label="Jangkauan Global" value="OPTIMASI_SEO" icon={Globe} color="emerald" desc="Kompatibilitas algoritma nominal" />
                    <MetricCard label="Kernel Engine" value="vNARRATIVE 2.0" icon={Cpu} color="emerald" desc="Transmission logic secure" />
                </motion.div>

                {/* --- NARRATIVE LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Layers size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Narrative stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Buku Besar Siaran Global</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Active Loops</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {announcements.data.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Narrative & Asset</th>
                                    <th className="px-12 py-8 text-center">Protocol Tag</th>
                                    <th className="px-12 py-8 text-center">Search Matrix</th>
                                    <th className="px-12 py-8 text-right">Kernel Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {announcements.data.length > 0 ? (
                                    announcements.data.map((a) => (
                                        <tr key={a.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-8">
                                                    {a.image ? (
                                                        <div className="relative">
                                                            <img 
                                                                src={`/storage/${a.image}`} 
                                                                className="h-20 w-32 rounded-[1.5rem] object-cover border border-slate-100 shadow-xl group-hover:scale-105 transition-transform"
                                                                alt=""
                                                            />
                                                            <div className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-black/5" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-20 w-32 bg-slate-50 border border-slate-100 text-slate-200 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all">
                                                            <ImageIcon size={30} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight uppercase italic truncate max-w-lg">{a.title}</span>
                                                        <div className="flex items-center gap-3">
                                                             <LinkIcon size={12} className="text-emerald-500/50" />
                                                             <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest italic leading-none">/warta/{a.slug || `id-${a.id}`}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="inline-flex h-8 items-center px-6 bg-slate-950 text-white rounded-xl text-[9px] font-black tracking-[0.25em] shadow-xl italic group-hover:bg-emerald-600 transition-colors uppercase">
                                                    {a.category.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {a.meta_title ? (
                                                        <div className="flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                                            <Activity size={10} className="animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">OPTIMIZED</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 text-slate-300 rounded-xl border border-slate-100">
                                                            <Target size={10} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">NO_META</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <button 
                                                        onClick={() => openEditModal(a)}
                                                        className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm transition-all active:scale-95"
                                                    >
                                                        <Edit2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteAnnouncement(a.id)}
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
                                                <Megaphone size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Narrative Loop Null</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO NARRATIVE VECTORS DETECTED IN BROADCAST BUFFER.</p>
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
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hub Komunikasi Aktif. Aliran Siaran Global Nominal.</span>
                        </div>
                        <Pagination 
                            meta={announcements.meta}
                            onPageChange={(page) => router.visit(route('admin.warta-utama.index', { page }), { preserveState: true, preserveScroll: true })}
                        />
                    </div>
                </motion.section>

                {/* --- PROFESSIONAL CMS MODAL --- */}
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
                                className="relative w-full max-w-7xl h-full bg-white shadow-2xl overflow-hidden flex flex-col md:rounded-[4rem] border border-white/20"
                            >
                                {/* Modal Header */}
                                <div className="px-14 py-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                                    <div className="flex items-center gap-8">
                                        <div className="h-16 w-16 bg-slate-900 text-white flex items-center justify-center rounded-[1.5rem] shadow-2xl">
                                            <PenTool size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                                {editingAnnouncement ? `Narrative_Revision` : 'Initial_Narrative'}
                                            </h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mt-1 leading-none">SIKKKN Narrative Matrix Protocol</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="h-14 w-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm border border-slate-100">
                                        <X size={24} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Editor Layout */}
                                <div className="flex-1 overflow-y-auto bg-slate-50/20 scrollbar-hide">
                                    <form id="cms-form" onSubmit={submit} className="flex flex-col xl:flex-row h-full">
                                        {/* Main Editor Area */}
                                        <div className="flex-1 p-14 space-y-12 bg-white">
                                            {/* Title Field */}
                                            <div className="space-y-6">
                                                <input 
                                                    value={data.title}
                                                    onChange={e => {
                                                        setData('title', e.target.value);
                                                        if (!editingAnnouncement) generateSlug(e.target.value);
                                                    }}
                                                    className="w-full text-5xl font-black text-slate-900 placeholder:text-slate-100 bg-transparent border-none focus:ring-0 outline-none p-0 tracking-tighter uppercase italic leading-none"
                                                    placeholder="ENTER_NARRATIVE_TITLE..."
                                                />
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-6 py-2 rounded-2xl border border-emerald-100">
                                                        <LinkIcon size={14} className="animate-pulse" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest italic underline decoration-emerald-200 underline-offset-4">/warta/</span>
                                                        <input 
                                                            value={data.slug}
                                                            onChange={e => setData('slug', e.target.value)}
                                                            className="bg-transparent border-none p-0 focus:ring-0 text-[11px] font-black text-emerald-700 w-64 uppercase tracking-widest italic"
                                                            placeholder="slug-path..."
                                                        />
                                                    </div>
                                                </div>
                                                {errors.title && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">VALIDATION_ERROR: {errors.title}</p>}
                                            </div>

                                            {/* Rich Text Editor */}
                                            <div className="space-y-6 pt-10">
                                                <div className="flex items-center gap-4 text-slate-300">
                                                     <FileText size={18} />
                                                     <span className="text-xs font-black uppercase tracking-[0.4em] italic text-slate-200">Narrative Body Stream</span>
                                                </div>
                                                <QuillEditor 
                                                    value={data.content}
                                                    onChange={val => setData('content', val)}
                                                />
                                                {errors.content && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic ml-4">VALIDATION_ERROR: {errors.content}</p>}
                                            </div>
                                        </div>

                                        {/* Sidebar Controls */}
                                        <aside className="w-full xl:w-96 border-l border-slate-50 p-12 space-y-12 bg-slate-50/30">
                                            {/* Publish Panel */}
                                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-8 group/side">
                                                <div className="flex items-center gap-4 text-emerald-600">
                                                    <Zap size={18} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Transmission</span>
                                                </div>
                                                <div className="space-y-6">
                                                    <label className="flex items-center justify-between cursor-pointer group/toggle">
                                                        <span className="text-[10px] font-black text-slate-400 group-hover/toggle:text-slate-900 transition-colors uppercase tracking-widest italic">Matrix_Active</span>
                                                        <div className="relative inline-flex items-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={data.is_active}
                                                                onChange={e => setData('is_active', e.target.checked)}
                                                                className="sr-only peer" 
                                                            />
                                                            <div className="w-14 h-7 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                                                        </div>
                                                    </label>
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2 leading-none">Transmit_Time</span>
                                                        <input 
                                                            type="datetime-local"
                                                            value={data.published_at}
                                                            onChange={e => setData('published_at', e.target.value)}
                                                            className="w-full h-14 bg-slate-100 border-none rounded-2xl px-6 text-[10px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 italic shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SEO & Meta Panel */}
                                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                                                <div className="flex items-center gap-4 text-slate-400">
                                                    <Globe size={18} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Search Matrix</span>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2 leading-none">SEO_Title</span>
                                                        <input 
                                                            value={data.meta_title}
                                                            onChange={e => setData('meta_title', e.target.value)}
                                                            className="w-full h-14 bg-slate-100 border-none rounded-2xl px-6 text-[11px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 italic shadow-sm"
                                                            placeholder="Meta title..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2 leading-none">SEO_Desc</span>
                                                        <textarea 
                                                            value={data.meta_description}
                                                            onChange={e => setData('meta_description', e.target.value)}
                                                            rows={3}
                                                            className="w-full bg-slate-100 border-none rounded-2xl p-6 text-[10px] font-bold text-slate-700 resize-none outline-none focus:ring-4 focus:ring-emerald-500/10 italic leading-relaxed shadow-sm uppercase tracking-tight"
                                                            placeholder="Meta description..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Feature Image Panel */}
                                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                                                <div className="flex items-center gap-4 text-slate-400">
                                                    <ImageIcon size={18} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Asset Proxy</span>
                                                </div>
                                                <div className="relative group/img overflow-hidden rounded-[2rem] border-4 border-dashed border-slate-50 hover:border-emerald-200 transition-all bg-slate-100 shadow-inner">
                                                    <input 
                                                        type="file" 
                                                        onChange={e => setData('image', e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="p-10 flex flex-col items-center gap-4">
                                                        <ImageIcon size={32} strokeWidth={1} className={clsx("transition-transform group-hover/img:scale-110", data.image ? "text-emerald-500" : "text-slate-300")} />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center leading-none">
                                                            {data.image ? 'VECTOR_UPLOADED' : 'INJECT_THUMBNAIL'}
                                                        </span>
                                                    </div>
                                                    {data.image && (
                                                         <div className="absolute inset-0 bg-emerald-600 flex items-center justify-center pointer-events-none">
                                                            <CheckCircle2 className="text-white animate-bounce" size={32} />
                                                         </div>
                                                    )}
                                                </div>
                                            </div>
                                        </aside>
                                    </form>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-14 py-10 bg-white border-t border-slate-50 flex items-center justify-between shrink-0">
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="px-6 py-2 bg-slate-950 text-emerald-500 rounded-full text-[9px] font-black tracking-[0.3em] shadow-xl italic uppercase">
                                             KERNEL_VER: 2.5
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Stream Buffer Synced</span>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <button onClick={() => setIsModalOpen(false)} className="text-[11px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-[0.3em] transition-colors italic">ABORT_PUBLISH</button>
                                        <Button 
                                            form="cms-form"
                                            type="submit"
                                            disabled={processing}
                                            className="h-20 px-16 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500"
                                        >
                                            <AnimatePresence mode="wait">
                                                 {processing ? (
                                                     <RefreshCw size={24} className="animate-spin" />
                                                 ) : (
                                                     <Zap size={24} className="text-emerald-500 group-hover:animate-pulse" />
                                                 )}
                                            </AnimatePresence>
                                            {processing ? 'TRANSMITTING...' : 'INITIATE_BROADCAST'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-950 rounded-[4rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover/f:rotate-12 transition-transform duration-1000">
                         <Target size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <ShieldCheck className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Narrative Governance</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Communication Standards</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                SIKKKN Narrative Matrix mematuhi standar komunikasi internal UIN Saizu. Seluruh publikasi narasi akan diarsipkan secara permanen dan disinkronkan dengan kanal informasi resmi universitas untuk transparansi publik.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Broadcast Stream Secured</span>
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
