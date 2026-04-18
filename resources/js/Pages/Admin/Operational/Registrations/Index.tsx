import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  CheckCheck, Clock, ClipboardList, Download, IdCard, Search, Users,
  XCircle, Filter, ChevronDown, X, Database, ShieldCheck, Activity, ArrowRight, Zap, Target,
  FileCheck, FileX, ShieldPlus, HeartPulse, UserPlus, CreditCard, Stethoscope, Globe, HardDrive
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
  student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string }; };
  period: { name: string; id: number | null };
  group?: { name: string };
  registration_date: string;
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  try { 
    const d = new Date(value); 
    if (isNaN(d.getTime())) return '—'; 
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d); 
  }
  catch { return '—'; }
}

const DocIcon = ({ active, label, icon: Icon }: { active?: boolean; label: string; icon: any }) => (
  <div 
    className={clsx(
      "transition-all",
      active ? "text-[#1a7a4a]" : "text-gray-200"
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { 
    setSearch(filters.search ?? ''); 
    setStatus(filters.status ?? ''); 
    setPeriodId(filters.period_id ?? ''); 
  }, [filters]);

  const allIds = useMemo(() => registrations?.data?.map(r => r.id) ?? [], [registrations?.data]);

  const applyFilters = () => router.get('/admin/pendaftaran', { 
    search: search || undefined, 
    status: status || undefined, 
    period_id: periodId || undefined 
  }, { preserveState: true, preserveScroll: true, replace: true });

  const resetFilters = () => { 
    setSearch(''); 
    setStatus(''); 
    setPeriodId(''); 
    router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true }); 
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
  const activeFilterCount = (search ? 1 : 0) + (status ? 1 : 0) + (periodId ? 1 : 0);

  return (
    <AppLayout title="Validasi Pendaftaran KKN">
      <Head title="Manajemen Pendaftaran" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
        
        <PageHeader 
          title="Validasi Pendaftaran."
          subtitle="Verifikasi berkas, validasi persyaratan, dan manajemen entri peserta KKN UIN SAIZU secara terpusat."
          icon={ClipboardList}
          groupLabel="Gerbang Masuk Operasional"
          stats={{
            label: 'Total Pendaftar',
            value: `${(stats?.total ?? 0).toLocaleString()}`,
            icon: Database
          }}
        >
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 mr-2">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Storage Mode</span>
                  <div className="flex items-center gap-2">
                    <div className={clsx("h-2 w-2 rounded-full animate-pulse", app?.storage_disk === 's3' ? "bg-blue-500" : "bg-emerald-500")} />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                        {app?.storage_disk === 's3' ? <Globe size={10} className="text-blue-500" /> : <HardDrive size={10} className="text-[#1a7a4a]" />}
                        {app?.storage_disk === 's3' ? 'Cloud R2' : 'Local Server'}
                    </span>
                  </div>
               </div>
            </div>
            <button onClick={() => handleExport('standard')} className="h-12 px-5 bg-white border-2 border-[#f3f4f6] text-emerald-950 rounded-xl font-extrabold transition-all shadow-sm flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest hover:border-emerald-600">
              <Download size={16} strokeWidth={2.5} /> Ekspor List
            </button>
            <button onClick={() => handleExport('biodata')} className="h-12 px-6 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-extrabold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest">
              <IdCard size={18} strokeWidth={2.5} /> Unduh Biodata
            </button>
          </div>
        </PageHeader>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Masuk" value={stats?.total ?? 0} icon={Database} variant="gray" />
          <StatCard label="Antrian Verifikasi" value={stats?.pending ?? 0} icon={Clock} variant={stats?.pending && stats.pending > 0 ? 'warning' : 'success'} />
          <StatCard label="Terverifikasi" value={stats?.approved ?? 0} icon={ShieldCheck} variant="success" />
          <StatCard label="Dibatalkan/Tolak" value={stats?.rejected ?? 0} icon={XCircle} variant="danger" />
        </div>

        {/* --- BULK ACTION BAR --- */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-950 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-2 border-emerald-800 shadow-xl shadow-emerald-950/20 relative overflow-hidden group/bulk animate-in lg:slide-in-from-right-12 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/bulk:rotate-12 transition-transform pointer-events-none"><Target size={150} /></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center shadow-inner text-[#1a7a4a]">
                <Zap size={24} strokeWidth={2.5} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-wider tabular-nums leading-none mb-1.5">{selectedIds.length} Pendaftaran Terpilih</span>
                <span className="text-xs font-bold text-[#1a7a4a]/60 uppercase tracking-widest leading-none italic">Mode Edit Massal Aktif</span>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <button onClick={handleBulkApprove} className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
                <CheckCheck size={16} /> Setujui Semua
              </button>
              <button onClick={handleBulkReject} className="h-11 px-6 bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2">
                <FileX size={16} /> Tolak Semua
              </button>
              <button onClick={() => setSelectedIds([])} className="h-11 w-11 bg-white/5 border border-white/10 text-white hover:bg-rose-500 hover:border-rose-500 rounded-xl transition-all flex items-center justify-center active:scale-95"><X size={18} strokeWidth={3} /></button>
            </div>
          </div>
        )}

        {/* --- MAIN PANEL --- */}
        <ContentPanel
          title="Log Validasi Masuk"
          description="Verifikasi Berkas & Alur Registrasi"
          icon={Activity}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <SearchInput 
                placeholder="CARI NAMA ATAU NIM..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onSearch={applyFilters}
                className="w-64"
              />
              <button onClick={() => setShowFilters(!showFilters)} className={clsx("h-11 px-5 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all border-2 uppercase tracking-widest", showFilters ?"bg-[#16a34a] text-white border-emerald-600 shadow-md shadow-emerald-600/20":"bg-white border-[#f3f4f6] text-emerald-950 hover:border-emerald-600")}>
                <Filter size={14} /> {activeFilterCount > 0 ? `FILTER (${activeFilterCount})` : 'FILTER'}
              </button>
              <button onClick={applyFilters} className="h-11 px-8 bg-emerald-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-none active:scale-95 transition-all">Terapkan</button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950/40 uppercase tracking-widest">
                Halaman <strong className="text-emerald-950 tabular-nums">{registrations?.meta?.current_page || 1}</strong> dari {registrations?.meta?.last_page || 1}
              </span>
              {registrations?.meta && <Pagination meta={registrations.meta} />}
            </div>
          }
        >
          {showFilters && (
            <div className="p-6 bg-gray-50/20 border-b-2 border-[#f3f4f6] grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-emerald-950 uppercase tracking-widest pl-1">Periode KKN</label>
                <div className="relative group">
                  <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-[#f3f4f6] bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all">
                    <option value="">SEMUA PERIODE</option>
                    {periods?.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-emerald-950 uppercase tracking-widest pl-1">Status Verifikasi</label>
                <div className="relative group">
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-[#f3f4f6] bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all">
                    <option value="">SEMUA STATUS</option>
                    <option value="pending">MENUNGGU VERIFIKASI</option>
                    <option value="approved">TELAH DISETUJUI</option>
                    <option value="rejected">DITOLAK SISTEM</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button onClick={resetFilters} className="text-xs font-extrabold text-emerald-950/30 hover:text-rose-600 uppercase tracking-widest transition-colors">Reset Semua Filter</button>
              </div>
            </div>
          )}

          <PremiumTable
            headers={[
               <div key="select-all" className="flex items-center justify-center w-full">
                 <input 
                   type="checkbox" 
                   checked={allIds.length > 0 && selectedIds.length === allIds.length} 
                   ref={input => { if(input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length; }}
                   onChange={toggleSelectAll} 
                   className="h-4 w-4 rounded text-[#1a7a4a] border-gray-300 focus:ring-[#1a7a4a] transition-all cursor-pointer"
                   title="Pilih/Batal Pilih Semua"
                 />
               </div>, 
               'Identitas Mahasiswa', 'Unit Akademik', 'Checklist Berkas', 'Linimasa Alur', 'Status', 'Aksi'
            ]}
            isEmpty={!registrations?.data?.length}
            emptyText="Tidak ada pendaftaran mahasiswa yang ditemukan saat ini."
          >
            {registrations?.data?.map(r => (
              <PremiumTableRow key={r.id} className={clsx(selectedIds.includes(r.id) && "bg-gray-50")}>
                <PremiumTableCell align="center" className="w-12">
                  <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded text-[#1a7a4a] border-gray-300 focus:ring-[#1a7a4a] transition-all cursor-pointer"/>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1 px-1">
                    <span className="text-xs font-black text-emerald-950 leading-tight uppercase mr-2">{r.student.name}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-[#1a7a4a]/60 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-emerald-50/50 w-fit tabular-nums">{r.student.nim}</span>
                       <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-tighter">Joined {new Date(r.registration_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-emerald-950/70 leading-tight uppercase tracking-tight truncate max-w-[140px]">{r.student.program?.name || 'UMUM'}</span>
                     <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest">{r.student.faculty?.name || 'UIN SAIZU'}</span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 w-fit">
                    <DocIcon active={r.documents?.health_cert} label="S. Sehat" icon={Stethoscope} />
                    <DocIcon active={r.documents?.parent_permit} label="Izin Ortu" icon={UserPlus} />
                    <DocIcon active={r.documents?.krs} label="KRS" icon={FileCheck} />
                    <DocIcon active={r.documents?.pembayaran} label="UKT/Bukti" icon={CreditCard} />
                    <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                    <DocIcon active={r.documents?.asuransi} label="Asuransi" icon={ShieldPlus} />
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-emerald-950 tabular-nums uppercase whitespace-nowrap">
                      {new Date(r.registration_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    <span className="text-[9px] font-bold text-[#1a7a4a]/40 uppercase tracking-tighter truncate max-w-[110px]" title={r.period.name}>
                      {r.period.name}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1.5">
                    <StatusTag status={r.status} />
                    {r.group && (
                      <div className="flex items-center gap-1.5 opacity-60">
                         <div className="h-1 w-1 rounded-full bg-emerald-400" />
                         <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest truncate max-w-[100px]">{r.group.name}</span>
                      </div>
                    )}
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="right">
                   <Link href={`/admin/pendaftaran/${r.id}`} className="h-10 px-5 bg-white text-emerald-950 hover:bg-emerald-900 hover:text-white border-2 border-[#f3f4f6] rounded-xl flex items-center justify-center gap-3 text-xs font-black transition-all active:scale-95 uppercase tracking-widest shadow-sm hover:translate-x-1">
                    Audit <ArrowRight size={14} strokeWidth={3} className="text-[#1a7a4a]" />
                  </Link>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-xl p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20 border-4 border-emerald-900">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 -mr-20 -mt-20 pointer-events-none"><ShieldCheck size={300} /></div>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="h-24 w-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-[#1a7a4a] border border-white/10 shadow-inner shrink-0 rotate-3 backdrop-blur-sm">
              <Activity size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Otoritas Validasi Registrasi KKN</h2>
              <p className="text-xs font-bold text-[#1a7a4a]/50 uppercase tracking-[0.15em] leading-relaxed max-w-3xl">
                Proses audit ini menentukan kelayakan akademik mahasiswa untuk melanjutkan ke fase penempatan kelompok. Harap lakukan verifikasi berkas secara teliti sesuai dengan parameter kelulusan prasyarat KKN 2026/2027. Kesalahan validasi dapat berdampak pada integritas data penempatan kelompok secara massal.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
