'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeaveRequestSchema, type CreateLeaveRequestFormData } from '@sibermas/schemas';
import { ChevronLeft, Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function CreateIzinPage() {
  const router = useRouter();
  const endpoints = studentEndpoints(api);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLeaveRequestFormData>({ resolver: zodResolver(createLeaveRequestSchema) });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => endpoints.leaveRequests.store(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'leave-requests'] }); toast.success('Pengajuan izin berhasil'); router.push('/mahasiswa/izin'); },
    onError: () => toast.error('Gagal mengajukan izin'),
  });

  const onSubmit = (data: CreateLeaveRequestFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined) formData.append(key, String(value)); });
    if (file) formData.append('file_bukti', file);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 mb-6"><ChevronLeft size={16} /> Kembali</button>
      <div className="bg-white rounded-[2rem] p-8 border border-amber-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-amber-600 rounded-xl flex items-center justify-center text-white"><Plane size={24} /></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Ajukan Izin</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Jenis Izin</label>
            <select {...register('type')} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2">
              <option value="">Pilih jenis izin</option><option value="sakit">Sakit</option><option value="izin">Izin</option><option value="keperluan_mendesak">Keperluan Mendesak</option>
            </select>
            {errors.type && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Alasan</label>
            <textarea {...register('reason')} rows={4} placeholder="Jelaskan alasan izin..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-2" />
            {errors.reason && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.reason.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Mulai</label><input {...register('start_date')} type="date" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" />{errors.start_date && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.start_date.message}</p>}</div>
            <div><label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Selesai</label><input {...register('end_date')} type="date" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold mt-2" />{errors.end_date && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.end_date.message}</p>}</div>
          </div>
          <div>
            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Bukti (opsional)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm mt-2 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-amber-700" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50">
            {mutation.isPending ? 'Mengirim...' : 'Ajukan Izin'}
          </button>
        </form>
      </div>
    </div>
  );
}
