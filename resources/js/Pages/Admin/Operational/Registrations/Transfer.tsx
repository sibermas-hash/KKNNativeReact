import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Users, Search, ArrowRightLeft, MapPin, AlertTriangle, UserCircle, Activity, Database, Zap, Filter, FileDigit
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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
    router.get('/admin/peserta/pindah', { search }, { preserveState: true });
  };

  const fetchGroups = async (periodId: string) => {
    if (!periodId) { setGroups([]); return; }
    setIsLoadingGroups(true);
    try {
      const response = await fetch(`/admin/api/transfer-targets?target_period_id=${periodId}`);
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (_e) { /* ignore network errors */ } finally { setIsLoadingGroups(false); }
  };

  const handleTransfer = () => {
    if (!selectedStudent || !targetPeriodId || !reason.trim()) return;
    if (confirm(`Mutasi Peserta: ${selectedStudent.mahasiswa.nama}? Pastikan data tujuan sudah benar.`)) {
      router.post('/admin/peserta/pindah', { 
        peserta_kkn_id: selectedStudent.id, 
        target_period_id: targetPeriodId, 
        target_group_id: targetGroupId || null, 
        reason 
      }, {
        onSuccess: () => { 
          setSelectedStudent(null); 
          setTargetGroupId(''); 
          setTargetPeriodId(''); 
          setReason(''); 
        },
      });
    }
  };

  return (
    <>
      <Head title="Manajemen Mutasi Peserta" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans text-emerald-950">
        {/* --- PREMIUM HEADER --- */}
        <div className="bg-white rounded-[2.5rem] border border-emerald-100 p-8 lg:p-12 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-12 bg-emerald-600 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 opacity-80">Movement & Logic</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-black text-emerald-950 tracking-tighter uppercase leading-none">
                  Mutasi <span className="text-emerald-500">&</span> <br />
                  <span className="text-emerald-600">Perpindahan.</span>
                </h1>
                <p className="text-sm font-bold text-emerald-900/70 leading-relaxed max-w-xl">
                  Protokol administrasi untuk memindahkan personil KKN lintas kelompok atau siklus periode secara real-time dengan validasi otomatis terhadap kapasitas dan kuota sistem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Total Peserta</span>
                  <span className="text-3xl font-black text-emerald-950 tracking-tighter tabular-nums">{students.meta.total}</span>
               </div>
               <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <Zap size={24} className="text-emerald-500 mb-2" />
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">Auto Validated</span>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT: SEARCH & SELECTION (GLASS CARD) --- */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-emerald-100 rounded-[2.5rem] shadow-sm overflow-hidden h-[800px]">
            <div className="p-8 border-b border-emerald-50 flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <Search size={14} strokeWidth={3} />
                Filter Identitas
              </h3>
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full h-14 pl-12 pr-6 bg-emerald-50/30 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-200 focus:bg-white transition-all outline-none uppercase tracking-wider" 
                  placeholder="NIM / NAMA MAHASISWA..." 
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-emerald-50 custom-scrollbar p-4">
              {students.data.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  className={clsx(
                    'w-full p-6 text-left transition-all duration-300 flex flex-col gap-2 rounded-2xl mb-2', 
                    selectedStudent?.id === s.id 
                      ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/20 translate-x-2' 
                      : 'hover:bg-emerald-50 text-emerald-950 hover:translate-x-1'
                  )}
                >
                  <span className={clsx('text-xs font-black uppercase tracking-widest', selectedStudent?.id === s.id ? 'text-emerald-400' : 'text-emerald-600')}>
                    {s.mahasiswa.nim}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-tight leading-tight">
                      {s.mahasiswa.nama}
                    </span>
                    <span className={clsx('text-[11px] font-bold mt-1 opacity-60 uppercase tracking-widest', selectedStudent?.id === s.id ? 'text-emerald-100' : 'text-emerald-900')}>
                      {s.kelompok?.nama_kelompok || s.kelompok?.code || 'BELUM DITEMPATKAN'}
                    </span>
                  </div>
                </button>
              ))}
              {students.data.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center px-10">
                  <UserCircle size={64} className="text-emerald-100 mb-6" strokeWidth={1} />
                  <p className="text-[11px] font-black text-emerald-900/40 uppercase tracking-[0.2em]">Data Null</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-emerald-50 bg-white">
              <Pagination meta={students.meta} />
            </div>
          </div>

          {/* --- RIGHT: SURGICAL FORM --- */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-[800px]">
            {selectedStudent ? (
              <div className="bg-white border-2 border-emerald-950 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-500">
                {/* Panel Header */}
                <div className="px-10 py-8 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
                      <ArrowRightLeft size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Protokol Mutasi</h2>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Konfigurasi Tujuan</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)} 
                    className="h-10 px-4 bg-emerald-900 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-emerald-800 transition-colors"
                  >
                    Batal Pilih
                  </button>
                </div>

                <div className="flex-1 p-10 space-y-12">
                  {/* Current Status Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 border-2 border-emerald-50 rounded-3xl flex flex-col gap-3 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><UserCircle size={80} /></div>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Identitas Terpilih</span>
                       <div>
                         <strong className="text-2xl font-black text-emerald-950 leading-none block uppercase tracking-tighter tabular-nums">{selectedStudent.mahasiswa.nama}</strong>
                         <span className="text-sm font-bold text-emerald-600 block mt-1 tracking-widest">{selectedStudent.mahasiswa.nim}</span>
                       </div>
                    </div>
                    <div className="p-8 bg-emerald-50/30 border-2 border-emerald-50 rounded-3xl flex flex-col gap-3 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><MapPin size={80} /></div>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Repositori Saat Ini</span>
                       <div>
                         <strong className="text-2xl font-black text-emerald-950 leading-none block uppercase tracking-tighter underline underline-offset-8 decoration-emerald-200">
                           {selectedStudent.kelompok?.nama_kelompok || selectedStudent.kelompok?.code || 'NA'}
                         </strong>
                         <span className="text-[11px] font-bold text-emerald-600 block mt-2 uppercase tracking-wide">
                           {selectedStudent.kelompok?.location 
                             ? `${selectedStudent.kelompok.location.village_name || '-'}, ${selectedStudent.kelompok.location.district_name}` 
                             : 'DISTRIK TIDAK TERDEFINISI'}
                         </span>
                       </div>
                    </div>
                  </div>

                  {/* Transfer Form Inputs */}
                  <div className="space-y-10 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Filter size={14} className="text-emerald-500" />
                          Target Siklus Periode
                        </label>
                        <select 
                          value={targetPeriodId} 
                          onChange={(e) => { setTargetPeriodId(e.target.value); setTargetGroupId(''); fetchGroups(e.target.value); }} 
                          className="w-full h-14 px-5 rounded-2xl bg-emerald-50/50 border-2 border-transparent focus:border-emerald-500 focus:bg-white text-sm font-black uppercase tracking-widest transition-all outline-none appearance-none"
                        >
                          <option value="">-- SELEKSI PERIODE --</option>
                          {targetPeriods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.periode})</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-500" />
                          Unit Kelompok Tujuan
                        </label>
                        <select 
                          value={targetGroupId} 
                          onChange={(e) => setTargetGroupId(e.target.value)} 
                          disabled={!targetPeriodId || isLoadingGroups} 
                          className="w-full h-14 px-5 rounded-2xl bg-emerald-50/50 border-2 border-transparent focus:border-emerald-500 focus:bg-white text-sm font-black uppercase tracking-widest transition-all outline-none appearance-none disabled:opacity-40"
                        >
                          <option value="">{isLoadingGroups ? 'LOADED...' : '-- SELEKSI UNIT (OPSIONAL) --'}</option>
                          {groups.filter(g => g.id !== selectedStudent.kelompok?.id).map(g => (
                            <option key={g.id} value={g.id.toString()}>
                              {g.nama} {g.available !== null ? `(${g.available} SLOT SISA)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Filter size={14} className="text-emerald-500" strokeWidth={3} />
                        Klausa Justifikasi Mutasi
                      </label>
                      <textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="INPUT ALASAN PERPINDAHAN UNTUK AUDIT LOG..." 
                        rows={4} 
                        className="w-full p-6 rounded-[2rem] bg-emerald-50/50 border-2 border-transparent focus:border-emerald-500 focus:bg-white text-sm font-bold transition-all outline-none uppercase tracking-widest shadow-inner placeholder:text-emerald-900/30" 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-10 bg-emerald-50 border-t-2 border-emerald-100/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                      <AlertTriangle size={20} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest max-w-[200px] leading-relaxed">
                      Operasi ini permanen dan akan terekam dalam log riwayat.
                    </span>
                  </div>
                  <Button 
                    onClick={handleTransfer} 
                    disabled={!targetPeriodId || !reason.trim()} 
                    className="h-16 px-12 bg-emerald-600 hover:bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all w-full sm:w-auto"
                  >
                    Luncurkan Mutasi Peserta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-[3rem] items-center justify-center p-20 text-center h-full group">
                <div className="h-32 w-32 bg-white rounded-[3rem] shadow-xl border border-emerald-100 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <ArrowRightLeft size={48} className="text-emerald-300 group-hover:text-emerald-500 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-4 italic">Seleksi Buffer</h3>
                <p className="text-sm font-bold text-emerald-900/40 max-w-sm uppercase tracking-widest leading-loose">
                  Gunakan panel kriteria di sebelah kiri untuk memuat entitas peserta. Pratinjau formulir mutasi akan diaktifkan setelah seleksi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

StudentTransfer.layout = AppLayout.layout;
