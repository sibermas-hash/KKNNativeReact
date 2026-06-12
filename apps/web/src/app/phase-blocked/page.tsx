'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Clock, CheckCircle2, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PHASE_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  upcoming: { label: 'Pra-Pendaftaran', icon: Clock, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  registration: { label: 'Masa Pendaftaran', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  placement: { label: 'Seleksi & Plotting', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  execution: { label: 'Pelaksanaan KKN', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  grading: { label: 'Masa Penilaian', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  finished: { label: 'KKN Selesai', icon: Lock, color: 'text-slate-400 bg-slate-50 border-slate-200' },
  inactive: { label: 'Tidak Aktif', icon: Lock, color: 'text-slate-400 bg-slate-50 border-slate-200' },
};

function PhaseBlockedContent() {
  const params = useSearchParams();
  const message = params?.get('message') ?? 'Fitur ini belum tersedia pada fase KKN saat ini.';
  const currentPhase = params?.get('phase') ?? 'inactive';

  const info = PHASE_INFO[currentPhase] ?? PHASE_INFO.inactive;
  const PhaseIcon = info.icon;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8 p-8 rounded-3xl border border-slate-100 shadow-xl bg-white">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 mx-auto">
          <ShieldAlert size={42} className="text-teal-600" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fitur Belum Tersedia</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border font-bold tracking-tight ${info.color}`}>
          <PhaseIcon size={18} />
          <span className="text-sm uppercase tracking-wider">{info.label}</span>
        </div>

        <Link
          href="/mahasiswa"
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PhaseBlockedPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}>
      <PhaseBlockedContent />
    </Suspense>
  );
}
