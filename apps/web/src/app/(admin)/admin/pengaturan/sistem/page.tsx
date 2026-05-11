'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function SystemSettingsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Pengaturan berhasil diperbarui');
    },
  });

  const settings = data?.settings || {};
  const entries = Object.entries(settings).slice(0, 20);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Pengaturan Sistem" subtitle="Konfigurasi umum sistem KKN" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : entries.length === 0 ? (
        <EmptyState icon={<Settings size={40} />} title="Belum ada pengaturan" description="Tidak ada konfigurasi sistem yang tersedia." />
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-700 uppercase tracking-wide">Pengaturan Umum</h2>
          <div className="space-y-0">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
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
