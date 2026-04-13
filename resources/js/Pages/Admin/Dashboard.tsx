import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  Users, 
  Activity, 
  CheckCircle2, 
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  LayoutGrid,
  FileText,
  ClipboardList,
  Award,
  Loader2,
  UserPlus,
  Clock,
  AlertTriangle,
  AlertCircle,
  Building2
} from 'lucide-react';
import { clsx } from 'clsx';

import type { PageProps } from '@/types';
import type { LucideIcon } from '@/types';

export default function Dashboard({
  auth,
  active_period_id,
  active_period_name,
  active_periods = [],
  stats = {},
  current_phase = {},
  recentRegistrations = []
}: PageProps & {
  active_period_id?: number | null;
  active_period_name?: string | null;
  active_periods?: Any[];
  stats?: Record<string, any>;
  current_phase?: Record<string, any>;
  recentRegistrations?: Any[];
}) {
  const [periodDropdown, setPeriodDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [confirmPhase, setConfirmPhase] = useState<string | null>(null);

  const currentPhaseKey = current_phase?.key || 'upcoming';
  
  const phases = [
    { id: 'registration', label: '1. Pendaftaran', desc: 'Akses pendaftaran mahasiswa terbuka' },
    { id: 'placement', label: '2. Plotting', desc: 'Proses pembagian kelompok & lokasi' },
    { id: 'execution', label: '3. Lapangan', desc: 'Input logbook & aktivitas aktif' },
    { id: 'grading', label: '4. Penilaian', desc: 'Proses input & sinkronisasi nilai' },
  ];

  const phaseLabels: Record<string, string> = {
    registration: 'Pendaftaran',
    placement: 'Plotting',
    execution: 'Lapangan',
    grading: 'Penilaian',
    upcoming: 'Pra-Pendaftaran',
    finished: 'Selesai',
  };

  function handleSwitchPhase(target: string) {
    if (!active_period_id || switching) return;
    setSwitching(true);
    router.post('/admin/dashboard/switch-phase', {
      target,
      period_id: active_period_id,
    }, {
      preserveScroll: true,
      onFinish: () => {
        setSwitching(false);
        setConfirmPhase(null);
      },
    });
  }

  return (
    <AppLayout>
      <Head title="Pusat Kendali Admin" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-[0.25em] opacity-80">Operational Intelligence Center</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                Dashboard <span className="text-emerald-500">Sistem.</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">
                    Manajemen Strategis Pelaksanaan KKN UIN SAIZU Purwokerto
                </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* DROPDOWN PERIODE PREMIUM */}
              <div className="relative">
                <button
                  onClick={() => setPeriodDropdown(!periodDropdown)}
                  className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm group"
                >
                  <Calendar size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fokus Periode</span>
                    <span className="text-xs font-bold text-slate-700 leading-none">
                        {active_period_name || 'Pilih Periode'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={clsx("text-slate-300 transition-transform ml-2", periodDropdown && "rotate-180")} />
                </button>

                {periodDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPeriodDropdown(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 p-1 overflow-hidden ring-4 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 mb-1">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">History Periode</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {(active_periods || []).length > 0 ? (active_periods || []).map((p: { id: number; name: string }) => (
                            <Link
                            key={p.id}
                            href={`/admin?period_id=${p.id}`}
                            onClick={() => setPeriodDropdown(false)}
                            className={clsx(
                                "flex items-center justify-between px-4 py-4 rounded-xl text-sm transition-all mb-1",
                                p.id === active_period_id 
                                ? "bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100" 
                                : "text-slate-600 hover:bg-slate-50 font-semibold"
                            )}
                            >
                            <span>{p.nama}</span>
                            {p.id === active_period_id && <CheckCircle2 size={16} />}
                            </Link>
                        )) : (
                            <div className="px-4 py-6 text-center text-xs text-slate-400 italic">Data belum tersedia</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-14 px-6 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-4">
                <Activity size={18} className="text-emerald-500" />
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status Fase</span>
                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                        {phaseLabels[currentPhaseKey] || currentPhaseKey}
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- WORKFLOW MATRIX --- */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                    <Layers size={22} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Kontrol Alur Kerja KKN</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Implementasi Protokol Operasional Berdasarkan Fase</p>
                </div>
            </div>
            {switching && <Loader2 size={24} className="animate-spin text-emerald-500" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {phases.map((phase) => {
              const isActive = currentPhaseKey === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => {
                    if (!isActive && active_period_id) {
                      setConfirmPhase(phase.id);
                    }
                  }}
                  disabled={switching}
                  className={clsx(
                    "group flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden active:scale-95",
                    isActive 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-200/50 translate-y-[-4px]" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-600",
                    switching && "opacity-50 cursor-wait"
                  )}
                >
                  <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-white/20" : "bg-slate-50 text-slate-300 group-hover:bg-white group-hover:text-emerald-500 shadow-sm")}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold uppercase tracking-widest block mb-1">{phase.label}</span>
                    <span className={clsx("text-[9px] font-medium leading-tight block px-2", isActive ? "text-emerald-100" : "text-slate-300 group-hover:text-emerald-400")}>
                        {phase.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-5">
             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-emerald-500">
                <Info size={20} />
             </div>
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Informasi Kebijakan Akses</h4>
                <p className="text-sm font-medium text-emerald-700/80 leading-relaxed max-w-4xl">
                    Perubahan fase akan merekonfigurasi otorisasi fitur secara otomatis bagi seluruh mahasiswa dan DPL. Pastikan verifikasi data pada fase sebelumnya telah mencapai 100% sebelum memindahkan sistem ke tahap berikutnya.
                </p>
             </div>
          </div>
        </div>

        {/* --- STATISTIK STRATEGIS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Total Mahasiswa" value={stats?.total_students} icon={Users} color="emerald" desc="Partisipan Terdaftar" />
          <MetricCard label="Unit Kelompok" value={stats?.total_groups} icon={LayoutGrid} color="sky" desc="Formasi Lapangan" />
          <MetricCard label="Logbook Harian" value={stats?.total_reports} icon={FileText} color="amber" desc="Validasi Aktivitas" />
          <MetricCard label="Registrasi Baru" value={stats?.pending_registrations} icon={ClipboardList} color="rose" desc="Menunggu Verifikasi" />
        </div>

        {/* --- OPERATIONAL INSIGHTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Audit Periode Aktif</h3>
            <div className="space-y-5">
              <DetailRow label="Program Kerja" value={stats?.total_work_programs} icon={Award} />
              <DetailRow label="Laporan Akhir" value={stats?.total_final_reports} icon={FileText} />
              <DetailRow label="Target Mahasiswa" value={stats?.total_students} icon={Users} />
              <DetailRow label="Lokasi Strategis" value={stats?.total_groups} icon={LayoutGrid} />
            </div>
            <div className="pt-4 border-t border-slate-50 opacity-40 italic">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Data: {new Date().toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Clock size={20} />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Pendaftaran Terkini</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logging Aktivitas Sinkronisasi</p>
                </div>
              </div>
              <Link href="/admin/pendaftaran" className="h-10 px-6 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95">
                Kelola Semua <ChevronRight size={14} />
              </Link>
            </div>
            
            {recentRegistrations === null ? (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-500 gap-4 border-2 border-dashed border-emerald-50 rounded-2xl">
                <Loader2 size={48} className="animate-spin" />
                <p className="text-xs font-bold uppercase tracking-[0.3em]">Menyinkronkan Data Pendaftaran...</p>
              </div>
            ) : recentRegistrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentRegistrations.map((reg: Record<string, any>) => (
                  <div key={reg.id} className="flex items-center gap-5 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-emerald-50/30 hover:border-emerald-100 transition-all group">
                    <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 shadow-sm transition-all italic font-bold">
                      {reg.mahasiswa?.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate uppercase tracking-tight">{reg.mahasiswa?.user?.name || '—'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums mt-0.5">{reg.mahasiswa?.nim || '—'}</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-200 gap-4 border-2 border-dashed border-slate-50 rounded-2xl">
                <Clock size={48} strokeWidth={1.5} />
                <p className="text-xs font-bold uppercase tracking-[0.3em]">Antrean Pendaftaran Kosong</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL KONFIRMASI TRANSISI FASE --- */}
      {confirmPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setConfirmPhase(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full mx-4 space-y-8 animate-in zoom-in-95 duration-200 border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Otorisasi Transisi</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Security Override Control Required</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
              <p className="text-sm font-medium text-slate-600 leading-relaxed text-center">
                Anda akan melakukan transisi fase dari <span className="text-slate-900 font-bold px-1.5 py-0.5 bg-slate-200 rounded uppercase text-[11px] tracking-wider">{phaseLabels[currentPhaseKey]}</span> ke{' '}
                <span className="text-emerald-700 font-bold px-1.5 py-0.5 bg-emerald-100 rounded uppercase text-[11px] tracking-wider">{phaseLabels[confirmPhase]}</span>.
              </p>
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest italic">
                Tindakan ini permanen untuk periode berjalan.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSwitchPhase(confirmPhase)}
                disabled={switching}
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
              >
                {switching ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {switching ? 'MENYINKRONKAN SISTEM...' : 'KONFIRMASI TRANSISI'}
              </button>
              <button
                onClick={() => setConfirmPhase(null)}
                className="w-full h-14 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              >
                BATALKAN PROSES
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string; value: string |number; icon: LucideIcon; color: string; desc: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50',
    sky: 'bg-sky-50 text-sky-600 border-sky-100 shadow-sky-50',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50',
  };
  const isLoading = value === undefined || value === null;
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden active:scale-[0.98]">
      <div className="flex items-center justify-between relative z-10">
        <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 shadow-sm", colorMap[color])}>
          <Icon size={20} />
        </div>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{desc}</span>
      </div>
      <div className="space-y-1 relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
        ) : (
          <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none uppercase">
              {Number(value).toLocaleString('id-ID')}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  const isLoading = value === undefined || value === null;
  return (
    <div className="flex items-center justify-between group py-1">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all border border-transparent group-hover:border-emerald-100 shadow-sm">
            <Icon size={14} />
        </div>
        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{label}</span>
      </div>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-200" />
      ) : (
        <span className="text-sm font-black text-slate-900 tabular-nums uppercase underline decoration-emerald-200 decoration-2 underline-offset-4">{Number(value).toLocaleString('id-ID')}</span>
      )}
    </div>
  );
}
