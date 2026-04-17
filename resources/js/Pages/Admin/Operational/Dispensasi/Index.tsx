import { type FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  ShieldCheck, Plus, Trash2, Search, X, UserCheck, RefreshCw, 
  FileWarning, Fingerprint, Activity, AlertCircle, ChevronRight, Zap, Target, Calendar,
  ShieldAlert, Files, GraduationCap
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
interface Izin {
  id: number; tanggal_mulai: string; tanggal_kembali: string; durasi_hari: number;
  alasan: string; status: string;
  mahasiswa?: { nama: string; nim: string } | null;
  kelompok?: { nama_kelompok: string } | null;
}
interface Period { id: number; name: string; }
interface PaginatedDispensasi { data: Dispensasi[]; meta: PaginationMeta; }
interface PaginatedIzin { data: Izin[]; meta: PaginationMeta; }
interface Props { 
  dispensasi: PaginatedDispensasi; 
  izins: PaginatedIzin;
  periods: Period[]; 
  filters: { search?: string }; 
}

const REQUIREMENT_OPTIONS = [
  { value: 'min_sks', label: 'SKS MINIMUM' },
  { value: 'min_gpa', label: 'IPK MINIMUM' },
  { value: 'bta_ppi', label: 'LULUS BTA & PPI' },
  { value: 'documents', label: 'KELENGKAPAN BERKAS' },
  { value: 'personal_status', label: 'STATUS KEAKTIFAN' },
  { value: 'program_prodi', label: 'KOMPATIBILITAS PRODI' },
];

export default function DispensasiIndex({ dispensasi, izins, periods, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dispensasi' | 'izin'>('dispensasi');

  const form = useForm({ nim: '', period_id: '', alasan: '', bypassed_requirements: [] as string[] });

  const handleSearch = (e: FormEvent) => { 
    e.preventDefault(); 
    router.get('/admin/dispensasi', { search: search || undefined }, { preserveState: true, replace: true }); 
  };
  
  const handleSubmit = (e: FormEvent) => { 
    e.preventDefault(); 
    form.post('/admin/dispensasi', { onSuccess: () => form.reset() }); 
  };
  
  const toggleRequirement = (v: string) => { 
    const curr = form.data.bypassed_requirements; 
    form.setData('bypassed_requirements', curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v]); 
  };

  return (
    <AppLayout title="Otoritas Dispensasi Khusus">
      <Head title="Manajemen Dispensasi"/>

      <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        
        {/* --- STANDARD HEADER STYLE --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
          <div className="space-y-4">
            <div className="h-10 w-10 bg-[#e8f5ee] text-[#1a7a4a] rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
              <ShieldAlert size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Manajemen Dispensasi & Izin.
              </h1>
              <p className="text-sm font-medium text-gray-700">
                Pusat kendali otoritas jalur khusus dan monitoring perizinan mahasiswa KKN.
              </p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm shadow-emerald-900/5">
             <div className="h-12 w-12 rounded-xl bg-[#e8f5ee] flex items-center justify-center text-[#1a7a4a]">
                <Files size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider">Total Otoritas</p>
                <h4 className="text-xl font-bold text-gray-900 tabular-nums">{dispensasi?.meta?.total} Kasus</h4>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN: FORMULIR (Standard Pattern) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-[#1a7a4a] border border-gray-200">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Formulir Dispensasi</h3>
                  <p className="text-xs font-bold text-gray-700">INPUT OTORISASI BYPASS SISTEM</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">Mahasiswa [NIM] <span className="text-rose-500">*</span></label>
                  <input 
                    value={form.data.nim} 
                    onChange={e => form.setData('nim', e.target.value)} 
                    className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Masukkan NIM..."
                    required 
                  />
                  {form.errors.nim && <p className="text-xs font-bold text-rose-500">{form.errors.nim}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">Periode Program</label>
                  <select 
                    value={form.data.period_id} 
                    onChange={e => form.setData('period_id', e.target.value)} 
                    className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all"
                  >
                    <option value="">Berlaku Global</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">Justifikasi <span className="text-rose-500">*</span></label>
                  <textarea 
                    value={form.data.alasan} 
                    onChange={e => form.setData('alasan', e.target.value)} 
                    className="w-full h-24 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 outline-none transition-all resize-none"
                    placeholder="Alasan formal dispensasi..."
                    required 
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">Parameter Bypass</label>
                  <div className="grid grid-cols-1 gap-2">
                    {REQUIREMENT_OPTIONS.map(opt => {
                      const isChecked = form.data.bypassed_requirements.includes(opt.value);
                      return (
                        <button 
                          key={opt.value} 
                          type="button"
                          onClick={() => toggleRequirement(opt.value)} 
                          className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                            isChecked ? "bg-[#16a34a] border-emerald-600 text-white" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <div className={clsx("h-4 w-4 rounded border flex items-center justify-center", isChecked ? "bg-white border-white text-[#1a7a4a]" : "bg-gray-50 border-emerald-200")}>
                            {isChecked && <Plus size={12} strokeWidth={4} />}
                          </div>
                          <span className="text-xs font-bold tracking-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={form.processing}
                  className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl shadow-lg shadow-none font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-4"
                >
                  {form.processing ? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18} strokeWidth={3} />}
                  SIMPAN DATA DISPENSASI
                </button>
              </form>
            </div>
            
            <div className="bg-emerald-950 rounded-xl p-6 text-white relative overflow-hidden">
               <ShieldCheck className="absolute -right-4 -bottom-4 h-32 w-32 text-gray-900 opacity-30 rotate-12" />
               <div className="relative z-10 space-y-2">
                  <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-widest">Informasi Keamanan</p>
                  <p className="text-xs font-semibold leading-relaxed opacity-80">
                    Semua data dispensasi bersifat permanent audit log. Hanya dipublikasikan untuk keperluan verifikasi operasional.
                  </p>
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: DAFTAR TERDAFTAR (Standard Pattern) --- */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[800px]">
              
              <div className="p-6 border-b border-[#f3f4f6] bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit">
                  <button 
                    onClick={() => setActiveTab('dispensasi')}
                    className={clsx(
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                      activeTab === 'dispensasi' ? "bg-[#16a34a] text-white shadow-md":"text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <ShieldCheck size={14} /> DISPENSASI
                  </button>
                  <button 
                    onClick={() => setActiveTab('izin')}
                    className={clsx(
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                      activeTab === 'izin' ? "bg-[#16a34a] text-white shadow-md":"text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Activity size={14} /> IZIN MONITORING
                  </button>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a7a4a]"/>
                  <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full h-10 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#f3f4f6]0 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Cari data..."
                  />
                </form>
              </div>

              <div className="flex-1 overflow-x-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'dispensasi' ? (
                    <motion.table 
                      key="dispensasi-table"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full text-left border-collapse"
                    >
                      <thead className="bg-gray-50/50 text-gray-900 border-b border-[#f3f4f6]">
                        <tr>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest">Identitas NIM</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest">Periode</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest">Parameter</th>
                          <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-widest">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f3f4f6]">
                        {dispensasi?.data?.length === 0 ? <EmptyState /> : dispensasi?.data?.map(item => (
                          <tr key={item.id} className="group hover:bg-gray-50/20 transition-all">
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-gray-900 font-mono">{item.nim}</span>
                                <span className="text-xs font-bold text-[#1a7a4a] truncate max-w-[200px]" title={item.alasan}>{item.alasan}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-xs font-bold text-gray-700">{item.periode?.name || 'GLOBAL'}</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-wrap gap-1">
                                {item.bypassed_requirements?.map(r => (
                                  <span key={r} className="px-1.5 py-0.5 bg-white border border-gray-200 text-[#1a7a4a] rounded text-[9px] font-bold">{r.toUpperCase()}</span>
                                )) || <span className="text-[9px] font-bold text-gray-600">MASTER BYPASS</span>}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => setRevokingId(item.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </motion.table>
                  ) : (
                    <motion.table 
                      key="izin-table"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full text-left border-collapse"
                    >
                      <thead className="bg-gray-50/50 text-gray-900 border-b border-[#f3f4f6]">
                        <tr>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest">Mahasiswa</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest">Durasi & Alasan</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest">Kelompok</th>
                          <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f3f4f6]">
                        {izins?.data?.length === 0 ? <EmptyState label="Data Izin Nihil" /> : izins?.data?.map(item => (
                          <tr key={item.id} className="group hover:bg-gray-50/20 transition-all">
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold text-gray-900">{item.mahasiswa?.nama}</span>
                                <span className="text-xs font-bold text-[#1a7a4a] font-mono">{item.mahasiswa?.nim}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-700">{item.tanggal_mulai} — {item.tanggal_kembali}</span>
                                <span className="text-[9px] font-bold text-[#1a7a4a] italic truncate max-w-[200px]" title={item.alasan}>"{item.alasan}"</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-xs font-bold text-gray-700">{item.kelompok?.nama_kelompok}</td>
                            <td className="px-8 py-6 text-right">
                              <span className={clsx(
                                "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest",
                                item.status === 'disetujui' ? "bg-[#e8f5ee] text-[#1a7a4a] border border-emerald-200" :
                                item.status === 'ditolak' ? "bg-rose-100 text-rose-700 border border-rose-200" :
                                "bg-amber-100 text-amber-700 border border-amber-200"
                              )}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </motion.table>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-[#f3f4f6] bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-900/60 uppercase tracking-widest">TOTAL {activeTab === 'dispensasi' ? dispensasi?.meta?.total : izins?.meta?.total} BARIS DATA</p>
                <Pagination meta={(activeTab === 'dispensasi' ? dispensasi?.meta : izins?.meta) as any} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={() => { if (revokingId) router.delete(`/admin/dispensasi/${revokingId}`, { onSuccess: () => setRevokingId(null) }); }}
        title="KONFIRMASI PENCABUTAN"
        message="Cabut hak dispensasi mahasiswa ini? Mahasiswa akan kembali tunduk pada validasi sistem standar."
        confirmLabel="YA, CABUT HAK"
        confirmVariant="danger"
      />
    </AppLayout>
  );
}

function EmptyState({ label = 'Data Dispensasi Kosong' }: { label?: string }) {
  return (
    <tr>
      <td colSpan={10} className="py-24 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 bg-[#e8f5ee] rounded-xl flex items-center justify-center text-gray-500">
            <Fingerprint size={32} />
          </div>
          <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{label}</span>
        </div>
      </td>
    </tr>
  );
}
