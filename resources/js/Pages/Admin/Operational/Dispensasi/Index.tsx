import { type FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ShieldCheck, Plus, Trash2, Search, X, UserCheck, RefreshCw, FileWarning, Fingerprint, Activity } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, ConfirmDialog } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Dispensasi {
  id: number; nim: string; alasan: string; bypassed_requirements: string[] | null;
  is_active: boolean; created_at: string;
  periode?: { id: number; name: string } | null;
  granted_by_user?: { id: number; name: string } | null;
}
interface Period { id: number; name: string; }
type PaginatedDispensasi = PaginationMeta & { data: Dispensasi[] };
interface Props { dispensasi: PaginatedDispensasi; periods: Period[]; filters: { search?: string }; }

const REQUIREMENT_OPTIONS = [
  { value: 'min_sks', label: 'SKS Minimum' },
  { value: 'min_gpa', label: 'IPK Minimum' },
  { value: 'bta_ppi', label: 'Lulus BTA & PPI' },
  { value: 'documents', label: 'Kelengkapan Dokumen' },
  { value: 'personal_status', label: 'Status Aktif Mahasiswa' },
  { value: 'program_prodi', label: 'Sinkronisasi Prodi' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function DispensasiIndex({ dispensasi, periods, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [showForm, setShowForm] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const form = useForm({ nim: '', period_id: '', alasan: '', bypassed_requirements: [] as string[] });

  const handleSearch = (e: FormEvent) => { e.preventDefault(); router.get('/admin/dispensasi', { search: search || undefined }, { preserveState: true, replace: true }); };
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); form.post('/admin/dispensasi', { onSuccess: () => { form.reset(); setShowForm(false); } }); };
  const toggleRequirement = (v: string) => { const curr = form.data.bypassed_requirements; form.setData('bypassed_requirements', curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v]); };

  return (
    <AppLayout title="Dispensasi Sistem Akses">
      <Head title="Dispensasi Otoritas | Sistem KKN" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[1600px] mx-auto space-y-16 sm:px-6 lg:px-8 font-sans pb-24 pt-6">
        {/* --- PREMIUM HEADER --- */}
        <motion.header variants={itemVariants} className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-12 shadow-sm">
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-50 opacity-50 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider text-xs font-semibold leading-none">
                            Otoritas Administrator Khusus
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-emerald-950 tracking-tight leading-none pt-2">
                        Pusat Kendali <span className="text-rose-600">Dispensasi</span>.
                    </h1>
                    <p className="text-emerald-950 font-medium text-lg leading-relaxed pt-2">
                        Terbitkan pengecualian otorisasi pendaftaran untuk kasus khusus. Segala bentuk bypass sistem akan terdata dalam log audit dan diawasi sepenuhnya.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                    <div className="h-14 px-6 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs">
                            <span className="text-emerald-600 text-lg mr-2 tabular-nums">{dispensasi.total}</span>
                            Dispensasi Aktif
                        </span>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={clsx(
                            "h-14 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-xs font-semibold shadow-rose flex items-center gap-3 transition-all",
                            showForm 
                                ? "bg-white border-2 border-emerald-100 text-emerald-950 hover:bg-emerald-50" 
                                : "bg-emerald-950 border border-transparent text-white hover:bg-emerald-800"
                        )}
                    >
                        {showForm ? <><X size={16} strokeWidth={2.5} /> Batalkan Proses</> : <><Plus size={16} strokeWidth={2.5} /> Terbitkan Baru</>}
                    </button>
                </div>
            </div>
        </motion.header>

        {/* --- FORM KENDALI NEW --- */}
        <AnimatePresence>
            {showForm && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white border-2 border-rose-100 rounded-[2.5rem] p-10 shadow-form relative">
                        <div className="absolute top-0 right-10 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
                        
                        <div className="flex items-center gap-4 mb-10 border-b-2 border-slate-50 pb-6 relative z-10">
                            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                <FileWarning size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-emerald-950 leading-none mb-1">Form Registrasi Perlakuan Khusus</h3>
                                <p className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold opacity-60">
                                    Dokumentasikan alasan persetujuan agar tidak menyalahi SOP pendaftaran KKN.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-2">
                                        NIM Kadidat <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600">
                                            <Fingerprint size={18} />
                                        </div>
                                        <input 
                                            value={form.data.nim} 
                                            onChange={e => form.setData('nim', e.target.value)} 
                                            className="w-full h-14 pl-12 pr-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl text-emerald-950 font-bold focus:border-emerald-600 focus:ring-0 placeholder:text-slate-300 transition-all font-mono text-lg" 
                                            placeholder="Cth: 191240001" 
                                            required 
                                        />
                                    </div>
                                    {form.errors.nim && <p className="text-sm font-bold text-rose-600 uppercase tracking-wider text-[10px]">{form.errors.nim}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs">Target Periode Impelementasi</label>
                                    <select 
                                        value={form.data.period_id} 
                                        onChange={e => form.setData('period_id', e.target.value)} 
                                        className="w-full h-14 px-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl text-emerald-950 font-bold focus:border-emerald-600 focus:ring-0 transition-all uppercase tracking-wider text-xs font-semibold"
                                    >
                                        <option value="">TERAPKAN GLOBAL (SEMUA SIKLUS)</option>
                                        {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-2">
                                        Surat Keterangan / Justifikasi <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        value={form.data.alasan} 
                                        onChange={e => form.setData('alasan', e.target.value)} 
                                        className="w-full h-14 px-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl text-emerald-950 font-bold focus:border-emerald-600 focus:ring-0 transition-all placeholder:text-slate-300 placeholder:normal-case placeholder:font-normal" 
                                        placeholder="Tuliskan justifikasi yang valid menurut aturan" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t-2 border-slate-50">
                                <label className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs block mb-4">
                                    Pilih Komponen Bypass (Syarat yang Dikecualikan)
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {REQUIREMENT_OPTIONS.map(opt => {
                                        const isChecked = form.data.bypassed_requirements.includes(opt.value);
                                        return (
                                            <button 
                                                key={opt.value} 
                                                type="button" 
                                                onClick={() => toggleRequirement(opt.value)} 
                                                className={clsx(
                                                    "h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-[11px] border-2 transition-all active:scale-95 flex items-center gap-3",
                                                    isChecked 
                                                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' 
                                                        : 'bg-white border-emerald-100/60 text-emerald-950 hover:border-emerald-300'
                                                )}
                                            >
                                                <div className={clsx(
                                                    "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                                    isChecked ? "border-rose-500 bg-rose-500" : "border-slate-300"
                                                )}>
                                                    {isChecked && <X size={10} className="text-white" strokeWidth={4} />}
                                                </div>
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-8 border-t-2 border-slate-50">
                                <button type="button" onClick={() => setShowForm(false)} className="h-14 px-8 font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold hover:text-rose-600 transition-colors">
                                    Batalkan Otomasi
                                </button>
                                <button type="submit" disabled={form.processing} className="h-14 px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xl shadow-rose-200 font-bold uppercase tracking-wider text-xs font-semibold flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                    {form.processing && <RefreshCw size={18} className="animate-spin" />}
                                    TERBITKAN OTORISASI
                                    <ShieldCheck size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- MAIN LEDGER --- */}
        <motion.div variants={itemVariants} className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm pt-8">
            <div className="px-10 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-50">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-950 leading-none">Buku Induk Log Bypass Sistem</h3>
                </div>
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full h-12 pl-12 pr-4 bg-emerald-50/50 border border-emerald-100/60 rounded-xl text-emerald-950 font-bold focus:border-emerald-600 focus:ring-0 placeholder:text-slate-300 placeholder:font-normal transition-all" 
                        placeholder="Identifikasi via NIM Mahasiswa..." 
                    />
                </form>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-emerald-950 text-white">
                            <th className="px-10 py-6 text-sm font-bold uppercase tracking-wider text-xs font-semibold">Profil Target Mahasiswa</th>
                            <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider text-xs font-semibold">Berlaku Pada Siklus</th>
                            <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider text-xs font-semibold">Komponen Syarat Termodifikasi</th>
                            <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider text-xs font-semibold">Otorisator Administrasi</th>
                            <th className="px-8 py-6 text-right text-sm font-bold uppercase tracking-wider text-xs font-semibold">Kontrol Cabut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                        {dispensasi.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-32 text-center text-emerald-950">
                                    <Fingerprint size={48} className="mx-auto text-slate-200 mb-4" strokeWidth={1} />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">Tidak ada jalur khusus ditemukan</p>
                                </td>
                            </tr>
                        ) : dispensasi.data.map(item => (
                            <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-lg font-bold text-emerald-950 font-mono leading-none group-hover:text-emerald-700 transition-colors">{item.nim}</span>
                                        <div className="flex items-start gap-2 text-emerald-950 opacity-60">
                                            <FileWarning size={14} className="mt-0.5 shrink-0" />
                                            <span className="text-sm font-bold leading-tight max-w-[200px]">{item.alasan}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <span className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-emerald-950 tracking-wider text-[11px] uppercase">
                                        {item.periode?.name || 'BERLAKU GLOBAL'}
                                    </span>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex flex-wrap gap-2 max-w-[300px]">
                                        {(item.bypassed_requirements || []).map(r => {
                                            const label = REQUIREMENT_OPTIONS.find(o => o.value === r)?.label || r;
                                            return (
                                                <span key={r} className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm font-bold uppercase tracking-wider text-[10px]">
                                                    DIBEBASKAN: {label}
                                                </span>
                                            );
                                        })}
                                        {!(item.bypassed_requirements?.length) && <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">BYPASS UMUM</span>}
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                                            <UserCheck size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-950 leading-none">
                                            {item.granted_by_user?.name || 'SISTEM ROOT'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-8 text-right">
                                    <button 
                                        onClick={() => setRevokingId(item.id)} 
                                        className="h-12 w-12 rounded-xl text-slate-300 hover:text-white hover:bg-rose-500 border border-transparent hover:border-rose-600 transition-all inline-flex items-center justify-center active:scale-95 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0" 
                                        title="Cabut Otorisasi"
                                    >
                                        <Trash2 size={20} strokeWidth={2.5} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-10 py-6 border-t border-emerald-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs opacity-60">
                    Menampilkan total <strong className="text-emerald-700">{dispensasi.total}</strong> riwayat otorisasi khusus
                </span>
                <Pagination meta={dispensasi} />
            </div>
        </motion.div>
      </motion.div>

      <ConfirmDialog
        open={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={() => { if (revokingId) router.delete(`/admin/dispensasi/${revokingId}`, { onSuccess: () => setRevokingId(null) }); }}
        title="Cabut Dispensasi Khusus"
        message="Cabut hak istimewa untuk bypass syarat? Mahasiswa yang bersangkutan akan langsung terblokir jika syarat aslinya tidak terpenuhi."
        confirmLabel="Ya, Eksekusi Pencabutan"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

