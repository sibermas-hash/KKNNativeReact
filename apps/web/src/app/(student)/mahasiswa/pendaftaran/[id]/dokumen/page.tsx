'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function UploadDokumenPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post(`/student/registration/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res;
    },
    onSuccess: () => { toast.success('Dokumen berhasil diunggah'); router.push('/mahasiswa/cek-pendaftaran'); },
    onError: () => toast.error('Gagal mengunggah dokumen'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });
    mutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Upload Dokumen Persyaratan</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Surat Keterangan Sehat</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles({ ...files, health_certificate: e.target.files?.[0] || null })} className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Izin Orang Tua</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles({ ...files, parent_permission: e.target.files?.[0] || null })} className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {mutation.isPending ? 'Mengunggah...' : 'Kirim Dokumen'}
        </button>
      </form>
    </div>
  );
}
