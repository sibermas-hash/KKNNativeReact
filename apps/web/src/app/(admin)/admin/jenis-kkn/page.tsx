'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, ConfirmDialog } from '@/components/ui/shared';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, X, RefreshCw, Settings, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ── */
interface ReqConfig {
  min_sks: number; min_gpa: number; min_semester: number;
  require_bta_ppi: boolean; require_not_married: boolean;
  require_parent_permission: boolean; require_health_cert: boolean;
}
interface AttConfig {
  geofence_enabled: boolean; radius_meters: number;
  location_source: string; require_photo: boolean; allow_offline_sync: boolean;
}
interface TemplateOption {
  id: number;
  document_key: string;
  name: string;
  file_name: string;
  download_url?: string;
}
interface DocumentRequirement {
  id: number;
  document_key: string;
  document_label: string;
  description?: string;
  is_required: boolean;
  sort_order: number;
  default_template_id?: number | null;
  default_template?: TemplateOption | null;
}

interface JenisKkn {
  id: number; code: string; name: string; description?: string;
  registration_mode: string; registration_mode_label: string;
  placement_mode: string; placement_mode_label: string;
  color?: string; is_active: boolean; sort_order: number;
  requirements_config?: Partial<ReqConfig>;
  attendance_config?: Partial<AttConfig>;
  document_requirements?: DocumentRequirement[];
}
interface FormState {
  code: string; name: string; description: string;
  registration_mode: string; placement_mode: string;
  color: string; is_active: boolean; sort_order: number;
  requirements_config: ReqConfig; attendance_config: AttConfig;
}

const DEFAULT_FORM: FormState = {
  code: '', name: '', description: '',
  registration_mode: 'open', placement_mode: 'automatic_after_approval',
  color: '#10b981', is_active: true, sort_order: 0,
  requirements_config: { min_sks: 100, min_gpa: 0, min_semester: 6, require_bta_ppi: true, require_not_married: false, require_parent_permission: false, require_health_cert: false },
  attendance_config: { geofence_enabled: true, radius_meters: 500, location_source: 'posko', require_photo: true, allow_offline_sync: true },
};

/* ── Sub-components ── */
function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100">
      <div>
        <p className="text-xs font-semibold text-cyan-950 uppercase tracking-tight">{label}</p>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-cyan-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider pl-1">{label}</label>
      {children}
    </div>
  );
}

function RadiusSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const safeValue = Number.isFinite(value) ? Math.min(10000, Math.max(50, value)) : 500;
  const min = 50;
  const max = 10000;
  const percentage = ((safeValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-950">{safeValue.toLocaleString('id-ID')} meter</p>
          <p className="text-[11px] text-slate-500">Geser slider atau isi angka manual.</p>
        </div>
        <input
          type="number"
          min={50}
          max={10000}
          step={50}
          value={safeValue}
          onChange={(e) => onChange(Number(e.target.value) || 50)}
          className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-right text-sm font-bold text-cyan-950 outline-none focus:border-cyan-600"
        />
      </div>
      <div className="space-y-2">
        <div className="relative px-1">
          <div
            className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-full bg-cyan-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg"
            style={{ left: `calc(${percentage}% + ${(0.5 - percentage / 100) * 8}px)` }}
          >
            {safeValue.toLocaleString('id-ID')}m
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={50}
            value={safeValue}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Radius absensi"
            className="jenis-kkn-radius-slider h-2.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(90deg, #0891b2 0%, #06b6d4 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
            }}
          />
        </div>
        <style jsx>{`
          .jenis-kkn-radius-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 9999px;
            background: #ffffff;
            border: 3px solid #0891b2;
            box-shadow: 0 6px 16px rgba(8, 145, 178, 0.28);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .jenis-kkn-radius-slider::-webkit-slider-thumb:hover {
            transform: scale(1.06);
            box-shadow: 0 8px 20px rgba(8, 145, 178, 0.34);
          }

          .jenis-kkn-radius-slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 9999px;
            background: #ffffff;
            border: 3px solid #0891b2;
            box-shadow: 0 6px 16px rgba(8, 145, 178, 0.28);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .jenis-kkn-radius-slider::-moz-range-thumb:hover {
            transform: scale(1.06);
            box-shadow: 0 8px 20px rgba(8, 145, 178, 0.34);
          }
        `}</style>
      </div>
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>50m</span>
        <span>5km</span>
        <span>10km</span>
      </div>
    </div>
  );
}

const INPUT = "w-full h-11 px-4 rounded-xl border-2 border-slate-100 text-sm font-semibold text-cyan-950 focus:border-cyan-600 outline-none bg-[#F8FAF9]";

/* ── Main Page ── */
export default function JenisKknPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [docReqForm, setDocReqForm] = useState({ document_key: '', document_label: '', description: '', is_required: true, sort_order: 0, default_template_id: '', template_file: null as File | null });

  const [editingRequirementId, setEditingRequirementId] = useState<number | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading } = useQuery<JenisKkn[]>({
    queryKey: ['admin', 'jenis-kkn'],
    queryFn: async () => {
      const res = await api.get('/admin/jenis-kkn');
      return (res as { data: JenisKkn[] }).data ?? res;
    },
  });



  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/admin/jenis-kkn/${id}`, { is_active }),
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'jenis-kkn'] });
      const prev = qc.getQueryData<JenisKkn[]>(['admin', 'jenis-kkn']);
      qc.setQueryData<JenisKkn[]>(['admin', 'jenis-kkn'], (old) =>
        old?.map((j) => j.id === id ? { ...j, is_active } : j) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(['admin', 'jenis-kkn'], ctx?.prev); toast.error('Gagal memperbarui status'); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] }),
  });

  const save = useMutation({
    mutationFn: () => editingId
      ? api.put(`/admin/jenis-kkn/${editingId}`, form)
      : api.post('/admin/jenis-kkn', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] });
      toast.success(editingId ? 'Jenis KKN diperbarui' : 'Jenis KKN ditambahkan');
      closeModal();
    },
    onError: () => toast.error('Gagal menyimpan'),
  });

  const destroy = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/jenis-kkn/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] }); toast.success('Jenis KKN dihapus'); },
    onError: () => toast.error('Gagal menghapus — masih digunakan oleh periode'),
  });

  const addDocumentRequirement = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('Simpan Jenis KKN terlebih dahulu.');
      const fd = new FormData();
      fd.append('document_key', docReqForm.document_key);
      fd.append('document_label', docReqForm.document_label);
      if (docReqForm.description) fd.append('description', docReqForm.description);
      fd.append('is_required', docReqForm.is_required ? '1' : '0');
      fd.append('sort_order', String(docReqForm.sort_order));
      if (docReqForm.template_file) fd.append('template_file', docReqForm.template_file);
      return api.post(`/admin/jenis-kkn/${editingId}/document-requirements`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] });
      toast.success('Requirement dokumen ditambahkan');
      setDocReqForm({ document_key: '', document_label: '', description: '', is_required: true, sort_order: 0, default_template_id: '', template_file: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Gagal menambah requirement dokumen'),
  });



  const updateDocumentRequirement = useMutation({
    mutationFn: async () => {
      if (!editingId || !editingRequirementId) throw new Error('Requirement dokumen tidak valid.');
      const fd = new FormData();
      fd.append('document_key', docReqForm.document_key);
      fd.append('document_label', docReqForm.document_label);
      if (docReqForm.description) fd.append('description', docReqForm.description);
      fd.append('is_required', docReqForm.is_required ? '1' : '0');
      fd.append('sort_order', String(docReqForm.sort_order));
      if (docReqForm.template_file) fd.append('template_file', docReqForm.template_file);
      fd.append('_method', 'PUT');
      return api.post(`/admin/jenis-kkn/${editingId}/document-requirements/${editingRequirementId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] });
      toast.success('Requirement dokumen diperbarui');
      setEditingRequirementId(null);
      setDocReqForm({ document_key: '', document_label: '', description: '', is_required: true, sort_order: 0, default_template_id: '', template_file: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Gagal memperbarui requirement dokumen'),
  });

  const deleteDocumentRequirement = useMutation({
    mutationFn: async (requirementId: number) => {
      if (!editingId) throw new Error('Jenis KKN belum dipilih.');
      return api.delete(`/admin/jenis-kkn/${editingId}/document-requirements/${requirementId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] });
      toast.success('Requirement dokumen dihapus');
      setEditingRequirementId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Gagal menghapus requirement dokumen'),
  });



  const resetDocumentForms = () => {
    setDocReqForm({ document_key: '', document_label: '', description: '', is_required: true, sort_order: 0, default_template_id: '', template_file: null });
    setEditingRequirementId(null);
  };

  const openCreate = () => { setEditingId(null); setForm(DEFAULT_FORM); resetDocumentForms(); setOpen(true); };
  const openEdit = (j: JenisKkn) => {
    setEditingId(j.id);
    setForm({
      code: j.code, name: j.name, description: j.description ?? '',
      registration_mode: j.registration_mode, placement_mode: j.placement_mode,
      color: j.color ?? '#10b981', is_active: j.is_active, sort_order: j.sort_order,
      requirements_config: { ...DEFAULT_FORM.requirements_config, ...(j.requirements_config ?? {}) },
      attendance_config: { ...DEFAULT_FORM.attendance_config, ...(j.attendance_config ?? {}) },
    });
    resetDocumentForms();
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditingId(null); };

  const setReq = (k: keyof ReqConfig, v: unknown) =>
    setForm(f => ({ ...f, requirements_config: { ...f.requirements_config, [k]: v } }));
  const setAtt = (k: keyof AttConfig, v: unknown) =>
    setForm(f => ({ ...f, attendance_config: { ...f.attendance_config, [k]: v } }));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jenis KKN"
        subtitle="Kelola jenis KKN beserta syarat pendaftaran dan konfigurasi absensi"
        actions={
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20">
            <Plus size={16} strokeWidth={3} /> Tambah Jenis KKN
          </motion.button>
        }
      />

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-4xl"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-8 py-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {editingId ? 'Perbarui Skema' : 'Tambah Skema Baru'}
                    </h2>
                    <p className="text-cyan-100 text-sm mt-1">Atur parameter kualifikasi dan alur kerja skema.</p>
                  </div>
                  <button onClick={closeModal} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
                  className="p-8 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">

                  {/* Kode + Nama */}
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Kode Skema">
                      <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        className={INPUT} placeholder="REGULER" required />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Nama Program">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className={INPUT} placeholder="KKN Reguler" required />
                      </Field>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <Field label="Deskripsi Singkat">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full p-4 rounded-xl border-2 border-slate-100 text-sm font-medium text-cyan-950 focus:border-cyan-600 outline-none min-h-[80px] bg-[#F8FAF9]"
                      placeholder="Penjelasan mengenai skema program ini..." />
                  </Field>

                  {/* Mode + SKS + IPK */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Field label="Min SKS">
                      <input type="number" value={form.requirements_config.min_sks}
                        onChange={e => setReq('min_sks', Number(e.target.value))} className={INPUT} />
                    </Field>
                    <Field label="Min IPK">
                      <input type="number" step="0.01" value={form.requirements_config.min_gpa}
                        onChange={e => setReq('min_gpa', Number(e.target.value))} className={INPUT} />
                    </Field>
                    <Field label="Mode Pendaftaran">
                      <select value={form.registration_mode} onChange={e => setForm(f => ({ ...f, registration_mode: e.target.value }))}
                        className={INPUT + ' cursor-pointer'}>
                        <option value="open">Terbuka Mandiri</option>
                        <option value="selective">Seleksi Khusus</option>
                        <option value="proposal_based">Berbasis Proposal</option>
                      </select>
                    </Field>
                    <Field label="Mode Penempatan">
                      <select value={form.placement_mode} onChange={e => setForm(f => ({ ...f, placement_mode: e.target.value }))}
                        className={INPUT + ' cursor-pointer'}>
                        <option value="automatic_after_approval">Otomatis Sistem</option>
                        <option value="manual_admin">Manual Admin</option>
                        <option value="host_defined">Ditentukan Mitra</option>
                        <option value="proposal_defined">Ikuti Proposal</option>
                        <option value="self_determined">Mandiri</option>
                      </select>
                    </Field>
                  </div>

                  {/* Validasi Otomatis */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Validasi Otomatis Sistem</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Toggle label="Lulus BTA-PPI" hint="Sistem mengecek data BTA di database."
                        checked={form.requirements_config.require_bta_ppi} onChange={v => setReq('require_bta_ppi', v)} />
                      <Toggle label="Belum Menikah" hint="Sistem mengecek status pernikahan."
                        checked={form.requirements_config.require_not_married} onChange={v => setReq('require_not_married', v)} />
                    </div>
                  </div>

                  {/* Dokumen Persyaratan */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumen Persyaratan (Cek Manual Admin)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Toggle label="Surat Sehat" hint="Wajib unggah Surat Keterangan Sehat."
                        checked={form.requirements_config.require_health_cert} onChange={v => setReq('require_health_cert', v)} />
                      <Toggle label="Izin Orang Tua/Suami" hint="Wajib unggah Surat Izin."
                        checked={form.requirements_config.require_parent_permission} onChange={v => setReq('require_parent_permission', v)} />
                    </div>
                  </div>

                  {/* Requirement Dokumen Dinamis */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Requirement Dokumen Dinamis</h4>
                    {!editingId ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                        Simpan skema terlebih dahulu agar requirement dokumen dan template default bisa dikelola dari UI.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input value={docReqForm.document_key} onChange={e => setDocReqForm(f => ({ ...f, document_key: e.target.value }))} className={INPUT} placeholder="document_key, contoh: surat_izin_ortu" />
                          <input value={docReqForm.document_label} onChange={e => setDocReqForm(f => ({ ...f, document_label: e.target.value }))} className={INPUT} placeholder="Label dokumen (tampil ke mahasiswa)" />
                          <input value={docReqForm.description} onChange={e => setDocReqForm(f => ({ ...f, description: e.target.value }))} className={INPUT} placeholder="Deskripsi/petunjuk untuk mahasiswa" />
                          <input type="number" value={docReqForm.sort_order} onChange={e => setDocReqForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className={INPUT} placeholder="Urutan tampil" />
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">File Template (opsional)</p>
                            <input type="file" accept=".doc,.docx,.pdf,.xls,.xlsx" onChange={e => setDocReqForm(f => ({ ...f, template_file: e.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-semibold file:text-cyan-700" />
                            <p className="text-[9px] text-slate-400">File ini bisa diunduh mahasiswa sebagai contoh format surat.</p>
                          </div>
                          <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-cyan-950">
                            <input type="checkbox" checked={docReqForm.is_required} onChange={e => setDocReqForm(f => ({ ...f, is_required: e.target.checked }))} className="accent-cyan-600" />
                            Wajib diunggah mahasiswa
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editingRequirementId ? updateDocumentRequirement.mutate() : addDocumentRequirement.mutate()} disabled={(addDocumentRequirement.isPending || updateDocumentRequirement.isPending) || !docReqForm.document_key || !docReqForm.document_label} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                            {editingRequirementId
                              ? (updateDocumentRequirement.isPending ? 'Menyimpan...' : 'Simpan Requirement')
                              : (addDocumentRequirement.isPending ? 'Menyimpan...' : 'Tambah Requirement Dokumen')}
                          </button>
                          {editingRequirementId && (
                            <button type="button" onClick={resetDocumentForms} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                              Batal Edit
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-4">
                          {(list.find(item => item.id === editingId)?.document_requirements ?? []).length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada requirement dokumen dinamis untuk skema ini.</p>
                          ) : (
                            (list.find(item => item.id === editingId)?.document_requirements ?? []).map(req => (
                              <div key={req.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-bold text-cyan-950">{req.document_label}</p>
                                    <p className="text-xs font-mono text-slate-500">{req.document_key}</p>
                                    {req.description && <p className="mt-1 text-xs text-slate-500">{req.description}</p>}
                                  </div>
                                  <div className="text-right text-xs text-slate-500">
                                    <p>{req.is_required ? 'Wajib' : 'Opsional'}</p>
                                    <p>Urutan {req.sort_order}</p>
                                    <div className="mt-2 flex justify-end gap-2">
                                      <button type="button" onClick={() => { setEditingRequirementId(req.id); setDocReqForm({ document_key: req.document_key, document_label: req.document_label, description: req.description ?? '', is_required: req.is_required, sort_order: req.sort_order, default_template_id: req.default_template_id ? String(req.default_template_id) : '', template_file: null }); }} className="rounded-lg bg-white px-2 py-1 font-semibold text-cyan-700 hover:bg-cyan-50">Edit</button>
                                      <button type="button" onClick={() => deleteDocumentRequirement.mutate(req.id)} className="rounded-lg bg-white px-2 py-1 font-semibold text-rose-600 hover:bg-rose-50">Hapus</button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                                  Template default: {req.default_template ? `${req.default_template.name} (${req.default_template.file_name})` : 'Belum diatur'}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>



                  {/* Absensi */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Konfigurasi Absensi & Geotagging</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Toggle label="Aktifkan Geofencing" hint="Validasi lokasi saat mahasiswa absen."
                        checked={form.attendance_config.geofence_enabled} onChange={v => setAtt('geofence_enabled', v)} />
                      <Toggle label="Wajib Lampiran Foto" hint="Mahasiswa wajib upload foto saat absen."
                        checked={form.attendance_config.require_photo} onChange={v => setAtt('require_photo', v)} />
                      <Toggle label="Izinkan Offline Sync" hint="Absen offline, sync saat online."
                        checked={form.attendance_config.allow_offline_sync} onChange={v => setAtt('allow_offline_sync', v)} />
                      {form.attendance_config.geofence_enabled && (
                        <Field label="Radius Absensi (Meter)">
                          <RadiusSlider
                            value={form.attendance_config.radius_meters}
                            onChange={(value) => setAtt('radius_meters', value)}
                          />
                        </Field>
                      )}
                    </div>
                    <Field label="Sumber Lokasi Rujukan">
                      <div className="flex gap-3 flex-wrap">
                        {[{ value: 'posko', label: 'Posko Kelompok' }, { value: 'address', label: 'Alamat Asli Mahasiswa' }, { value: 'custom', label: 'Lokasi Custom' }].map(opt => (
                          <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold hover:bg-slate-50 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50">
                            <input type="radio" name="location_source" value={opt.value}
                              checked={form.attendance_config.location_source === opt.value}
                              onChange={() => setAtt('location_source', opt.value)} className="accent-cyan-600" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>

                  {/* Warna + Urutan + Aktif */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <Field label="Warna">
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                          className="h-11 w-14 cursor-pointer rounded-xl border-2 border-slate-100" />
                        <span className="font-mono text-sm text-slate-500">{form.color}</span>
                      </div>
                    </Field>
                    <Field label="Urutan">
                      <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                        className="w-20 h-11 text-center rounded-xl border-2 border-slate-100 text-sm font-bold bg-[#F8FAF9]" />
                    </Field>
                    <label className="flex items-center gap-3 cursor-pointer mt-5">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                        className="w-5 h-5 text-cyan-600 border-slate-200 rounded-lg focus:ring-cyan-500" />
                      <span className="text-sm font-semibold text-cyan-950">Skema Aktif</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-cyan-50">
                    <button type="button" ref={cancelRef} onClick={closeModal}
                      className="flex-1 h-12 border-2 border-slate-100 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50">
                      Batal
                    </button>
                    <button type="submit" disabled={save.isPending}
                      className="flex-[2] h-12 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 flex items-center justify-center gap-3 shadow-lg shadow-cyan-600/20 disabled:opacity-50">
                      {save.isPending ? <RefreshCw size={16} className="animate-spin" /> : editingId ? <Settings size={16} /> : <CheckCircle2 size={16} />}
                      {save.isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Daftarkan Skema'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Belum ada jenis KKN</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
            <Plus size={16} /> Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Nama</th>
                <th className="px-5 py-3 text-left">Mode Pendaftaran</th>
                <th className="px-5 py-3 text-left">Mode Penempatan</th>
                <th className="px-5 py-3 text-left">SKS / IPK</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((j) => {
                const req = j.requirements_config ?? {};
                return (
                  <tr key={j.id} className="hover:bg-slate-50 group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {j.color && <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: j.color }} />}
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-cyan-700 transition-colors">{j.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{j.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{j.registration_mode_label}</td>
                    <td className="px-5 py-4 text-slate-600">{j.placement_mode_label}</td>
                    <td className="px-5 py-4 font-mono text-slate-700 text-xs">
                      {req.min_sks != null ? `${req.min_sks} SKS` : '—'}
                      <span className="text-slate-300 mx-1">/</span>
                      {req.min_gpa && Number(req.min_gpa) > 0 ? Number(req.min_gpa).toFixed(2) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleActive.mutate({ id: j.id, is_active: !j.is_active })}
                        disabled={toggleActive.isPending}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{ background: j.is_active ? '#dcfce7' : '#f1f5f9', color: j.is_active ? '#16a34a' : '#94a3b8' }}
                      >
                        {j.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {j.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(j)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100">
                          <Pencil size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => { setConfirmId(j.id); setConfirmName(j.name); }}
                          disabled={destroy.isPending && destroy.variables === j.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 disabled:opacity-50">
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) destroy.mutate(confirmId); }}
        title={`Hapus "${confirmName}"?`}
        description="Jenis KKN akan dihapus permanen dan tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
