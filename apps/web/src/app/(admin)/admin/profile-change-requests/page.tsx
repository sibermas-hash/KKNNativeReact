'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, User, XCircle } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';
type ChangeValue = { old: unknown; new: unknown };
type ChangeRequest = { id: number; user?: { id: number; name: string; username: string }; reviewer?: { id: number; name?: string; username?: string }; requested_changes: Record<string, ChangeValue>; status: Status; rejection_reason?: string; reviewed_at?: string; created_at: string };
type Paginator = { data: ChangeRequest[]; total: number; current_page: number; last_page: number; from: number | null; to: number | null };

const FIELD_LABELS: Record<string, string> = { name: 'Nama', phone: 'No. HP', address: 'Alamat', address_village_name: 'Desa/Kelurahan', address_district_name: 'Kecamatan', address_regency_name: 'Kota/Kabupaten', address_postal_code: 'Kode Pos', address_lat: 'Latitude Alamat', address_lng: 'Longitude Alamat', nik: 'NIK', dosen_nik: 'NIK', mother_name: 'Nama Ibu', gender: 'Jenis Kelamin', shirt_size: 'Ukuran Baju', birth_place: 'Tempat Lahir', birth_date: 'Tanggal Lahir', jabatan: 'Jabatan', golongan: 'Golongan', no_rekening: 'No. Rekening', nama_bank: 'Nama Bank', npwp: 'NPWP' };
const SENSITIVE_FIELDS = new Set(['nik', 'dosen_nik', 'npwp', 'no_rekening', 'phone', 'mother_name', 'address', 'address_postal_code']);
const fmtDate = (v?: string) => v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '-';
const mask = (field: string, val: unknown) => { const t = String(val ?? '-'); if (t === '-' || !SENSITIVE_FIELDS.has(field)) return t; if (t.length <= 6) return '••••'; return `${t.slice(0, 4)}••••••••${t.slice(-4)}`; };
const short = (v: string) => v.length > 120 ? `${v.slice(0, 120)}…` : v;
const getMessage = (e: unknown, fallback: string) => (e as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error?.message ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export default function AdminProfileChangeRequestsPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<Status>('pending');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'profile-change-requests', statusFilter, page],
    queryFn: () => api.get('/admin/profile-change-requests', { params: { status: statusFilter, page } }),
  });
  const pageData = (data as Paginator | { data?: Paginator } | undefined)?.data && !Array.isArray((data as { data?: unknown }).data) ? (data as { data?: Paginator }).data : data as Paginator | undefined;
  const requests = pageData?.data ?? [];
  const total = pageData?.total ?? requests.length;
  const lastPage = pageData?.last_page ?? 1;
  const from = pageData?.from ?? (requests.length ? 1 : 0);
  const to = pageData?.to ?? requests.length;
  const totalPending = statusFilter === 'pending' ? total : 0;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'profile-change-requests'] });

  const approveMutation = useMutation({ mutationFn: (id: number) => api.patch(`/admin/profile-change-requests/${id}/approve`), onSuccess: () => { toast.success('Perubahan profil disetujui'); invalidate(); }, onError: (e: unknown) => toast.error(getMessage(e, 'Gagal menyetujui')) });
  const approveAllMutation = useMutation({ mutationFn: () => api.patch('/admin/profile-change-requests/approve-all', { confirm: true }), onSuccess: (res: unknown) => { const r = res as { approved?: number; failed_count?: number }; toast.success(`Approve all selesai: ${r?.approved ?? 0} disetujui${r?.failed_count ? `, ${r.failed_count} gagal` : ''}`); invalidate(); }, onError: (e: unknown) => toast.error(getMessage(e, 'Gagal approve all')) });
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => api.patch(`/admin/profile-change-requests/${id}/reject`, { rejection_reason: reason }), onSuccess: () => { toast.success('Permintaan ditolak'); setRejectId(null); setRejectReason(''); invalidate(); }, onError: (e: unknown) => toast.error(getMessage(e, 'Gagal menolak')) });

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Permintaan Perubahan Profil</h1><p className="text-sm text-slate-500 mt-1">Tinjau dan setujui perubahan data profil pengguna</p></div>
      <div className="flex flex-wrap gap-2 justify-end">
        {statusFilter === 'pending' && totalPending > 0 && <button onClick={() => { if (confirm(`Setujui maksimal 50 dari ${totalPending} permintaan pending? Pastikan semua data sudah dicek.`)) approveAllMutation.mutate(); }} disabled={approveAllMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"><CheckCheck size={14} /> {approveAllMutation.isPending ? 'Memproses...' : 'Approve 50 Max'}</button>}
        {(['pending', 'approved', 'rejected'] as const).map(s => <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : 'Ditolak'}{statusFilter === s ? ` (${total})` : ''}</button>)}
      </div>
    </div>

    {isLoading ? <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div> : isError ? <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center"><p className="text-rose-600 font-medium">Gagal memuat data. Silakan refresh halaman.</p></div> : requests.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Clock size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500 font-medium">Tidak ada permintaan {statusFilter === 'pending' ? 'yang menunggu' : statusFilter}</p></div> : <div className="space-y-4">{requests.map(req => <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><User size={20} className="text-emerald-600" /></div><div><p className="font-black text-slate-900">{req.user?.name}</p><p className="text-xs text-slate-500">@{req.user?.username} · diajukan {fmtDate(req.created_at)}</p>{req.reviewed_at && <p className="text-xs text-slate-400">Direview {fmtDate(req.reviewed_at)}{req.reviewer ? ` oleh ${req.reviewer.name || req.reviewer.username || '-'}` : ''}</p>}</div></div>{req.status === 'pending' && <div className="flex gap-2 shrink-0"><button onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 size={14} /> Setujui</button><button onClick={() => setRejectId(req.id)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100"><XCircle size={14} /> Tolak</button></div>}</div>
      <div className="mt-5 space-y-2">{Object.entries(req.requested_changes ?? {}).map(([field, val]) => <div key={field} className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{FIELD_LABELS[field] ?? field}</p><div className="mt-2 grid gap-2 md:grid-cols-2"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Lama</p><p className="text-sm text-slate-700 break-words">{short(mask(field, val.old))}</p></div><div><p className="text-[10px] font-bold text-emerald-600 uppercase">Baru</p><p className="text-sm font-semibold text-slate-900 break-words">{short(mask(field, val.new))}</p></div></div></div>)}</div>
      {req.status === 'rejected' && req.rejection_reason && <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">Alasan: {req.rejection_reason}</div>}
    </div>)}</div>}

    {lastPage > 1 && <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Menampilkan {from}-{to} dari {total} data • Halaman {page}/{lastPage}</p><div className="flex gap-2"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40"><ChevronLeft size={14} /> Prev</button><button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40">Next <ChevronRight size={14} /></button></div></div>}
    {rejectId !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"><h3 className="font-black text-slate-900 mb-4">Alasan Penolakan</h3><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Jelaskan alasan penolakan..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" /><div className="flex gap-3 mt-4"><button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50">Batal</button><button onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })} disabled={!rejectReason.trim() || rejectMutation.isPending} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50">{rejectMutation.isPending ? 'Menolak...' : 'Tolak'}</button></div></div></div>}
  </div>;
}
