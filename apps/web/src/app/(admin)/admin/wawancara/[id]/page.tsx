'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Plus, CheckCircle2, XCircle,
  Search, Trash2, UserPlus
} from 'lucide-react';

type Participant = {
  id: number;
  peserta_kkn_id: number;
  result: 'pending' | 'passed' | 'failed';
  notes?: string;
  processed_at?: string;
  processed_by?: { name?: string };
  peserta_kkn?: { id: number; mahasiswa?: { nama?: string; nim?: string; prodi?: { nama?: string }; fakultas?: { nama?: string } } };
};

type Schedule = {
  id: number;
  interview_date: string;
  interview_time_start: string;
  interview_time_end: string;
  location?: string;
  notes?: string;
  periode?: { name?: string; periode?: number; jenis_kkn?: { name?: string } };
  creator?: { name?: string };
  participants?: Participant[];
};

type AvailablePeserta = {
  id: number;
  mahasiswa?: { nama?: string; nim?: string; prodi?: { nama?: string }; fakultas?: { nama?: string } };
};

const fmtDate = (v?: string) => v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(v)) : '-';
const fmtTime = (v?: string) => v ? v.slice(0, 5) : '-';

export default function WawancaraDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(params?.id);

  const [showAssign, setShowAssign] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [resultModal, setResultModal] = useState<Participant | null>(null);
  const [resultValue, setResultValue] = useState<'passed' | 'failed'>('passed');
  const [resultNotes, setResultNotes] = useState('');

  // Fetch schedule detail
  const { data: schedule, isLoading } = useQuery<Schedule>({
    queryKey: ['admin', 'wawancara', id],
    queryFn: async () => {
      const res = await rawApi.get(`/admin/wawancara/${id}`);
      const payload = (res.data as { data?: Schedule }).data ?? res.data;
      return payload as Schedule;
    },
    enabled: id > 0,
  });

  // Fetch available peserta for assignment
  const { data: availableData } = useQuery<{ data: AvailablePeserta[] }>({
    queryKey: ['admin', 'wawancara', id, 'available', assignSearch],
    queryFn: async () => {
      const res = await rawApi.get(`/admin/wawancara/${id}/available-peserta`, { params: { search: assignSearch || undefined, per_page: 50 } });
      return (res.data as { data?: { data: AvailablePeserta[] } }).data ?? res.data;
    },
    enabled: showAssign && id > 0,
  });
  const availablePeserta = availableData?.data ?? [];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async (ids: number[]) => { await rawApi.post(`/admin/wawancara/${id}/assign`, { peserta_kkn_ids: ids }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara', id, 'available'] });
      toast.success('Peserta ditambahkan');
      setSelectedIds([]);
      setShowAssign(false);
    },
    onError: () => toast.error('Gagal menambahkan peserta'),
  });

  // Remove participant
  const removeMutation = useMutation({
    mutationFn: async (participantId: number) => { await rawApi.delete(`/admin/wawancara/${id}/participants/${participantId}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara', id] });
      toast.success('Peserta dihapus dari jadwal');
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  // Record result
  const resultMutation = useMutation({
    mutationFn: async ({ participantId, result, notes }: { participantId: number; result: string; notes?: string }) => {
      await rawApi.patch(`/admin/wawancara/${id}/participants/${participantId}/result`, { result, notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wawancara', id] });
      toast.success('Hasil wawancara disimpan');
      setResultModal(null);
    },
    onError: () => toast.error('Gagal menyimpan hasil'),
  });

  const participants = schedule?.participants ?? [];
  const pending = participants.filter(p => p.result === 'pending');
  const passed = participants.filter(p => p.result === 'passed');
  const failed = participants.filter(p => p.result === 'failed');

  const toggleSelect = (pesertaId: number) => {
    setSelectedIds(prev => prev.includes(pesertaId) ? prev.filter(x => x !== pesertaId) : [...prev, pesertaId]);
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />;
  if (!schedule) return <div className="text-center text-slate-500">Jadwal tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.push('/admin/wawancara')} className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
          <ArrowLeft size={14} /> Kembali
        </button>
        <PageHeader title="Detail Wawancara" subtitle={`${schedule.periode?.jenis_kkn?.name ?? schedule.periode?.name ?? '-'}`} />
      </div>

      {/* Schedule Info */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{fmtDate(schedule.interview_date)}</span>
          <span className="flex items-center gap-2"><Clock size={14} className="text-slate-400" />{fmtTime(schedule.interview_time_start)} - {fmtTime(schedule.interview_time_end)}</span>
          {schedule.location && <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" />{schedule.location}</span>}
          <span className="flex items-center gap-2"><Users size={14} className="text-slate-400" />{participants.length} peserta</span>
        </div>
        {schedule.notes && <p className="mt-2 text-sm text-slate-600">{schedule.notes}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-amber-50 p-4 text-center ring-1 ring-amber-100">
          <p className="text-2xl font-black text-amber-700">{pending.length}</p>
          <p className="text-xs font-bold text-amber-600">Pending</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
          <p className="text-2xl font-black text-emerald-700">{passed.length}</p>
          <p className="text-xs font-bold text-emerald-600">Lulus</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-4 text-center ring-1 ring-rose-100">
          <p className="text-2xl font-black text-rose-700">{failed.length}</p>
          <p className="text-xs font-bold text-rose-600">Tidak Lulus</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700">
          <UserPlus size={16} /> Tambah Peserta
        </button>
      </div>

      {/* Participants Table */}
      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Belum ada peserta. Klik &quot;Tambah Peserta&quot; untuk assign.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">No</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">NIM</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Nama</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">Prodi</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Hasil</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.peserta_kkn?.mahasiswa?.nim ?? '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.peserta_kkn?.mahasiswa?.nama ?? '-'}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{p.peserta_kkn?.mahasiswa?.prodi?.nama ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.result === 'passed' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={12} />Lulus</span>}
                    {p.result === 'failed' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700"><XCircle size={12} />Tidak Lulus</span>}
                    {p.result === 'pending' && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.result === 'pending' && (
                        <button onClick={() => { setResultModal(p); setResultValue('passed'); setResultNotes(p.notes ?? ''); }} className="rounded-lg bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100">Nilai</button>
                      )}
                      <button onClick={() => removeMutation.mutate(p.id)} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-black text-slate-900">Tambah Peserta Wawancara</h3>
              <button onClick={() => { setShowAssign(false); setSelectedIds([]); }} className="text-sm font-bold text-slate-500 hover:text-slate-900">&times;</button>
            </div>
            <div className="border-b border-slate-100 px-6 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} placeholder="Cari NIM/Nama..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {availablePeserta.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Tidak ada peserta yang tersedia</p>
              ) : (
                <div className="space-y-1">
                  {availablePeserta.map((p) => (
                    <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${selectedIds.includes(p.id) ? 'bg-cyan-50 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 rounded" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{p.mahasiswa?.nama ?? '-'}</p>
                        <p className="text-xs text-slate-500">{p.mahasiswa?.nim} • {p.mahasiswa?.prodi?.nama ?? '-'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-xs text-slate-500">{selectedIds.length} dipilih</p>
              <button onClick={() => assignMutation.mutate(selectedIds)} disabled={selectedIds.length === 0 || assignMutation.isPending} className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                Tambahkan {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Hasil Wawancara</h3>
            <p className="mt-1 text-sm text-slate-600">{resultModal.peserta_kkn?.mahasiswa?.nama} ({resultModal.peserta_kkn?.mahasiswa?.nim})</p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setResultValue('passed')} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${resultValue === 'passed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <CheckCircle2 size={14} className="mx-auto mb-1" /> Lulus
                </button>
                <button onClick={() => setResultValue('failed')} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${resultValue === 'failed' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <XCircle size={14} className="mx-auto mb-1" /> Tidak Lulus
                </button>
              </div>
              <textarea value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} rows={3} placeholder="Catatan (opsional)..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600" />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setResultModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button onClick={() => resultMutation.mutate({ participantId: resultModal.id, result: resultValue, notes: resultNotes || undefined })} disabled={resultMutation.isPending} className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
