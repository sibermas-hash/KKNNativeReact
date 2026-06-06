'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl, studentApi } from '@/lib/api';
import { FileText, CloudUpload, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS, FIELD_CLASS } from '@/lib/theme-config';

export default function FinalReportPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { config: themeConfig, surfaceClass } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['student', 'final-report'],
    queryFn: async () => {
      const res = await studentApi.finalReport.index();
      return res as unknown as Record<string, unknown>;
    },
    retry: false,
  });

  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  const mutation = useMutation({
    mutationFn: (formData: FormData) => studentApi.finalReport.store(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'final-report'] });
      toast.success('Laporan akhir berhasil diunggah!');
      setFile(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal mengunggah laporan');
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('file', file);
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="h-32 bg-slate-100/10 animate-pulse rounded-3xl" />
        <div className="h-64 bg-slate-100/10 animate-pulse rounded-3xl" />
      </div>
    );
  }

  const report = reportData?.report as Record<string, unknown> | undefined;
  const isLeader = Boolean((reportData as { is_leader?: boolean } | undefined)?.is_leader);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Laporan Akhir KKN</h1>
        <p className="text-[color:var(--profile-muted)] font-medium">Unggah dokumen laporan akhir sebagai syarat yudisium KKN.</p>
      </header>

      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-[color:var(--profile-warning-text)] mx-auto" />
          <h2 className="text-lg font-black text-[color:var(--profile-warning-text)]">Belum Bisa Mengunggah</h2>
          <p className="text-sm text-[color:var(--profile-warning-text)] opacity-90">{phaseMessage ?? 'Pengunggahan laporan akhir hanya tersedia saat masa penilaian KKN.'}</p>
        </div>
      )}

      {!isPhaseBlocked && report ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 border border-[color:var(--profile-border)] space-y-6 ${themeConfig.shadow} ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-[color:var(--profile-soft)] rounded-2xl flex items-center justify-center text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[color:var(--profile-text)]">Laporan Telah Terunggah</h3>
                <p className="text-sm text-[color:var(--profile-muted)] font-medium">Diunggah pada {new Date(report.created_at as string).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              report.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 
              report.status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
            }`}>
              {String(report.status_label || report.status || '')}
            </div>
          </div>

          <div className="bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-[color:var(--profile-muted)]" size={20} />
              <span className="text-sm font-bold text-[color:var(--profile-text)] truncate max-w-[200px]">{String(report.file_name || '')}</span>
            </div>
            <a 
              href={String(report.file_url || '') || apiUrl(`/student/final-report/${report.id}/preview`)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-black text-[color:var(--profile-soft-text)] hover:opacity-85 uppercase tracking-widest"
            >
              Lihat File <ExternalLink size={14} />
            </a>
          </div>

          {!!report.notes && (
            <div className="bg-[color:var(--profile-warning)] border border-[color:var(--profile-border)] rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-black text-[color:var(--profile-warning-text)] uppercase tracking-widest">Catatan DPL:</p>
              <p className="text-sm text-[color:var(--profile-warning-text)] font-medium opacity-90">{String(report.notes || '')}</p>
            </div>
          )}

          {report.status === 'rejected' && isLeader && (
            <button 
              onClick={() => queryClient.setQueryData(['student', 'final-report'], { ...reportData, report: null })}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${PRIMARY_CLASS}`}
            >
              Unggah Ulang Laporan
            </button>
          )}
          {report.status === 'rejected' && !isLeader && (
            <div className="bg-[color:var(--profile-warning)] border border-[color:var(--profile-border)] rounded-2xl p-4">
              <p className="text-sm font-bold text-[color:var(--profile-warning-text)]">Laporan perlu direvisi. Hubungi ketua kelompok untuk mengunggah ulang.</p>
            </div>
          )}
        </motion.div>
      ) : !isLeader ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[color:var(--profile-warning)] rounded-[2rem] p-10 border-2 border-dashed border-[color:var(--profile-border)] text-center space-y-4"
        >
          <div className="mx-auto h-20 w-20 bg-[color:var(--profile-soft)] rounded-3xl flex items-center justify-center text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[color:var(--profile-warning-text)]">Hanya Ketua Kelompok</h3>
            <p className="text-sm text-[color:var(--profile-warning-text)] font-medium max-w-md mx-auto opacity-90">
              Unggah laporan akhir diperuntukkan bagi ketua kelompok. Silakan koordinasikan dokumen bersama anggota kelompok
              dan serahkan kepada ketua untuk diunggah.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-10 border-2 border-dashed border-[color:var(--profile-border)] hover:border-[color:var(--profile-primary)] transition-colors ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <form onSubmit={handleUpload} className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded-3xl flex items-center justify-center text-[color:var(--profile-soft-text)]">
              <CloudUpload size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[color:var(--profile-text)]">Pilih File Laporan</h3>
              <p className="text-sm text-[color:var(--profile-muted)]">Format PDF/DOC/DOCX, Maksimal 20MB</p>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul laporan akhir"
              className={`w-full max-w-md rounded-xl px-4 py-3 text-sm font-bold border outline-none ${FIELD_CLASS}`}
              required
            />

            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.size > 20 * 1024 * 1024) { toast.error('File maksimal 20MB'); e.target.value = ''; return; }
                  setFile(f);
                }}
              />
              <div className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${SOFT_CLASS}`}>
                {file ? 'Ganti File' : 'Cari File PDF'}
              </div>
            </label>

            {file && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-[color:var(--profile-soft)] px-4 py-2 rounded-lg border border-[color:var(--profile-border)]"
              >
                <FileText className="text-[color:var(--profile-soft-text)]" size={16} />
                <span className="text-xs font-bold text-[color:var(--profile-soft-text)]">{file.name}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={!file || !title.trim() || mutation.isPending}
              className={`w-full max-w-xs py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${PRIMARY_CLASS}`}
            >
              {mutation.isPending ? 'Mengunggah...' : 'Unggah Sekarang'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Info Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[color:var(--profile-soft)] rounded-2xl p-6 border border-[color:var(--profile-border)] flex gap-4">
          <Clock className="text-[color:var(--profile-primary)] shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-[color:var(--profile-soft-text)] uppercase tracking-widest mb-1">Batas Waktu</p>
            <p className="text-sm font-bold text-[color:var(--profile-text)]">7 Hari setelah penarikan KKN</p>
          </div>
        </div>
        <div className="bg-[color:var(--profile-soft)] rounded-2xl p-6 border border-[color:var(--profile-border)] flex gap-4">
          <CheckCircle2 className="text-[color:var(--profile-primary)] shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-[color:var(--profile-soft-text)] uppercase tracking-widest mb-1">Verifikasi</p>
            <p className="text-sm font-bold text-[color:var(--profile-text)]">Laporan akan diverifikasi oleh DPL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
