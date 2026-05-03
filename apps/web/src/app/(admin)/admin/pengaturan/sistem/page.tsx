'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SystemSettingsPage() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => { const res = await endpoints.settings.index(); return (res.data as { success: boolean; data: { settings: Record<string, string> } }).data; },
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, string>) => endpoints.settings.update({ settings }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }); toast.success('Pengaturan berhasil diperbarui'); },
  });

  const settings = data?.settings || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Pengaturan Umum</h2>
          <div className="space-y-4">
            {Object.entries(settings).slice(0, 20).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-3">
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
