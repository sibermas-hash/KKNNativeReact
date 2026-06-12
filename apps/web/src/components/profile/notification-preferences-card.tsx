'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Smartphone, RefreshCw, Monitor, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { desktopPermissionState, requestDesktopPermission, type DesktopPermission } from '@/lib/notify';

type Prefs = { in_app: boolean; email: boolean; push: boolean };

interface PreferencesResponse {
  preferences: Prefs;
  raw: Partial<Prefs> | null;
  defaults: Prefs;
}

/**
 * Notification preferences card — per-channel toggles (in-app / email / push).
 *
 * Backed by GET + PATCH /v1/profile/notification-preferences. The raw
 * stored prefs are shown next to each toggle so the user can tell
 * whether a channel is "explicitly on" vs "on by default (unset)".
 */
export function NotificationPreferencesCard(): React.JSX.Element {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PreferencesResponse>({
    queryKey: ['profile', 'notification-preferences'],
    queryFn: async () => {
      const res = await api.get('/profile/notification-preferences');
      return ((res as { data?: unknown }).data ?? res) as PreferencesResponse;
    },
  });

  const patch = useMutation({
    mutationFn: (payload: Partial<Prefs> | { reset: true }) =>
      api.patch('/profile/notification-preferences', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'notification-preferences'] });
      toast.success('Preferensi notifikasi tersimpan.');
    },
    onError: () => toast.error('Gagal menyimpan preferensi notifikasi.'),
  });

  const prefs = data?.preferences ?? { in_app: true, email: true, push: true };
  const raw = data?.raw ?? null;

  const rows: Array<{ key: keyof Prefs; icon: typeof Bell; label: string; hint: string }> = [
    { key: 'in_app', icon: Bell,       label: 'Notifikasi dalam aplikasi', hint: 'Lonceng notifikasi + halaman /notifikasi' },
    { key: 'email',  icon: Mail,       label: 'Email',                     hint: 'Kirim ringkasan ke email terdaftar' },
    { key: 'push',   icon: Smartphone, label: 'Push ke perangkat mobile',  hint: 'Hanya aktif saat app mobile terpasang + izin push diberikan' },
  ];

  return (
    <section className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-5 shadow-sm space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[color:var(--profile-text)]">Preferensi Notifikasi</h2>
          <p className="mt-0.5 text-xs text-[color:var(--profile-muted)]">
            Atur saluran notifikasi yang ingin Anda terima.
          </p>
        </div>
        {raw !== null && (
          <button
            type="button"
            onClick={() => patch.mutate({ reset: true })}
            disabled={patch.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-[color:var(--profile-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--profile-muted)] hover:bg-[color:var(--profile-soft)] disabled:opacity-50"
            title="Kembalikan ke preferensi default"
          >
            <RefreshCw size={11} /> Reset
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-[color:var(--profile-input-disabled)]" />
      ) : (
        <ul className="space-y-2">
          {rows.map(({ key, icon: Icon, label, hint }) => {
            const value = prefs[key];
            const isExplicit = raw !== null && raw?.[key] !== undefined;
            return (
              <li key={key} className="flex items-start gap-3 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] p-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-[color:var(--profile-primary)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[color:var(--profile-text)]">{label}</p>
                    <Switch
                      checked={value}
                      disabled={patch.isPending}
                      onChange={(next) => patch.mutate({ [key]: next } as Partial<Prefs>)}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[color:var(--profile-muted)]">
                    {hint}
                    {!isExplicit && <span className="ml-1 italic">(default)</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DesktopNotificationRow />
    </section>
  );
}

/**
 * Desktop Notification API row — separate from the channel preferences
 * because it's a PURE BROWSER permission (not stored server-side). Lets
 * the user grant / revoke OS-level popups when the tab is backgrounded.
 */
function DesktopNotificationRow(): React.JSX.Element {
  const [state, setState] = useState<DesktopPermission>('unsupported');

  useEffect(() => {
    setState(desktopPermissionState());
  }, []);

  const handleEnable = async () => {
    const result = await requestDesktopPermission();
    setState(result);
    if (result === 'granted') {
      toast.success('Notifikasi desktop diaktifkan.');
    } else if (result === 'denied') {
      toast.error('Notifikasi desktop ditolak. Ubah via pengaturan browser jika ingin mengaktifkan kembali.');
    }
  };

  if (state === 'unsupported') return <></>;

  const labelMap: Record<Exclude<DesktopPermission, 'unsupported'>, { status: string; hint: string; tone: string }> = {
    'granted':    { status: 'Aktif',        hint: 'Notifikasi desktop muncul saat tab di background.', tone: 'text-emerald-600' },
    'not-asked':  { status: 'Belum aktif',  hint: 'Saat tab di-minimize atau pindah tab, notifikasi tidak terlihat kecuali Anda aktifkan ini.', tone: 'text-slate-500' },
    'denied':     { status: 'Diblokir',     hint: 'Buka pengaturan browser (site settings) untuk mengaktifkan kembali.', tone: 'text-rose-600' },
  };
  const meta = labelMap[state];

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] p-3">
      <Monitor size={18} className="mt-0.5 shrink-0 text-[color:var(--profile-primary)]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[color:var(--profile-text)]">Notifikasi desktop (OS)</p>
          {state === 'granted' ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={12} /> {meta.status}
            </span>
          ) : state === 'denied' ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <XCircle size={12} /> {meta.status}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleEnable}
              className="rounded-lg bg-[color:var(--profile-primary)] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[color:var(--profile-primary-hover)]"
            >
              Aktifkan
            </button>
          )}
        </div>
        <p className={`mt-0.5 text-[11px] ${meta.tone}`}>{meta.hint}</p>
      </div>
    </div>
  );
}

/** Minimal accessible toggle — avoids pulling in a full Radix Switch. */
function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (next: boolean) => void }): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
