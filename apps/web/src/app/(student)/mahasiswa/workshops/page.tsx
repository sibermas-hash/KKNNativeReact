'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Award, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/ui/shared';

export default function WorkshopsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'workshops'],
    queryFn: async () => {
      const res = await api.get('/student/workshops');
      return (res as { data?: { workshops?: unknown[]; has_certificates?: boolean } }).data ?? {};
    },
  });

  const workshops = (data as { workshops?: Record<string, unknown>[] })?.workshops ?? [];
  const hasCertificates = (data as { has_certificates?: boolean })?.has_certificates ?? false;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Workshop & Pembekalan</h1>
            <p className="text-sm text-slate-400">Jadwal dan sertifikat workshop KKN</p>
          </div>
        </div>

        {/* Sertifikat link */}
        <Link
          href="/mahasiswa/workshops/sertifikat"
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 active:scale-[0.98]"
        >
          <Award size={16} /> Sertifikat Saya
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : workshops.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Belum Ada Workshop"
          description="Workshop yang tersedia akan muncul di sini"
          action={
            <Link href="/mahasiswa/workshops/sertifikat" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-colors">
              <Award size={14} /> Lihat Sertifikat
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {workshops.map((w) => (
            <div key={String(w.id)} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                      {String(w.title ?? '-')}
                    </p>
                    {!!w.participant_status && (
                      <StatusBadge status={String(w.participant_status)} />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {String(w.workshop_date ?? '-')}
                    </span>
                    {!!w.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {String(w.location)}
                      </span>
                    )}
                    {!!w.speaker && <span>Pembicara: {String(w.speaker)}</span>}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom sertifikat banner */}
      {hasCertificates && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-900">Anda memiliki sertifikat workshop</p>
              <p className="text-xs text-amber-600">Unduh sertifikat kehadiran Anda</p>
            </div>
          </div>
          <Link
            href="/mahasiswa/workshops/sertifikat"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-colors"
          >
            Lihat Sertifikat <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
