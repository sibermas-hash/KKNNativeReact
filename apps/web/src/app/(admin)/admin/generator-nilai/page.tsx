'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';

export default function GradeGeneratorPage(): React.JSX.Element {
  const { data: _data, isLoading: _isLoading } = useQuery({
    queryKey: ['admin', 'grade-generator'],
    queryFn: async () => {
      return await api.get('/admin/generator-nilai');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generator Nilai"
        subtitle="Generate dan kelola nilai KKN berdasarkan komponen penilaian."
      />
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Gunakan endpoint API untuk generate nilai secara massal.</p>
      </div>
    </div>
  );
}
