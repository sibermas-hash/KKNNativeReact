'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Bell, Mail, MessageCircle, Save, Send, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { rawApi } from '@/lib/api';

type NotifDefaults = { in_app: boolean; email: boolean; push: boolean; wa: boolean };


type WaConfig = {
  enabled: boolean;
  url: string;
  session: string;
  api_key_masked: string;
  has_api_key: boolean;
  rate_limit_per_minute: number;
  rate_limit_per_phone_per_minute: number;
};

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <span className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminApi.settings.index();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const { data: waData } = useQuery({
    queryKey: ['admin', 'wa-gateway'],
    queryFn: async () => (await rawApi.get('/admin/pengaturan/notifikasi/wa')).data?.data?.config as WaConfig,
  });

  const [waForm, setWaForm] = useState({ enabled: false, url: '', session: '', api_key: '', rate_limit_per_minute: 10, rate_limit_per_phone_per_minute: 2, test_phone: '' });

  useEffect(() => {
    if (!waData) return;
    setWaForm((prev) => ({ ...prev, enabled: waData.enabled, url: waData.url || '', session: waData.session || '', rate_limit_per_minute: waData.rate_limit_per_minute || 10, rate_limit_per_phone_per_minute: waData.rate_limit_per_phone_per_minute || 2 }));
  }, [waData]);

  const saveWaMutation = useMutation({
    mutationFn: () => rawApi.patch('/admin/pengaturan/notifikasi/wa', waForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'wa-gateway'] }); toast.success('Konfigurasi WA Gateway tersimpan'); },
    onError: () => toast.error('Gagal menyimpan konfigurasi WA Gateway'),
  });

  const testWaMutation = useMutation({
    mutationFn: async () => (await rawApi.post('/admin/pengaturan/notifikasi/wa/test', { phone: waForm.test_phone })).data,
    onSuccess: (res) => toast.success(res?.data?.message || 'Test WA selesai'),
    onError: () => toast.error('Gagal test WA'),
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, string>) => adminApi.settings.update({ settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Pengaturan notifikasi berhasil diperbarui');
    },
    onError: () => toast.error('Gagal menyimpan pengaturan'),
  });

  const settings = (data?.settings || {}) as Record<string, string>;
  const defaults: NotifDefaults = {
    in_app: settings['notification_default_in_app'] !== '0',
    email: settings['notification_default_email'] !== '0',
    push: settings['notification_default_push'] !== '0',
    wa: settings['notification_default_wa'] !== '0',
  };

  const toggle = (key: keyof NotifDefaults) => {
    updateMutation.mutate({
      [`notification_default_${key}`]: defaults[key] ? '0' : '1',
    });
  };

  const rows = [
    { key: 'in_app' as const, icon: Bell, label: 'Notifikasi dalam aplikasi', hint: 'Lonceng notifikasi + halaman /notifikasi untuk semua user' },
    { key: 'email' as const, icon: Mail, label: 'Email', hint: 'Kirim ringkasan notifikasi ke email terdaftar user' },
    { key: 'push' as const, icon: Smartphone, label: 'Push ke perangkat mobile', hint: 'Push notification ke app mobile (FCM)' },
    { key: 'wa' as const, icon: MessageCircle, label: 'WhatsApp / WA', hint: 'Kirim notifikasi melalui nomor WhatsApp pengguna jika layanan WA aktif' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Pengaturan Notifikasi" subtitle="Konfigurasi default saluran notifikasi untuk seluruh pengguna sistem" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">Default Saluran Notifikasi</h2>
            <p className="mt-1 text-xs text-slate-500">Pengaturan ini berlaku sebagai default untuk user yang belum mengatur preferensi sendiri.</p>
          </div>

          <ul className="space-y-3">
            {rows.map(({ key, icon: Icon, label, hint }) => (
              <li key={key} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Icon size={20} className="shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{hint}</p>
                </div>
                <Switch checked={defaults[key]} disabled={updateMutation.isPending} onChange={() => toggle(key)} />
              </li>
            ))}
          </ul>
        </div>
      )}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">Gateway WhatsApp</h2>
            <p className="mt-1 text-xs text-slate-500">Tempel URL, session, API key, batas kirim, lalu kirim pesan test. API key disimpan terenkripsi dan tidak ditampilkan ulang.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-slate-600">Base URL
              <input value={waForm.url} onChange={(e) => setWaForm({ ...waForm, url: e.target.value })} placeholder="https://wa-gateway.example.com" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-bold text-slate-600">Session Name
              <input value={waForm.session} onChange={(e) => setWaForm({ ...waForm, session: e.target.value })} placeholder="sibermas" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-bold text-slate-600">API Key
              <input type="password" value={waForm.api_key} onChange={(e) => setWaForm({ ...waForm, api_key: e.target.value })} placeholder={waData?.has_api_key ? `Tersimpan: ${waData.api_key_masked}` : 'Tempel API key'} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" />
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div><p className="text-sm font-semibold text-slate-800">Aktifkan WA Gateway</p><p className="text-xs text-slate-500">Matikan untuk menghentikan semua kiriman WA</p></div>
              <Switch checked={waForm.enabled} disabled={saveWaMutation.isPending} onChange={(v) => setWaForm({ ...waForm, enabled: v })} />
            </div>
            <label className="space-y-1 text-xs font-bold text-slate-600">Batas global / menit
              <input type="number" min={1} max={60} value={waForm.rate_limit_per_minute} onChange={(e) => setWaForm({ ...waForm, rate_limit_per_minute: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-bold text-slate-600">Batas per nomor / menit
              <input type="number" min={1} max={10} value={waForm.rate_limit_per_phone_per_minute} onChange={(e) => setWaForm({ ...waForm, rate_limit_per_phone_per_minute: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => saveWaMutation.mutate()} disabled={saveWaMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Save size={16} /> Simpan Gateway</button>
            <input value={waForm.test_phone} onChange={(e) => setWaForm({ ...waForm, test_phone: e.target.value })} placeholder="Nomor test, contoh 08123456789" className="min-w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button onClick={() => testWaMutation.mutate()} disabled={testWaMutation.isPending || !waForm.test_phone} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Send size={16} /> Kirim Test</button>
          </div>
        </div>

    </div>
  );
}
