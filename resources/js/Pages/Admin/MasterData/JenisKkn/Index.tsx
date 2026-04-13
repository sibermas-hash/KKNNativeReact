import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Eye,
  Edit2,
  Settings2,
  Search,
  Filter,
  Activity,
  ChevronRight,
  Component,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface JenisKkn {
  id: number;
  code: string;
  name: string;
  description: string | null;
  registration_mode: string;
  placement_mode: string;
  registration_mode_label: string;
  placement_mode_label: string;
  min_sks: number;
  min_gpa: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  periodes_count: number;
}

interface Props {
  jenisKkn: JenisKkn[];
  filters: { search?: string };
  registrationModes: { value: string; label: string }[];
  placementModes: { value: string; label: string }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function JenisKknIndex({
  jenisKkn,
  filters,
  registrationModes,
  placementModes,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJenis, setEditingJenis] = useState<JenisKkn | null>(null);

  const { data, setData, post, patch, processing, reset, errors } = useForm({
    code: '',
    name: '',
    description: '',
    registration_mode: 'open',
    placement_mode: 'automatic_after_approval',
    min_sks: 100,
    min_gpa: '0.00',
    color: 'emerald',
    is_active: true,
    sort_order: 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/jenis-kkn', { search }, { preserveState: true, replace: true });
  };

  const openCreateForm = () => {
    setEditingJenis(null);
    reset();
    setIsFormOpen(true);
  };

  const openEditForm = (jenis: JenisKkn) => {
    setEditingJenis(jenis);
    setData({
      code: jenis.code,
      name: jenis.name,
      description: jenis.description || '',
      registration_mode: jenis.registration_mode,
      placement_mode: jenis.placement_mode,
      min_sks: jenis.min_sks,
      min_gpa: jenis.min_gpa,
      color: jenis.color,
      is_active: jenis.is_active,
      sort_order: jenis.sort_order,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Lanjutkan untuk menghapus skema KKN ini secara permanen? Data yang sudah terkait mungkin akan terpengaruh.')) {
      router.delete(`/admin/jenis-kkn/${id}`);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJenis) {
      patch(`/admin/jenis-kkn/${editingJenis.id}`, { onSuccess: () => setIsFormOpen(false) });
    } else {
      post('/admin/jenis-kkn', { onSuccess: () => { setIsFormOpen(false); reset(); } });
    }
  };

  return (
    <AppLayout title="Pengaturan Skema KKN">
      <Head title="Manajemen Skema KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* --- HEADER --- */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Konfigurasi Akademik</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <h1 className="text-4xl font-extrabold text-black tracking-tight">
                    Skema Jenis KKN
                </h1>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-3">
                        <Component size={14} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700 uppercase">Total Terdaftar: {jenisKkn.length} Skema</span>
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="h-12 px-8 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full shadow-lg shadow-emerald-100 transition-all flex items-center gap-3 text-sm font-semibold active:scale-95"
                    >
                        <Plus size={20} />
                        Tambah Jenis
                    </button>
                </div>
            </div>
        </div>

        {/* --- LIST & SEARCH --- */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                 <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                           <Layers size={24} />
                      </div>
                      <div className="space-y-1">
                          <h3 className="text-base font-bold text-black uppercase tracking-tight">Indeks Skema Program</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Parameter & Persyaratan Mahasiswa</p>
                      </div>
                 </div>
                 <form onSubmit={handleSearch} className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="Cari Jenis KKN..." 
                        className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-emerald-500 transition-all outline-none" 
                      />
                 </form>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-50">
                        <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-10 py-6">Nama & Identitas</th>
                            <th className="px-10 py-6 text-center">Persyaratan</th>
                            <th className="px-10 py-6 text-center">Operasional</th>
                            <th className="px-10 py-6 text-center">Status</th>
                            <th className="px-10 py-6 text-right">Kelola</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {jenisKkn.length > 0 ? jenisKkn.map((jenis) => (
                            <tr key={jenis.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white border-2 border-slate-100 text-slate-200 flex items-center justify-center font-bold rounded-2xl group-hover:border-emerald-200 group-hover:text-emerald-600 transition-all shadow-sm">
                                            <Component size={24} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[15px] font-bold text-slate-900 leading-tight uppercase group-hover:text-emerald-700 transition-colors">{jenis.name}</span>
                                            <div className="flex items-center gap-3 mt-2">
                                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KODE: {jenis.code}</span>
                                                 <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{jenis.periodes_count} Periode</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-10 py-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                            Min. {jenis.min_sks} SKS
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            IPK Min. {jenis.min_gpa}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center uppercase tabular-nums">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-slate-700 tracking-tight leading-none">{jenis.registration_mode_label}</div>
                                        <div className="text-[9px] font-semibold text-slate-400 tracking-[0.2em] leading-none pt-0.5">{jenis.placement_mode_label}</div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center uppercase tabular-nums">
                                    {jenis.is_active ? 
                                        <div className="inline-flex flex-col items-center">
                                            <div className="h-1.5 w-14 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200" />
                                            <span className="text-[9px] font-bold text-emerald-600 mt-2 tracking-widest uppercase">AKTIF</span>
                                        </div> :
                                        <div className="inline-flex flex-col items-center opacity-30">
                                            <div className="h-1.5 w-14 bg-slate-300 rounded-full" />
                                            <span className="text-[9px] font-bold text-slate-400 mt-2 tracking-widest uppercase">ARSIP</span>
                                        </div>
                                    }
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-3 outline-none">
                                      <Link 
                                        href={`/admin/jenis-kkn/${jenis.id}`} 
                                        className="h-11 px-6 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center active:scale-95 group/btn" 
                                      >
                                        Detail
                                      </Link>
                                      <button onClick={() => openEditForm(jenis)} className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:text-sky-600 hover:border-sky-200 transition-all flex items-center justify-center active:scale-95 group/btn" title="Ubah Konfigurasi">
                                        <Edit2 size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(jenis.id)} 
                                        disabled={jenis.periodes_count > 0} 
                                        className={clsx(
                                            "h-11 w-11 rounded-2xl bg-white border border-slate-200 transition-all flex items-center justify-center active:scale-95 group/btn",
                                            jenis.periodes_count > 0 ? "text-slate-100 opacity-20 cursor-not-allowed" : "text-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 shadow-sm"
                                        )} 
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-10 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-200">
                                        <Activity size={60} strokeWidth={1} />
                                        <p className="text-xs font-bold uppercase tracking-[0.4em] leading-none">Database Skema Kosong</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="fixed inset-0 z-[100] bg-emerald-950/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden border border-slate-100">
                <div className="px-10 py-8 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                             <Settings2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-black uppercase tracking-tight">{editingJenis ? 'Edit Skema Program' : 'Registrasi Skema Baru'}</h3>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Parameter Persyaratan & Mode Operasional</p>
                        </div>
                    </div>
                    <button onClick={() => setIsFormOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-emerald-100 text-emerald-600 transition-colors">
                        <X size={28} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-10 space-y-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 pl-1 border-l-2 border-emerald-500 leading-none">Nama Skema KKN</label>
                            <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Misal: KKN REGULER" className="w-full h-14 px-6 text-sm font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none uppercase shadow-sm" />
                            {errors.name && <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-tight">{errors.name}</p>}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 pl-1 border-l-2 border-emerald-500 leading-none">ID Unik Sistem</label>
                            <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} disabled={!!editingJenis} placeholder="ID-SKEMA" className="w-full h-14 px-6 text-sm font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none uppercase disabled:bg-slate-50 disabled:text-slate-300 shadow-sm" />
                            {errors.code && <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-tight">{errors.code}</p>}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 pl-1 border-l-2 border-emerald-500 leading-none">Ambang Batas SKS</label>
                            <div className="relative">
                                <input type="number" value={data.min_sks} onChange={(e) => setData('min_sks', parseInt(e.target.value))} className="w-full h-14 px-6 text-sm font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none shadow-sm" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase">Kredit</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 pl-1 border-l-2 border-emerald-500 leading-none">Ambang Batas IPK</label>
                            <div className="relative">
                                <input type="text" value={data.min_gpa} onChange={(e) => setData('min_gpa', e.target.value)} className="w-full h-14 px-6 text-sm font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none shadow-sm" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase">Skala 4.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Mode Pendaftaran
                            </label>
                            <select value={data.registration_mode} onChange={(e) => setData('registration_mode', e.target.value)} className="w-full h-14 px-6 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                                {registrationModes.map((m) => <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Mode Penempatan Kelompok
                            </label>
                            <select value={data.placement_mode} onChange={(e) => setData('placement_mode', e.target.value)} className="w-full h-14 px-6 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                                {placementModes.map((m) => <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                        <div onClick={() => setData('is_active', !data.is_active)} className="flex items-center gap-5 cursor-pointer px-8 py-5 rounded-[1.5rem] border-2 border-slate-50 bg-white hover:border-emerald-100 transition-all group lg:min-w-[280px] shadow-sm">
                             <div className={clsx("w-12 h-7 rounded-full p-1.5 transition-all duration-300 flex", data.is_active ? 'bg-emerald-500 flex-row-reverse shadow-inner' : 'bg-slate-200')}>
                                <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className={clsx("text-xs font-bold uppercase leading-none tracking-tight", data.is_active ? "text-emerald-700" : "text-slate-500")}>Publikasi Terbuka</span>
                                <span className="text-[9px] text-slate-300 mt-2 font-bold uppercase tracking-widest">{data.is_active ? 'Siap Digunakan' : 'Draft / Non-Aktif'}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="h-16 px-10 bg-white border border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-widest rounded-2xl hover:bg-slate-50 transition-all">Batal</button>
                            <button type="submit" disabled={processing} className="h-16 px-12 bg-emerald-500 text-white font-bold uppercase text-[11px] tracking-widest rounded-full shadow-xl shadow-emerald-100/50 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3">
                                {processing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={18} />}
                                {editingJenis ? 'Simpan' : 'Terbitkan'}
                            </button>
                        </div>
                    </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

// Tambahkan sisa komponen yang diperlukan di bagian atas file
import { X, Layers } from 'lucide-react';
