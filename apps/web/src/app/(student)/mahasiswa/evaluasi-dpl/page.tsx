'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { studentApi } from '@/lib/api';
import { Star, MessageSquare, Send, CheckCircle2, UserCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS, FIELD_CLASS } from '@/lib/theme-config';

type Aspect = { id: string; label: string; description: string };

export default function DplEvaluationPage(): React.JSX.Element {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { surfaceClass } = useTheme();
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: formData, isLoading } = useQuery({
    queryKey: ['student', 'dpl-evaluation', 'form'],
    queryFn: async () => {
      const res = await studentApi.dplEvaluation.form();
      return res as unknown as Record<string, unknown>;
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => studentApi.dplEvaluation.store(payload),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Evaluasi berhasil dikirim!');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal mengirim evaluasi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aspects = (formData?.aspects as Aspect[]) || [];
    const missing = aspects.filter((a: Aspect) => !ratings[a.id]);
    
    if (missing.length > 0) {
      toast.error('Harap isi semua aspek penilaian');
      return;
    }

    mutation.mutate({
      ratings: Object.entries(ratings).map(([aspect, score]) => ({ aspect, score })),
      comment,
    });
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-[color:var(--profile-muted)] font-black uppercase tracking-widest">Memuat Form Evaluasi...</div>;

  const aspects = (formData?.aspects as Aspect[]) || [
    { id: 'komunikasi', label: 'Komunikasi', description: 'Kemudahan dalam berkonsultasi dan berkomunikasi dengan DPL.' },
    { id: 'bimbingan', label: 'Bimbingan Teknik', description: 'Kualitas bimbingan dalam penyusunan program kerja dan laporan.' },
    { id: 'kehadiran', label: 'Kehadiran di Lokasi', description: 'Frekuensi dan kualitas kunjungan DPL ke lokasi KKN.' },
    { id: 'responsivitas', label: 'Responsivitas', description: 'Kecepatan DPL dalam menanggapi kendala mahasiswa di lapangan.' },
  ];

  if (submitted || formData?.already_submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
          <div className="h-24 w-24 bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-[color:var(--profile-text)] uppercase tracking-tight">Evaluasi Terkirim</h1>
            <p className="text-[color:var(--profile-muted)] font-medium">Terima kasih telah memberikan masukan untuk peningkatan kualitas bimbingan KKN.</p>
          </div>
          <Link href="/mahasiswa" className={`inline-flex px-8 py-3 rounded-xl font-bold text-sm text-white ${PRIMARY_CLASS}`}>
            Kembali ke Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header 
        className={`${surfaceClass} flex items-center gap-6 p-6 border border-[color:var(--profile-border)] shadow-sm`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${SOFT_CLASS}`}>
          <UserCircle size={36} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[color:var(--profile-text)] uppercase tracking-tight">Evaluasi Kinerja DPL</h1>
          <p className="text-sm text-[color:var(--profile-muted)] font-medium">Berikan penilaian jujur Anda terhadap Dosen Pembimbing Lapangan.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {aspects.map((aspect: Aspect, idx: number) => (
            <motion.div 
              key={aspect.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${surfaceClass} p-6 border border-[color:var(--profile-border)] shadow-sm hover:shadow-md transition-shadow group`}
              style={{ borderRadius: 'var(--profile-radius)' }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-black text-[color:var(--profile-text)] uppercase tracking-wide flex items-center gap-2">
                    <span className="text-[color:var(--profile-primary)] text-xs">0{idx + 1}</span> {aspect.label}
                  </h3>
                  <p className="text-xs text-[color:var(--profile-muted)] leading-relaxed max-w-md font-medium">{aspect.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded-2xl border ${SOFT_CLASS}`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings(prev => ({ ...prev, [aspect.id]: star }))}
                      className={`p-2 rounded-xl transition-all ${
                        (ratings[aspect.id] || 0) >= star 
                          ? 'text-amber-400 dark:text-amber-300 scale-110' 
                          : 'text-[color:var(--profile-muted)] opacity-55 hover:opacity-100'
                      }`}
                      title={`Beri nilai ${star} bintang`}
                      aria-label={`Beri nilai ${star} bintang`}
                    >
                      <Star size={24} fill={(ratings[aspect.id] || 0) >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div 
          className={`${surfaceClass} p-8 border border-[color:var(--profile-border)] shadow-sm space-y-4`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <label className="flex items-center gap-2 text-[10px] font-black text-[color:var(--profile-primary)] uppercase tracking-widest ml-1">
            <MessageSquare size={14} /> Kritik & Saran Tambahan
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Tuliskan masukan konstruktif untuk DPL Anda..."
            className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none border ${FIELD_CLASS}`}
          />
        </div>

        <button 
          type="submit" 
          disabled={mutation.isPending}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${PRIMARY_CLASS}`}
        >
          {mutation.isPending ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengirim...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              Kirim Evaluasi <Send size={18} />
            </div>
          )}
        </button>
      </form>

      <footer className="bg-[color:var(--profile-warning)] rounded-2xl p-6 border border-[color:var(--profile-border)]">
        <div className="flex gap-4">
          <AlertCircle className="text-[color:var(--profile-warning-text)] shrink-0" size={20} />
          <p className="text-xs text-[color:var(--profile-warning-text)] font-bold leading-relaxed">
            Identitas Anda bersifat anonim. Penilaian ini hanya akan ditampilkan kepada LPPM dalam bentuk agregat untuk kepentingan evaluasi kinerja DPL, tanpa menyebutkan nama mahasiswa.
          </p>
        </div>
      </footer>
    </div>
  );
}
