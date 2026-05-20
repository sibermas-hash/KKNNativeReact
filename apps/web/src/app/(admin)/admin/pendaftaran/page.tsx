'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList, CheckCircle2, XCircle, Eye, Search, RefreshCw, Download, Users, FileCheck2, AlertTriangle, Filter, ArrowUpDown } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

type DocItem = { field: string; label: string; required: boolean; uploaded: boolean; is_verified?: boolean; file_name?: string };
type DetailDoc = { document_type?: string; file_path?: string; file_name?: string; mime_type?: string; file_exists?: boolean };
type DocSummary = { uploaded_count: number; required_count: number; missing_required_count: number; items: DocItem[] };
type JenisInfo = {
  id?: number;
  name?: string;
  description?: string;
  registration_mode_label?: string;
  placement_mode_label?: string;
};
interface Registration { id: number; mahasiswa?: { nama?: string; nim?: string; fakultas?: { nama?: string } }; periode?: { name?: string; jenis_kkn?: JenisInfo }; kelompok_id?: number | null; kelompok?: { id?: number } | null; status: string; first_uploaded_at?: string | null; document_summary?: DocSummary }
type ApiList = { items: Registration[]; meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number; from?: number; to?: number } };
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
  visibleApprovedCount: number;
  visibleRejectedCount: number;
};
const REVIEWABLE = ['pending', 'document_submitted', 'document_verified'];
const STATUS_TABS = [
  { value: 'pending', label: 'Belum Upload' },
  { value: 'document_submitted', label: 'Dokumen Masuk' },
  { value: 'document_verified', label: 'Terverifikasi' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'interview_scheduled', label: 'Wawancara' },
];


function pageWindow(current: number, last: number): Array<number | 'dots'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, last - 1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: Array<number | 'dots'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('dots');
    out.push(sorted[i]);
  }
  return out;
}

function DocumentSummaryCell({ summary, registrationId }: { summary?: DocSummary; registrationId: number }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [loadingField, setLoadingField] = useState<string | null>(null);
  if (!summary) return <span className="text-xs text-slate-400">-</span>;
  const uploaded = summary.uploaded_count;
  const required = summary.required_count;
  const missing = summary.missing_required_count;
  const items = summary.items || [];
  const closePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewName(''); setPreviewType(''); setLoadingField(null); };
  const showPreview = async (item: DocItem) => {
    if (!item.uploaded) return;
    setLoadingField(item.field);
    try {
      const res = await adminApi.registrations.show(registrationId);
      const detail = ((res as { data?: { documents?: DetailDoc[] } }).data ?? res) as { documents?: DetailDoc[] };
      const doc = (detail.documents ?? []).find((d) => d.document_type === item.field || d.file_name === item.file_name || (item.label && (d.file_name || '').toLowerCase().includes(item.label.toLowerCase())));
      if (!doc?.file_path || doc.file_exists === false) return;
      const blobRes = await adminApi.registrations.downloadDocument(doc.file_path);
      const blob = blobRes instanceof Blob ? blobRes : (blobRes as { data: Blob }).data;
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewName(doc.file_name || item.file_name || item.label);
      setPreviewType(blob.type || doc.mime_type || '');
    } catch { toast.error('Gagal memuat preview dokumen'); }
    finally { setLoadingField(null); }
  };
  return (
    <div className="relative min-w-[260px] space-y-2">
      <div className="flex items-center gap-2 text-xs font-black">
        <span className={missing > 0 ? 'text-rose-700' : 'text-emerald-700'}>{uploaded}/{required} dokumen wajib</span>
        {missing > 0 && <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700">Kurang {missing}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((d) => <span key={d.field} onClick={() => showPreview(d)} className={`cursor-pointer rounded-md px-2 py-1 text-[10px] font-bold ring-1 ${d.uploaded ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100' : d.required ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-50 text-slate-500 ring-slate-100'}`}>{loadingField === d.field ? '…' : d.uploaded ? '✓' : '×'} {d.label}{d.required ? '' : ' (opsional)'}</span>)}
      </div>
      {previewUrl && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm" onClick={closePreview}>
        <div className="flex h-[92vh] w-[min(92vw,900px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-black text-slate-800">{previewName}</p><button type="button" onClick={closePreview} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Tutup</button></div>
          <div className="min-h-0 flex-1 bg-slate-100">{previewType.includes('image') ? <img src={previewUrl} alt={previewName} className="h-full w-full object-contain"/> : <iframe src={previewUrl} title={previewName} className="h-full w-full"/>}</div>
        </div>
      </div>}
    </div>
  );
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusGroup, setStatusGroup] = useState(searchParams.get('status_group') || 'unprocessed');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page') || 1)));
  const [perPage, setPerPage] = useState(Math.max(1, Number(searchParams.get('per_page') || 25)));
  const [jenisKknId, setJenisKknId] = useState(searchParams.get('jenis_kkn_id') || '');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>((searchParams.get('direction') === 'desc' ? 'desc' : 'asc'));
  const toggleDateSort = () => { setPage(1); setDateSort((v) => v === 'asc' ? 'desc' : 'asc'); };
  const fmtDateTime = (v?: string | null) => v ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : '-';
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Registration | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const periodeId = searchParams.get('periode_id') ?? '';

  useEffect(() => { setSelectedIds([]); setPage(1); }, [statusGroup, status, search, periodeId, jenisKknId]);
  useEffect(() => {
    const qs = new URLSearchParams();
    if (statusGroup) qs.set('status_group', statusGroup);
    if (status) qs.set('status', status);
    if (search) qs.set('search', search);
    if (periodeId) qs.set('periode_id', periodeId);
    if (jenisKknId) qs.set('jenis_kkn_id', jenisKknId);
    if (page > 1) qs.set('page', String(page));
    if (perPage !== 25) qs.set('per_page', String(perPage));
    qs.set('sort', 'first_uploaded_at');
    qs.set('direction', dateSort);
    router.replace(`/admin/pendaftaran${qs.toString() ? `?${qs.toString()}` : ''}`, { scroll: false });
  }, [router, statusGroup, status, search, periodeId, jenisKknId, page, perPage, dateSort]);

  const { data: activePeriods = [] } = useQuery<PeriodOption[]>({
    queryKey: ['admin', 'periods', 'active-registration-review'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await adminApi.periods.index({ is_active: true, per_page: 100 });
      const payload = (res as { data?: unknown }).data ?? res;
      const rows = Array.isArray(payload) ? payload : ((payload as { data?: PeriodOption[] }).data ?? []);
      return rows as PeriodOption[];
    },
  });

  const { data, isLoading, isError, refetch } = useQuery<ApiList>({
    queryKey: ["admin", "registrations", { statusGroup, status, search, periodeId, jenisKknId, page, perPage, dateSort }],
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await rawApi.get("/admin/pendaftaran", { params: { status_group: statusGroup || undefined, status: status || undefined, search, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, sort: 'first_uploaded_at', direction: dateSort, page, per_page: perPage } });
      const envelope = res.data as { data?: Registration[]; meta?: ApiList["meta"] };
      return { items: envelope.data ?? [], meta: envelope.meta };
    },
  });
  useEffect(() => { if (data) setLastUpdated(new Date()); }, [data]);
  const { data: stats } = useQuery<{ total: number; review: number; approved: number; rejected: number }>({
    queryKey: ['admin', 'registrations', 'fast-stats', { search, periodeId, jenisKknId }],
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const base = { search, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, per_page: 1 };
      const [total, review, approved, rejected] = await Promise.all([
        rawApi.get('/admin/pendaftaran', { params: { ...base } }),
        rawApi.get('/admin/pendaftaran', { params: { ...base, status_group: 'unprocessed' } }),
        rawApi.get('/admin/pendaftaran', { params: { ...base, status: 'approved' } }),
        rawApi.get('/admin/pendaftaran', { params: { ...base, status: 'rejected' } }),
      ]);
      const getTotal = (res: unknown) => ((res as { data?: { meta?: { total?: number } } }).data?.meta?.total ?? 0);
      return { total: getTotal(total), review: getTotal(review), approved: getTotal(approved), rejected: getTotal(rejected) };
    },
  });
  const registrations = data?.items ?? [];
  const meta = data?.meta;
  const lastPage = Math.max(1, meta?.last_page ?? 1);
  const currentPage = meta?.current_page ?? page;
  const pages = pageWindow(currentPage, lastPage);
  useEffect(() => { if (page > lastPage) setPage(lastPage); }, [page, lastPage]);
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
      visibleApprovedCount: 0,
      visibleRejectedCount: 0,
    };

    current.activePeriodCount += 1;
    map.set(key, current);
    return map;
  }, new Map()).values());

  const approveMutation = useMutation({ mutationFn: (id: number) => adminApi.registrations.approve(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Disetujui'); setApproveConfirm(null); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menyetujui') });
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Ditolak'); setRejectTarget(null); setRejectReason(''); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menolak') });
  const bulkApproveMutation = useMutation({ mutationFn: (ids: number[]) => adminApi.registrations.bulkApprove(ids), onSuccess: (res: unknown) => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); const payload = (res as { data?: { approved_count?: number } })?.data; toast.success(`${payload?.approved_count ?? selectedIds.length} pendaftaran disetujui`); setSelectedIds([]); setBulkApproveConfirm(false); }, onError: () => toast.error('Gagal menyetujui massal') });

  const toggleSelect = (r: Registration) => REVIEWABLE.includes(r.status) && setSelectedIds((prev) => prev.includes(r.id) ? prev.filter((i) => i !== r.id) : [...prev, r.id]);
  const exportFile = async (format: 'xlsx' | 'pdf') => {
    try {
      const res = await adminApi.registrations.exportFile({ format, status: status || undefined, periode_id: periodeId || undefined, jenis_kkn_id: jenisKknId || undefined, limit: 50000 });
      const blob = (res as { data: Blob }).data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'peserta-kkn-lengkap-' + new Date().toISOString().slice(0,10) + '.' + format;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Gagal export ' + format.toUpperCase()); }
  };
  const submitReject = () => { const reason = rejectReason.trim(); if (reason.length < 5) return toast.error('Alasan minimal 5 karakter'); if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason }); };

  return <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader title="Manajemen Pendaftaran KKN" subtitle="Validasi dokumen mahasiswa, setujui/tolak pendaftaran, dan pantau status penempatan." />
    <div className="grid gap-2 md:grid-cols-4">
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3"><Users className="text-slate-500" size={20} /><p className="text-xs font-bold uppercase text-slate-500">Total Pendaftar</p></div>
        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.total ?? 0}</p>
      </div>
      <div className="rounded-xl bg-amber-50 p-3 shadow-sm ring-1 ring-amber-100">
        <div className="flex items-center gap-3"><AlertTriangle className="text-amber-600" size={20} /><p className="text-xs font-bold uppercase text-amber-700">Perlu review</p></div>
        <p className="mt-2 text-2xl font-black text-amber-700">{stats?.review ?? 0}</p>
      </div>
      <div className="rounded-xl bg-emerald-50 p-3 shadow-sm ring-1 ring-emerald-100">
        <div className="flex items-center gap-3"><FileCheck2 className="text-emerald-600" size={20} /><p className="text-xs font-bold uppercase text-emerald-700">Disetujui</p></div>
        <p className="mt-2 text-2xl font-black text-emerald-700">{stats?.approved ?? 0}</p>
      </div>
      <div className="rounded-xl bg-rose-50 p-3 shadow-sm ring-1 ring-rose-100">
        <div className="flex items-center gap-3"><XCircle className="text-rose-600" size={20} /><p className="text-xs font-bold uppercase text-rose-700">Ditolak</p></div>
        <p className="mt-2 text-2xl font-black text-rose-700">{stats?.rejected ?? 0}</p>
      </div>
    </div>
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 pr-2 text-sm font-black text-slate-800"><Filter size={16} /> Filter</div>
        {[{value:'unprocessed',label:'Belum diproses'},{value:'processed',label:'Sudah diproses'},{value:'',label:'Semua'}].map((tab) => <button key={tab.value || 'all-group'} type="button" onClick={() => { setStatusGroup(tab.value); setStatus(''); }} className={`h-10 rounded-xl px-3 text-xs font-black uppercase tracking-wide ring-1 transition ${statusGroup === tab.value ? 'bg-teal-600 text-white ring-teal-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>{tab.label}</button>)}
        <select value={jenisKknId} onChange={(e) => setJenisKknId(e.target.value)} className="h-10 max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase text-slate-600" aria-label="Filter jenis KKN"><option value="">Semua Jenis KKN</option>{jenisCards.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}</select>
        <div className="relative min-w-[240px] flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIM" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm font-bold outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" /></div>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase text-slate-600" aria-label="Jumlah data per halaman">{[10,25,50,100].map((n) => <option key={n} value={n}>{n} / halaman</option>)}</select>
        <button onClick={() => refetch()} disabled={isLoading} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className="inline" /> Refresh</button>
        {selectedIds.length > 0 && <button onClick={() => setBulkApproveConfirm(true)} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase text-white">Setujui {selectedIds.length}</button>}
      </div>    </div>

    {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : isError ? <div className="rounded-2xl bg-rose-50 p-6 text-center"><p className="font-bold text-rose-700">Gagal memuat data</p><button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Coba Lagi</button></div> : registrations.length === 0 ? <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada pendaftaran sesuai filter" /> : <><div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">Tips: klik Detail untuk melihat berkas. Gunakan Setujui hanya jika dokumen wajib lengkap. Jika menolak, tulis alasan jelas agar mahasiswa bisa memperbaiki.</div><div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="w-10 px-4 py-3"></th><th className="px-4 py-3">Mahasiswa</th><th className="px-4 py-3">Jenis/Periode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><button type="button" onClick={toggleDateSort} className="inline-flex items-center gap-1 hover:text-slate-900">Tanggal {dateSort === 'asc' ? '↑' : '↓'}<ArrowUpDown size={12}/></button></th><th className="px-4 py-3">Dokumen</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{registrations.map((r) => { const reviewable = REVIEWABLE.includes(r.status); return <tr key={r.id} className="align-top hover:bg-slate-50/60"><td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(r.id)} disabled={!reviewable} onChange={() => toggleSelect(r)} className="h-4 w-4 disabled:opacity-30" /></td><td className="px-4 py-4"><p className="font-black text-slate-900">{r.mahasiswa?.nama || '-'}</p><p className="text-xs text-slate-500">{r.mahasiswa?.nim || '-'} • {r.mahasiswa?.fakultas?.nama || '-'}</p></td><td className="px-4 py-4"><p className="font-bold text-slate-700">{r.periode?.jenis_kkn?.name || '-'}</p><p className="text-xs text-slate-500">{r.periode?.name || '-'}</p></td><td className="px-4 py-4"><StatusBadge status={r.status || ''} />{r.status === 'approved' && !r.kelompok_id && !r.kelompok && <span className="mt-2 inline-flex rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black uppercase text-amber-700 ring-1 ring-amber-100">Menunggu Penempatan</span>}</td><td className="px-4 py-4"><p className="text-xs font-bold text-slate-700">{fmtDateTime(r.first_uploaded_at)}</p></td><td className="px-4 py-4"><DocumentSummaryCell summary={r.document_summary} registrationId={r.id} /></td><td className="px-4 py-4"><div className="flex justify-end gap-2">{reviewable && <><button onClick={() => setApproveConfirm(r)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"><CheckCircle2 size={12} className="inline" /> Setujui</button><button onClick={() => { setRejectTarget(r); setRejectReason(''); }} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><XCircle size={12} className="inline" /> Tolak</button></>}<Link href={`/admin/pendaftaran/${r.id}?returnTo=${encodeURIComponent(`/admin/pendaftaran?${new URLSearchParams({ status_group: statusGroup, ...(status ? { status } : {}), ...(search ? { search } : {}), ...(periodeId ? { periode_id: periodeId } : {}), ...(jenisKknId ? { jenis_kkn_id: jenisKknId } : {}), sort: 'first_uploaded_at', direction: dateSort, page: String(currentPage), per_page: String(perPage) }).toString()}`)}`} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"><Eye size={12} className="inline" /> Detail</Link></div></td></tr>; })}</tbody></table></div>
    </div></>}

    {meta && <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-xs font-semibold text-slate-500">Menampilkan <b className="text-slate-800">{meta.from ?? ((currentPage - 1) * perPage + 1)}-{meta.to ?? ((currentPage - 1) * perPage + registrations.length)}</b> dari <b className="text-slate-800">{(meta.total ?? registrations.length).toLocaleString('id-ID')}</b> pendaftaran</p>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman pendaftaran">
        <button aria-label="Halaman pertama" disabled={currentPage <= 1 || isLoading} onClick={() => setPage(1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
        <button aria-label="Halaman sebelumnya" disabled={currentPage <= 1 || isLoading} onClick={() => setPage((n) => Math.max(1, n - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        {pages.map((item, idx) => item === 'dots' ? <span key={`dots-${idx}`} className="px-1 text-xs font-black text-slate-400">…</span> : <button key={item} onClick={() => setPage(item)} disabled={isLoading} className={`h-9 min-w-9 rounded-xl px-3 text-xs font-black transition ${currentPage === item ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item}</button>)}
        <button aria-label="Halaman berikutnya" disabled={currentPage >= lastPage || isLoading} onClick={() => setPage((n) => Math.min(lastPage, n + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        <button aria-label="Halaman terakhir" disabled={currentPage >= lastPage || isLoading} onClick={() => setPage(lastPage)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
      </div>
    </div>}
    <ConfirmDialog open={approveConfirm !== null} onClose={() => setApproveConfirm(null)} onConfirm={() => approveConfirm && approveMutation.mutate(approveConfirm.id)} title="Setujui pendaftaran?" description={approveConfirm?.mahasiswa?.nama || ''} confirmText="Setujui" variant="info" />
    <ConfirmDialog open={bulkApproveConfirm} onClose={() => setBulkApproveConfirm(false)} onConfirm={() => bulkApproveMutation.mutate(selectedIds)} title={`Setujui ${selectedIds.length} pendaftaran?`} description="Pastikan dokumen wajib sudah lengkap dan benar." confirmText="Setujui Semua" variant="info" />
    {rejectTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-black">Tolak Pendaftaran</h3><p className="mt-1 text-xs text-slate-500">{rejectTarget.mahasiswa?.nama}</p><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Alasan penolakan" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setRejectTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-slate-200">Batal</button><button onClick={submitReject} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">Tolak</button></div></div></div>}
  </div>;
}
