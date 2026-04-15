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
      router.post('/admin/peserta/pindah', { peserta_kkn_id: selectedStudent.id, target_period_id: targetPeriodId, target_group_id: targetGroupId || null, reason }, {
        onSuccess: () => { setSelectedStudent(null); setTargetGroupId(''); setTargetPeriodId(''); setReason(''); },
      });
    }
  };

  return (
    <AppLayout title="Mutasi Lokasi Peserta">
      <Head title="Manajemen Mutasi Peserta" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                 <ArrowRightLeft size={16} className="text-emerald-600" />
                 <span className="text-sm font-medium text-gray-500">Operasional Sistem KKN</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">Mutasi Penempatan Peserta</h1>
             <p className="text-sm text-gray-500 max-w-2xl mt-1">
               Proses administrasi perpindahan mahasiswa antar kelompok atau periode KKN secara terkontrol.
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[650px]">
          {/* LEFT: STUDENT SELECTION LIST */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-800">Cari Peserta Terdaftar</h3>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 shadow-sm" 
                  placeholder="Ketik NIM atau Nama Mahasiswa..." 
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 custom-scrollbar">
              {students.data.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  className={clsx(
                    'w-full p-4 text-left transition-colors flex flex-col gap-1.5 focus:outline-none', 
                    selectedStudent?.id === s.id ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                  )}
                >
                  <span className={clsx('text-sm font-semibold truncate', selectedStudent?.id === s.id ? 'text-emerald-900' : 'text-gray-900')}>
                    {s.mahasiswa.nama}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">NIM: {s.mahasiswa.nim}</span>
                    <span className={clsx('text-xs font-medium truncate', selectedStudent?.id === s.id ? 'text-emerald-700' : 'text-emerald-600')}>
                      {s.kelompok?.nama_kelompok || s.kelompok?.code || 'Belum Ditempatkan'}
                    </span>
                  </div>
                </button>
              ))}
              {students.data.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <UserCircle size={40} className="text-gray-300 mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-gray-500">Tidak ada peserta yang ditemukan dengan kata kunci "{search}".</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Pagination meta={students.meta} />
            </div>
          </div>

          {/* RIGHT: MUTATION FORM */}
          <div className="lg:col-span-8 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {selectedStudent ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-md flex items-center justify-center"><ArrowRightLeft size={16} /></div>
                    <h2 className="text-base font-semibold text-gray-900">Formulir Mutasi Peserta</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)} 
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Batal Pilih
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Current Status Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Identitas Mahasiswa</span>
                      <strong className="text-base text-gray-900 mt-1">{selectedStudent.mahasiswa.nama}</strong>
                      <span className="text-sm text-gray-600">NIM: {selectedStudent.mahasiswa.nim}</span>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status Lokal Sekarang</span>
                      <strong className="text-base text-gray-900 mt-1">{selectedStudent.kelompok?.nama_kelompok || selectedStudent.kelompok?.code || 'Belum Ditempatkan'}</strong>
                      <span className="text-sm text-gray-600">
                        {selectedStudent.kelompok?.location ? `${selectedStudent.kelompok.location.village_name || '-'}, ${selectedStudent.kelompok.location.district_name || '-'}` : 'Wilayah Belum Ditentukan'}
                      </span>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="space-y-5 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Penempatan Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Periode Tujuan <span className="text-rose-500">*</span></label>
                        <select 
                          value={targetPeriodId} 
                          onChange={(e) => { setTargetPeriodId(e.target.value); setTargetGroupId(''); fetchGroups(e.target.value); }} 
                          className="w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900"
                        >
                          <option value="">-- Pilih Periode --</option>
                          {targetPeriods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Kelompok Penempatan</label>
                        <select 
                          value={targetGroupId} 
                          onChange={(e) => setTargetGroupId(e.target.value)} 
                          disabled={!targetPeriodId || isLoadingGroups} 
                          className="w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="">{isLoadingGroups ? 'Memuat Kelompok...' : '-- Pilih Kelompok (Opsional) --'}</option>
                          {groups.filter(g => g.id !== selectedStudent.kelompok?.id).map(g => (
                            <option key={g.id} value={g.id.toString()}>
                              {g.nama} {g.available !== null ? `(Sisa ${g.available} Slot)` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Biarkan kosong jika peserta hanya dipindahkan blok periodenya saja.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-sm font-medium text-gray-700">Alasan Mutasi (Log Audit) <span className="text-rose-500">*</span></label>
                      <textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="Contoh: Permintaan pindah atas persetujuan kaprodi..." 
                        rows={3} 
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm text-gray-900" 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Database size={14} /> Tersimpan pada log riwayat peserta.
                  </span>
                  <button 
                    onClick={handleTransfer} 
                    disabled={!targetPeriodId || !reason.trim()} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    Setujui Mutasi Peserta Terpilih
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-gray-50 items-center justify-center p-12 text-center h-full">
                <FileDigit size={64} className="text-gray-300 mb-6" strokeWidth={1} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Peserta untuk Dimutasi</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Gunakan panel di sebelah kiri untuk mencari kolom peserta berdasarkan NIM atau Nama. Detail form mutasi akan muncul di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
