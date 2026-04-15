import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  CheckCheck, Clock, ClipboardList, Download, IdCard, Search, Users,
  XCircle, Filter, ChevronDown, X, Database,
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
  pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
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
    <AppLayout title="Pendaftaran Peserta KKN">
      <Head title="Manajemen Pendaftaran KKN" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-500">Operasional KKN</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Pendaftaran Peserta KKN</h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">Verifikasi berkas dan validasi pendaftaran mahasiswa KKN.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => handleExport('standard')} className="h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download size={15} /> Ekspor Pendaftaran
            </button>
            <button onClick={() => handleExport('biodata')} className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <IdCard size={15} /> Ekspor Biodata Peserta
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Pendaftar', value: stats?.total ?? 0, icon: Database, cls: '' },
            { label: 'Menunggu Validasi', value: stats?.pending ?? 0, icon: Clock, cls: 'text-amber-600' },
            { label: 'Disetujui', value: stats?.approved ?? 0, icon: CheckCheck, cls: 'text-emerald-600' },
            { label: 'Ditolak', value: stats?.rejected ?? 0, icon: XCircle, cls: 'text-rose-600' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className={clsx("h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0", cls || 'text-gray-600')}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 tabular-nums">{value.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-900">{selectedIds.length} pendaftaran dipilih</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleBulkApprove} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors">Setujui Semua</button>
              <button onClick={handleBulkReject} className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 transition-colors">Tolak Semua</button>
              <button onClick={() => setSelectedIds([])} className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* TABLE PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm" placeholder="Cari nama atau NIM..." />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={clsx("h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 border shadow-sm transition-colors", showFilters ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50")}>
                <Filter size={15} /> {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
              </button>
              <button onClick={applyFilters} className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Terapkan</button>
            </div>
          </div>

          {showFilters && (
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Periode</label>
                <div className="relative">
                  <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 appearance-none shadow-sm">
                    <option value="">Semua Periode</option>
                    {periods?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Status</label>
                <div className="relative">
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-emerald-500 appearance-none shadow-sm">
                    <option value="">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2 border-t border-gray-200">
                <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-rose-600 font-medium transition-colors">Reset Filter</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input type="checkbox" checked={pendingIds.length > 0 && selectedIds.length === pendingIds.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mahasiswa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prodi / Fakultas</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Periode & Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!registrations?.data?.length ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500"><ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" strokeWidth={1.5} />Data pendaftaran tidak ditemukan.</td></tr>
                ) : registrations.data.map(r => (
                  <tr key={r.id} className={clsx("hover:bg-gray-50 transition-colors", selectedIds.includes(r.id) && 'bg-emerald-50/40')}>
                    <td className="px-6 py-4 text-center">
                      {r.status === 'pending' ? (
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      ) : <span className="h-2 w-2 rounded-full bg-gray-200 inline-block" />}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{r.student.name}</span>
                        <span className="text-xs text-gray-500 mt-0.5">NIM: {r.student.nim}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800 truncate max-w-xs">{r.student.program?.name || '—'}</span>
                        <span className="text-xs text-gray-500">{r.student.faculty?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800">{r.period.name}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(r.registration_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit", STATUS_BADGE[r.status])}>
                          {STATUS_LABEL[r.status]}
                        </span>
                        {r.group && <span className="text-xs text-gray-500">{r.group.name}</span>}
                        {r.status === 'rejected' && r.rejection_reason && <span className="text-xs text-rose-500 truncate max-w-xs">{r.rejection_reason}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/pendaftaran/${r.id}`} className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Menampilkan <strong>{registrations?.data?.length ?? 0}</strong> dari <strong>{(registrations?.meta?.total ?? 0).toLocaleString()}</strong></span>
            {registrations?.meta && <Pagination meta={registrations.meta} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
