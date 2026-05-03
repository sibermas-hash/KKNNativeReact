'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeaveRequestSchema, type CreateLeaveRequestFormData } from '@sibermas/schemas';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function CreateIzinPage() {
  const router = useRouter();
  const endpoints = studentEndpoints(api);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLeaveRequestFormData>({
    resolver: zodResolver(createLeaveRequestSchema),
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => endpoints.leaveRequests.store(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'leave-requests'] }); toast.success('Pengajuan izin berhasil dikirim'); router.push('/mahasiswa/izin'); },
    onError: () => toast.error('Gagal mengajukan izin'),
  });

  const onSubmit = (data: CreateLeaveRequestFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined) formData.append(key, String(value)); });
    if (file) formData.append('file_bukti', file);
    mutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ajukan Izin</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Jenis Izin</label>
          <select {...register('type')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <option value="">Pilih jenis izin</option>
            <option value="sakit">Sakit</option>
            <option value="izin">Izin</option>
            <option value="keperluan_mendesak">Keperluan Mendesak</option>
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Alasan</label>
          <textarea {...register('reason')} rows={4} placeholder="Jelaskan alasan izin..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tanggal Mulai</label>
            <input {...register('start_date')} type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tanggal Selesai</label>
            <input {...register('end_date')} type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Bukti (opsional)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
          {mutation.isPending ? 'Mengirim...' : 'Ajukan Izin'}
        </button>
      </form>
    </div>
  );
}
