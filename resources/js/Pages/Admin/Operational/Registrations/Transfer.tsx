import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
  Users,
  Search,
  ArrowRightLeft,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Target,
  UserCircle,
  Activity,
  Database,
  Zap,
  ArrowLeft,
  ArrowRight,
  Filter
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  id: number;
  mahasiswa: {
    nim: string;
    nama: string;
    user: { name: string };
  };
  kelompok?: {
    id: number;
    nama_kelompok: string;
    code: string;
    location?: { district_name: string; village_name: string | null; regency_name: string };
  };
  status: string;
}

interface TargetGroup {
  id: number;
  nama: string;
  capacity: number | null;
  current_count: number;
  available: number | null;
}

interface Props {
  students: { data: Student[]; meta: PaginationMeta };
  targetPeriods: Array<{ id: number; name: string; periode: number; jenis: string; kuota: number }>;
  filters: { search?: string };
}

export default function StudentTransfer({ students, targetPeriods, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [targetPeriodId, setTargetPeriodId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('admin.peserta.pindah.index'), { search }, { preserveState: true });
  };

  const fetchGroups = async (periodId: string) => {
    if (!periodId) { setGroups([]); return; }
    setIsLoadingGroups(true);
    try {
      const response = await fetch(route('admin.api.transfer-targets', { target_period_id: periodId }));
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (e) {} finally { setIsLoadingGroups(false); }
  };

  const handleTransfer = () => {
    if (!selectedStudent || !targetPeriodId || !reason.trim()) return;
    if (confirm(`EKSEKUSI MUTASI PESERTA: ${selectedStudent.mahasiswa.nama}?`)) {
      router.post(route('admin.peserta.pindah'), { peserta_kkn_id: selectedStudent.id, target_period_id: targetPeriodId, target_group_id: targetGroupId || null, reason }, {
        onSuccess: () => { setSelectedStudent(null); setTargetGroupId(''); setTargetPeriodId(''); setReason(''); },
      });
    }
  };

  return (
    <AppLayout title="Prosedur Mutasi Peserta">
      <Head title="Mutasi Peserta" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <ArrowRightLeft size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Administrasi & Plotting</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Mutasi <span className="text-emerald-500">Peserta.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Prosedur Perpindahan dan Rekonsiliasi Plotting Unit Strategis Mahasiswa KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-4 text-white shadow-xl shadow-emerald-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Otorisasi SIKKKN</span>
                            <span className="text-sm font-black text-emerald-400 uppercase tabular-nums leading-none tracking-tight">GRANT SECURED</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] min-h-[600px]">
          {/* --- LEFT: SELECTION --- */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50/50 border-b border-slate-50 flex flex-col gap-3">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Target Selection Registry</h3>
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-lg text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200 uppercase tracking-widest font-bold" placeholder="CARI NIM / NAMA..." />
                </form>
             </div>
             
             <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar p-1">
                 {students.data.map(s => (
                   <button key={s.id} onClick={() => setSelectedStudent(s)} className={clsx('w-full p-4 text-left transition-all rounded-lg flex flex-col gap-1', selectedStudent?.id === s.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'hover:bg-slate-50')}>
                      <span className={clsx('text-[13px] font-bold uppercase leading-tight line-clamp-1', selectedStudent?.id === s.id ? 'text-emerald-400' : 'text-slate-900')}>{s.mahasiswa.nama}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">NIM: {s.mahasiswa.nim}</span>
                        <div className="h-0.5 w-2 bg-slate-200 rounded-full" />
                        <span className="text-[9px] font-bold text-emerald-600 uppercase italic line-clamp-1">{s.kelompok?.nama_kelompok || s.kelompok?.code || 'NO-GROUP'}</span>
                      </div>
                   </button>
                 ))}
                 {students.data.length === 0 && <div className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase italic opacity-50 tracking-widest">Scanner returned null.</div>}
             </div>

             <div className="p-3 bg-slate-50/50 border-t border-slate-50 flex justify-center">
                <Pagination meta={students.meta} />
             </div>
          </div>

          {/* --- RIGHT: FORM --- */}
          <div className="lg:col-span-8 flex flex-col">
             <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.div key="form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex-1 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="px-8 py-6 bg-slate-50/30 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100"><Target size={20} /></div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Redeployment Protocol Configuration</h2>
                         </div>
                         <Button onClick={() => setSelectedStudent(null)} className="h-8 px-4 bg-white border border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:text-rose-600">Abort Sync</Button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-10 space-y-10">
                         {/* Card Preview */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-emerald-600 border border-emerald-500 rounded-2xl text-white flex items-center gap-5 shadow-xl shadow-emerald-100 relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><UserCircle size={100} /></div>
                               <div className="h-14 w-14 bg-emerald-600 text-white flex items-center justify-center text-xl font-black rounded-xl italic relative z-10 shrink-0">{selectedStudent.mahasiswa.nama.charAt(0)}</div>
                               <div className="relative z-10">
                                  <p className="text-lg font-bold text-white uppercase italic tracking-tighter leading-none mb-1">{selectedStudent.mahasiswa.nama}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">NIM: {selectedStudent.mahasiswa.nim}</p>
                               </div>
                            </div>
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center gap-2">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Status Deployment</p>
                               <p className="text-lg font-bold text-slate-800 uppercase tracking-tighter leading-none">{selectedStudent.kelompok?.nama_kelompok || 'NO-CLUSTER'}</p>
                               {selectedStudent.kelompok?.location && (
                                 <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin size={12} className="text-rose-500" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest line-clamp-1">{selectedStudent.kelompok.location.village_name}, {selectedStudent.kelompok.location.district_name}</span>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* Form Inputs */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Periode</label>
                                <div className="relative">
                                   <Database size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                   <select value={targetPeriodId} onChange={(e) => { setTargetPeriodId(e.target.value); setTargetGroupId(''); fetchGroups(e.target.value); }} className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-800 outline-none transition focus:border-emerald-500 uppercase">
                                      <option value="">Pilih Periode Destinasi...</option>
                                      {targetPeriods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                   </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Strategic Unit</label>
                                <div className="relative">
                                   <Activity size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                   <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} disabled={!targetPeriodId || isLoadingGroups} className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-800 outline-none transition focus:border-emerald-500 uppercase disabled:opacity-50">
                                      <option value="">{isLoadingGroups ? 'Scanning Cluster...' : 'Pilih Unit Pindah...'}</option>
                                      {groups.filter(g => g.id !== selectedStudent.kelompok?.id).map(g => <option key={g.id} value={g.id.toString()}>{g.nama} ({g.available ?? '??'} Slots Free)</option>)}
                                   </select>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Redeployment Rationale (Audit Log)</label>
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="TULIS ALASAN PINDAH SECARA FORMAL UNTUK AUDIT..." rows={3} className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all uppercase italic tracking-tight placeholder:opacity-50" />
                            </div>
                         </div>
                      </div>

                      <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                         <div className="flex items-center gap-3 text-emerald-600">
                            <Zap size={18} strokeWidth={3} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Awaiting Final Authorization.</span>
                         </div>
                         <Button onClick={handleTransfer} disabled={!targetPeriodId || !reason.trim()} className="h-14 px-10 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 disabled:opacity-20">Execute Mutation <ArrowRight size={16} strokeWidth={3}/></Button>
                      </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 border-4 border-dashed border-slate-50 rounded-2xl flex flex-col items-center justify-center p-20 text-slate-200">
                      <UserCircle size={100} strokeWidth={1} className="opacity-20 mb-5" />
                      <p className="text-xl font-black uppercase tracking-[0.4em] italic opacity-50">Terminal Idle</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Scan & Select student node to begin mutation protocol.</p>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="bg-emerald-600 rounded-[2rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)]" />
           <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"><ArrowRightLeft size={28} /></div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black uppercase tracking-tighter leading-none">Audit Compliance Protocol</h4>
                 <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest leading-relaxed max-w-xl">Seluruh mutasi tercatat dalam riwayat operasional SIKKKN. Pastikan target unit memiliki load capacity yang cukup sebelum mengeksekusi redeployment.</p>
              </div>
           </div>
           <div className="flex items-center gap-3 opacity-30 relative z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Registry Secured</span>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
