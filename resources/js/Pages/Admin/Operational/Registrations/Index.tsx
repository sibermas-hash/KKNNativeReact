import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  CheckCheck, Clock, ClipboardList, Download, IdCard, Search, Users,
  XCircle, Filter, ChevronDown, X, Database, ShieldCheck, Activity, ArrowRight, Zap, Target,
  FileCheck, FileX, ShieldPlus, HeartPulse, UserPlus, CreditCard, Stethoscope, Globe, HardDrive, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import StatusTag from '@/Components/Premium/StatusTag';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';

interface Registration {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  rejection_reason?: string | null;
  registration_date: string;
  is_eligible: boolean;
  eligibility_issues?: string[];
  is_system_imported?: boolean;
  student: { 
    nim: string; 
    name: string; 
    is_bta_ppi_passed: boolean;
    faculty?: { name: string }; 
    program?: { name: string }; 
  };
  period: { name: string; id: number | null; jenis?: string | null; program_type?: string | null; };
  group?: { name: string };
  documents?: {
    health_cert: boolean;
    parent_permit: boolean;
    krs: boolean;
    pembayaran: boolean;
    asuransi: boolean;
  };
}

interface Props {
  registrations?: { data: Registration[]; meta: PaginationMeta };
  filters: { search?: string; status?: string; period_id?: string };
  stats?: { total: number; pending: number; approved: number; rejected: number; };
  periods?: Array<{ id: number; name: string }>;
  app?: { storage_disk: string };
}

const DocIcon = ({ active, label, icon: Icon }: { active?: boolean; label: string; icon: any }) => (
  <div 
    className={clsx(
      "transition-all",
      active ? "text-[#0d9488]" : "text-gray-200"
    )}
    title={`${label}: ${active ? 'Tersedia' : 'Kosong'}`}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
  </div>
);

export default function RegistrationsIndex({ registrations, filters, stats, periods, app }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? '');
  const [periodId, setPeriodId] = useState(filters.period_id ?? '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => { 
    setSearch(filters.search ?? ''); 
    setStatus(filters.status ?? ''); 
    setPeriodId(filters.period_id ?? ''); 
  }, [filters]);

  const allIds = useMemo(() => registrations?.data?.map(r => r.id) ?? [], [registrations?.data]);

  const applyFilters = () => {
    setIsFiltering(true);
    router.get('/admin/pendaftaran', { 
      search: search || undefined, 
      status: status || undefined, 
      period_id: periodId || undefined 
    }, { 
      preserveState: true, 
      preserveScroll: true, 
      replace: true,
      onFinish: () => setIsFiltering(false)
    });
  };

  const resetFilters = () => { 
    setIsFiltering(true);
    setSearch(''); 
    setStatus(''); 
    setPeriodId(''); 
    router.get('/admin/pendaftaran', {}, { 
      preserveState: true, 
      preserveScroll: true, 
      replace: true,
      onFinish: () => setIsFiltering(false)
    }); 
  };

  const handleBulkApprove = () => { 
    if (selectedIds.length === 0) return; 
    if (confirm(`Setujui ${selectedIds.length} pendaftaran terpilih?`)) 
      router.post('/admin/pendaftaran/setuju-massal', { ids: selectedIds }, { preserveScroll: true, onSuccess: () => setSelectedIds([]) }); 
  };

  const handleBulkReject = () => { 
    if (selectedIds.length === 0) return; 
    const notes = prompt(`Alasan penolakan untuk ${selectedIds.length} pendaftaran:`); 
    if (notes) 
      router.post('/admin/pendaftaran/tolak-massal', { ids: selectedIds, notes }, { preserveScroll: true, onSuccess: () => setSelectedIds([]) }); 
  };

  const handleExport = (type: 'standard' | 'biodata') => { 
    const url = type === 'standard' ? '/admin/pendaftaran/ekspor' : '/admin/pendaftaran/ekspor-biodata'; 
    const params = new URLSearchParams(); 
    if (search) params.set('search', search); 
    if (status) params.set('status', status); 
    if (periodId) params.set('period_id', periodId); 
    window.location.href = `${url}?${params.toString()}`; 
  };

  const toggleSelect = (id: number) => setSelectedIds(cur => cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id]);
  const toggleSelectAll = () => setSelectedIds(cur => cur.length === allIds.length ? [] : allIds);

  return (
    <AppLayout title="Validasi Pendaftaran KKN">
      <Head title="Manajemen Pendaftaran" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-24 font-sans">
        
        <PageHeader 
          title="Validasi Pendaftaran."
          subtitle="Verifikasi berkas, validasi persyaratan, dan manajemen entri peserta KKN secara terpusat."
          icon={ClipboardList}
          groupLabel="Gerbang Masuk Operasional"
        >
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-white border border-emerald-100 rounded-xl px-4 py-2 mr-2">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Storage Mode</span>
                  <div className="flex items-center gap-2">
                    <div className={clsx("h-2 w-2 rounded-full animate-pulse", app?.storage_disk === 's3' ? "bg-blue-500" : "bg-emerald-500")} />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                        {app?.storage_disk === 's3' ? <Globe size={10} className="text-blue-500" /> : <HardDrive size={10} className="text-emerald-600" />}
                        {app?.storage_disk === 's3' ? 'Cloud R2' : 'Local Server'}
                    </span>
                  </div>
               </div>
            </div>
            <button onClick={() => handleExport('standard')} className="h-12 px-5 bg-white border-2 border-gray-100 text-emerald-950 rounded-xl font-bold transition-all shadow-sm flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest hover:border-emerald-600">
              <Download size={16} strokeWidth={2.5} /> Ekspor List
            </button>
            <button onClick={() => handleExport('biodata')} className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest">
              <IdCard size={18} strokeWidth={2.5} /> Unduh Biodata
            </button>
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Masuk" value={stats?.total ?? 0} icon={Database} variant="gray" />
          <StatCard label="Menunggu" value={stats?.pending ?? 0} icon={Clock} variant={stats?.pending && stats.pending > 0 ? 'warning' : 'success'} />
          <StatCard label="Disetujui" value={stats?.approved ?? 0} icon={ShieldCheck} variant="success" />
          <StatCard label="Ditolak" value={stats?.rejected ?? 0} icon={XCircle} variant="danger" />
        </div>

        {/* --- FILTER SECTION (NOW HORIZONTAL AT TOP) --- */}
        <ContentPanel title="Filter Validasi" icon={Filter} padding={true}>
          <div className="flex flex-col lg:flex-row items-end gap-6">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Periode KKN</label>
              <div className="relative group">
                <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none">
                  <option value="">SEMUA PERIODE</option>
                  {periods?.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
              </div>
            </div>

            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">Status Verifikasi</label>
              <div className="relative group">
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none">
                  <option value="">SEMUA STATUS</option>
                  <option value="pending">MENUNGGU VERIFIKASI</option>
                  <option value="approved">TELAH DISETUJUI</option>
                  <option value="rejected">DITOLAK SISTEM</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={applyFilters} 
                disabled={isFiltering}
                className="h-12 px-8 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isFiltering ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
                Terapkan Filter
              </button>
              <button 
                onClick={resetFilters} 
                disabled={isFiltering}
                className="h-12 px-6 text-emerald-600 hover:text-rose-600 border border-emerald-100 hover:border-rose-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isFiltering ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                Reset
              </button>
            </div>
          </div>
        </ContentPanel>

        {/* --- MAIN CONTENT: Data List --- */}
        <div className="space-y-6">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-emerald-950 rounded-2xl p-4 flex items-center justify-between gap-6 border border-emerald-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-4 pl-2">
                <div className="h-10 w-10 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <Zap size={20} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tabular-nums">{selectedIds.length} Data Terpilih</span>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Aksi Massal Tersedia</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleBulkApprove} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2">
                  <CheckCheck size={14} /> Setujui Semua
                </button>
                <button onClick={handleBulkReject} className="h-10 px-5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2">
                  <FileX size={14} /> Tolak Semua
                </button>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <button onClick={() => setSelectedIds([])} className="h-10 px-3 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">Batal</button>
              </div>
            </div>
          )}

          <ContentPanel
            title="Log Validasi Masuk"
            description="Daftar antrian dan riwayat registrasi mahasiswa."
            icon={ClipboardList}
            padding={false}
            headerAction={
              <div className="flex items-center gap-3">
                 <SearchInput 
                  placeholder="CARI NAMA ATAU NIM..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onSearch={applyFilters}
                  className="w-80"
                />
              </div>
            }
            footer={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Menampilkan {registrations?.data?.length || 0} entri • Halaman {registrations?.meta?.current_page || 1} dari {registrations?.meta?.last_page || 1}
                  </span>
                </div>
                {registrations?.meta && <Pagination meta={registrations.meta} />}
              </div>
            }
          >
            <PremiumTable
              headers={[
                 <div key="select-all" className="flex items-center justify-center w-full">
                   <input 
                     type="checkbox" 
                     checked={allIds.length > 0 && selectedIds.length === allIds.length} 
                     ref={input => { if(input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length; }}
                     onChange={toggleSelectAll} 
                     className="h-4 w-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 transition-all cursor-pointer"
                   />
                 </div>, 
                 'Identitas Mahasiswa', 'Unit Akademik', 'Dokumen', 'Riwayat Entri', 'Status', 'Opsi'
              ]}
              isEmpty={!registrations?.data?.length}
              emptyText="Tidak ada pendaftaran yang ditemukan."
            >
              {registrations?.data?.map(r => (
                <PremiumTableRow key={r.id} className={clsx(selectedIds.includes(r.id) && "bg-emerald-50/50")}>
                  <PremiumTableCell align="center" className="w-10">
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 transition-all cursor-pointer"/>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-emerald-950 uppercase leading-tight tracking-tight font-display">{r.student.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-wider">{r.student.nim}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.student.is_bta_ppi_passed ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black border border-emerald-100 uppercase">BTA/PPI OK</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[9px] font-black border border-rose-100 uppercase animate-pulse">BTA/PPI FAIL</span>
                        )}
                        {!r.is_eligible && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black border border-amber-100 uppercase" title={r.eligibility_issues?.join(', ')}>ISSUE</span>
                        )}
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-emerald-900 uppercase truncate max-w-[150px]">{r.student.program?.name || 'UMUM'}</span>
                       <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">{r.student.faculty?.name || 'UIN SAIZU'}</span>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-100 w-fit shadow-sm">
                      <DocIcon active={r.documents?.health_cert} label="Sehat" icon={Stethoscope} />
                      <DocIcon active={r.documents?.parent_permit} label="Izin" icon={UserPlus} />
                      <DocIcon active={r.documents?.krs} label="KRS" icon={FileCheck} />
                      <DocIcon active={r.documents?.pembayaran} label="UKT" icon={CreditCard} />
                      <div className="w-px h-3 bg-gray-200 mx-1" />
                      <DocIcon active={r.documents?.asuransi} label="Asuransi" icon={ShieldPlus} />
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-950">
                        <div className="p-1 bg-emerald-50 rounded-md">
                          <Clock size={12} className="text-emerald-600 shrink-0" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black tabular-nums leading-none">
                            {new Date(r.registration_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600/60 tabular-nums">
                            {new Date(r.registration_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-800/40 uppercase tracking-tighter">
                        <span className={clsx("px-1.5 py-0.5 rounded border", r.is_system_imported ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                          {r.is_system_imported ? 'RESTORED' : 'SELF-REG'}
                        </span>
                        <span className="truncate max-w-[80px]" title={r.period.name}>{r.period.jenis || 'Reguler'}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <div className="flex flex-col gap-1.5">
                      <StatusTag status={r.status} />
                      {r.group && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100 w-fit">
                          <Users size={10} className="text-gray-400" />
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter truncate max-w-[100px]">{r.group.name}</span>
                        </div>
                      )}
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                     <Link href={`/admin/pendaftaran/${r.id}`} className="h-9 px-4 bg-emerald-900 text-white hover:bg-emerald-800 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest shadow-md">
                      Audit <ArrowRight size={14} strokeWidth={3} className="text-emerald-400" />
                    </Link>
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </ContentPanel>
        </div>      </div>
    </AppLayout>
  );
}
