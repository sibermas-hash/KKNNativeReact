import { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  X,
  Fingerprint,
  Activity,
  Target,
  Layers,
  Binary,
  RefreshCw,
  ShieldCheck,
  Zap,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  PenTool,
  Save,
  Search,
  FileText,
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

interface QuillInstance {
  on: (event: string, callback: () => void) => void;
  root: HTMLElement;
  clipboard: { convert: (html: string) => unknown };
  setContents: (delta: unknown, mode: string) => void;
}

const QuillEditor = ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string; }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<QuillInstance | null>(null);

  useEffect(() => {
    const loadQuill = async () => {
      if (typeof window === 'undefined') return;
      if (!document.getElementById('quill-css')) {
        const link = document.createElement('link');
        link.id = 'quill-css'; link.rel = 'stylesheet'; link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        document.head.appendChild(link);
      }
      if (!(window as any).Quill) {
        const script = document.createElement('script');
        script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js'; script.async = true;
        script.onload = () => initQuill();
        document.body.appendChild(script);
      } else initQuill();
    };
    const initQuill = () => {
      if (editorRef.current && !quillInstance.current) {
        const Quill = (window as any).Quill;
        quillInstance.current = new Quill(editorRef.current, {
          theme: 'snow', placeholder: placeholder || 'ENTER_NARRATIVE_STREAM...',
          modules: { toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']] }
        });
        quillInstance.current.on('text-change', () => onChange(quillInstance.current.root.innerHTML));
      }
    };
    loadQuill();
  }, []);

  useEffect(() => {
    if (quillInstance.current && value !== quillInstance.current.root.innerHTML) {
      const delta = quillInstance.current.clipboard.convert(value || '');
      quillInstance.current.setContents(delta, 'silent');
    }
  }, [value]);

  return <div className="bg-white border border-slate-100 rounded-xl overflow-hidden min-h-[400px]"><div ref={editorRef} /></div>;
};

interface Props extends PageProps {
  announcements: { data: (Announcement & { slug?: string; image?: string; meta_title?: string; meta_description?: string; meta_keywords?: string; })[]; meta: PaginationMeta; };
}

export default function AnnouncementIndex({ announcements }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<(Announcement & { slug?: string; image?: string; meta_title?: string; meta_description?: string; meta_keywords?: string; }) | null>(null);

  const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
    title: '', slug: '', category: 'PENGUMUMAN', content: '', image: null as File | null, is_active: true, published_at: dayjs().format('YYYY-MM-DDTHH:mm'), meta_title: '', meta_description: '', meta_keywords: '',
  });

  const openCreateModal = () => { setEditingAnnouncement(null); reset(); clearErrors(); setIsModalOpen(true); };
  const openEditModal = (a: Announcement) => {
    setEditingAnnouncement(a);
    setData({ title: a.title, slug: a.slug || '', category: a.category, content: a.content, image: null, is_active: a.is_active, published_at: dayjs(a.published_at).format('YYYY-MM-DDTHH:mm'), meta_title: a.meta_title || '', meta_description: a.meta_description || '', meta_keywords: a.meta_keywords || '' });
    clearErrors(); setIsModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAnnouncement ? route('admin.warta-utama.update', editingAnnouncement.id) : route('admin.warta-utama.store');
    router.post(url, { ...data, _method: editingAnnouncement ? 'PATCH' : 'POST' }, { forceFormData: true, onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  const generateSlug = (val: string) => setData('slug', val.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'));

  return (
    <AppLayout title="Manajemen Warta Utama">
      <Head title="Warta Utama" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Megaphone size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Konten Publik & Komunikasi</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Warta <span className="text-emerald-500">Utama.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Pusat Komunikasi Publik dan Manajemen Informasi Strategis LPPM UIN SAIZU
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={openCreateModal} 
                        className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center gap-3 text-sm transition-all active:scale-95 uppercase tracking-wider"
                    >
                        <Plus size={20} className="text-white" /> TERBITKAN WARTA
                    </button>
                </div>
            </div>
        </div>

        {/* --- METRIC STRIP --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnnouncementMetric label="Broadcast Total" value={announcements.meta?.total || 0} icon={Megaphone} />
            <AnnouncementMetric label="SEO Matrix" value="OPTIMIZED" icon={Globe} />
            <AnnouncementMetric label="Transmission" value="ACTIVE" icon={Zap} />
            <AnnouncementMetric label="Visibility" value="PUBLIC" icon={ShieldCheck} />
        </div>

        {/* --- TABLE --- */}
        <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Layers size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Institutional Communication Ledger</span>
                 </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Narrative & Asset</th>
                            <th className="px-6 py-4 text-center">Protocol Tag</th>
                            <th className="px-6 py-4 text-center">Search Matrix</th>
                            <th className="px-6 py-4 text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {announcements.data.map((a) => (
                            <tr key={a.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        {a.image ? (
                                            <img src={`/storage/${a.image}`} className="h-10 w-16 rounded-lg object-cover border border-slate-100 shadow-sm" alt="" />
                                        ) : (
                                            <div className="h-10 w-16 bg-slate-50 border border-slate-100 text-slate-200 rounded-lg flex items-center justify-center italic"><ImageIcon size={16} /></div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-slate-900 uppercase italic group-hover:text-emerald-700 transition-colors truncate max-w-[300px]">{a.title}</span>
                                            <div className="flex items-center gap-2 mt-1 opacity-40">
                                                <LinkIcon size={10} className="text-emerald-500" />
                                                <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest">/warta/{a.slug || a.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                     <span className="inline-flex h-6 items-center px-3 bg-emerald-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest italic">{a.category}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                     <div className={clsx('inline-flex h-6 items-center px-3 rounded-md text-[8px] font-black uppercase tracking-widest italic border', a.meta_title ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100')}>
                                        {a.meta_title ? 'OPTIMIZED' : 'LEGACY'}
                                     </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button onClick={() => openEditModal(a)} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-lg flex items-center justify-center transition-all shadow-sm"><Edit2 size={14} /></button>
                                        <button onClick={() => { if(confirm('Hapus warta?')) router.delete(route('admin.warta-utama.destroy', a.id)) }} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg flex items-center justify-center transition-all shadow-sm"><Trash2 size={14} /></button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Broadcast Stream Nominal. Sync Active.</span>
                <Pagination meta={announcements.meta} />
            </div>
        </section>

        {/* --- MODAL --- */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-5xl bg-white shadow-2xl overflow-hidden rounded-xl border border-slate-100 flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-600 text-white flex items-center justify-center rounded-lg shadow-lg"><PenTool size={20} /></div>
                        <h3 className="text-sm font-black uppercase tracking-widest italic">{editingAnnouncement ? 'Revise_Narrative' : 'Initial_Narrative'}</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <form id="cms-form" onSubmit={submit} className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narrative_Title</label>
                                <input value={data.title} onChange={e => { setData('title', e.target.value); if(!editingAnnouncement) generateSlug(e.target.value); }} className="w-full text-2xl font-black text-slate-900 placeholder:text-slate-100 bg-transparent border-none focus:ring-0 outline-none p-0 tracking-tight uppercase italic leading-none" placeholder="ENTER_TITLE..." required />
                                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-50 rounded-md border border-slate-100 w-fit">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/warta/</span>
                                    <input value={data.slug} onChange={e => setData('slug', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black text-emerald-600 w-48 uppercase tracking-widest italic" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narrative_Body</label>
                                <QuillEditor value={data.content} onChange={val => setData('content', val)} />
                            </div>
                        </div>
                        <aside className="w-full lg:w-72 space-y-4 shrink-0">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Asset_Proxy</label>
                                    <div className="relative h-32 w-full bg-white rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 overflow-hidden group/img">
                                        <input type="file" onChange={e => setData('image', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {data.image ? <CheckCircle2 className="text-emerald-500" size={24} /> : <ImageIcon size={24} className="text-slate-200" />}
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{data.image ? 'IMAGE_QUEUED' : 'INJECT_IMAGE'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Transmit_Time</label>
                                    <input type="datetime-local" value={data.published_at} onChange={e => setData('published_at', e.target.value)} className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-[10px] font-black outline-none focus:border-emerald-500 italic shadow-sm" />
                                </div>
                                <div className="flex items-center justify-between gap-2 px-1">
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Matrix_Active</span>
                                     <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shadow-sm" />
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">SEO_Title</label>
                                    <input value={data.meta_title} onChange={e => setData('meta_title', e.target.value)} className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[10px] font-bold italic outline-none focus:border-emerald-500" placeholder="Meta title..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">SEO_Desc</label>
                                    <textarea value={data.meta_description} onChange={e => setData('meta_description', e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold italic outline-none focus:border-emerald-500 resize-none" placeholder="Meta description..." />
                                </div>
                            </div>
                        </aside>
                    </form>
                 </div>
                 <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 shrink-0">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Narrative Stream Buffer v2.5</span>
                    <Button form="cms-form" type="submit" disabled={processing} className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-3 group active:scale-95">{processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} className="text-white" />} COMMIT_BROADCAST</Button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex justify-center pt-8 opacity-20">
            <div className="flex items-center gap-3 text-slate-300 font-bold text-[9px] uppercase tracking-[0.4em] italic leading-none">
                <Zap size={12} className="text-emerald-500 animate-pulse" />
                Broadcast Stream Secured • Institutional Narrative Standard
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

function AnnouncementMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
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
