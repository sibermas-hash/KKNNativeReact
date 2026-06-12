'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Award } from 'lucide-react';
import { BackButton, PageHeader, EmptyState } from '@/components/ui/shared';

type CertificateConfig = {
  id?: number;
  config_key?: string;
  label?: string;
  value?: string | null;
  type?: string | null;
};

type CertificateConfigResponse = {
  configs?: CertificateConfig[];
};

export default function CertificateConfigPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'certificate-config'],
    queryFn: async () => {
      const res = await api.get('/admin/pengaturan/sertifikat');
      return res as unknown as CertificateConfigResponse;
    },
  });

  const configs = Array.isArray(data?.configs) ? data.configs : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton href="/admin/dashboard" label="Kembali ke Dashboard" />
      <PageHeader title="Konfigurasi Sertifikat" subtitle="Template dan format sertifikat KKN" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : configs.length === 0 ? (
        <EmptyState icon={<Award size={40} />} title="Belum ada konfigurasi" description="Konfigurasi template sertifikat belum tersedia." />
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-700 uppercase tracking-wide">Template Sertifikat</h2>
          <p className="text-sm text-slate-500 mb-4">Konfigurasi template dan format sertifikat KKN.</p>
          <div className="space-y-2">
            {configs.map((config) => (
              <div key={config.id ?? config.config_key} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
                <p className="text-sm font-medium text-slate-700">{config.label || config.config_key || 'Konfigurasi'}</p>
                <p className="text-right text-sm text-slate-500">{config.value || 'Default'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
