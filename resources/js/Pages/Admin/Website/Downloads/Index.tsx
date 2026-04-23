import { useState } from 'react';
import { router, Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PageProps, Download } from '@/types';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  X,
  FileDown,
  CloudUpload,
  Save,
  FileIcon,
  Globe,
  ShieldCheck,
  Database,
  Archive,
  RefreshCw,
  Activity,
  Zap,
  Cpu,
  LayoutGrid
} from 'lucide-react';
import dayjs from 'dayjs';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import StatusTag from '@/Components/Premium/StatusTag';

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
    <AppLayout title="Pusat Unduhan">
      <Head title="Manajemen Aset Digital | SIBERDAYA" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title="Pusat Unduhan."
          subtitle="Repositori aset digital, panduan operasional, dan berkas administrasi utama."
          icon={FileDown}
          groupLabel="Website & Repositori"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={openCreateModal} 
              className="h-12 px-8 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} /> Tambah Aset
            </button>
          </div>
        </PageHeader>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Aset" value={downloads.meta.total} icon={Archive} variant="gray" />
          <StatCard label="Vaults Aktif" value={downloads.data.filter(d => d.is_active).length} icon={Database} variant="success" />
          <StatCard label="IOPS Status" value="LOW_LATENCY" icon={Activity} variant="info" />
          <StatCard label="Sync Mode" value="GLOBAL_CDN" icon={Globe} variant="gray" />
        </div>

        {/* MAIN CONTENT */}
        <ContentPanel
          title="Global Binary Archive Ledger"
          description="Daftar berkas administrasi dan panduan operasional yang dapat diunduh publik."
          icon={LayoutGrid}
          padding={false}
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                  Integritas Binary Terverifikasi &middot; {downloads.meta.total} Aset Terdaftar
                </span>
              </div>
              <Pagination meta={downloads.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Asset Identifier', 'Infrastructure Source', 'Release Status', 'Opsi']}
            isEmpty={downloads.data.length === 0}
            emptyText="Belum ada aset digital yang terdaftar."
          >
            {downloads.data.map((d) => (
              <PremiumTableRow key={d.id} className="group">
                <PremiumTableCell>
                  <div className="flex items-center gap-4 py-1">
                    <div className="h-10 w-10 bg-gray-50 border border-emerald-50 text-emerald-200 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <FileDown size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors line-clamp-1">{d.title}</span>
                      <span className="text-[9px] font-black text-emerald-950/40 font-mono tracking-tighter uppercase">ID_{String(d.id).padStart(4,'0')} &middot; {dayjs(d.created_at).format('YYYY-MM-DD')}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <span className={clsx(
                    "inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest",
                    d.file_path ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {d.file_path ? 'LOCAL_VAULT' : 'EXTERNAL_CDN'}
                  </span>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <StatusTag status={d.is_active ? 'active' : 'draft'} label={d.is_active ? 'RELEASED' : 'DRAFT_STG'} size="sm" />
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEditModal(d)} className="h-9 px-3 bg-white border border-gray-100 text-emerald-900 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase">
                      <Pencil size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => { if(confirm('Hapus aset?')) router.delete(route('admin.unduhan.destroy', d.id)) }} 
                      className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

      </div>

      {/* ASSET MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden rounded-[2rem] border border-emerald-50 flex flex-col"
            >
              <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-600 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-600/20">
                    <CloudUpload size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">{editingDownload ? 'Revisi Aset' : 'Injeksi Binary'}</h3>
                    <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-widest">Panel Repositori Digital</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-rose-50 text-emerald-900 hover:text-rose-600 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={submit} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Judul Identitas Aset</label>
                  <input 
                    value={data.title} 
                    onChange={e => setData('title', e.target.value.toUpperCase())} 
                    className="w-full h-14 bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-6 text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all" 
                    placeholder="PANDUAN_OPERASIONAL_2026" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Binary Source</label>
                    <div className="relative h-14 w-full bg-[#F8FAF9] rounded-2xl border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center gap-1 overflow-hidden group/img transition-all hover:border-emerald-400">
                      <input type="file" onChange={e => setData('file', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      {data.file ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" size={20} strokeWidth={2.5} />
                          <span className="text-[9px] font-black text-emerald-950 uppercase tracking-tight truncate w-24">{data.file.name}</span>
                        </div>
                      ) : (
                        <>
                          <FileDown size={20} className="text-emerald-100 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black text-emerald-800/30 uppercase tracking-widest">Local Binary</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">External Proxy</label>
                    <div className="h-14 w-full bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl px-4 flex items-center gap-3">
                      <Globe size={18} className="text-emerald-300 shrink-0" />
                      <input value={data.external_url} onChange={e => setData('external_url', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black text-emerald-950 placeholder:text-gray-200" placeholder="https://drive.google.com/..." />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={20} className={clsx(data.is_active ? "text-emerald-600" : "text-emerald-200")} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest leading-none mb-1">Status Visibilitas</span>
                      <span className="text-[9px] font-bold text-emerald-700/50 uppercase tracking-tight">Siap dipublikasi ke portal.</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={data.is_active} 
                    onChange={e => setData('is_active', e.target.checked)} 
                    className="h-6 w-6 rounded-lg border-emerald-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer shadow-sm transition-all"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 text-[10px] font-black text-emerald-950 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Batalkan</button>
                  <button 
                    type="submit" 
                    disabled={processing} 
                    className="flex-[2] h-14 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
                  >
                    {processing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />} 
                    Komit Binary
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
