'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ReqConfig {
  min_sks: number;
  min_gpa: number;
  min_semester: number;
  require_bta_ppi: boolean;
  require_not_married: boolean;
  require_parent_permission: boolean;
  require_health_cert: boolean;
}

interface AttConfig {
  geofence_enabled: boolean;
  radius_meters: number;
  location_source: string;
  require_photo: boolean;
  allow_offline_sync: boolean;
}

interface FormState {
  name: string;
  description: string;
  registration_mode: string;
  placement_mode: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  requirements_config: ReqConfig;
  attendance_config: AttConfig;
}

const DEFAULT_REQ: ReqConfig = {
  min_sks: 100,
  min_gpa: 0,
  min_semester: 6,
  require_bta_ppi: true,
  require_not_married: false,
  require_parent_permission: false,
  require_health_cert: false,
};

const toHexColor = (value?: string | null): string => {
  if (!value) return "#10b981";
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  const map: Record<string, string> = { emerald: "#10b981", blue: "#3b82f6", amber: "#f59e0b", indigo: "#6366f1", slate: "#64748b", cyan: "#06b6d4" };
  return map[value] ?? "#10b981";
};

const DEFAULT_ATT: AttConfig = {
  geofence_enabled: true,
  radius_meters: 500,
  location_source: 'posko',
  require_photo: true,
  allow_offline_sync: true,
};

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0, step = 1, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
}

export default function JenisKknEditPage(): React.JSX.Element {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'jenis-kkn', id],
    queryFn: async () => {
      const res = await api.get(`/admin/jenis-kkn/${id}`);
      return (res as { data: unknown }).data ?? res;
    },
    enabled: !!id,
  });

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    registration_mode: 'open',
    placement_mode: 'automatic_after_approval',
    color: '#10b981',
    is_active: true,
    sort_order: 0,
    requirements_config: DEFAULT_REQ,
    attendance_config: DEFAULT_ATT,
  });

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    setForm({
      name: String(d.name ?? ''),
      description: String(d.description ?? ''),
      registration_mode: String(d.registration_mode ?? 'open'),
      placement_mode: String(d.placement_mode ?? 'automatic_after_approval'),
      color: String(d.color ?? '#10b981'),
      is_active: Boolean(d.is_active ?? true),
      sort_order: Number(d.sort_order ?? 0),
      requirements_config: { ...DEFAULT_REQ, ...((d.requirements_config as object) ?? {}) },
      attendance_config: { ...DEFAULT_ATT, ...((d.attendance_config as object) ?? {}) },
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put(`/admin/jenis-kkn/${id}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jenis-kkn'] });
      toast.success('Jenis KKN berhasil disimpan');
      router.push('/admin/jenis-kkn');
    },
    onError: () => toast.error('Gagal menyimpan'),
  });

  const setReq = (key: keyof ReqConfig, value: unknown) =>
    setForm((f) => ({ ...f, requirements_config: { ...f.requirements_config, [key]: value } }));

  const setAtt = (key: keyof AttConfig, value: unknown) =>
    setForm((f) => ({ ...f, attendance_config: { ...f.attendance_config, [key]: value } }));

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/jenis-kkn" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Edit Jenis KKN</h1>
            <p className="text-sm text-slate-500">{form.name}</p>
          </div>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save size={16} />
          {save.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informasi Dasar */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700">Informasi Dasar</h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deskripsi</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode Pendaftaran</label>
              <select
                value={form.registration_mode}
                onChange={(e) => setForm((f) => ({ ...f, registration_mode: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="open">Terbuka Mandiri</option>
                <option value="selective">Seleksi Khusus</option>
                <option value="proposal_based">Berbasis Proposal</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode Penempatan</label>
              <select
                value={form.placement_mode}
                onChange={(e) => setForm((f) => ({ ...f, placement_mode: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="automatic_after_approval">Otomatis oleh Sistem</option>
                <option value="manual_admin">Manual oleh Admin</option>
                <option value="host_defined">Ditentukan Mitra/Host</option>
                <option value="proposal_defined">Mengikuti Proposal</option>
                <option value="self_determined">Mandiri (Mahasiswa)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Warna</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={toHexColor(form.color)}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                />
                <span className="font-mono text-sm text-slate-500">{form.color}</span>
              </div>
            </div>
            <NumberField
              label="Urutan Tampil"
              value={form.sort_order}
              onChange={(v) => setForm((f) => ({ ...f, sort_order: v }))}
            />
          </div>

          <Toggle
            label="Status Aktif"
            hint="Jenis KKN nonaktif tidak bisa dipilih saat membuat periode"
            checked={form.is_active}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          />
        </div>

        {/* Syarat Pendaftaran */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700">Syarat Pendaftaran</h2>

          <div className="grid grid-cols-3 gap-4">
            <NumberField
              label="Min SKS"
              value={form.requirements_config.min_sks}
              onChange={(v) => setReq('min_sks', v)}
              hint="Contoh: 100"
            />
            <NumberField
              label="Min IPK"
              value={form.requirements_config.min_gpa}
              onChange={(v) => setReq('min_gpa', v)}
              min={0}
              step={0.01}
              hint="0 = tidak dicek"
            />
            <NumberField
              label="Min Semester"
              value={form.requirements_config.min_semester}
              onChange={(v) => setReq('min_semester', v)}
              hint="Contoh: 6"
            />
          </div>

          <div className="space-y-2">
            <Toggle
              label="Wajib Lulus BTA/PPI"
              checked={form.requirements_config.require_bta_ppi}
              onChange={(v) => setReq('require_bta_ppi', v)}
            />
            <Toggle
              label="Wajib Belum Menikah"
              checked={form.requirements_config.require_not_married}
              onChange={(v) => setReq('require_not_married', v)}
            />
            <Toggle
              label="Wajib Izin Orang Tua"
              hint="Mahasiswa harus upload surat izin orang tua"
              checked={form.requirements_config.require_parent_permission}
              onChange={(v) => setReq('require_parent_permission', v)}
            />
            <Toggle
              label="Wajib Surat Keterangan Sehat"
              checked={form.requirements_config.require_health_cert}
              onChange={(v) => setReq('require_health_cert', v)}
            />
          </div>
        </div>

        {/* Konfigurasi Absensi */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-700">Konfigurasi Absensi</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Toggle
              label="Geofence Aktif"
              hint="Validasi lokasi GPS saat absen"
              checked={form.attendance_config.geofence_enabled}
              onChange={(v) => setAtt('geofence_enabled', v)}
            />
            <Toggle
              label="Wajib Foto"
              hint="Mahasiswa harus upload foto saat absen"
              checked={form.attendance_config.require_photo}
              onChange={(v) => setAtt('require_photo', v)}
            />
            <Toggle
              label="Izinkan Offline Sync"
              hint="Absen bisa dilakukan offline, sync saat online"
              checked={form.attendance_config.allow_offline_sync}
              onChange={(v) => setAtt('allow_offline_sync', v)}
            />
            <NumberField
              label="Radius Geofence (meter)"
              value={form.attendance_config.radius_meters}
              onChange={(v) => setAtt('radius_meters', v)}
              min={50}
              hint="Default: 500m"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sumber Lokasi Referensi</label>
            <div className="flex gap-3">
              {[
                { value: 'posko', label: 'Posko Kelompok' },
                { value: 'address', label: 'Alamat Asli Mahasiswa' },
                { value: 'custom', label: 'Lokasi Custom' },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input
                    type="radio"
                    name="location_source"
                    value={opt.value}
                    checked={form.attendance_config.location_source === opt.value}
                    onChange={() => setAtt('location_source', opt.value)}
                    className="accent-emerald-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
