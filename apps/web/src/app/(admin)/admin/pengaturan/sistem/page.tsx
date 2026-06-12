'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Bell, MessageCircle, Settings, ShieldCheck } from 'lucide-react';
import { BackButton, EmptyState, PageHeader } from '@/components/ui/shared';

export default function SystemSettingsPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminApi.settings.index();
      return res as unknown as Record<string, unknown>;
    },
  });

  const settings = (data?.settings as Record<string, unknown> | undefined) ?? {};
  const entries = Object.entries(settings).slice(0, 20);
  const hubs = [
    {
      title: 'WAHA / WhatsApp Gateway',
      description: 'Atur URL WAHA, session, API key, rate limit, dan test kirim WhatsApp.',
      href: '/admin/pengaturan/notifikasi#wa-gateway',
      icon: MessageCircle,
      badge: 'Integrasi',
    },
    {
      title: 'Notifikasi Sistem',
      description: 'Default kanal in-app, email, push, dan WhatsApp untuk seluruh pengguna.',
      href: '/admin/pengaturan/notifikasi',
      icon: Bell,
      badge: 'Notifikasi',
    },
    {
      title: 'Keamanan & Operasional',
      description: 'Ringkasan konfigurasi global dan status pengaturan inti SIBERMAS.',
      href: '#pengaturan-umum',
      icon: ShieldCheck,
      badge: 'Sistem',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton href="/admin/dashboard" label="Kembali ke Dashboard" />
      <PageHeader title="Pusat Administrasi Sistem" subtitle="Kelola konfigurasi global, keamanan, integrasi, dan status operasional SIBERMAS." />

      <div className="grid gap-4 md:grid-cols-3">
        {hubs.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-100">
                  <Icon size={24} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {item.badge}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-800">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Settings size={40} />}
          title="Belum ada pengaturan"
          description="Tidak ada konfigurasi sistem yang tersedia."
        />
      ) : (
        <div id="pengaturan-umum" className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-700 uppercase tracking-wide">
            Pengaturan Umum
          </h2>
          <div className="space-y-0">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{key}</p>
                  <p className="text-xs text-slate-500">{String(value || '-')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
