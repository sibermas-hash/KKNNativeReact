'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Download, Calendar, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui/shared';

interface Certificate {
  id: number;
  workshop_name: string;
  workshop_date: string;
  certificate_issued_at: string;
  certificate_url: string | null;
}

export default function WorkshopSertifikatPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'workshop-certificates'],
    queryFn: async () => {
      const res = await api.get('/student/workshops/my-certificates');
      return (res as { data?: Certificate[] }).data ?? [];
    },
  });

  const certificates = data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/mahasiswa/workshops" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Award size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Sertifikat Workshop</h1>
            <p className="text-xs text-slate-400">Daftar sertifikat workshop yang telah Anda ikuti</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={48} />}
          title="Belum Ada Sertifikat"
          description="Sertifikat akan muncul setelah kehadiran workshop diverifikasi"
        />
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cert.certificate_url ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                    {cert.certificate_url ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{cert.workshop_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} /> {cert.workshop_date}
                      </span>
                      {cert.certificate_issued_at && (
                        <span className="text-xs text-emerald-600 font-bold">
                          Diterbitkan: {cert.certificate_issued_at}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {cert.certificate_url ? (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-colors shrink-0 shadow-lg shadow-amber-200"
                  >
                    <Download size={12} /> Unduh
                  </a>
                ) : (
                  <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-black shrink-0">
                    Belum Tersedia
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
