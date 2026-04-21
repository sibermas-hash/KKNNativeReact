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
  period: { name: string; id: number | null };
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
  const [showFilters, setShowFilters] = useState(true); // Always show in two-column layout

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

  return (
    <AppLayout title="Validasi Pendaftaran KKN">
      <Head title="Manajemen Pendaftaran" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans">
        
        <PageHeader 
          title="Validasi Pendaftaran."
          subtitle="Verifikasi berkas, validasi persyaratan, dan manajemen entri peserta KKN secara terpusat."
          icon={ClipboardList}
          groupLabel="Gerbang Masuk Operasional"
          stats={{
            label: 'Total Pendaftar',
            value: `${(stats?.total ?? 0).toLocaleString()}`,
            icon: Database
          }}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- LEFT COLUMN (1/3): Stats & Filters --- */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Summary Panel */}
            <ContentPanel title="Statistik Entri" icon={Activity} padding={true}>
              <div className="space-y-4">
                <StatCard label="Total Masuk" value={stats?.total ?? 0} icon={Database} variant="gray" className="w-full" />
                <StatCard label="Antrian Verifikasi" value={stats?.pending ?? 0} icon={Clock} variant={stats?.pending && stats.pending > 0 ? 'warning' : 'success'} className="w-full" />
                <StatCard label="Terverifikasi" value={stats?.approved ?? 0} icon={ShieldCheck} variant="success" className="w-full" />
                <StatCard label="Dibatalkan/Tolak" value={stats?.rejected ?? 0} icon={XCircle} variant="danger" className="w-full" />
              </div>
            </ContentPanel>

            {/* Filter Panel */}
            <ContentPanel title="Filter Validasi" icon={Filter} padding={true}>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1">Periode KKN</label>
                  <div className="relative group">
                    <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none">
                      <option value="">SEMUA PERIODE</option>
                      {periods?.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1">Status Verifikasi</label>
                  <div className="relative group">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none">
                      <option value="">SEMUA STATUS</option>
                      <option value="pending">MENUNGGU VERIFIKASI</option>
                      <option value="approved">TELAH DISETUJUI</option>
                      <option value="rejected">DITOLAK SISTEM</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button onClick={applyFilters} className="w-full h-11 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">Terapkan Filter</button>
                  <button onClick={resetFilters} className="text-xs font-bold text-emerald-600 hover:text-rose-600 uppercase tracking-widest transition-colors py-2">Reset Semua Filter</button>
                </div>
              </div>
            </ContentPanel>
          </div>

          {/* --- RIGHT COLUMN (2/3): Data List --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bulk Action Bar - Only shows when selections exist */}
            {selectedIds.length > 0 && (
              <div className="bg-emerald-950 rounded-xl p-5 flex items-center justify-between gap-6 border border-emerald-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center text-emerald-400">
                    <Zap size={20} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-wider tabular-nums">{selectedIds.length} Terpilih</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Aksi Massal</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleBulkApprove} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-2">
                    <CheckCheck size={14} /> Setujui
                  </button>
                  <button onClick={handleBulkReject} className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-2">
                    <FileX size={14} /> Tolak
                  </button>
                  <button onClick={() => setSelectedIds([])} className="h-9 w-9 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-all flex items-center justify-center active:scale-95"><X size={16} /></button>
                </div>
              </div>
            )}

            <ContentPanel
              title="Log Validasi Masuk"
              description="Daftar antrian dan riwayat registrasi mahasiswa."
              icon={ClipboardList}
              padding={false}
              headerAction={
                <SearchInput 
                  placeholder="CARI NAMA ATAU NIM..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onSearch={applyFilters}
                  className="w-64"
                />
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest tabular-nums">
                    Halaman {registrations?.meta?.current_page || 1} dari {registrations?.meta?.last_page || 1}
                  </span>
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
                   'Identitas & Syarat', 'Akademik', 'Berkas', 'Audit Registrasi', 'Status', 'Aksi'
                ]}
                isEmpty={!registrations?.data?.length}
                emptyText="Tidak ada pendaftaran yang ditemukan."
              >
                {registrations?.data?.map(r => (
                  <PremiumTableRow key={r.id} className={clsx(selectedIds.includes(r.id) && "bg-emerald-50/30")}>
                    <PremiumTableCell align="center" className="w-10">
                      <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 transition-all cursor-pointer"/>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-950 uppercase leading-tight">{r.student.name}</span>
                          <span className="text-[10px] font-bold text-emerald-600/70 font-mono tracking-tight">{r.student.nim}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {r.student.is_bta_ppi_passed ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black border border-emerald-200">BTA/PPI: LULUS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-black border border-rose-200 animate-pulse">BTA/PPI: TIDAK LOLOS</span>
                          )}
                          {!r.is_eligible && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black border border-amber-200" title={r.eligibility_issues?.join(', ')}>ISSUE AKADEMIK</span>
                          )}
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase truncate max-w-[120px]">{r.student.program?.name || 'UMUM'}</span>
                         <span className="text-[9px] font-medium text-emerald-600 uppercase tracking-wider">{r.student.faculty?.name || 'UIN SAIZU'}</span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100 w-fit">
                        <DocIcon active={r.documents?.health_cert} label="Sehat" icon={Stethoscope} />
                        <DocIcon active={r.documents?.parent_permit} label="Izin" icon={UserPlus} />
                        <DocIcon active={r.documents?.krs} label="KRS" icon={FileCheck} />
                        <DocIcon active={r.documents?.pembayaran} label="UKT" icon={CreditCard} />
                        <div className="w-px h-3 bg-gray-200 mx-0.5" />
                        <DocIcon active={r.documents?.asuransi} label="Asuransi" icon={ShieldPlus} />
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-emerald-950">
                          <Clock size={10} className="text-emerald-600" />
                          <span className="text-[10px] font-bold tabular-nums">
                            {new Date(r.registration_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-black bg-gray-100 px-1 rounded text-gray-600">
                            {new Date(r.registration_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800/60 uppercase">
                          <UserPlus size={10} /> 
                          <span>Pendaftar: </span>
                          <span className={clsx("px-1 rounded", r.is_system_imported ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                            {r.is_system_imported ? 'RESTORE SYSTEM' : 'MAHASISWA (Self)'}
                          </span>
                        </div>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex flex-col gap-1">
                        <StatusTag status={r.status} />
                        {r.group && (
                          <span className="text-[9px] font-bold text-emerald-900/60 uppercase tracking-tighter truncate max-w-[80px]">{r.group.name}</span>
                        )}
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell align="right">
                       <Link href={`/admin/pendaftaran/${r.id}`} className="h-8 px-3 bg-white text-emerald-950 hover:bg-emerald-900 hover:text-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest shadow-sm">
                        Audit <ArrowRight size={12} strokeWidth={3} className="text-emerald-600" />
                      </Link>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </div>
        </div>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-xl p-8 text-white relative overflow-hidden shadow-2xl border-b-4 border-emerald-900">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-16 -mt-16 pointer-events-none"><ShieldCheck size={250} /></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner shrink-0 backdrop-blur-sm">
              <Activity size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight">Otoritas Validasi Registrasi KKN</h2>
              <p className="text-[11px] font-medium text-emerald-400/60 uppercase tracking-widest leading-relaxed max-w-3xl">
                Proses audit menentukan kelayakan akademik mahasiswa. Harap verifikasi berkas secara teliti sesuai parameter KKN 2026/2027. Kesalahan validasi berdampak pada integritas data penempatan kelompok secara massal.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
