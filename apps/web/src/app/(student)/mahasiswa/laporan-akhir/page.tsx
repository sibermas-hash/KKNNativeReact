'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api, studentApi } from '@/lib/api';
import { FileText, CloudUpload, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FinalReportPage() {
  
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['student', 'final-report'],
    queryFn: async () => {
      const res = await studentApi.finalReport.index() as any;
      return (res as any).data ?? res;
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => studentApi.finalReport.store(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'final-report'] });
      toast.success('Laporan akhir berhasil diunggah!');
      setFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Gagal mengunggah laporan');
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="h-32 bg-slate-100 animate-pulse rounded-3xl" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
      </div>
    );
  }

  const report = reportData?.report;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-emerald-950 tracking-tight uppercase">Laporan Akhir KKN</h1>
        <p className="text-slate-500 font-medium">Unggah dokumen laporan akhir sebagai syarat yudisium KKN.</p>
      </header>

      {report ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-sm space-y-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Laporan Telah Terunggah</h3>
                <p className="text-sm text-slate-500">Diunggah pada {new Date(report.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              report.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
              report.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {report.status_label || report.status}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-slate-400" size={20} />
              <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{report.file_name}</span>
            </div>
            <a 
              href={report.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
            >
              Lihat File <ExternalLink size={14} />
            </a>
          </div>

          {report.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Catatan DPL:</p>
              <p className="text-sm text-amber-900 font-medium">{report.notes}</p>
            </div>
          )}

          {report.status === 'rejected' && (
            <button 
              onClick={() => queryClient.setQueryData(['student', 'final-report'], { ...reportData, report: null })}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200"
            >
              Unggah Ulang Laporan
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-10 border-2 border-dashed border-slate-200 hover:border-emerald-200 transition-colors"
        >
          <form onSubmit={handleUpload} className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400">
              <CloudUpload size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-emerald-950">Pilih File Laporan</h3>
              <p className="text-sm text-slate-400">Format PDF, Maksimal 10MB</p>
            </div>

            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                {file ? 'Ganti File' : 'Cari File PDF'}
              </div>
            </label>

            {file && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100"
              >
                <FileText className="text-emerald-600" size={16} />
                <span className="text-xs font-bold text-emerald-700">{file.name}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={!file || mutation.isPending}
              className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
            >
              {mutation.isPending ? 'Mengunggah...' : 'Unggah Sekarang'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Info Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 flex gap-4">
          <Clock className="text-sky-600 shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-sky-700 uppercase tracking-widest mb-1">Batas Waktu</p>
            <p className="text-sm font-bold text-sky-900">7 Hari setelah penarikan KKN</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex gap-4">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Verifikasi</p>
            <p className="text-sm font-bold text-emerald-900">Laporan akan diverifikasi oleh DPL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
