'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/shared';
import {
  Calendar, Download, GraduationCap, MapPin, Plus, Upload, Users,
  X, Pencil, Ban, UserCheck, Clock, FileUp,
} from 'lucide-react';

interface Participant {
  id: number;
  user_id: number;
  workshop_id: number;
  jabatan_sk?: string | null;
  nomor_dokumen?: string | null;
  attendance_status: string;
  is_passed: boolean;
  registered_at: string;
  checked_in_at: string | null;
  user?: { id: number; name: string; email: string };
}

interface Workshop {
  id: number;
  periode_id: number;
  title: string;
  description?: string;
  methodology?: string;
  workshop_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  status: string;
  is_active: boolean;
  participants_count?: number;
  peserta?: Participant[];
  display_date?: string;
  period_name?: string;
}

interface ApiParticipant {
  id: number;
  user_id: number;
  workshop_id?: number;
  jabatan_sk?: string | null;
  nomor_dokumen?: string | null;
  identity_number?: string | null;
  attendance_status: string;
  is_passed?: boolean;
  certificate_generated?: boolean;
  registered_at?: string;
  checked_in_at?: string | null;
  name?: string;
  email?: string | null;
  user?: { id?: number; name?: string; email?: string | null };
}

interface ApiWorkshop {
  id: number;
  periode_id?: number;
  title: string;
  description?: string;
  methodology?: string;
  workshop_date?: string;
  workshop_date_value?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  status: string;
  is_active?: boolean;
  participants_count?: number;
  registered?: number;
  peserta?: ApiParticipant[];
  participants?: ApiParticipant[];
  period?: { id: number; name: string } | null;
}

interface PeriodOption {
  id: number;
  name: string;
}

function normalizeParticipant(participant: ApiParticipant, workshopId: number): Participant {
  return {
    id: participant.id,
    user_id: participant.user_id,
    workshop_id: participant.workshop_id ?? workshopId,
    jabatan_sk: participant.jabatan_sk ?? null,
    nomor_dokumen: participant.nomor_dokumen ?? participant.identity_number ?? null,
    attendance_status: participant.attendance_status,
    is_passed: participant.is_passed ?? Boolean(participant.certificate_generated),
    registered_at: participant.registered_at ?? '',
    checked_in_at: participant.checked_in_at ?? null,
    user: {
      id: Number(participant.user?.id ?? participant.user_id),
      name: participant.user?.name ?? participant.name ?? `User #${participant.user_id}`,
      email: participant.user?.email ?? participant.email ?? '',
    },
  };
}

function normalizeWorkshop(workshop: ApiWorkshop): Workshop {
  const peserta = (workshop.peserta ?? workshop.participants ?? []).map((participant) =>
    normalizeParticipant(participant, workshop.id),
  );

  return {
    id: workshop.id,
    periode_id: workshop.periode_id ?? workshop.period?.id ?? 0,
    title: workshop.title,
    description: workshop.description ?? '',
    methodology: workshop.methodology ?? '',
    workshop_date: workshop.workshop_date ?? workshop.workshop_date_value ?? '',
    start_time: workshop.start_time ?? '',
    end_time: workshop.end_time ?? '',
    location: workshop.location ?? '',
    max_participants: workshop.max_participants ?? undefined,
    status: workshop.status,
    is_active: workshop.is_active ?? workshop.status !== 'cancelled',
    participants_count: workshop.participants_count ?? workshop.registered ?? peserta.length,
    peserta,
    display_date: workshop.date ?? workshop.workshop_date ?? workshop.workshop_date_value ?? '-',
    period_name: workshop.period?.name,
  };
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Terjadwal',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function WorkshopFormModal({ workshop, onClose, onSaved }: { workshop?: Workshop | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    periode_id: workshop?.periode_id ? String(workshop.periode_id) : '',
    title: workshop?.title ?? '',
    description: workshop?.description ?? '',
    methodology: workshop?.methodology ?? '',
    workshop_date: workshop?.workshop_date ?? '',
    start_time: workshop?.start_time ?? '',
    end_time: workshop?.end_time ?? '',
    location: workshop?.location ?? '',
    max_participants: workshop?.max_participants ?? '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, periode_id: Number(form.periode_id) || undefined, max_participants: form.max_participants ? Number(form.max_participants) : null };
      return workshop ? adminApi.workshops.update(workshop.id, payload) : adminApi.workshops.store(payload);
    },
    onSuccess: () => {
      toast.success(workshop ? 'Workshop diperbarui' : 'Workshop dibuat');
      onSaved();
      onClose();
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menyimpan workshop'),
  });

  const { data: periods } = useQuery({
    queryKey: ['admin', 'periods-dropdown'],
    queryFn: async () => {
      const res = await adminApi.periods.index();
      const rawPeriods = ((res as { data?: unknown })?.data ?? res) as unknown;
      return (Array.isArray(rawPeriods) ? rawPeriods : []).map((period) => {
        const item = period as PeriodOption;
        return { id: item.id, name: item.name };
      });
    },
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">{workshop ? 'Edit Workshop' : 'Buat Workshop Baru'}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Periode *</label>
            <select value={form.periode_id} onChange={e => setForm({ ...form, periode_id: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Pilih Periode</option>
              {(periods ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Judul Workshop *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Tanggal *</label>
              <input type="date" value={form.workshop_date} onChange={e => setForm({ ...form, workshop_date: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Maks Peserta</label>
              <input type="number" min="1" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Jam Mulai</label>
              <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Jam Selesai</label>
              <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Lokasi</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Aula, Gedung A, dll" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Metodologi</label>
            <input value={form.methodology} onChange={e => setForm({ ...form, methodology: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="ABCD, Participatory, dll" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {mutation.isPending ? 'Menyimpan...' : workshop ? 'Simpan Perubahan' : 'Buat Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttendanceModal({ workshop, onClose, onSaved }: { workshop: Workshop; onClose: () => void; onSaved: () => void }) {
  const participants = workshop.peserta ?? [];
  const [attendedIds, setAttendedIds] = useState<Set<number>>(() => {
    const set = new Set<number>();
    participants.forEach(p => { if (p.attendance_status === 'attended') set.add(p.user_id); });
    return set;
  });

  const mutation = useMutation({
    mutationFn: () => adminApi.workshops.markAttendance(workshop.id, { user_ids: Array.from(attendedIds) }),
    onSuccess: () => {
      toast.success('Presensi berhasil disimpan');
      onSaved();
      onClose();
    },
    onError: () => toast.error('Gagal menyimpan presensi'),
  });

  const toggle = (userId: number) => {
    setAttendedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const selectAll = () => setAttendedIds(new Set(participants.map(p => p.user_id)));
  const deselectAll = () => setAttendedIds(new Set());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Presensi: {workshop.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{participants.length} peserta terdaftar · {attendedIds.size} hadir</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {participants.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Belum ada peserta terdaftar.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 mb-3">
                <button onClick={selectAll} className="text-xs font-semibold text-emerald-600 hover:underline">Pilih Semua</button>
                <span className="text-slate-300">|</span>
                <button onClick={deselectAll} className="text-xs font-semibold text-slate-500 hover:underline">Hapus Semua</button>
              </div>
              {participants.map(p => (
                <label key={p.user_id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={attendedIds.has(p.user_id)} onChange={() => toggle(p.user_id)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.user?.name || `User #${p.user_id}`}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {p.jabatan_sk && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{p.jabatan_sk}</span>}
                      {p.nomor_dokumen && <span className="truncate font-mono">{p.nomor_dokumen}</span>}
                      {!p.jabatan_sk && !p.nomor_dokumen && <span>{p.user?.email || '-'}</span>}
                    </div>
                  </div>
                  {p.attendance_status === 'attended' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Hadir</span>}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopsPage(): React.JSX.Element {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [attendanceWorkshop, setAttendanceWorkshop] = useState<Workshop | null>(null);
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: number } | null>(null);
  const [importPesertaId, setImportPesertaId] = useState<number | null>(null);
  const pesertaFileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'workshops'],
    queryFn: async () => {
      const res = await adminApi.workshops.index();
      const rawWorkshops = ((res as { data?: unknown })?.data ?? res) as unknown;
      return (Array.isArray(rawWorkshops) ? rawWorkshops : []).map((workshop) =>
        normalizeWorkshop(workshop as ApiWorkshop),
      );
    },
  });

  const importMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return adminApi.workshops.importMetodologiPkm(fd);
    },
    onSuccess: (res) => {
      const r = (res as unknown) as { matched: number; unmatched: number };
      setImportResult(r);
      qc.invalidateQueries({ queryKey: ['admin', 'workshops'] });
      toast.success(`Import selesai: ${r.matched} berhasil, ${r.unmatched} tidak ditemukan`);
    },
    onError: () => toast.error('Gagal import data'),
  });

  const importPesertaMut = useMutation({
    mutationFn: ({ workshopId, file }: { workshopId: number; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      return adminApi.workshops.importPeserta(workshopId, fd);
    },
    onSuccess: (res: unknown) => {
      const data = ((res as { data?: { success?: number; not_found?: number; skipped?: number } })?.data ?? res) as { success?: number; not_found?: number; skipped?: number };
      const msg = `Import selesai: ${data.success ?? 0} berhasil, ${data.not_found ?? 0} tidak ditemukan, ${data.skipped ?? 0} dilewati.`;
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['admin', 'workshops'] });
      setImportPesertaId(null);
    },
    onError: () => toast.error('Gagal import peserta'),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => adminApi.workshops.cancel(id),
    onSuccess: () => {
      toast.success('Workshop dibatalkan');
      qc.invalidateQueries({ queryKey: ['admin', 'workshops'] });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal membatalkan workshop'),
  });

  const workshops = data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'workshops'] });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop & Pembekalan"
        subtitle="Kelola workshop, presensi peserta, dan import data metodologi PKM"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setEditingWorkshop(null); setShowForm(true); }}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm">
              <Plus size={15} /> Buat Workshop
            </button>
            <a href="/api/v1/admin/workshops/template-peserta" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
              <Download size={15} /> Template Import
            </a>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) importMut.mutate(f); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} disabled={importMut.isPending}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-sm">
              <Upload size={15} />
              {importMut.isPending ? 'Mengimport...' : 'Import Data PKM'}
            </button>
            {/* Hidden input for per-workshop peserta import */}
            <input ref={pesertaFileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f && importPesertaId) importPesertaMut.mutate({ workshopId: importPesertaId, file: f }); e.target.value = ''; }} />
          </div>
        }
      />

      {/* Import result */}
      {importResult && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Import selesai</p>
            <p className="text-xs text-emerald-600 mt-0.5">{importResult.matched} berhasil · {importResult.unmatched} tidak ditemukan</p>
          </div>
          <button onClick={() => setImportResult(null)} className="text-emerald-500 hover:text-emerald-700"><X size={16} /></button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : workshops.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-12 text-center">
          <GraduationCap size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada workshop</p>
          <p className="text-xs text-slate-400 mt-1">Klik &quot;Buat Workshop&quot; untuk menambah workshop baru.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map(w => (
            <div key={w.id} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800">{w.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[w.status] || STATUS_COLORS.scheduled}`}>
                      {STATUS_LABELS[w.status] || w.status}
                    </span>
                  </div>
                  {w.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.description}</p>}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {w.display_date ?? w.workshop_date}</span>
                    {w.start_time && <span className="flex items-center gap-1"><Clock size={12} /> {w.start_time}{w.end_time ? ` - ${w.end_time}` : ''}</span>}
                    {w.location && <span className="flex items-center gap-1"><MapPin size={12} /> {w.location}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {w.participants_count ?? 0}{w.max_participants ? ` / ${w.max_participants}` : ''} peserta</span>
                    {w.methodology && <span className="flex items-center gap-1"><GraduationCap size={12} /> {w.methodology}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {w.status !== 'cancelled' && (
                    <>
                      <button onClick={() => setAttendanceWorkshop(w)} title="Kelola Presensi"
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <UserCheck size={13} /> Presensi
                      </button>
                      <button onClick={() => { setImportPesertaId(w.id); pesertaFileRef.current?.click(); }} title="Import Peserta dari Excel"
                        disabled={importPesertaMut.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        <FileUp size={13} /> {importPesertaMut.isPending && importPesertaId === w.id ? 'Importing...' : 'Import'}
                      </button>
                      <button onClick={() => { setEditingWorkshop(w); setShowForm(true); }} title="Edit"
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                        <Pencil size={14} />
                      </button>
                      {w.status === 'scheduled' && (
                        <button onClick={() => { if (confirm(`Batalkan workshop "${w.title}"? Workshop yang sudah memiliki presensi tidak dapat dibatalkan.`)) cancelMut.mutate(w.id); }} title="Batalkan"
                          disabled={cancelMut.isPending}
                          className="p-2 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50">
                          <Ban size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && <WorkshopFormModal workshop={editingWorkshop} onClose={() => setShowForm(false)} onSaved={invalidate} />}
      {attendanceWorkshop && <AttendanceModal workshop={attendanceWorkshop} onClose={() => setAttendanceWorkshop(null)} onSaved={invalidate} />}
    </div>
  );
}
