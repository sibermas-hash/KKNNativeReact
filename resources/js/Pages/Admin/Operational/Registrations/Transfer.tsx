import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Search, ArrowRightLeft, MapPin, AlertTriangle, UserCircle, Zap, Filter
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
    lokasi?: { district_name: string; village_name: string | null; regency_name: string };
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
    <AppLayout title="Transfer Peserta">
      <Head title="Manajemen Mutasi Peserta | KKN UIN SAIZU" />

      <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-sans px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION IN CLEAN EMERALD */}
        <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-start justify-between gap-8 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform group-hover:scale-110 duration-1000" />
          
          <div className="relative z-10 flex gap-6 items-start">
            <div className="h-20 w-20 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 shrink-0">
              <ArrowRightLeft size={36} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 w-fit">
                Operasi Basis Data
              </span>
              <h1 className="text-3xl font-black text-emerald-950 tracking-tight leading-none uppercase">
                Mutasi Peserta 
              </h1>
              <p className="text-sm font-bold text-emerald-800 max-w-xl leading-relaxed">
                Protokol administrasi instan untuk menggeser penempatan personil KKN lintas kelompok atau siklus periode secara aman dan akurat.
              </p>
            </div>
          </div>

          <div className="relative z-10 hidden md:flex items-center gap-6 bg-emerald-50 px-8 py-6 rounded-[2rem] shrink-0 border border-emerald-100">
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Total Peserta Valid</span>
              <span className="text-4xl font-black text-emerald-950 leading-none tabular-nums">{students.meta.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
              <Zap size={24} strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT COLUMN: SEARCH & SELECTION (1/3 LAYOUT) --- */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-emerald-100 rounded-xl overflow-hidden h-[800px] shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-white">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 group-focus-within:text-emerald-700 transition-colors" />
                <input 
                  type="text"
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-950 uppercase tracking-wider focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  placeholder="CARI NIM / NAMA MAHASISWA..."
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 custom-scrollbar p-6">
              {students.data.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  className={clsx(
                    'w-full p-5 text-left transition-all duration-300 flex flex-col gap-2 rounded-xl mb-3', 
                    selectedStudent?.id === s.id 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 translate-x-2' 
                    : 'bg-white hover:bg-emerald-50/50 border border-emerald-50 text-emerald-950 hover:translate-x-1'
                  )}
                >
                  <span className={clsx('text-xs font-black uppercase tracking-widest', selectedStudent?.id === s.id ? 'text-emerald-200' : 'text-emerald-600')}>
                    {s.mahasiswa.nim}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight uppercase">
                      {s.mahasiswa.nama}
                    </span>
                    <span className={clsx('text-xs font-bold mt-2 uppercase tracking-widest', selectedStudent?.id === s.id ? 'text-emerald-100/70' : 'text-emerald-600/70')}>
                      {s.kelompok?.nama_kelompok || s.kelompok?.code ? (
                        <>Posisi: <span className="font-extrabold">{s.kelompok.nama_kelompok || s.kelompok.code}</span></>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">BELUM DITEMPATKAN</span>
                      )}
                    </span>
                  </div>
                </button>
              ))}
              {students.data.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <UserCircle size={48} className="text-emerald-800 mb-4" strokeWidth={1.5} />
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-widest mb-1">Data Kosong</span>
                  <p className="text-xs font-bold text-emerald-800">Peserta tidak ditemukan.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
              <Pagination meta={students.meta} />
            </div>
          </div>

          {/* --- RIGHT COLUMN: SURGICAL FORM (2/3 LAYOUT) --- */}
          <div className="lg:col-span-8 flex flex-col min-h-[800px]">
            {selectedStudent ? (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-500 shadow-sm">
                
                {/* Panel Header */}
                <div className="px-10 py-8 bg-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                      <ArrowRightLeft size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Sistem Mutasi Terpadu</h2>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Konfigurasi Tujuan Penempatan</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)} 
                    className="h-10 px-5 bg-white/10 text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-white hover:text-emerald-950 transition-all border border-white/20"
                  >
                    Batal Pilih
                  </button>
                </div>

                <div className="flex-1 p-10 space-y-10">
                  {/* Current Status Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 border border-gray-200 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-950"><UserCircle size={100} /></div>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest relative z-10">Identitas Terpilih</span>
                      <div className="relative z-10">
                        <strong className="text-2xl font-black text-emerald-950 uppercase shrink-0 leading-none block">{selectedStudent.mahasiswa.nama}</strong>
                        <span className="text-xs font-bold text-emerald-600 block mt-2 uppercase tracking-widest tabular-nums">{selectedStudent.mahasiswa.nim}</span>
                      </div>
                    </div>
                    <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-600"><MapPin size={100} strokeWidth={1} /></div>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest relative z-10">Penempatan Saat Ini</span>
                      <div className="relative z-10">
                        <strong className="text-2xl font-black text-emerald-900 leading-none block uppercase">
                          {selectedStudent.kelompok?.nama_kelompok || selectedStudent.kelompok?.code || 'BELUM DITEMPATKAN'}
                        </strong>
                        <span className="text-xs font-bold text-emerald-700/70 block mt-3 uppercase tracking-widest">
                          {selectedStudent.kelompok?.lokasi 
                            ? `${selectedStudent.kelompok.lokasi.village_name || '-'}, ${selectedStudent.kelompok.lokasi.district_name}` 
                            : 'DISTRIK TIDAK TERDEFINISI'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Form Inputs */}
                  <div className="space-y-8 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="border-b border-gray-100 pb-6 mb-6">
                        <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                        <Filter size={16} className="text-emerald-600"/>
                        Parameter Relokasi Baru
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                          <TargetIcon /> Target Siklus Periode
                        </label>
                        <select 
                          value={targetPeriodId} 
                          onChange={(e) => { setTargetPeriodId(e.target.value); setTargetGroupId(''); fetchGroups(e.target.value); }} 
                          className="w-full h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white text-sm font-bold text-emerald-950 transition-all outline-none appearance-none"
                        >
                          <option value="">-- SELEKSI PERIODE --</option>
                          {targetPeriods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.periode})</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-600" /> Unit Kelompok Tujuan
                        </label>
                        <select 
                          value={targetGroupId} 
                          onChange={(e) => setTargetGroupId(e.target.value)} 
                          disabled={!targetPeriodId || isLoadingGroups} 
                          className="w-full h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white text-sm font-bold text-emerald-950 transition-all outline-none appearance-none disabled:opacity-40"
                        >
                          <option value="">{isLoadingGroups ? 'LOADING...' : '-- SELEKSI UNIT (OPSIONAL) --'}</option>
                          {groups.filter(g => g.id !== selectedStudent.kelompok?.id).map(g => (
                            <option key={g.id} value={g.id.toString()}>
                              {g.nama} {g.available !== null ? `(${g.available} SLOT SISA)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" strokeWidth={3} /> Alasan / Justifikasi Mutasi
                      </label>
                      <textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="INPUT ALASAN PERPINDAHAN UNTUK AUDIT LOG..."
                        rows={4} 
                        className="w-full p-6 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white text-sm font-bold text-emerald-950 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-6 bg-gray-50 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                      <Zap size={20} />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 max-w-[250px] leading-relaxed uppercase tracking-wider">
                      Operasi ini bersifat langsung dan akan tercatat permanen di dalam log audit kelayakan.
                    </span>
                  </div>
                  <Button 
                    onClick={handleTransfer} 
                    disabled={!targetPeriodId || !reason.trim()} 
                    className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transform hover:scale-[1.02] active:scale-95 transition-all outline-none"
                  >
                    Luncurkan Mutasi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-gray-50/50 border-2 border-dashed border-emerald-100 rounded-xl items-center justify-center p-20 text-center h-full group transition-all hover:bg-gray-50">
                <div className="h-32 w-32 bg-white rounded-[2rem] shadow-sm border border-emerald-100 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                  <ArrowRightLeft size={48} className="text-emerald-700 group-hover:text-emerald-600 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 mb-4 uppercase tracking-tight">Kondisi Siaga</h3>
                <p className="text-xs font-bold text-emerald-800 max-w-sm leading-relaxed uppercase tracking-widest">
                  Silakan seleksi identitas peserta dari kolom sebelah kiri untuk mengaktifkan antarmuka protokol perpindahan dan mutasi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TargetIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    )
}
