'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, XCircle, Eye, Download, Clock } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

type DocItem = { field: string; label: string; required: boolean; uploaded: boolean; is_verified?: boolean; file_name?: string };
type DocSummary = { uploaded_count: number; required_count: number; missing_required_count: number; items: DocItem[] };
type JenisInfo = {
  id?: number;
  name?: string;
  description?: string;
  registration_mode_label?: string;
  placement_mode_label?: string;
};
interface Registration { id: number; mahasiswa?: { nama?: string; nim?: string; fakultas?: { nama?: string } }; periode?: { name?: string; jenis_kkn?: JenisInfo }; status: string; document_summary?: DocSummary }
type RegistrationStats = {
  total: number;
  reviewable: number;
  pending: number;
  document_submitted: number;
  document_verified: number;
  approved: number;
  rejected: number;
  by_status?: Record<string, number>;
};
type ApiList = {
  items: Registration[];
  meta?: { current_page?: number; last_page?: number; total?: number };
  stats?: RegistrationStats;
};
type PeriodOption = { id: number; name?: string; jenis_kkn?: JenisInfo | null; jenis?: JenisInfo | null; jenis_kkn_id?: number };
type JenisCard = {
  id: string;
  name: string;
  description?: string;
  registrationModeLabel?: string;
  placementModeLabel?: string;
  activePeriodCount: number;
  visibleRegistrationCount: number;
  visibleReviewableCount: number;
};
const REVIEWABLE = ['pending', 'document_submitted', 'document_verified'];

const docLabel = (field?: string, label?: string) => field === 'health_certificate' || label === 'health_certificate' ? 'Surat Keterangan Sehat' : field === 'parent_permission' || label === 'parent_permission' ? 'Surat Izin Orang Tua/Wali' : (label || field || 'Dokumen');

function DocumentSummaryCell({ summary }: { summary?: DocSummary }) {
  if (!summary) return <span className="text-xs text-slate-400">-</span>;
  const uploaded = summary.uploaded_count;
  const required = summary.required_count;
  const missing = summary.missing_required_count;
  const items = summary.items || [];
  return (
    <div className="min-w-[260px] space-y-2">
      <div className="flex items-center gap-2 text-xs font-black">
        <span className={missing > 0 ? 'text-rose-700' : 'text-emerald-700'}>{uploaded}/{required} wajib terunggah</span>
        {missing > 0 && <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700">kurang {missing}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((d) => <span key={d.field} title={d.file_name || d.label} className={`rounded-md px-2 py-1 text-[10px] font-bold ring-1 ${d.uploaded ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : d.required ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-50 text-slate-500 ring-slate-100'}`}>{d.uploaded ? '✓' : '×'} {docLabel(d.field, d.label)}{d.required ? '' : ' (ops)'}</span>)}
      </div>
    </div>
  );
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('document_submitted');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [jenisKknId, setJenisKknId] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Registration | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const periodeId = searchParams?.get('periode_id') ?? '';

  useEffect(() => { setSelectedIds([]); setPage(1); }, [status, search, periodeId, jenisKknId]);

  const { data: activePeriods = [] } = useQuery<PeriodOption[]>({
    queryKey: ['admin', 'periods', 'active-registration-review'],
    queryFn: async () => {
      const res = await adminApi.periods.index({ is_active: true, per_page: 100 });
      const payload = (res as { data?: unknown }).data ?? res;
      const rows = Array.isArray(payload) ? payload : ((payload as { data?: PeriodOption[] }).data ?? []);
      return rows as PeriodOption[];
    },
  });

  const { data, isLoading, isError, refetch } = useQuery<ApiList>({
    queryKey: ['admin', 'registrations', { status, search, periodeId, jenisKknId, page }],
    queryFn: async () => {
      const res = await rawApi.get('/admin/pendaftaran', { params: { status, search, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, page, per_page: 25 } });
      const envelope = res.data as { data?: Registration[]; meta?: ApiList['meta']; stats?: RegistrationStats };
      return { items: envelope.data ?? [], meta: envelope.meta, stats: envelope.stats };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 10000,
  });
  const registrations = data?.items ?? [];
  const meta = data?.meta;
  const totalRegistrations = data?.stats?.total ?? meta?.total ?? registrations.length;
  const reviewableCount = data?.stats?.reviewable ?? registrations.filter((registration) => REVIEWABLE.includes(registration.status)).length;
  const submittedCount = data?.stats?.document_submitted ?? registrations.filter((registration) => registration.status === 'document_submitted').length;
  const jenisCards = Array.from(activePeriods.reduce<Map<string, JenisCard>>((map, period) => {
    const jenis = period.jenis_kkn ?? period.jenis;
    const id = jenis?.id ?? period.jenis_kkn_id;
    if (!id) return map;

    const key = String(id);
    const current = map.get(key) ?? {
      id: key,
      name: jenis?.name ?? `Jenis #${key}`,
      description: jenis?.description,
      registrationModeLabel: jenis?.registration_mode_label,
      placementModeLabel: jenis?.placement_mode_label,
      activePeriodCount: 0,
      visibleRegistrationCount: 0,
      visibleReviewableCount: 0,
    };

    current.activePeriodCount += 1;
    map.set(key, current);
    return map;
  }, new Map()).values()).map((card) => {
    const visibleItems = registrations.filter((registration) => String(registration.periode?.jenis_kkn?.id ?? '') === card.id);
    return {
      ...card,
      visibleRegistrationCount: visibleItems.length,
      visibleReviewableCount: visibleItems.filter((registration) => REVIEWABLE.includes(registration.status)).length,
    };
  });

  const approveMutation = useMutation({ mutationFn: (id: number) => adminApi.registrations.approve(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Disetujui'); setApproveConfirm(null); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menyetujui') });
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Ditolak'); setRejectTarget(null); setRejectReason(''); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menolak') });
  const bulkApproveMutation = useMutation({ mutationFn: (ids: number[]) => adminApi.registrations.bulkApprove(ids), onSuccess: (res: unknown) => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); const payload = (res as { data?: { approved_count?: number } })?.data; toast.success(`${payload?.approved_count ?? selectedIds.length} pendaftaran disetujui`); setSelectedIds([]); setBulkApproveConfirm(false); }, onError: () => toast.error('Gagal menyetujui massal') });

  const toggleSelect = (r: Registration) => REVIEWABLE.includes(r.status) && setSelectedIds((prev) => prev.includes(r.id) ? prev.filter((i) => i !== r.id) : [...prev, r.id]);
  const submitReject = () => { const reason = rejectReason.trim(); if (reason.length < 5) return toast.error('Alasan minimal 5 karakter'); if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason }); };
  const exportFile = async (format: 'xlsx' | 'pdf') => { try { const res = await rawApi.get('/admin/pendaftaran/export', { params: { format, status: status || undefined, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, limit: 50000 }, responseType: 'blob' }); const blob = res.data as Blob; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'peserta-kkn-lengkap-' + new Date().toISOString().slice(0,10) + '.' + format; a.click(); URL.revokeObjectURL(url); } catch { toast.error('Gagal export ' + format.toUpperCase()); } };

  return <div className="space-y-6">
    <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Pendaftaran KKN</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Validasi Dokumen KKN</h2>
          <p className="mt-2 max-w-2xl text-sm text-cyan-50">Review dokumen mahasiswa, setujui pendaftaran, atau minta revisi dalam satu layar.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Total Pendaftaran</p>
            <p className="mt-1 text-2xl font-black">{totalRegistrations.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Perlu Review</p>
            <p className="mt-1 text-2xl font-black">{reviewableCount.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Dokumen Masuk</p>
            <p className="mt-1 text-2xl font-black">{submittedCount.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
    {jenisCards.length > 0 && <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Jenis KKN</h2>
          <p className="text-xs font-semibold text-slate-500">Klik kartu untuk filter data pendaftaran.</p>
        </div>
        {jenisKknId && <button onClick={() => setJenisKknId('')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Reset Filter</button>}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
        {jenisCards.map((jenis) => {
          const active = jenisKknId === jenis.id;
          return <button key={jenis.id} type="button" onClick={() => setJenisKknId((current) => current === jenis.id ? '' : jenis.id)} className={`rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${active ? 'border-teal-300 bg-teal-50 shadow-sm ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200 hover:shadow-md'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">{jenis.name}</h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{jenis.activePeriodCount} periode aktif</p>
              </div>
              <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${active ? 'bg-white text-teal-700 ring-1 ring-teal-200' : 'bg-slate-100 text-slate-600'}`}>{active ? 'Aktif' : 'Filter'}</span>
            </div>
            <div className="mt-3 flex gap-2 text-[11px] font-bold">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">Pendaftar {jenis.visibleRegistrationCount}</span>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">Review {jenis.visibleReviewableCount}</span>
            </div>
          </button>;
        })}
      </div>
    </div>}
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14} className="text-cyan-600" /> Data auto-refresh tiap 10 detik.</div>
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/NIM" className="h-11 w-60 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"><option value="">Semua Status</option><option value="document_submitted">Dokumen Masuk</option><option value="pending">Belum Upload</option><option value="document_verified">Dokumen Terverifikasi</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option></select>
        <button onClick={() => exportFile('xlsx')} className="h-11 rounded-xl bg-teal-600 px-4 text-xs font-black uppercase text-white transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg"><Download size={14} className="inline" /> Export XLSX</button>
        <button onClick={() => exportFile('pdf')} className="h-11 rounded-xl bg-slate-800 px-4 text-xs font-black uppercase text-white transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg"><Download size={14} className="inline" /> Export PDF</button>
        {selectedIds.length > 0 && <button onClick={() => setBulkApproveConfirm(true)} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase text-white">Setujui {selectedIds.length}</button>}
      </div>
    </div>

    {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : isError ? <div className="rounded-2xl bg-rose-50 p-6 text-center"><p className="font-bold text-rose-700">Gagal memuat data</p><button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Coba Lagi</button></div> : registrations.length === 0 ? <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada data" /> : <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="w-10 px-4 py-3"></th><th className="px-4 py-3">Mahasiswa</th><th className="px-4 py-3">Jenis/Periode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Dokumen</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{registrations.map((r) => { const reviewable = REVIEWABLE.includes(r.status); return <tr key={r.id} className="align-top transition-colors hover:bg-cyan-50/40"><td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(r.id)} disabled={!reviewable} onChange={() => toggleSelect(r)} className="h-4 w-4 disabled:opacity-30" /></td><td className="px-4 py-4"><p className="font-black text-slate-900">{r.mahasiswa?.nama || '-'}</p><p className="text-xs text-slate-500">{r.mahasiswa?.nim || '-'} • {r.mahasiswa?.fakultas?.nama || '-'}</p></td><td className="px-4 py-4"><p className="font-bold text-slate-700">{r.periode?.jenis_kkn?.name || '-'}</p><p className="text-xs text-slate-500">{r.periode?.name || '-'}</p></td><td className="px-4 py-4"><StatusBadge status={r.status || ''} /></td><td className="px-4 py-4"><DocumentSummaryCell summary={r.document_summary} /></td><td className="px-4 py-4"><div className="flex justify-end gap-2">{reviewable && <><button onClick={() => setApproveConfirm(r)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"><CheckCircle2 size={12} className="inline" /> Setujui</button><button onClick={() => { setRejectTarget(r); setRejectReason(''); }} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><XCircle size={12} className="inline" /> Tolak</button></>}<Link href={`/admin/pendaftaran/${r.id}`} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"><Eye size={12} className="inline" /> Detail</Link></div></td></tr>; })}</tbody></table></div>
    </div>}

    {meta && (meta.last_page ?? 1) > 1 && <div className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200"><button disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">← Sebelumnya</button><span className="text-xs font-bold text-slate-500">Halaman {meta.current_page ?? page} / {meta.last_page} • Total {meta.total ?? '-'}</span><button disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage((n) => n + 1)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">Berikutnya →</button></div>}
    <ConfirmDialog open={approveConfirm !== null} onClose={() => setApproveConfirm(null)} onConfirm={() => approveConfirm && approveMutation.mutate(approveConfirm.id)} title="Setujui pendaftaran?" description={approveConfirm?.mahasiswa?.nama || ''} confirmText="Setujui" variant="info" />
    <ConfirmDialog open={bulkApproveConfirm} onClose={() => setBulkApproveConfirm(false)} onConfirm={() => bulkApproveMutation.mutate(selectedIds)} title={`Setujui ${selectedIds.length} data?`} description="Pastikan dokumen sudah lengkap." confirmText="Setujui Semua" variant="info" />
    {rejectTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-black">Tolak Pendaftaran</h3><p className="mt-1 text-xs text-slate-500">{rejectTarget.mahasiswa?.nama}</p><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Alasan penolakan" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setRejectTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-slate-200">Batal</button><button onClick={submitReject} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">Tolak</button></div></div></div>}
  </div>;
}
