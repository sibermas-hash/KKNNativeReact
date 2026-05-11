'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';

type NotifDefaults = { in_app: boolean; email: boolean; push: boolean };

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
      return (res as any)?.data ?? res;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, string>) => adminApi.settings.update({ settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Pengaturan notifikasi berhasil diperbarui');
    },
    onError: () => toast.error('Gagal menyimpan pengaturan'),
  });

  const settings = data?.settings || {};
  const defaults: NotifDefaults = {
    in_app: settings['notification_default_in_app'] !== '0',
    email: settings['notification_default_email'] !== '0',
    push: settings['notification_default_push'] !== '0',
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
    </div>
  );
}
