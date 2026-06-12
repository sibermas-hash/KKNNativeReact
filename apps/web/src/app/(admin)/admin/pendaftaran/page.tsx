'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi, rawApi } from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, XCircle, Eye, Download, Clock, RefreshCcw, Filter as FilterIcon, Search as SearchIcon, X as XIcon, Users, FileCheck2, ShieldAlert, ThumbsUp, ThumbsDown } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

type DocItem = { field: string; label: string; required: boolean; uploaded: boolean; is_verified?: boolean; file_name?: string; file_path?: string };
type DocSummary = { uploaded_count: number; required_count: number; missing_required_count: number; items: DocItem[] };
type JenisInfo = { id?: number; name?: string };
type FakultasInfo = { id?: number; nama?: string };
type ProdiInfo = { id?: number; nama_prodi?: string; nama?: string };
type MahasiswaInfo = {
  nama?: string;
  nim?: string;
  external_nim?: string;
  gender?: string;
  semester?: number;
  gpa?: number | string;
  batch_year?: number;
  origin_type?: string;
  fakultas?: FakultasInfo;
  prodi?: ProdiInfo;
  external_university_name?: string;
};
interface Registration {
  id: number;
  mahasiswa?: MahasiswaInfo;
  periode?: { id?: number; name?: string; jenis_kkn?: JenisInfo };
  status: string;
  entry_scheme?: string;
  registration_date?: string;
  document_summary?: DocSummary;
}
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
  meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number };
  stats?: RegistrationStats;
};
type PeriodOption = { id: number; name?: string; is_active?: boolean; jenis_kkn?: JenisInfo | null; jenis?: JenisInfo | null; jenis_kkn_id?: number; periode?: number | null; academic_year?: string | null };
type FakultasOption = { id: number; nama: string };
type ProdiOption = { id: number; nama_prodi?: string; nama?: string; fakultas_id?: number };
type JenisKknOption = { id: number; name: string };

const REVIEWABLE = ['pending', 'document_submitted', 'document_verified'];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Belum Upload' },
  { value: 'document_submitted', label: 'Dokumen Masuk' },
  { value: 'document_verified', label: 'Dokumen Terverifikasi' },
  { value: 'interview_scheduled', label: 'Wawancara Dijadwalkan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

const STATUS_GROUP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Tahap' },
  { value: 'unprocessed', label: 'Belum Diproses' },
  { value: 'processed', label: 'Sudah Diproses' },
];

const ORIGIN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Asal' },
  { value: 'internal', label: 'Internal UIN Saizu' },
  { value: 'external', label: 'Eksternal' },
];

const ENTRY_SCHEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Skema' },
  { value: 'self', label: 'Mandiri' },
  { value: 'invited', label: 'Diundang' },
  { value: 'transferred', label: 'Transfer' },
];

const docLabel = (field?: string, label?: string) => field === 'health_certificate' || label === 'health_certificate' ? 'Surat Keterangan Sehat' : field === 'parent_permission' || label === 'parent_permission' ? 'Surat Izin Orang Tua/Wali' : (label || field || 'Dokumen');

function DocumentSummaryCell({ summary, onPreview }: { summary?: DocSummary; onPreview?: (item: DocItem) => void }) {
  if (!summary) return <span className="text-xs text-slate-400">-</span>;
  const uploaded = summary.uploaded_count;
  const required = summary.required_count;
  const missing = summary.missing_required_count;
  const items = summary.items || [];
  const ok = missing === 0 && uploaded >= required;
  return (
    <div className="min-w-[220px] space-y-2">
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${ok ? 'bg-emerald-100 text-emerald-700' : missing > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{uploaded}/{required}</span>
        {missing > 0 && <span className="text-[11px] font-bold text-rose-600">{missing} wajib hilang</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((d) => {
          const canPreview = d.uploaded && !!d.file_path && !!onPreview;
          const className = `rounded-md px-2 py-1 text-[10px] font-bold ring-1 transition ${d.uploaded ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : d.required ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-50 text-slate-500 ring-slate-100'} ${canPreview ? 'cursor-pointer hover:bg-cyan-50 hover:text-cyan-700 hover:ring-cyan-200' : ''}`;
          const content = <>{d.uploaded ? '✓' : '×'} {docLabel(d.field, d.label)}{d.required ? '' : ' (ops)'}</>;
          return canPreview ? (
            <button key={d.field} type="button" title={`${d.file_name || d.label} — klik untuk preview`} onClick={() => onPreview?.(d)} className={className}>{content}</button>
          ) : (
            <span key={d.field} title={d.file_name || d.label} className={className}>{content}</span>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate' }) {
  const tones: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-teal-500/10 ring-cyan-300/30 text-cyan-100',
    amber: 'from-amber-500/20 to-orange-500/10 ring-amber-300/30 text-amber-100',
    emerald: 'from-emerald-500/20 to-teal-500/10 ring-emerald-300/30 text-emerald-100',
    rose: 'from-rose-500/20 to-pink-500/10 ring-rose-300/30 text-rose-100',
    slate: 'from-slate-500/20 to-slate-400/10 ring-slate-300/30 text-slate-100',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-4 ring-1 backdrop-blur`}>
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-white/10 p-1.5">{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p>
    </div>
  );
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // ─── filter state ───────────────────────────────────────────────
  const [status, setStatus] = useState('');
  const [statusGroup, setStatusGroup] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [jenisKknId, setJenisKknId] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [prodiId, setProdiId] = useState('');
  const [originType, setOriginType] = useState('');
  const [entryScheme, setEntryScheme] = useState('');
  const [perPage, setPerPage] = useState(25);
  const initialPeriodeId = searchParams?.get('periode_id') ?? '';
  const [periodeId, setPeriodeId] = useState(initialPeriodeId);

  // ─── action state ───────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Registration | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setSelectedIds([]); setPage(1); }, [status, statusGroup, search, periodeId, jenisKknId, fakultasId, prodiId, originType, entryScheme, perPage]);

  // ─── lookups ────────────────────────────────────────────────────
  const { data: periods = [] } = useQuery<PeriodOption[]>({
    queryKey: ['admin', 'periods', 'lookup-pendaftaran'],
    queryFn: async () => {
      const res = await adminApi.periods.index({ per_page: 200, active: 1 });
      const rows = Array.isArray(res) ? res : ((res as { data?: PeriodOption[] }).data ?? []);
      return (rows as PeriodOption[]).filter((p) => p.is_active === true);
    },
    staleTime: 60_000,
  });

  const activePeriodIds = useMemo(() => new Set(periods.map((p) => String(p.id))), [periods]);
  const effectivePeriodeId = periodeId && activePeriodIds.has(periodeId) ? periodeId : (periods[0]?.id ? String(periods[0].id) : '');

  useEffect(() => {
    if (!initialPeriodeId && !periodeId && periods[0]?.id) setPeriodeId(String(periods[0].id));
    if (periodeId && periods.length > 0 && !activePeriodIds.has(periodeId)) setPeriodeId(String(periods[0]?.id ?? ''));
  }, [initialPeriodeId, periodeId, periods, activePeriodIds]);

  const { data: jenisKknList = [] } = useQuery<JenisKknOption[]>({
    queryKey: ['admin', 'jenis-kkn', 'lookup-pendaftaran'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/jenis-kkn', { params: { per_page: 100 } });
      const env = res.data as { data?: JenisKknOption[] };
      return env.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: fakultasList = [] } = useQuery<FakultasOption[]>({
    queryKey: ['admin', 'fakultas', 'lookup-pendaftaran'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas', { params: { per_page: 100 } });
      const env = res.data as { data?: FakultasOption[] };
      return env.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: prodiList = [] } = useQuery<ProdiOption[]>({
    queryKey: ['admin', 'prodi', 'lookup-pendaftaran', fakultasId],
    queryFn: async () => {
      const res = await rawApi.get('/admin/prodi', { params: { per_page: 200, fakultas_id: fakultasId || undefined } });
      const env = res.data as { data?: ProdiOption[] };
      return env.data ?? [];
    },
    staleTime: 5 * 60_000,
    enabled: true,
  });

  // ─── main list query ────────────────────────────────────────────
  const queryParams = useMemo(() => ({
    status: status || undefined,
    status_group: statusGroup || undefined,
    search: search || undefined,
    periode_id: effectivePeriodeId || undefined,
    jenis_kkn_id: jenisKknId || undefined,
    fakultas_id: fakultasId || undefined,
    prodi_id: prodiId || undefined,
    origin_type: originType || undefined,
    entry_scheme: entryScheme || undefined,
    page,
    per_page: perPage,
  }), [status, statusGroup, search, effectivePeriodeId, jenisKknId, fakultasId, prodiId, originType, entryScheme, page, perPage]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery<ApiList>({
    queryKey: ['admin', 'registrations', queryParams],
    queryFn: async () => {
      const res = await rawApi.get('/admin/pendaftaran', { params: queryParams });
      const envelope = res.data as { data?: Registration[]; meta?: ApiList['meta']; stats?: RegistrationStats };
      return { items: envelope.data ?? [], meta: envelope.meta, stats: envelope.stats };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
  });

  const registrations = data?.items ?? [];
  const meta = data?.meta;
  const stats = data?.stats;
  const totalRegistrations = stats?.total ?? meta?.total ?? registrations.length;
  const reviewableCount = stats?.reviewable ?? 0;
  const submittedCount = stats?.document_submitted ?? 0;
  const approvedCount = stats?.approved ?? 0;
  const rejectedCount = stats?.rejected ?? 0;

  const activeFilterCount = [status, statusGroup, search, periodeId, jenisKknId, fakultasId, prodiId, originType, entryScheme].filter(Boolean).length;
  const resetAllFilters = () => {
    setStatus(''); setStatusGroup(''); setSearchInput(''); setSearch(''); setPeriodeId('');
    setJenisKknId(''); setFakultasId(''); setProdiId(''); setOriginType(''); setEntryScheme('');
  };

  // ─── mutations ──────────────────────────────────────────────────
  const approveMutation = useMutation({ mutationFn: (id: number) => adminApi.registrations.approve(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Disetujui'); setApproveConfirm(null); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menyetujui') });
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Ditolak'); setRejectTarget(null); setRejectReason(''); }, onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Gagal menolak') });
  const bulkApproveMutation = useMutation({ mutationFn: (ids: number[]) => adminApi.registrations.bulkApprove(ids), onSuccess: (res: unknown) => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); const payload = (res as { data?: { approved_count?: number } })?.data; toast.success(`${payload?.approved_count ?? selectedIds.length} pendaftaran disetujui`); setSelectedIds([]); setBulkApproveConfirm(false); }, onError: () => toast.error('Gagal menyetujui massal') });

  const toggleSelect = (r: Registration) => REVIEWABLE.includes(r.status) && setSelectedIds((prev) => prev.includes(r.id) ? prev.filter((i) => i !== r.id) : [...prev, r.id]);
  const toggleSelectAll = () => {
    const reviewable = registrations.filter((r) => REVIEWABLE.includes(r.status)).map((r) => r.id);
    setSelectedIds((prev) => prev.length === reviewable.length ? [] : reviewable);
  };
  const submitReject = () => { const reason = rejectReason.trim(); if (reason.length < 5) return toast.error('Alasan minimal 5 karakter'); if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason }); };
  const closePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewName(''); };
  const previewDocument = async (item: DocItem) => {
    if (!item.file_path) return toast.error('Path dokumen tidak tersedia');
    try {
      const res = await adminApi.registrations.downloadDocument(item.file_path);
      const payload = res as Blob | { data?: Blob };
      const blob = payload instanceof Blob ? payload : payload.data;
      if (!(blob instanceof Blob)) throw new Error('Dokumen tidak berbentuk blob.');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewName(item.file_name || docLabel(item.field, item.label));
    } catch { toast.error('Gagal memuat preview dokumen'); }
  };
  const exportFile = async (format: 'xlsx' | 'pdf') => {
    try {
      const res = await rawApi.get('/admin/pendaftaran/export', {
        params: { format, ...queryParams, page: undefined, per_page: undefined, limit: 50000 },
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'peserta-kkn-lengkap-' + new Date().toISOString().slice(0, 10) + '.' + format;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Gagal export ' + format.toUpperCase()); }
  };

  // ─── render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Hero + stats */}
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Pendaftaran KKN</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Validasi Pendaftaran &amp; Dokumen</h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">Tinjau dokumen mahasiswa, setujui pendaftaran, atau minta revisi dalam satu layar. Auto-refresh tiap 15 detik.</p>
          </div>
          <button onClick={() => refetch()} className="flex h-11 items-center gap-2 self-start rounded-xl bg-white/10 px-4 text-xs font-black uppercase tracking-wider text-white ring-1 ring-white/20 transition hover:bg-white/20 xl:self-end">
            <RefreshCcw size={14} className={isFetching ? 'animate-spin' : ''} /> {isFetching ? 'Memuat' : 'Segarkan'}
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Users size={14} />} label="Total Pendaftaran" value={totalRegistrations} tone="cyan" />
          <StatCard icon={<ShieldAlert size={14} />} label="Perlu Review" value={reviewableCount} tone="amber" />
          <StatCard icon={<FileCheck2 size={14} />} label="Dokumen Masuk" value={submittedCount} tone="cyan" />
          <StatCard icon={<ThumbsUp size={14} />} label="Disetujui" value={approvedCount} tone="emerald" />
          <StatCard icon={<ThumbsDown size={14} />} label="Ditolak" value={rejectedCount} tone="rose" />
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-2 z-20 rounded-3xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-cyan-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Filter Data</h3>
            {activeFilterCount > 0 && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-black text-cyan-700">{activeFilterCount} aktif</span>}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Auto-refresh 15 detik</span>
            {activeFilterCount > 0 && <button onClick={resetAllFilters} className="ml-2 flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"><XIcon size={12} /> Reset</button>}
          </div>
        </div>

        {/* search + per_page row */}
        <div className="mb-3 flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Cari nama atau NIM (min. 6 digit untuk NIM)" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
            {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"><XIcon size={14} /></button>}
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
            <option value={100}>100 / halaman</option>
          </select>
        </div>

        {/* dropdown filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status detail</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setStatusGroup(''); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Kelompok status</span>
            <select value={statusGroup} onChange={(e) => { setStatusGroup(e.target.value); setStatus(''); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              {STATUS_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Periode KKN</span>
            <select value={effectivePeriodeId} onChange={(e) => setPeriodeId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              
              {periods.map((p) => <option key={p.id} value={String(p.id)}>{p.name ?? `Periode #${p.id}`}{p.is_active ? ' (aktif)' : ''}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Jenis KKN</span>
            <select value={jenisKknId} onChange={(e) => setJenisKknId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              <option value="">Semua Jenis KKN</option>
              {jenisKknList.map((j) => <option key={j.id} value={String(j.id)}>{j.name}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fakultas</span>
            <select value={fakultasId} onChange={(e) => { setFakultasId(e.target.value); setProdiId(''); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              <option value="">Semua Fakultas</option>
              {fakultasList.map((f) => <option key={f.id} value={String(f.id)}>{f.nama}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Program studi</span>
            <select value={prodiId} onChange={(e) => setProdiId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              <option value="">Semua Prodi</option>
              {prodiList.map((p) => <option key={p.id} value={String(p.id)}>{p.nama_prodi ?? p.nama ?? `Prodi #${p.id}`}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Asal peserta</span>
            <select value={originType} onChange={(e) => setOriginType(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              {ORIGIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Skema masuk</span>
            <select value={entryScheme} onChange={(e) => setEntryScheme(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100">
              {ENTRY_SCHEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {/* actions row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button onClick={() => exportFile('xlsx')} className="h-10 rounded-xl bg-teal-600 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg"><Download size={12} className="mr-1 inline" /> Export XLSX</button>
          <button onClick={() => exportFile('pdf')} className="h-10 rounded-xl bg-slate-800 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg"><Download size={12} className="mr-1 inline" /> Export PDF</button>
          {selectedIds.length > 0 && <button onClick={() => setBulkApproveConfirm(true)} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"><CheckCircle2 size={12} className="mr-1 inline" /> Setujui {selectedIds.length} Terpilih</button>}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-200/60" />)}
        </div>
      ) : isError ? (
        <div className="rounded-3xl bg-rose-50 p-6 text-center ring-1 ring-rose-200">
          <p className="font-bold text-rose-700">Gagal memuat data pendaftaran.</p>
          <button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase text-white">Coba Lagi</button>
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada data" />
          {activeFilterCount > 0 && (
            <div className="mx-auto mt-4 max-w-md text-center">
              <p className="text-xs font-bold text-slate-500">Coba kurangi filter — saat ini {activeFilterCount} filter aktif.</p>
              <button onClick={resetAllFilters} className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase text-white">Reset Semua Filter</button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length > 0 && registrations.filter((r) => REVIEWABLE.includes(r.status)).every((r) => selectedIds.includes(r.id))} className="h-4 w-4" aria-label="Pilih semua reviewable" />
                  </th>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Asal &amp; Akademik</th>
                  <th className="px-4 py-3">Jenis / Periode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dokumen</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((r) => {
                  const reviewable = REVIEWABLE.includes(r.status);
                  const m = r.mahasiswa;
                  const fak = m?.fakultas?.nama;
                  const prd = m?.prodi?.nama_prodi ?? m?.prodi?.nama;
                  const isExternal = m?.origin_type === 'external';
                  const nimDisplay = m?.nim ?? m?.external_nim ?? '-';
                  return (
                    <tr key={r.id} className="align-top transition-colors hover:bg-cyan-50/40">
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selectedIds.includes(r.id)} disabled={!reviewable} onChange={() => toggleSelect(r)} className="h-4 w-4 disabled:opacity-30" />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{m?.nama || '-'}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">NIM: {nimDisplay}</p>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
                          {m?.gender && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{m.gender === 'L' ? 'Laki-laki' : m.gender === 'P' ? 'Perempuan' : m.gender}</span>}
                          {m?.semester != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Sem {m.semester}</span>}
                          {m?.gpa != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">IPK {typeof m.gpa === 'number' ? m.gpa.toFixed(2) : m.gpa}</span>}
                          {m?.batch_year != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Angk {m.batch_year}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {isExternal ? (
                          <>
                            <p className="font-bold text-slate-700">{m?.external_university_name || 'Eksternal'}</p>
                            <p className="text-xs text-slate-500">{prd || fak || 'Mitra'}</p>
                            <span className="mt-1 inline-block rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">Eksternal</span>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-slate-700">{fak || '-'}</p>
                            <p className="text-xs text-slate-500">{prd || '-'}</p>
                            <span className="mt-1 inline-block rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">Internal</span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-700">{r.periode?.jenis_kkn?.name || '-'}</p>
                        <p className="text-xs text-slate-500">{r.periode?.name || '-'}</p>
                        {r.entry_scheme && <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">{r.entry_scheme}</span>}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={r.status || ''} />
                        {r.registration_date && <p className="mt-1 text-[10px] font-bold text-slate-400">{new Date(r.registration_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <DocumentSummaryCell summary={r.document_summary} onPreview={previewDocument} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {reviewable && (
                            <>
                              <button onClick={() => setApproveConfirm(r)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"><CheckCircle2 size={12} className="inline" /> Setujui</button>
                              <button onClick={() => { setRejectTarget(r); setRejectReason(''); }} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100"><XCircle size={12} className="inline" /> Tolak</button>
                            </>
                          )}
                          <Link href={`/admin/pendaftaran/${r.id}`} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"><Eye size={12} className="inline" /> Detail</Link>
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
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
          <span className="text-xs font-bold text-slate-500">
            Halaman <span className="text-slate-900">{meta.current_page ?? page}</span> dari <span className="text-slate-900">{meta.last_page}</span>
            {' '}• Total <span className="text-slate-900">{meta.total ?? '-'}</span> pendaftaran
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(1)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">« Awal</button>
            <button disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">← Sebelumnya</button>
            <button disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage((n) => n + 1)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">Berikutnya →</button>
            <button disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage(meta.last_page ?? page)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-slate-200 disabled:opacity-40">Akhir »</button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog open={approveConfirm !== null} onClose={() => setApproveConfirm(null)} onConfirm={() => approveConfirm && approveMutation.mutate(approveConfirm.id)} title="Setujui pendaftaran?" description={approveConfirm?.mahasiswa?.nama || ''} confirmText="Setujui" variant="info" />
      <ConfirmDialog open={bulkApproveConfirm} onClose={() => setBulkApproveConfirm(false)} onConfirm={() => bulkApproveMutation.mutate(selectedIds)} title={`Setujui ${selectedIds.length} data?`} description="Pastikan dokumen sudah lengkap." confirmText="Setujui Semua" variant="info" />
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" onClick={closePreview}>
          <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="truncate text-sm font-black text-slate-900">{previewName}</h3>
              <button onClick={closePreview} className="rounded-lg px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">&times; Tutup</button>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              {previewName.toLowerCase().endsWith('.pdf') ? <iframe src={previewUrl} className="h-full w-full rounded-lg" title="Preview dokumen" /> : <img src={previewUrl} alt={previewName} className="h-full w-full rounded-lg object-contain" />}
            </div>
          </div>
        </div>
      )}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black">Tolak Pendaftaran</h3>
            <p className="mt-1 text-xs text-slate-500">{rejectTarget.mahasiswa?.nama}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="mt-4 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Alasan penolakan (min. 5 karakter)" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-slate-200">Batal</button>
              <button onClick={submitReject} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
