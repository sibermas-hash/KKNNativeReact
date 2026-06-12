'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Bell, CheckCircle2, Info, Megaphone, Send, Users } from 'lucide-react';
import { adminApi, api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { BackButton, PageHeader } from '@/components/ui/shared';

type Priority = 'info' | 'success' | 'warning' | 'danger';
type TargetKind = 'all' | 'role' | 'fakultas' | 'user_ids';

interface BroadcastResult {
  target: string;
  total_matched: number;
  total_sent: number;
}

const PRIORITIES: Array<{ value: Priority; label: string; Icon: typeof Info; cls: string }> = [
  { value: 'info',    label: 'Info',    Icon: Info,          cls: 'text-cyan-600' },
  { value: 'success', label: 'Sukses',  Icon: CheckCircle2,  cls: 'text-emerald-600' },
  { value: 'warning', label: 'Warning', Icon: AlertTriangle, cls: 'text-amber-600' },
  { value: 'danger',  label: 'Penting', Icon: AlertTriangle, cls: 'text-rose-600' },
];

const ROLE_OPTIONS = [
  { value: 'student',       label: 'Mahasiswa (semua)' },
  { value: 'dpl',           label: 'DPL' },
  { value: 'dosen',         label: 'Dosen (semua)' },
  { value: 'faculty_admin', label: 'Admin Fakultas' },
  { value: 'admin',         label: 'Admin' },
];

export default function BroadcastPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const isSuperadmin = (user?.roles ?? []).includes('superadmin');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('info');
  const [action, setAction] = useState('');
  const [targetKind, setTargetKind] = useState<TargetKind>('all');
  const [targetRole, setTargetRole] = useState('student');
  const [targetFakultasId, setTargetFakultasId] = useState<number | ''>('');
  const [userIdsRaw, setUserIdsRaw] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);

  // Fakultas list for the fakultas target.
  const { data: fakultasList } = useQuery<Array<{ id: number; nama?: string; short_name?: string }>>({
    queryKey: ['admin', 'fakultas-options'],
    queryFn: async () => {
      const res = await api.get('/admin/fakultas');
      const payload = res as unknown;
      // Paginated shape or plain array tolerated.
      const arr = (payload as { data?: unknown[] }).data ?? (payload as unknown[]);
      return Array.isArray(arr) ? (arr as Array<{ id: number; nama?: string; short_name?: string }>) : [];
    },
    enabled: isSuperadmin && targetKind === 'fakultas',
    staleTime: 60_000,
  });

  const broadcast = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        priority,
        type: 'announcement',
      };
      if (action.trim()) payload.action = action.trim();

      if (targetKind === 'all') {
        payload.target = 'all';
      } else if (targetKind === 'role') {
        payload.target = `role:${targetRole}`;
      } else if (targetKind === 'fakultas') {
        if (!targetFakultasId) throw new Error('Pilih fakultas dulu.');
        payload.target = `fakultas:${targetFakultasId}`;
      } else if (targetKind === 'user_ids') {
        const ids = userIdsRaw
          .split(/[\s,]+/)
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n) && n > 0);
        if (ids.length === 0) throw new Error('Isi minimal satu user ID.');
        payload.target = 'user_ids';
        payload.user_ids = ids;
      }

      return adminApi.notifications.broadcast(payload as Parameters<typeof adminApi.notifications.broadcast>[0]);
    },
    onSuccess: (res) => {
      const payload = res as unknown as BroadcastResult;
      setLastResult(payload);
      toast.success(`Pengumuman terkirim ke ${payload.total_sent} dari ${payload.total_matched} penerima.`);
      setConfirmed(false);
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, 'Gagal mengirim pengumuman.');
      toast.error(message);
    },
  });

  if (!isSuperadmin) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Akses khusus superadmin.</p>
            <p className="text-xs mt-1">
              Pengiriman pengumuman massal hanya dapat dilakukan oleh superadmin karena
              memengaruhi semua user pada skala fakultas atau lembaga.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (targetKind !== 'fakultas' || !!targetFakultasId) &&
    (targetKind !== 'user_ids' || userIdsRaw.trim().length > 0) &&
    confirmed &&
    !broadcast.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/admin/dashboard" label="Kembali ke Dashboard" />
      <PageHeader
        title="Kirim Pengumuman"
        subtitle="Broadcast ke in-app, email (bila diizinkan), dan push notification mobile"
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Hormati preferensi user.</p>
          <p className="mt-0.5">
            Notifikasi dikirim per-channel berdasarkan preferensi masing-masing user
            (<code>/profil</code>). User yang menonaktifkan email tidak akan menerima email meski channel
            dicentang. Superadmin tidak dapat override preferensi ini.
          </p>
        </div>
      </div>

      {/* Content form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Megaphone size={15} className="text-cyan-600" /> Konten Pengumuman
          </h3>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Judul *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="Contoh: Pengingat batas akhir pendaftaran KKN 56"
              className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
            />
            <span className="text-[10px] text-slate-400 block mt-1">{title.length}/150</span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Pesan *</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Isi pesan pengumuman — bisa multi-baris."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <span className="text-[10px] text-slate-400 block mt-1">{message.length}/500</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-1">Prioritas</span>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map(({ value, label, Icon, cls }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                      priority === value
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={14} className={cls} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">URL Aksi (opsional)</span>
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="/mahasiswa/pendaftaran"
                className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                URL internal SIBERMAS. Klik notifikasi → navigate ke URL ini.
              </span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 shadow-sm space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Bell size={13} /> Preview
          </h3>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow">
            <div className="flex items-start gap-3">
              <PriorityIconInline priority={priority} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{title || 'Judul pengumuman'}</p>
                <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">
                  {message || 'Pesan pengumuman akan muncul di sini.'}
                </p>
                {action && (
                  <p className="mt-2 text-[10px] font-mono text-cyan-700 truncate">→ {action}</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Tampilan sebenarnya menyesuaikan tema masing-masing user.
          </p>
        </div>
      </div>

      {/* Target */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Users size={15} className="text-cyan-600" /> Target Penerima
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { k: 'all',       label: 'Semua user aktif' },
            { k: 'role',      label: 'Per role' },
            { k: 'fakultas',  label: 'Per fakultas' },
            { k: 'user_ids',  label: 'User ID spesifik' },
          ].map(({ k, label }) => (
            <button
              key={k}
              type="button"
              onClick={() => setTargetKind(k as TargetKind)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                targetKind === k
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {targetKind === 'role' && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Pilih role</span>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {targetKind === 'fakultas' && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Pilih fakultas</span>
            <select
              value={targetFakultasId}
              onChange={(e) => setTargetFakultasId(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">— pilih fakultas —</option>
              {(fakultasList ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nama || f.short_name || `Fakultas #${f.id}`}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 block mt-1">
              Mahasiswa dan dosen di fakultas ini akan menerima pengumuman.
            </span>
          </label>
        )}

        {targetKind === 'user_ids' && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">User ID (pisah koma atau baris)</span>
            <textarea
              value={userIdsRaw}
              onChange={(e) => setUserIdsRaw(e.target.value)}
              rows={3}
              placeholder="1001, 1002, 1003&#10;1020"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
            />
          </label>
        )}
      </div>

      {/* Confirm + submit */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            Saya memahami bahwa pengumuman akan terkirim segera dan tidak dapat dibatalkan.
            {' '}Tindakan ini akan dicatat di audit log.
          </span>
        </label>

        <button
          onClick={() => broadcast.mutate()}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} className={broadcast.isPending ? 'animate-pulse' : ''} />
          {broadcast.isPending ? 'Mengirim…' : 'Kirim Pengumuman'}
        </button>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-bold">Terkirim ✓</p>
          <p className="mt-1 text-xs">
            Target: <code className="bg-white px-1.5 py-0.5 rounded">{lastResult.target}</code>
            {' '}· {lastResult.total_sent} dari {lastResult.total_matched} penerima berhasil menerima.
          </p>
        </div>
      )}
    </div>
  );
}

function PriorityIconInline({ priority }: { priority: Priority }): React.JSX.Element {
  const meta = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[0];
  const Icon = meta.Icon;
  return <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.cls}`} />;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const msg = resp?.data?.error?.message;
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
