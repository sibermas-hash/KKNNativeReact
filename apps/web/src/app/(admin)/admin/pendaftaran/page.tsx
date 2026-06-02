'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, Eye, FileCheck2, Filter, RefreshCw, Search, Users, X, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

type Doc = { id?: number; document_type?: string; file_name?: string; file_path?: string; status?: string; uploaded_at?: string };
type Reg = {
  id: number;
  status: string;
  registration_date?: string;
  mahasiswa?: { nama?: string; nim?: string; fakultas?: { nama?: string }; prodi?: { nama?: string } };
  periode?: { name?: string; periode?: string; jenis_kkn?: { name?: string } };
  documents?: Doc[];
};

type KknType = { id: number; name?: string; code?: string };
type ExternalUniversity = { id: number; name: string; code?: string };

const STATUS_LABEL: Record<string, string> = {
  pending: 'MENUNGGU',
  document_submitted: 'DOKUMEN MASUK',
  approved: 'DISETUJUI',
  rejected: 'DITOLAK',
  interview_scheduled: 'JADWAL WAWANCARA',
};

function unwrap(res: unknown): Reg[] {
  if (Array.isArray(res)) return res as Reg[];
  const obj = res as { data?: Reg[] } | null;
  return Array.isArray(obj?.data) ? obj.data : [];
}

function fmtDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function statusClass(status: string): string {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function previewDoc(doc: Doc): void {
  if (!doc.file_path) {
    toast.error('Path dokumen tidak tersedia');
    return;
  }
  window.open(`/api/v1/admin/pendaftaran/berkas/unduh?path=${encodeURIComponent(doc.file_path)}`, '_blank', 'noopener,noreferrer');
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('unprocessed');
  const [jenisKknId, setJenisKknId] = useState('');
  const [originType, setOriginType] = useState('');
  const [entryScheme, setEntryScheme] = useState('');
  const [externalUniversityId, setExternalUniversityId] = useState('');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Reg | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Reg | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const statusGroup = ['unprocessed', 'processed'].includes(statusFilter) ? statusFilter : undefined;
  const status = ['pending', 'document_submitted', 'interview_scheduled', 'approved', 'rejected'].includes(statusFilter) ? statusFilter : undefined;

  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'registrations-review', { statusFilter, jenisKknId, originType, entryScheme, externalUniversityId, search, perPage }],
    queryFn: async () => unwrap(await adminApi.registrations.index({
      status_group: statusGroup,
      status,
      jenis_kkn_id: jenisKknId || undefined,
      origin_type: originType || undefined,
      entry_scheme: entryScheme || undefined,
      external_university_id: externalUniversityId || undefined,
      search: search || undefined,
      per_page: perPage,
      sort: 'first_uploaded_at',
      direction: 'asc',
    })),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });

  const { data: kknTypes = [] } = useQuery({
    queryKey: ['admin', 'kkn-types', 'registration-filter'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/jenis-kkn?per_page=100', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) return [];
      const obj = await res.json() as { data?: KknType[] | { data?: KknType[] } };
      if (Array.isArray(obj.data)) return obj.data;
      return obj.data?.data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: externalUniversities = [] } = useQuery({
    queryKey: ['admin', 'external-universities', 'registration-filter'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/external-universities?per_page=100', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) return [];
      const obj = await res.json() as { data?: ExternalUniversity[] | { data?: ExternalUniversity[] } };
      if (Array.isArray(obj.data)) return obj.data;
      return obj.data?.data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: stats = { total: 0, review: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: ['admin', 'registrations-summary'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/pendaftaran/summary', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Gagal memuat ringkasan pendaftaran');
      const json = await res.json() as { data?: { total: number; review: number; approved: number; rejected: number } };
      return json.data ?? { total: 0, review: 0, approved: 0, rejected: 0 };
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.registrations.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-review'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-summary'] }); toast.success('Pendaftaran disetujui'); setApproveConfirm(null); },
    onError: () => toast.error('Gagal menyetujui pendaftaran'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => adminApi.registrations.bulkApprove(ids),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-review'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-summary'] }); toast.success(`${selectedIds.length} pendaftaran disetujui`); setSelectedIds([]); setBulkApproveConfirm(false); },
    onError: () => toast.error('Gagal menyetujui massal'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.registrations.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-review'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'registrations-summary'] }); toast.success('Pendaftaran ditolak'); setRejectTarget(null); setRejectReason(''); },
    onError: () => toast.error('Gagal menolak pendaftaran'),
  });

  const toggleSelect = (id: number) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const exportUrl = `/api/v1/admin/pendaftaran/export-biodata?status_group=${statusGroup ?? ''}&status=${status ?? ''}&jenis_kkn_id=${jenisKknId}&search=${encodeURIComponent(search)}`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={<Users size={24} />} label="TOTAL PENDAFTAR" value={stats.total} tone="slate" />
        <Stat icon={<AlertTriangle size={24} />} label="PERLU REVIEW" value={stats.review} tone="amber" />
        <Stat icon={<FileCheck2 size={24} />} label="DISETUJUI" value={stats.approved} tone="emerald" />
        <Stat icon={<XCircle size={24} />} label="DITOLAK" value={stats.rejected} tone="rose" />
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase"><Filter size={16} /> Filter</div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds([]); }} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value="unprocessed">BELUM DIPROSES</option>
            <option value="pending">MENUNGGU</option>
            <option value="document_submitted">DOKUMEN MASUK</option>
            <option value="interview_scheduled">JADWAL WAWANCARA</option>
            <option value="processed">SUDAH DIPROSES</option>
            <option value="approved">DISETUJUI</option>
            <option value="rejected">DITOLAK</option>
            <option value="all">SEMUA STATUS</option>
          </select>
          <select value={jenisKknId} onChange={(e) => { setJenisKknId(e.target.value); setSelectedIds([]); }} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value="">SEMUA JENIS KKN</option>
            {kknTypes.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.code ?? `Jenis #${t.id}`}</option>)}
          </select>
          <select value={originType} onChange={(e) => { setOriginType(e.target.value); setSelectedIds([]); }} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value="">SEMUA ASAL</option><option value="internal">INTERNAL</option><option value="external">EKSTERNAL</option>
          </select>
          <select value={entryScheme} onChange={(e) => { setEntryScheme(e.target.value); setSelectedIds([]); }} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value="">SEMUA SKEMA</option><option value="regular">REGULAR</option><option value="kolaborasi">KOLABORASI</option>
          </select>
          <select value={externalUniversityId} onChange={(e) => { setExternalUniversityId(e.target.value); setSelectedIds([]); }} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value="">SEMUA KAMPUS LUAR</option>
            {externalUniversities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIM" className="w-full h-11 rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
            <option value={25}>25 / HALAMAN</option><option value={50}>50 / HALAMAN</option><option value={100}>100 / HALAMAN</option>
          </select>
          <button type="button" onClick={() => refetch()} className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-black text-slate-700 flex items-center gap-2 hover:bg-slate-50"><RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> REFRESH</button>
          <a href={exportUrl} target="_blank" rel="noreferrer" className="h-11 px-4 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 hover:bg-emerald-700"><Download size={16} /> EXPORT XLSX</a>
          {selectedIds.length > 0 && <button type="button" onClick={() => setBulkApproveConfirm(true)} className="h-11 px-4 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700">SETUJUI {selectedIds.length}</button>}
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">Tips: klik Detail/Preview untuk melihat berkas. Gunakan Setujui hanya jika dokumen wajib lengkap. Jika menolak, tulis alasan jelas agar mahasiswa bisa memperbaiki.</div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[44px_1.35fr_1fr_130px_145px_1.25fr_180px] gap-4 bg-slate-50 px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">
          <div /><div>Mahasiswa</div><div>Jenis/Periode</div><div>Status</div><div>Tanggal</div><div>Dokumen</div><div>Aksi</div>
        </div>
        {isLoading ? <div className="p-10 text-center font-bold text-slate-500">Memuat data realtime...</div> : isError ? <div className="p-10 text-center font-bold text-rose-600">Gagal memuat data</div> : data.length === 0 ? <div className="p-12 text-center font-bold text-slate-400">Tidak ada pendaftaran</div> : data.map((r) => {
          const docs = r.documents ?? [];
          const firstDoc = docs[0];
          const canApprove = ['pending', 'document_submitted'].includes(r.status);
          return (
            <div key={r.id} className="grid grid-cols-[44px_1.35fr_1fr_130px_145px_1.25fr_180px] gap-4 px-5 py-4 border-t border-slate-100 items-start hover:bg-slate-50/70">
              <div><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="mt-1 h-4 w-4" /></div>
              <div><p className="font-black text-slate-900 uppercase leading-tight">{r.mahasiswa?.nama ?? '-'}</p><p className="text-xs text-slate-500 mt-1">{r.mahasiswa?.nim ?? '-'} • {r.mahasiswa?.fakultas?.nama ?? '-'}</p></div>
              <div><p className="font-black text-slate-800 text-sm">{r.periode?.jenis_kkn?.name ?? 'KKN Reguler'}</p><p className="text-xs text-slate-500">{r.periode?.name ?? r.periode?.periode ?? '-'}</p></div>
              <div><span className={`inline-flex rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${statusClass(r.status)}`}>{STATUS_LABEL[r.status] ?? r.status}</span></div>
              <div className="text-xs font-bold text-slate-600">{fmtDate(firstDoc?.uploaded_at || r.registration_date)}</div>
              <div><p className="text-xs font-black text-emerald-700">{docs.length}/1 dokumen wajib</p><div className="mt-2 flex flex-wrap gap-1">{docs.length ? docs.map((d, idx) => <button key={idx} type="button" onClick={() => previewDoc(d)} className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 text-[10px] font-bold hover:bg-emerald-100">✓ {d.document_type || d.file_name || 'Dokumen'}</button>) : <span className="text-xs text-slate-400">Belum ada dokumen</span>}</div></div>
              <div className="flex flex-wrap gap-2">
                {firstDoc && <button type="button" onClick={() => previewDoc(firstDoc)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black flex items-center gap-1 hover:bg-slate-200"><Eye size={12} /> Preview</button>}
                <Link href={`/admin/pendaftaran/${r.id}`} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black hover:bg-slate-200">Detail</Link>
                {canApprove && <button type="button" onClick={() => setApproveConfirm(r)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700">Setujui</button>}
                {canApprove && <button type="button" onClick={() => { setRejectTarget(r); setRejectReason(''); }} className="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black hover:bg-rose-200">Tolak</button>}
              </div>
            </div>
          );
        })}
      </section>

      <ConfirmDialog open={approveConfirm !== null} onClose={() => setApproveConfirm(null)} onConfirm={() => approveConfirm && approveMutation.mutate(approveConfirm.id)} title="Setujui Pendaftaran" description={approveConfirm ? `Setujui ${approveConfirm.mahasiswa?.nama ?? '-'}?` : ''} confirmText="Setujui" variant="info" />
      <ConfirmDialog open={bulkApproveConfirm} onClose={() => setBulkApproveConfirm(false)} onConfirm={() => bulkApproveMutation.mutate(selectedIds)} title={`Setujui ${selectedIds.length} Pendaftaran`} description="Pastikan dokumen wajib lengkap." confirmText="Setujui Semua" variant="info" />

      {rejectTarget && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setRejectTarget(null); }}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
          <div className="flex items-start justify-between"><div><h3 className="font-black text-slate-900 text-lg">Tolak Pendaftaran</h3><p className="text-xs text-slate-500 mt-1">{rejectTarget.mahasiswa?.nama ?? '-'} ({rejectTarget.mahasiswa?.nim ?? '-'})</p></div><button type="button" onClick={() => setRejectTarget(null)}><X size={20} /></button></div>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan..." rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Batal</button><button type="button" disabled={rejectReason.trim().length < 5 || rejectMutation.isPending} onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black disabled:opacity-50">Tolak</button></div>
        </div>
      </div>}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'slate' | 'amber' | 'emerald' | 'rose' }): React.JSX.Element {
  const cls = tone === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-700' : tone === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : tone === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-white border-slate-200 text-slate-600';
  return <div className={`rounded-3xl border p-5 shadow-sm ${cls}`}><div className="flex items-center gap-3"><div>{icon}</div><div><p className="text-[11px] font-black uppercase tracking-wider">{label}</p><p className="text-4xl font-black text-slate-900 mt-1">{value}</p></div></div></div>;
}
