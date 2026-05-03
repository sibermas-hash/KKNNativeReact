'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AdminHub() {
  const endpoints = adminEndpoints(api);
  const { data } = useQuery({
    queryKey: ['admin', 'hub'],
    queryFn: async () => { const res = await endpoints.hub(); return (res.data as { success: boolean; data: Record<string, unknown> }).data; },
  });

  const sections = [
    { title: 'Master Data', items: [{ href: '/admin/periode', label: 'Periode KKN' }, { href: '/admin/tahun-akademik', label: 'Tahun Akademik' }, { href: '/admin/jenis-kkn', label: 'Jenis KKN' }, { href: '/admin/fakultas', label: 'Fakultas' }, { href: '/admin/lokasi', label: 'Lokasi' }] },
    { title: 'Operasional', items: [{ href: '/admin/pendaftaran', label: 'Pendaftaran' }, { href: '/admin/kelompok', label: 'Kelompok' }, { href: '/admin/dosen/penugasan', label: 'DPL Assignment' }] },
    { title: 'Akademik', items: [{ href: '/admin/nilai', label: 'Nilai' }, { href: '/admin/yudisium', label: 'Yudisium' }, { href: '/admin/laporan/harian', label: 'Laporan Harian' }] },
    { title: 'Sistem', items: [{ href: '/admin/pengguna', label: 'Pengguna' }, { href: '/admin/pengaturan/sistem', label: 'Pengaturan' }, { href: '/admin/audit-log', label: 'Audit Log' }] },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Hub</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-700">{s.title}</h2>
            <div className="space-y-2">
              {s.items.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">{item.label} →</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
