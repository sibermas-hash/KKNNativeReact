'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CertificateConfigPage() {
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'certificate-config'],
    queryFn: async () => {
      const res = await api.get('/admin/pengaturan/sertifikat');
      return res;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Konfigurasi Sertifikat</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Template Sertifikat</h2>
          <p className="text-sm text-slate-500">Konfigurasi template dan format sertifikat KKN.</p>
          {data?.config && (
            <div className="mt-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Template:</span> {String(data.config.template_path || 'Default')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
