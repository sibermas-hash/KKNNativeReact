'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, XCircle, Eye, Download, Search, Filter, Users, FileCheck2 } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

type DocItem = { field: string; label: string; required: boolean; uploaded: boolean; is_verified?: boolean; file_name?: string; file_path?: string };
type DocSummary = { uploaded_count: number; required_count: number; missing_required_count: number; items: DocItem[] };
type JenisInfo = { id?: number; name?: string; description?: string };
interface Registration { id: number; mahasiswa?: { nama?: string; nim?: string; fakultas?: { nama?: string } }; periode?: { name?: string; jenis_kkn?: JenisInfo }; status: string; document_summary?: DocSummary; created_at?: string }
type ApiList = { items: Registration[]; meta?: { current_page?: number; last_page?: number; total?: number } };
type PeriodOption = { id: number; name?: string; jenis_kkn?: JenisInfo | null; jenis?: JenisInfo | null; jenis_kkn_id?: number };
const REVIEWABLE = ['pending', 'document_submitted', 'document_verified'];

const docLabel = (field?: string, label?: string) => field === 'health_certificate' || label === 'health_certificate' ? 'Surat Sehat' : field === 'parent_permission' || label === 'parent_permission' ? 'Izin Ortu' : (label || field || 'Dokumen');

function DocumentSummaryCell({ summary }: { summary?: DocSummary }) {
  if (!summary) return <span className="text-xs text-slate-400">-</span>;
  const { uploaded_count, required_count, missing_required_count, items } = summary;
  return (
    <div className="space-y-1.5">
      <span className={`text-xs font-bold ${missing_required_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
        {uploaded_count}/{required_count} {missing_required_count > 0 ? `(kurang ${missing_required_count})` : '✓'}
      </span>
      <div className="flex flex-wrap gap-1">
        {items.map((d) => (
          <span key={d.field} className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${d.uploaded ? 'bg-emerald-50 text-emerald-700' : d.required ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            {d.uploaded ? '✓' : '×'} {docLabel(d.field, d.label)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [jenisKknId, setJenisKknId] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Registration | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const periodeId = searchParams?.get('periode_id') ?? '';

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setSelectedIds([]); setPage(1); }, [status, debouncedSearch, periodeId, jenisKknId]);

  // Jenis KKN options
  const { data: jenisOptions = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['admin', 'jenis-kkn-options'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/jenis-kkn?per_page=50');
      const body = res.data as { data?: { id: number; name: string }[] };
      return body.data ?? [];
    },
    staleTime: 60000,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'registrations-stats'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/pendaftaran/stats');
      return ((res.data as { data?: unknown }).data ?? res.data) as { total: number; pending: number; document_submitted: number; document_verified: number; approved: number; interview_scheduled: number; rejected: number };
    },
    staleTime: 30000,
  });

  // Main data
  const { data, isLoading, isError, refetch } = useQuery<ApiList>({
    queryKey: ['admin', 'registrations', { status, search: debouncedSearch, periodeId, jenisKknId, page }],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        per_page: 25,
      };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      if (periodeId) params.periode_id = periodeId;
      if (jenisKknId) params.jenis_kkn_id = jenisKknId;
      const res = await rawApi.get('/admin/pendaftaran', { params });
      const envelope = res.data as { data?: Registration[]; meta?: ApiList['meta'] };
      return { items: envelope.data ?? [], meta: envelope.meta };
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const registrations = data?.items ?? [];
  const meta = data?.meta;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.registrations.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Pendaftaran disetujui'); setApproveConfirm(null); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menyetujui'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Pendaftaran ditolak'); setRejectTarget(null); setRejectReason(''); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menolak'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: number[]) => adminApi.registrations.bulkApprove(ids),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
      const payload = (res as { data?: { approved_count?: number } })?.data;
      toast.success(`${payload?.approved_count ?? selectedIds.length} pendaftaran disetujui`);
      setSelectedIds([]); setBulkApproveConfirm(false);
    },
    onError: () => toast.error('Gagal menyetujui massal'),
  });

  const toggleSelect = (r: Registration) => REVIEWABLE.includes(r.status) && setSelectedIds((prev) => prev.includes(r.id) ? prev.filter((i) => i !== r.id) : [...prev, r.id]);

  const submitReject = () => {
    const reason = rejectReason.trim();
    if (reason.length < 5) return toast.error('Alasan minimal 5 karakter');
    if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason });
  };

  const exportFile = async (format: 'xlsx' | 'pdf') => {
    try {
      const res = await rawApi.get('/admin/pendaftaran/export', { params: { format, status: status || undefined, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, limit: 50000 }, responseType: 'blob' });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `pendaftaran-kkn-${new Date().toISOString().slice(0, 10)}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(`Gagal export ${format.toUpperCase()}`); }
  };

  const statusOptions = [
    { value: '', label: 'Semua Status', count: meta?.total },
    { value: 'pending', label: 'Belum Upload Dokumen' },
    { value: 'document_submitted', label: 'Dokumen Masuk' },
    { value: 'document_verified', label: 'Dokumen Terverifikasi' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'interview_scheduled', label: 'Menunggu Wawancara' },
    { value: 'interview_passed', label: 'Lulus Wawancara' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Pendaftaran KKN" subtitle="Review, validasi dokumen, approval, dan export pendaftaran mahasiswa." />

      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Sentral Review Pendaftaran</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{(stats?.total ?? meta?.total ?? 0).toLocaleString('id-ID')} Pendaftaran</h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">Pantau dokumen masuk, verifikasi, approval, penolakan, dan pendaftaran per jenis KKN.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Dipilih</p>
            <p className="text-2xl font-black">{selectedIds.length}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div onClick={() => setStatus('')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${!status ? 'bg-cyan-50 ring-cyan-200' : 'bg-white ring-slate-200 hover:ring-cyan-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
            <p className="text-xl font-bold text-slate-900">{stats.total?.toLocaleString('id-ID') ?? 0}</p>
          </div>
          <div onClick={() => setStatus('pending')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${status === 'pending' ? 'bg-amber-50 ring-amber-200' : 'bg-white ring-slate-200 hover:ring-amber-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Belum Upload</p>
            <p className="text-xl font-bold text-amber-600">{stats.pending?.toLocaleString('id-ID') ?? 0}</p>
          </div>
          <div onClick={() => setStatus('document_submitted')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${status === 'document_submitted' ? 'bg-blue-50 ring-blue-200' : 'bg-white ring-slate-200 hover:ring-blue-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Dokumen Masuk</p>
            <p className="text-xl font-bold text-blue-600">{stats.document_submitted?.toLocaleString('id-ID') ?? 0}</p>
          </div>
          <div onClick={() => setStatus('document_verified')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${status === 'document_verified' ? 'bg-indigo-50 ring-indigo-200' : 'bg-white ring-slate-200 hover:ring-indigo-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Terverifikasi</p>
            <p className="text-xl font-bold text-indigo-600">{stats.document_verified?.toLocaleString('id-ID') ?? 0}</p>
          </div>
          <div onClick={() => setStatus('approved')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${status === 'approved' ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200 hover:ring-emerald-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Disetujui</p>
            <p className="text-xl font-bold text-emerald-600">{stats.approved?.toLocaleString('id-ID') ?? 0}</p>
          </div>
          <div onClick={() => setStatus('rejected')} className={`cursor-pointer rounded-xl p-3 shadow-sm ring-1 transition-all ${status === 'rejected' ? 'bg-rose-50 ring-rose-200' : 'bg-white ring-slate-200 hover:ring-rose-200'}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Ditolak</p>
            <p className="text-xl font-bold text-rose-600">{stats.rejected?.toLocaleString('id-ID') ?? 0}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
        <div className="flex items-start gap-2"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" /><div><b>Alur kerja:</b> cek dokumen → verifikasi/detail → setujui/tolak. Bulk approve hanya untuk status yang reviewable.</div></div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIM..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Jenis KKN */}
          <select
            value={jenisKknId}
            onChange={(e) => setJenisKknId(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          >
            <option value="">Semua Jenis KKN</option>
            {jenisOptions.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => exportFile('xlsx')} className="h-10 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
              <Download size={13} className="inline mr-1" />Excel
            </button>
            <button onClick={() => exportFile('pdf')} className="h-10 rounded-xl bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors">
              <Download size={13} className="inline mr-1" />PDF
            </button>
            {(search || status || jenisKknId) && (
              <button onClick={() => { setSearch(''); setStatus(''); setJenisKknId(''); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Reset Filter</button>
            )}
            {selectedIds.length > 0 && (
              <button onClick={() => setBulkApproveConfirm(true)} className="h-10 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white animate-pulse">
                <CheckCircle2 size={13} className="inline mr-1" />Setujui {selectedIds.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {meta && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
          <span className="flex items-center gap-1"><Users size={13} /> {meta.total?.toLocaleString('id-ID') ?? 0} pendaftaran</span>
          <span>Halaman {meta.current_page}/{meta.last_page}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : isError ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-center">
          <p className="font-bold text-rose-700">Gagal memuat data</p>
          <button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Coba Lagi</button>
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada pendaftaran" />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Data Pendaftaran</p>
              <p className="text-xs text-slate-400">Klik detail untuk review lengkap mahasiswa dan dokumen</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">{meta?.total?.toLocaleString('id-ID') ?? 0} data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="w-10 px-3 py-3"><input type="checkbox" onChange={(e) => { if (e.target.checked) { setSelectedIds(registrations.filter(r => REVIEWABLE.includes(r.status)).map(r => r.id)); } else { setSelectedIds([]); } }} checked={selectedIds.length > 0 && selectedIds.length === registrations.filter(r => REVIEWABLE.includes(r.status)).length} className="h-4 w-4" /></th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600">Mahasiswa</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600">Jenis KKN</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600">Dokumen</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {registrations.map((r) => {
                  const reviewable = REVIEWABLE.includes(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.includes(r.id)} disabled={!reviewable} onChange={() => toggleSelect(r)} className="h-4 w-4 disabled:opacity-30" />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{r.mahasiswa?.nama || '-'}</p>
                        <p className="text-xs text-slate-500">{r.mahasiswa?.nim || '-'} • {r.mahasiswa?.fakultas?.nama || '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-700">{r.periode?.jenis_kkn?.name || '-'}</p>
                        <p className="text-xs text-slate-400">{r.periode?.name || '-'}</p>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={r.status || ''} /></td>
                      <td className="px-3 py-3"><DocumentSummaryCell summary={r.document_summary} /></td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1.5">
                          {reviewable && (
                            <>
                              <button onClick={() => setApproveConfirm(r)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700">
                                <CheckCircle2 size={11} className="inline mr-0.5" />Setujui
                              </button>
                              <button onClick={() => { setRejectTarget(r); setRejectReason(''); }} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100">
                                <XCircle size={11} className="inline mr-0.5" />Tolak
                              </button>
                            </>
                          )}
                          <Link href={`/admin/pendaftaran/${r.id}`} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
                            <Eye size={11} className="inline mr-0.5" />Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && (meta.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <button disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40">
            ← Sebelumnya
          </button>
          <span className="text-xs font-bold text-slate-500">
            {meta.current_page} / {meta.last_page} • {meta.total?.toLocaleString('id-ID')} data
          </span>
          <button disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage((n) => n + 1)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40">
            Berikutnya →
          </button>
        </div>
      )}

      {/* Modals */}
      <ConfirmDialog open={approveConfirm !== null} onClose={() => setApproveConfirm(null)} onConfirm={() => approveConfirm && approveMutation.mutate(approveConfirm.id)} title="Setujui pendaftaran?" description={`${approveConfirm?.mahasiswa?.nama ?? ''} — ${approveConfirm?.periode?.jenis_kkn?.name ?? ''}`} confirmText="Setujui" variant="info" />
      <ConfirmDialog open={bulkApproveConfirm} onClose={() => setBulkApproveConfirm(false)} onConfirm={() => bulkApproveMutation.mutate(selectedIds)} title={`Setujui ${selectedIds.length} pendaftaran?`} description="Pastikan dokumen sudah lengkap sebelum menyetujui." confirmText="Setujui Semua" variant="info" />

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Tolak Pendaftaran</h3>
            <p className="mt-1 text-sm text-slate-500">{rejectTarget.mahasiswa?.nama} — {rejectTarget.periode?.jenis_kkn?.name}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Alasan penolakan (min. 5 karakter)..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Batal</button>
              <button onClick={submitReject} disabled={rejectMutation.isPending} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                {rejectMutation.isPending ? 'Menolak...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
