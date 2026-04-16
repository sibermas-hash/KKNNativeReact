import { type FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  ShieldCheck, Plus, Trash2, Search, X, UserCheck, RefreshCw, 
  FileWarning, Fingerprint, Activity, AlertCircle, ChevronRight, Zap, Target
} from 'lucide-react';
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
interface PaginatedDispensasi { data: Dispensasi[]; meta: PaginationMeta; }
interface Props { dispensasi: PaginatedDispensasi; periods: Period[]; filters: { search?: string }; }

const REQUIREMENT_OPTIONS = [
  { value: 'min_sks', label: 'SKS MINIMUM' },
  { value: 'min_gpa', label: 'IPK MINIMUM' },
  { value: 'bta_ppi', label: 'LULUS BTA & PPI' },
  { value: 'documents', label: 'KELENGKAPAN BERKAS' },
  { value: 'personal_status', label: 'STATUS KEAKTIFAN' },
  { value: 'program_prodi', label: 'KOMPATIBILITAS PRODI' },
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
    <AppLayout title="Otoritas Dispensasi Khusus">
      <Head title="Manajemen Dispensasi" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-rose-600">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Protokol Intervensi Sistem</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Kendali <span className="text-rose-500">Dispensasi.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Terbitkan pengecualian persyaratan pendaftaran untuk kondisi akademik darurat. Setiap bypass sistem akan diaudit secara ketat dan dicatat dalam log monitoring.
                </p>
              </div>
              <div className="shrink-0">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className={clsx(
                        "h-16 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all border-2 flex items-center gap-4 active:scale-95",
                        showForm 
                            ? "bg-white border-emerald-100 text-emerald-950 hover:bg-emerald-50 shadow-emerald-50" 
                            : "bg-emerald-950 border-emerald-950 text-white hover:bg-black shadow-emerald-200"
                    )}
                  >
                    {showForm ? <><X size={18} strokeWidth={3} /> BATALKAN PROSES</> : <><Plus size={18} strokeWidth={3} /> TERBITKAN DISPENSASI</>}
                  </button>
              </div>
           </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard label="Dispensasi Aktif" value={dispensasi.meta.total} icon={Zap} desc="Total Kasus Bypass" />
           <MetricCard label="Status Otoritas" value="TERKONTROL" icon={ShieldCheck} desc="Log Audit Aktif" />
           <MetricCard label="Integritas Data" value="VALID" icon={Activity} desc="Sinkronisasi Master" />
           <MetricCard label="Tingkat Risiko" value="RENDAH" icon={AlertCircle} desc="Monitoring Berkala" />
        </div>

        {/* --- FORM INTERVENSI --- */}
        <AnimatePresence>
            {showForm && (
                <motion.section 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-12 shadow-2xl shadow-rose-100/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16"><FileWarning size={200} /></div>
                        
                        <div className="flex items-center gap-6 mb-12 border-b-2 border-emerald-50 pb-8 relative z-10">
                            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center border-2 border-rose-100 shadow-sm">
                                <FileWarning size={32} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Otorisasi Perlakuan Khusus</h3>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Dokumentasikan Alasan Persetujuan Secara Formal</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">
                                        NIM KANDIDAT TARGET <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300 group-focus-within:text-emerald-600 transition-colors">
                                            <Fingerprint size={20} strokeWidth={2.5} />
                                        </div>
                                        <input 
                                            value={form.data.nim} 
                                            onChange={e => form.setData('nim', e.target.value)} 
                                            className="w-full h-16 pl-14 pr-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-emerald-950 font-black focus:bg-white focus:border-emerald-500 outline-none transition-all font-mono text-xl tracking-widest placeholder:text-emerald-100" 
                                            placeholder="NIM MAHASISWA" 
                                            required 
                                        />
                                    </div>
                                    {form.errors.nim && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 pl-1">{form.errors.nim}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">TARGET PERIODE AKADEMIK</label>
                                    <select 
                                        value={form.data.period_id} 
                                        onChange={e => form.setData('period_id', e.target.value)} 
                                        className="w-full h-16 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-black text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all uppercase tracking-widest appearance-none"
                                    >
                                        <option value="">BERLAKU GLOBAL (SEMUA SIKLUS)</option>
                                        {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 leading-none">
                                        JUSTIFIKASI FORMAL <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        value={form.data.alasan} 
                                        onChange={e => form.setData('alasan', e.target.value)} 
                                        className="w-full h-16 px-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-widest" 
                                        placeholder="ALASAN DISPENSASI..." 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t-2 border-emerald-50">
                                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest pl-1 block">
                                    KOMPONEN BYPASS (PARAMETER YANG DIABAIKAN SISTEM)
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    {REQUIREMENT_OPTIONS.map(opt => {
                                        const isChecked = form.data.bypassed_requirements.includes(opt.value);
                                        return (
                                            <button 
                                                key={opt.value} 
                                                type="button" 
                                                onClick={() => toggleRequirement(opt.value)} 
                                                className={clsx(
                                                    "h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all active:scale-95 flex items-center gap-4",
                                                    isChecked 
                                                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xl shadow-rose-100/50' 
                                                        : 'bg-white border-emerald-50 text-emerald-950 hover:border-emerald-200'
                                                )}
                                            >
                                                <div className={clsx(
                                                    "h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    isChecked ? "border-rose-500 bg-rose-500 shadow-lg shadow-rose-200" : "border-emerald-100"
                                                )}>
                                                    {isChecked && <X size={12} className="text-white" strokeWidth={4} />}
                                                </div>
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-5 pt-12 border-t-2 border-emerald-50">
                                <button type="button" onClick={() => setShowForm(false)} className="h-16 px-10 text-[11px] font-black text-emerald-700 uppercase tracking-widest hover:text-rose-500 transition-colors">
                                    BATALKAN
                                </button>
                                <button type="submit" disabled={form.processing} className="h-16 px-12 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-2xl shadow-rose-100 font-black uppercase tracking-widest text-[11px] flex items-center gap-4 active:scale-95 transition-all disabled:opacity-50">
                                    {form.processing ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} strokeWidth={3} />}
                                    TERBITKAN OTORISASI BYPASS
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.section>
            )}
        </AnimatePresence>

        {/* --- MAIN PAGE CONTENT --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[3rem] overflow-hidden shadow-sm flex flex-col pt-8">
            <div className="px-10 pb-10 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b-2 border-emerald-50">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center border-2 border-emerald-50 shadow-sm">
                        <Activity size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Log Audit Bypass</h3>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Direktori Otoritas Jalur Khusus</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full h-14 pl-14 pr-6 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-emerald-950 font-black focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-widest" 
                        placeholder="CARI NIM MAHASISWA..." 
                    />
                </form>
            </div>

            <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-emerald-50/50 text-emerald-950">
                        <tr>
                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Identitas Target [NIM]</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Siklus Penugasan</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Parameter Modifikasi</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Otorisator Hub</th>
                            <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                        {dispensasi.data.length === 0 ? (
                            <EmptyState />
                        ) : dispensasi.data.map(item => (
                            <tr key={item.id} className="group hover:bg-emerald-50/30 transition-all">
                                <td className="px-10 py-8">
                                    <div className="flex flex-col gap-3">
                                        <span className="text-lg font-black text-emerald-950 font-mono leading-none tracking-widest group-hover:text-emerald-700 transition-colors uppercase">{item.nim}</span>
                                        <div className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-50/50 max-w-fit">
                                            <FileWarning size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none truncate max-w-[250px]" title={item.alasan}>{item.alasan}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.15em]">
                                            {item.periode?.name || 'DOMINASI GLOBAL'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex flex-wrap gap-2 max-w-[350px]">
                                        {(item.bypassed_requirements || []).length > 0 ? (item.bypassed_requirements || []).map(r => {
                                            const label = REQUIREMENT_OPTIONS.find(o => o.value === r)?.label || r.toUpperCase();
                                            return (
                                                <span key={r} className="px-3 py-1.5 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
                                                    BYPASSED: {label}
                                                </span>
                                            );
                                        }) : (
                                           <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest tracking-[0.2em] opacity-60">MASTER BYPASS (FULL ACCESS)</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-50 group-hover:bg-white transition-colors">
                                            <UserCheck size={18} strokeWidth={3} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-black text-emerald-950 uppercase leading-none mb-1">
                                              {item.granted_by_user?.name || 'Otoritas Sistem'}
                                          </span>
                                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Root Administrator</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                      <button 
                                          onClick={() => setRevokingId(item.id)} 
                                          className="h-10 w-10 bg-white border-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90" 
                                          title="Cabut Otorisasi"
                                      >
                                          <Trash2 size={18} strokeWidth={2.5} />
                                      </button>
                                      <button className="h-10 w-10 bg-white border-2 border-emerald-100 text-emerald-400 hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-all shadow-sm ml-3 group-hover:scale-105">
                                         <ChevronRight size={18} strokeWidth={3} />
                                      </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-10 py-6 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                   Total <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{dispensasi.meta.total}</strong> Jalur Intervensi Terdaftar
                </span>
                <Pagination meta={dispensasi.meta} />
            </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
            <Target size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <ShieldCheck size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Otoritas Validasi Terpusat</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Kebijakan Intervensi Akademik</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                 Penggunaan fitur dispensasi harus didasarkan pada disposisi tertulis dari pimpinan institusi atau kondisi mendesak lainnya yang diakomodasi oleh peraturan. Setiap intervensi sistem akan masuk ke dalam audit log universitas untuk menjamin transparansi dan keadilan proses seleksi KKN bagi seluruh mahasiswa.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={() => { if (revokingId) router.delete(`/admin/dispensasi/${revokingId}`, { onSuccess: () => setRevokingId(null) }); }}
        title="KONFIRMASI PENCABUTAN DISPENSASI"
        message="Apakah Anda yakin ingin melenyapkan hak istimewa intervensi sistem ini? Mahasiswa yang bersangkutan akan kembali tunduk pada validasi persyaratan standar sistem pendaftaran KKN."
        confirmLabel="YA, CABUT HAK DISPENSASI"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string; value: any; icon: any; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className="h-14 w-14 rounded-2xl bg-emerald-50 border-2 border-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value}</span>
        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} className="py-32 text-center text-emerald-950">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <Fingerprint size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">Data Dispensasi Kosong</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">Tidak ada jalur intervensi yang ditemukan dalam basis data log.</p>
          </div>
      </td>
    </tr>
  );
}
