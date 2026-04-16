import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  CheckCheck, Clock, ClipboardList, Download, IdCard, Search, Users,
  XCircle, Filter, ChevronDown, X, Database, ShieldCheck, Activity, ArrowRight, Zap, Target
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Registration {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  rejection_reason?: string | null;
  student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string }; };
  period: { name: string; id: number | null };
  group?: { name: string };
  registration_date: string;
}
interface Props {
  registrations?: { data: Registration[]; meta: PaginationMeta };
  filters: { search?: string; status?: string; period_id?: string };
  stats?: { total: number; pending: number; approved: number; rejected: number; };
  periods?: Array<{ id: number; name: string }>;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  try { const d = new Date(value); if (isNaN(d.getTime())) return '—'; return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
  catch { return '—'; }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'MENUNGGU', approved: 'DISETUJUI', rejected: 'DITOLAK',
};

export default function RegistrationsIndex({ registrations, filters, stats, periods }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? '');
  const [periodId, setPeriodId] = useState(filters.period_id ?? '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setSearch(filters.search ?? ''); setStatus(filters.status ?? ''); setPeriodId(filters.period_id ?? ''); }, [filters]);

  const pendingIds = useMemo(() => registrations?.data?.filter(r => r.status === 'pending').map(r => r.id) ?? [], [registrations?.data]);

  const applyFilters = () => router.get('/admin/pendaftaran', { search: search || undefined, status: status || undefined, period_id: periodId || undefined }, { preserveState: true, preserveScroll: true, replace: true });
  const resetFilters = () => { setSearch(''); setStatus(''); setPeriodId(''); router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true }); };
  const handleBulkApprove = () => { if (selectedIds.length === 0) return; if (confirm(`Setujui ${selectedIds.length} pendaftaran terpilih?`)) router.post('/admin/pendaftaran/setuju-massal', { ids: selectedIds }, { preserveScroll: true, onSuccess: () => setSelectedIds([]) }); };
  const handleBulkReject = () => { if (selectedIds.length === 0) return; const notes = prompt(`Alasan penolakan untuk ${selectedIds.length} pendaftaran:`); if (notes) router.post('/admin/pendaftaran/tolak-massal', { ids: selectedIds, notes }, { preserveScroll: true, onSuccess: () => setSelectedIds([]) }); };
  const handleExport = (type: 'standard' | 'biodata') => { const url = type === 'standard' ? '/admin/pendaftaran/ekspor' : '/admin/pendaftaran/ekspor-biodata'; const params = new URLSearchParams(); if (search) params.set('search', search); if (status) params.set('status', status); if (periodId) params.set('period_id', periodId); window.location.href = `${url}${params.toString() ? `?${params.toString()}` : ''}`; };
  const toggleSelect = (id: number) => setSelectedIds(cur => cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id]);
  const toggleSelectAll = () => setSelectedIds(cur => cur.length === pendingIds.length ? [] : pendingIds);
  const activeFilterCount = (search ? 1 : 0) + (status ? 1 : 0) + (periodId ? 1 : 0);

  return (
    <AppLayout title="Validasi Pendaftaran KKN">
      <Head title="Manajemen Pendaftaran" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <ClipboardList size={18} />
            <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Gerbang Masuk Operasional</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                Validasi <span className="text-emerald-500">Pendaftaran.</span>
              </h1>
              <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
                Verifikasi berkas, validasi persyaratan, dan manajemen entri peserta KKN UIN SAIZU secara terpusat.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => handleExport('standard')} className="h-14 px-6 bg-white border-2 border-emerald-50 text-emerald-700 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase">
                <Download size={18} /> EKSPOR LIST
              </button>
              <button onClick={() => handleExport('biodata')} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-[10px] tracking-widest uppercase">
                <IdCard size={18} /> UNDUH BIODATA
              </button>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RegistrationMetric label="Total Pendaftar" value={stats?.total ?? 0} icon={Database} status="success" />
          <RegistrationMetric label="Menunggu Validasi" value={stats?.pending ?? 0} icon={Clock} status={stats?.pending && stats.pending > 0 ? 'warning' : 'success'} />
          <RegistrationMetric label="Disetujui" value={stats?.approved ?? 0} icon={CheckCheck} status="success" />
          <RegistrationMetric label="Ditolak" value={stats?.rejected ?? 0} icon={XCircle} status="danger" />
        </div>

        {/* --- BULK ACTION BAR --- */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-950 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-emerald-800 shadow-2xl relative overflow-hidden group/bulk">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/bulk:rotate-12 transition-transform"><Target size={150} /></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="h-12 w-12 bg-emerald-900 border border-emerald-800 rounded-2xl flex items-center justify-center shadow-inner text-emerald-400">
                <Zap size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-white tabular-nums leading-none mb-1">{selectedIds.length} Pendaftaran Terpilih</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Tindakan Massal Siap Dieksekusi</span>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <button onClick={handleBulkApprove} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-95">Setujui Semua</button>
              <button onClick={handleBulkReject} className="h-11 px-6 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-900/40 active:scale-95">Tolak Semua</button>
              <button onClick={() => setSelectedIds([])} className="h-11 w-11 bg-emerald-900/50 border border-emerald-800 text-emerald-400 hover:text-white rounded-xl transition-all flex items-center justify-center"><X size={18} /></button>
            </div>
          </div>
        )}

        {/* --- TABLE PANEL --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 bg-emerald-50/50 border-b-2 border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && applyFilters()} 
                className="w-full h-12 pl-12 pr-4 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300 uppercase tracking-widest" 
                placeholder="CARI NAMA ATAU NIM MAHASISWA..." 
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className={clsx("h-12 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all", showFilters ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border-2 border-emerald-50 text-emerald-700 hover:border-emerald-200")}>
                <Filter size={16} /> {activeFilterCount > 0 ? `FILTER (${activeFilterCount})` : 'FILTER OPSIONAL'}
              </button>
              <button onClick={applyFilters} className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">TERAPKAN</button>
            </div>
          </div>

          {showFilters && (
            <div className="p-6 bg-emerald-50/30 border-b-2 border-emerald-50 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">PERIODE KKN</label>
                <div className="relative group">
                  <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-12 pl-5 pr-10 rounded-xl border-2 border-emerald-50 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-500 appearance-none shadow-sm transition-all">
                    <option value="">SEMUA PERIODE</option>
                    {periods?.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest pl-1">STATUS VALIDASI</label>
                <div className="relative group">
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-12 pl-5 pr-10 rounded-xl border-2 border-emerald-50 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-500 appearance-none shadow-sm transition-all">
                    <option value="">SEMUA STATUS</option>
                    <option value="pending">MENUNGGU VERIFIKASI</option>
                    <option value="approved">TELAH DISETUJUI</option>
                    <option value="rejected">DITOLAK SISTEM</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end pt-4 border-t border-emerald-100">
                <button onClick={resetFilters} className="text-[10px] font-bold text-emerald-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Reset Semua Filter</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-emerald-50">
              <thead className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-950">
                <tr>
                  <th className="px-8 py-5 w-12">
                    <input type="checkbox" checked={pendingIds.length > 0 && selectedIds.length === pendingIds.length} onChange={toggleSelectAll} className="h-5 w-5 rounded-lg border-2 border-emerald-200 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest">Identitas Mahasiswa</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest">Fakultas / Pogram Studi</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-center">Periode & Alur</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest">Status Verifikasi</th>
                  <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-emerald-50">
                {!registrations?.data?.length ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <ClipboardList size={40} className="text-emerald-100 mb-2" strokeWidth={1.5} />
                        <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Data Pendaftaran Kosong</span>
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Tidak ada pendaftaran mahasiswa yang ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                ) : registrations.data.map(r => (
                  <tr key={r.id} className={clsx("group hover:bg-emerald-50/30 transition-all", selectedIds.includes(r.id) && 'bg-emerald-50/60')}>
                    <td className="px-8 py-6 text-center">
                      {r.status === 'pending' ? (
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-5 w-5 rounded-lg border-2 border-emerald-200 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                      ) : <div className="h-2 w-2 rounded-full bg-emerald-100 mx-auto" />}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 uppercase group-hover:text-emerald-700 transition-colors leading-tight mb-1.5">{r.student.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">NIM: {r.student.nim}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight leading-tight mb-1 truncate max-w-xs">{r.student.program?.name || 'UMUM'}</span>
                        <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest">{r.student.faculty?.name || 'UIN SAIZU'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-950 tabular-nums uppercase mb-1">
                          <Clock size={12} className="text-emerald-500" />
                          <span>{formatDateTime(r.registration_date)}</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest opacity-60 leading-none">{r.period.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className={clsx("inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit border", 
                          r.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          r.status === 'approved' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {STATUS_LABEL[r.status]}
                        </div>
                        {r.group && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-60 leading-none">{r.group.name}</span>}
                        {r.status === 'rejected' && r.rejection_reason && <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed max-w-xs truncate" title={r.rejection_reason}>{r.rejection_reason}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <Link href={`/admin/pendaftaran/${r.id}`} className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all">
                          Verifikasi <ArrowRight size={14} strokeWidth={3} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Halaman {registrations?.meta?.current_page || 1} dari {registrations?.meta?.total || 0} pendaftar terdaftar
            </span>
            {registrations?.meta && <Pagination meta={registrations.meta} />}
          </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 -mr-20 -mt-20"><ShieldCheck size={300} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-800 shadow-inner">
                        <Activity size={40} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight uppercase leading-none mb-1">Otoritas Validasi Registrasi KKN</h2>
                        <p className="text-[12px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-2xl">
                           Proses validasi ini menentukan kelayakan akademik mahasiswa untuk melanjutkan ke fase penempatan kelompok. Harap lakukan verifikasi berkas secara teliti sesuai dengan parameter kelulusan prasyarat KKN.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

function RegistrationMetric({ label, value, icon: Icon, status }: { label: string, value: string | number, icon: LucideIcon, status: 'success' | 'warning' | 'danger' }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border", 
        status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
        status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
      )}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col z-20">
        <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase leading-none mb-2">{label}</span>
        <span className="text-xl font-black text-emerald-950 tracking-tight tabular-nums leading-none uppercase">{value}</span>
      </div>
    </div>
  );
}
