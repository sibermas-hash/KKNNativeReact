'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GradeGeneratorPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'grade-generator'],
    queryFn: async () => {
      const res = await api.get('/admin/generator-nilai');
      return (res as unknown as { success: boolean; data: unknown }).data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Generator Nilai</h1>
      <p className="text-sm text-slate-500">Generate dan kelola nilai KKN berdasarkan komponen penilaian.</p>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-slate-500">Gunakan endpoint API untuk generate nilai secara massal.</p>
      </div>
    </div>
  );
}
