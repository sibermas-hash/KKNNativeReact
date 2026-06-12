'use client';
 
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeaveRequestSchema, type CreateLeaveRequestFormData } from '@sibermas/schemas';
import { ChevronLeft, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, FIELD_CLASS } from '@/lib/theme-config';

export default function CreateIzinPage(): React.JSX.Element {
  const router = useRouter();
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLeaveRequestFormData>({ resolver: zodResolver(createLeaveRequestSchema) });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => studentApi.leaveRequests.store(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'leave-requests'] }); toast.success('Pengajuan izin berhasil'); router.push('/mahasiswa/izin'); },
    onError: () => toast.error('Gagal mengajukan izin'),
  });

  const onSubmit = (data: CreateLeaveRequestFormData) => {
    const formData = new FormData();
    // Map FE field names to backend expected names
    formData.append('tanggal_mulai', data.start_date);
    formData.append('tanggal_kembali', data.end_date);
    formData.append('alasan', data.reason);
    if (data.type) formData.append('jenis', data.type);
    if (file) formData.append('file_bukti', file);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm font-bold text-[color:var(--profile-muted)] hover:text-[color:var(--profile-accent)] mb-6"
      >
        <ChevronLeft size={16} /> Kembali
      </button>
      <div 
        className={`${surfaceClass} border border-[color:var(--profile-border)] p-8 ${themeConfig.shadow}`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-[color:var(--profile-primary)] rounded-xl flex items-center justify-center text-white">
            <Plane size={24} />
          </div>
          <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Ajukan Izin</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">Jenis Izin</label>
            <select 
              {...register('type')} 
              className={`w-full h-12 rounded-xl px-4 text-sm font-bold mt-2 border ${FIELD_CLASS}`}
            >
              <option value="">Pilih jenis izin</option>
              <option value="sakit">Sakit</option>
              <option value="izin">Izin</option>
              <option value="keperluan_mendesak">Keperluan Mendesak</option>
            </select>
            {errors.type && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">Alasan</label>
            <textarea 
              {...register('reason')} 
              rows={4} 
              placeholder="Jelaskan alasan izin..." 
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold mt-2 border ${FIELD_CLASS}`} 
            />
            {errors.reason && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.reason.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">Mulai</label>
              <input 
                {...register('start_date')} 
                type="date" 
                className={`w-full h-12 rounded-xl px-4 text-sm font-bold mt-2 border ${FIELD_CLASS}`} 
              />
              {errors.start_date && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">Selesai</label>
              <input 
                {...register('end_date')} 
                type="date" 
                className={`w-full h-12 rounded-xl px-4 text-sm font-bold mt-2 border ${FIELD_CLASS}`} 
              />
              {errors.end_date && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.end_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">Bukti (opsional)</label>
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png" 
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f && f.size > 5 * 1024 * 1024) { toast.error('File maksimal 5MB'); e.target.value = ''; return; }
                setFile(f);
              }} 
              className={`w-full rounded-xl border px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:text-white file:px-3 file:py-1.5 file:text-xs file:font-bold cursor-pointer ${FIELD_CLASS.replace('bg-[color:var(--profile-input)]', 'bg-[color:var(--profile-input)] file:bg-[color:var(--profile-primary)]')}`}
            />
          </div>
          <button 
            type="submit" 
            disabled={mutation.isPending} 
            className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50 ${PRIMARY_CLASS}`}
          >
            {mutation.isPending ? 'Mengirim...' : 'Ajukan Izin'}
          </button>
        </form>
      </div>
    </div>
  );
}
