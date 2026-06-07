'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dosenApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/shared';
import { GraduationCap, Calendar, MapPin, Users, Award, Download } from 'lucide-react';

interface Workshop {
  id: number;
  title: string;
  description?: string;
  workshop_date: string;
  location?: string;
  max_participants?: number;
  is_active: boolean;
  participants_count?: number;
  is_registered?: boolean;
  participant_id?: number;
  is_passed?: boolean;
}

export default function DosenWorkshopsPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'available' | 'certificates'>('available');

  const { data: workshopsData, isLoading } = useQuery({
    queryKey: ['dosen', 'workshops'],
    queryFn: async () => {
      const res = await dosenApi.workshops.index();
      return ((res as unknown as { data?: Workshop[] })?.data ?? res) as Workshop[];
    },
  });

  const { data: certsData, isLoading: certsLoading } = useQuery({
    queryKey: ['dosen', 'workshops', 'certificates'],
    queryFn: async () => {
      const res = await dosenApi.workshops.myCertificates();
      return ((res as unknown as { data?: Workshop[] })?.data ?? res) as Workshop[];
    },
    enabled: tab === 'certificates',
  });

  const registerMut = useMutation({
    mutationFn: (workshopId: number) => dosenApi.workshops.register(workshopId),
    onSuccess: () => {
      toast.success('Berhasil mendaftar workshop');
      qc.invalidateQueries({ queryKey: ['dosen', 'workshops'] });
    },
    onError: () => toast.error('Gagal mendaftar workshop'),
  });

  const handleDownload = async (participantId: number, title: string) => {
    try {
      const res = await dosenApi.workshops.downloadCertificate(participantId);
      const blob = res instanceof Blob ? res : new Blob([res as unknown as BlobPart]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sertifikat-${title.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh sertifikat');
    }
  };

  const workshops = workshopsData ?? [];
  const certs = certsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Workshop & Pembekalan" subtitle="Daftar workshop dan sertifikat Anda" />

      <div className="flex gap-2 border-b border-[color:var(--profile-border)]">
        {(['available', 'certificates'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[color:var(--profile-primary)] text-[color:var(--profile-primary)]' : 'border-transparent text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)]'
            }`}
          >
            {t === 'available' ? 'Workshop Tersedia' : 'Sertifikat Saya'}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}</div>
        ) : workshops.length === 0 ? (
          <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-12 text-center">
            <GraduationCap size={32} className="text-[color:var(--profile-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[color:var(--profile-muted)]">Belum ada workshop tersedia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workshops.map((w) => (
              <div key={w.id} className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[color:var(--profile-text)]">{w.title}</p>
                  {w.description && <p className="text-xs text-[color:var(--profile-muted)] mt-0.5 line-clamp-2">{w.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[color:var(--profile-muted)]">
                    <span className="flex items-center gap-1"><Calendar size={12} />{w.workshop_date}</span>
                    {w.location && <span className="flex items-center gap-1"><MapPin size={12} />{w.location}</span>}
                    <span className="flex items-center gap-1"><Users size={12} />{w.participants_count ?? 0} peserta</span>
                  </div>
                </div>
                {w.is_registered ? (
                  <span className="shrink-0 rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)] text-xs font-black px-3 py-1 uppercase tracking-wider">
                    Terdaftar
                  </span>
                ) : (
                  <button
                    onClick={() => registerMut.mutate(w.id)}
                    disabled={registerMut.isPending || !w.is_active}
                    className="shrink-0 rounded-xl bg-[color:var(--profile-primary)] text-white text-xs font-bold px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    Daftar
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'certificates' && (
        certsLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}</div>
        ) : certs.length === 0 ? (
          <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-12 text-center">
            <Award size={32} className="text-[color:var(--profile-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[color:var(--profile-muted)]">Belum ada sertifikat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c) => (
              <div key={c.id} className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[color:var(--profile-text)]">{c.title}</p>
                  <p className="text-xs text-[color:var(--profile-muted)] mt-0.5">{c.workshop_date}</p>
                  {c.is_passed && (
                    <span className="inline-block mt-1 rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)] text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                      Lulus
                    </span>
                  )}
                </div>
                {c.participant_id && (
                  <button
                    onClick={() => handleDownload(c.participant_id!, c.title)}
                    className="flex items-center gap-1.5 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-3 py-2 text-xs font-bold hover:bg-[color:var(--profile-soft)] transition-colors"
                  >
                    <Download size={14} /> Unduh
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
