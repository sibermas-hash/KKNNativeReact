import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';

interface Workshop {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string | null;
  registered: number;
  max_participants: number | null;
  status: string;
  is_full: boolean;
  is_registered: boolean;
  attendance_status: string | null;
}

interface Eligibility {
  eligible: boolean;
  reason: string;
}

interface Props {
  workshops: Workshop[];
  dpl_eligibility?: Eligibility | null;
}

export default function StudentWorkshopIndex({ workshops = [], dpl_eligibility }: Props) {
  const handleRegister = (workshopId: number) => {
    router.post(route('dpl.workshops.register', workshopId));
  };

  return (
    <AppLayout title="Pendaftaran Workshop DPL">
      <Head title="Workshop DPL" />

      <div className="max-w-5xl mx-auto space-y-10 py-12 px-4">
        {/* WELCOME SECTION */}
        <div className="relative overflow-hidden rounded-[3rem] bg-emerald-950 p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-[#f3f4f6]0/30">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Pusat Pengembangan SDM</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">Workshop <span className="text-emerald-400 italic">DPL.</span></h1>
            <p className="max-w-2xl text-emerald-100/60 text-sm font-bold leading-relaxed uppercase tracking-wide">
              Pembekalan teknis bagi calon Dosen Pembimbing Lapangan untuk menjamin kualitas pengabdian masyarakat yang terukur dan berdampak.
            </p>
          </div>
        </div>

        {/* ELIGIBILITY CARD */}
        {dpl_eligibility && (
          <div className={clsx(
            "p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8 shadow-sm transition-all duration-500",
            dpl_eligibility.eligible 
              ? "bg-white border-gray-200" 
              : "bg-rose-50/50 border-rose-100"
          )}>
            <div className={clsx(
              "h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700",
              dpl_eligibility.eligible ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            )}>
              {dpl_eligibility.eligible ? <ShieldCheck size={40} strokeWidth={1.5} /> : <AlertCircle size={40} strokeWidth={1.5} />}
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className={clsx(
                "text-lg font-black uppercase tracking-tight",
                dpl_eligibility.eligible ? "text-gray-900" : "text-rose-900"
              )}>
                {dpl_eligibility.eligible ? 'Status Kelayakan: Memenuhi Syarat' : 'Belum Dapat Mendaftar'}
              </h3>
              <p className={clsx(
                "text-xs font-bold uppercase tracking-widest leading-relaxed",
                dpl_eligibility.eligible ? "text-emerald-600/60" : "text-rose-600/60"
              )}>
                {dpl_eligibility.reason}
              </p>
            </div>
            {dpl_eligibility.eligible && (
              <div className="px-6 py-2 bg-emerald-50 rounded-xl border border-gray-200 text-xs font-black text-emerald-600 uppercase tracking-widest animate-pulse">
                Terverifikasi
              </div>
            )}
          </div>
        )}

        {/* WORKSHOP LIST */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Jadwal Tersedia</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {workshops.length === 0 ? (
              <div className="py-20 bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-slate-300">
                <Calendar size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">Belum ada jadwal yang diterbitkan</p>
              </div>
            ) : (
              workshops.map((w) => (
                <div key={w.id} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                  {w.is_registered && (
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                      <CheckCircle2 size={120} />
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={clsx(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            w.is_registered ? "bg-emerald-50 text-emerald-600 border-gray-200" : "bg-gray-50 text-gray-500 border-gray-100"
                          )}>
                            {w.is_registered ? 'Terdaftar' : 'Tersedia'}
                          </span>
                          {w.is_full && !w.is_registered && (
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">Penuh</span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{w.title}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest line-clamp-1">{w.description || 'Tidak ada deskripsi tambahan.'}</p>
                      </div>

                      <div className="flex flex-wrap gap-x-8 gap-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#1a7a4a] transition-colors">
                            <Calendar size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal</span>
                            <span className="text-xs font-black text-gray-700 uppercase">{w.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#1a7a4a] transition-colors">
                            <Clock size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Waktu</span>
                            <span className="text-xs font-black text-gray-700 uppercase">{w.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#1a7a4a] transition-colors">
                            <MapPin size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lokasi</span>
                            <span className="text-xs font-black text-gray-700 uppercase truncate max-w-[200px]">{w.location || 'LPPM'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center md:items-end gap-4">
                      <div className="text-right hidden md:block">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Kapasitas</span>
                        <div className="text-xl font-black text-gray-900 tabular-nums">
                          {w.registered} <span className="text-xs text-slate-300">/ {w.max_participants || '∞'}</span>
                        </div>
                      </div>

                      {w.is_registered ? (
                        <div className="flex items-center gap-2 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-gray-200">
                          <CheckCircle2 size={18} strokeWidth={3} />
                          <span className="text-xs font-black uppercase tracking-widest">Sudah Terdaftar</span>
                        </div>
                      ) : (
                        <Button
                          disabled={!!w.is_full || !!(dpl_eligibility && !dpl_eligibility.eligible)}
                          onClick={() => handleRegister(w.id)}
                          className="h-14 px-10 rounded-2xl uppercase text-xs font-black tracking-widest shadow-xl shadow-emerald-600/20"
                          icon={<ArrowRight size={16} />}
                        >
                          Daftar Sekarang
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
