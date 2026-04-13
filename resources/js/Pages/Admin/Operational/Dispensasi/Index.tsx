import { type FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  X,
  Activity,
  Zap,
  Briefcase,
  CheckCircle2,
  UserCheck,
  Cpu,
  ShieldAlert,
  Database,
  Fingerprint,
  Layers3,
  Info,
  RefreshCw,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';

interface Dispensasi {
  id: number; nim: string; alasan: string; bypassed_requirements: string[] | null; is_active: boolean; created_at: string; periode?: { id: number; name: string } | null; granted_by_user?: { id: number; name: string } | null;
}
interface Period { id: number; name: string; }
interface Props { dispensasi: { data: Dispensasi[]; meta: PaginationMeta; }; periods: Period[]; filters: { search?: string }; }

const REQUIREMENT_OPTIONS = [
  { value: 'min_sks', label: 'SKS MINIMUM' }, { value: 'min_gpa', label: 'IPK MINIMUM' }, { value: 'bta_ppi', label: 'BTA / PPI' }, { value: 'documents', label: 'DOCUMENTS' }, { value: 'personal_status', label: 'STATUS' }, { value: 'program_prodi', label: 'PRODI' },
];

export default function DispensasiIndex({ dispensasi, periods, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [showForm, setShowForm] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const form = useForm({ nim: '', period_id: '', alasan: '', bypassed_requirements: [] as string[] });

  const handleSearch = (e: FormEvent) => { e.preventDefault(); router.get('/admin/dispensasi', { search: search || undefined }, { preserveState: true, replace: true }); };
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); form.post('/admin/dispensasi', { onSuccess: () => { form.reset(); setShowForm(false); } }); };
  const toggleRequirement = (v: string) => { const curr = form.data.bypassed_requirements; form.setData('bypassed_requirements', curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v]); };

  return (
    <AppLayout title="Manajemen Dispensasi KKN">
      <Head title="Dispensasi KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <ShieldAlert size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Operasional & Kebijakan Khusus</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Dispensasi <span className="text-emerald-500">KKN.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Otoritas Pengecualian Syarat Akademik dan Manajemen Kelayakan Khusus Mahasiswa Terverifikasi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status Waiver</span>
                            <span className="text-sm font-black text-slate-900 tabular-nums leading-none tracking-tight">{dispensasi.meta.total} AKTIF</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className={clsx(
                            "h-14 px-8 rounded-2xl font-bold shadow-xl flex items-center gap-3 text-sm transition-all active:scale-95 uppercase tracking-wider",
                            showForm ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100"
                        )}
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} className="text-white" />}
                        {showForm ? 'BATAL' : 'BERI DISPENSASI'}
                    </button>
                </div>
            </div>
        </div>

        {/* --- FORM PANEL --- */}
        <AnimatePresence>
            {showForm && (
                <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-emerald-100/50 shadow-2xl">
                    <div className="p-1 bg-emerald-500" />
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">NIM Mahasiswa</label>
                                <div className="relative group">
                                    <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input value={form.data.nim} onChange={e => form.setData('nim', e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none uppercase placeholder:text-slate-200 transition-all font-mono" placeholder="Input NIM..." required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Periode Berlaku</label>
                                <div className="relative">
                                    <select value={form.data.period_id} onChange={e => form.setData('period_id', e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:bg-white focus:border-emerald-500 appearance-none transition-all">
                                        <option value="">— SELURUH PERIODE (GLOBAL) —</option>
                                        {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                    </select>
                                    <RefreshCw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Alasan / Justifikasi</label>
                                <input value={form.data.alasan} onChange={e => form.setData('alasan', e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none placeholder:text-slate-200 transition-all" placeholder="Misal: Mahasiswa Transfer / Tugas Akhir" required />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" /> Matrix Pengecualian Syarat
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {REQUIREMENT_OPTIONS.map(opt => (
                                    <button 
                                        key={opt.value} 
                                        type="button" 
                                        onClick={() => toggleRequirement(opt.value)} 
                                        className={clsx(
                                            "px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border", 
                                            form.data.bypassed_requirements.includes(opt.value) 
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                                : "bg-white border-slate-100 text-slate-400 hover:border-emerald-500 hover:text-emerald-600"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-50">
                             <button 
                                type="submit" 
                                disabled={form.processing} 
                                className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-wider shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                             >
                                {form.processing ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                TERBITKAN DISPENSASI
                             </button>
                        </div>
                    </form>
                </motion.section>
            )}
        </AnimatePresence>

        {/* --- LEDGER --- */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                 <div className="flex items-center gap-5">
                    <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <Layers3 size={24} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Log Otorisasi Dispensasi</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar Pengecualian Syarat Mahasiswa Terverifikasi</p>
                    </div>
                 </div>
                 <form onSubmit={handleSearch} className="relative w-full md:w-80 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all uppercase placeholder:text-slate-300" placeholder="Cari NIM Pengguna..." />
                 </form>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-50">
                        <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-10 py-6">Identitas & NIM</th>
                            <th className="px-10 py-6 text-center">Periode Berlaku</th>
                            <th className="px-10 py-6 text-center">Pengecualian Dialihkan</th>
                            <th className="px-10 py-6 text-center">Diterbitkan Oleh</th>
                            <th className="px-10 py-6 text-right">Kontrol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {dispensasi.data.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-10 py-8">
                                    <div className="flex flex-col">
                                        <span className="text-[15px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors italic font-mono uppercase leading-none tracking-tighter">{item.nim}</span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[200px]">{item.alasan}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.periode?.name || 'GLOBAL / SEMUA'}</span>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex flex-wrap justify-center gap-1.5 max-w-[250px] mx-auto">
                                        {(item.bypassed_requirements || []).map(r => (
                                            <span key={r} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-emerald-100">{r.replace('_', ' ')}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                     <div className="flex items-center justify-center gap-3">
                                        <div className="h-8 w-8 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center border border-slate-100"><UserCheck size={14} /></div>
                                        <span>{item.granted_by_user?.name || 'SYSTEM ADMIN'}</span>
                                     </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                     <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button onClick={() => setRevokingId(item.id)} className="h-10 px-5 bg-white border border-slate-200 text-rose-400 hover:text-rose-600 hover:border-rose-200 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"><Trash2 size={16} /> Cabut Akses</button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                        {dispensasi.data.length === 0 && (
                            <tr><td colSpan={5} className="py-40 text-center">
                                <div className="flex flex-col items-center gap-6 text-slate-200">
                                    <ShieldAlert size={64} strokeWidth={1} />
                                    <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database Dispensasi Kosong</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Database sinkron &middot; SIKKKN UIN SAIZU</span>
                <Pagination meta={dispensasi.meta} />
            </div>
        </section>

        {/* --- INFO CARD (CLEAN EMERALD) --- */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-12 text-emerald-900 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16 text-emerald-600"><ShieldCheck size={350} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex items-center gap-10">
                    <div className="h-20 w-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shrink-0 text-white shadow-xl shadow-emerald-200">
                        <ShieldAlert size={40} />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">Protokol Kebijakan Khusus</h4>
                        <p className="text-sm font-medium text-emerald-700/70 max-w-3xl leading-relaxed">
                            Otoritas dispensasi memungkinkan mahasiswa dengan kondisi khusus untuk tetap dapat melakukan pendaftaran KKN. Pastikan alasan dan persyaratan yang dilewati telah melalui tinjauan kebijakan LPPM.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <ConfirmDialog open={!!revokingId} onClose={() => setRevokingId(null)} onConfirm={() => { if(revokingId) router.delete(`/admin/dispensasi/${revokingId}`, { onSuccess: () => setRevokingId(null) }); }} title="Batalkan Dispensasi" message="Apakah Anda yakin ingin mencabut otorisasi pengecualian ini? Mahasiswa akan kembali ke validasi standar sistem." confirmLabel="Ya, Cabut Dispensasi" confirmVariant="danger" />
    </AppLayout>
  );
}

function WaiverMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={20} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</span>
                <span className="text-2xl font-extrabold text-slate-900 uppercase tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
