import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Users, LayoutGrid, FileText, ClipboardList, AlertTriangle, 
  MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// ── Config ───────────────────────────────────────────
interface DashboardProps extends PageProps {
  active_periode_id?: number | null;
  active_period_name?: string | null;
  active_periods?: any[];
  stats?: Record<string, any>;
  current_phase?: Record<string, any> | string;
  recentRegistrations?: any[];
}

const PHASES = [
  { id: 'registration', label: 'Pendaftaran' },
  { id: 'placement',    label: 'Penempatan' },
  { id: 'execution',    label: 'Pelaksanaan' },
  { id: 'grading',      label: 'Penilaian' },
];

const PHASE_LABELS: Record<string, string> = {
  registration: 'Pendaftaran', placement: 'Penempatan',
  execution: 'Pelaksanaan', grading: 'Penilaian',
  upcoming: 'Belum Dimulai', finished: 'Selesai',
};

// ── Main ─────────────────────────────────────────────
export default function Dashboard({
  active_periode_id, active_periods = [],
  stats = {}, current_phase = {}, recentRegistrations = [],
}: DashboardProps) {
  const [switching, setSwitching] = useState(false);
  const [confirmPhase, setConfirmPhase] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  const phaseKey = typeof current_phase === 'string'
    ? current_phase : (current_phase?.key || 'upcoming');

  function handlePeriodChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val) router.get(route('admin.dashboard', { periode_id: val }));
  }

  function handlePhaseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val && val !== phaseKey && active_periode_id) {
      setConfirmPhase(val);
      // Reset select back to current phase until confirmed
      e.target.value = phaseKey; 
    }
  }

  function submitPhaseChange() {
    if (!active_periode_id || !confirmPhase || switching) return;
    setSwitching(true);
    router.post('/admin/dashboard/switch-phase',
      { target: confirmPhase, periode_id: active_periode_id },
      { preserveScroll: true, onFinish: () => { setSwitching(false); setConfirmPhase(null); } }
    );
  }

  const pendingCount = stats?.pending_registrations ?? 0;
  const unassignedCount = stats?.unassigned_students ?? 0;

  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard Admin" />

      {/* ── Background Kontras (Slate-50) ── */}
      <div className="min-h-screen bg-slate-50 -m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto space-y-4"
        >
          
          {/* ── HEADER PANEL (Minimalist & Padat) ── */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border-2 border-cyan-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
            {/* Subtle accent line on top of header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-lime-500 to-amber-500" />
            <div>
              <h1 className="text-4xl font-black text-cyan-950 leading-none tracking-tighter uppercase font-display">
                Dashboard <span className="text-amber-500">Admin.</span>
              </h1>
              <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.25em] font-display">Ringkasan operasional & status pendaftaran real-time</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
              {/* Form Select Periode */}
              <div className="w-full sm:w-56">
                <label className="block text-[10px] font-black text-cyan-900 uppercase tracking-widest mb-1.5 font-display">
                  Periode KKN
                </label>
                <select
                  value={active_periode_id || ''}
                  onChange={handlePeriodChange}
                  className="w-full h-11 bg-slate-50 border-2 border-cyan-100 text-cyan-950 text-xs font-black rounded-xl focus:ring-cyan-600 focus:border-cyan-600 py-2 px-4 shadow-sm font-display uppercase"
                >
                  <option value="" disabled>Pilih Periode...</option>
                  {active_periods.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Form Select Fase */}
              <div className="w-full sm:w-56">
                <label className="block text-[10px] font-black text-cyan-900 uppercase tracking-widest mb-1.5 font-display">
                  Fase Saat Ini
                </label>
                <select
                  value={phaseKey}
                  onChange={handlePhaseChange}
                  className={clsx(
                    "w-full h-11 text-xs font-black rounded-xl border-2 focus:ring-2 focus:outline-none py-2 px-4 shadow-sm font-display uppercase transition-colors",
                    "bg-cyan-600 border-cyan-500 text-white focus:ring-cyan-400 focus:border-cyan-400"
                  )}
                >
                  <option value="upcoming" disabled>Belum Dimulai</option>
                  {PHASES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                  <option value="finished" disabled>Selesai</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* ── METRICS ROW (Kecil, Kompak, Terbaca Jelas) ── */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}><MetricCard title="Total Pendaftar" value={stats?.total_students ?? 0} icon={Users} /></motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard 
                title="Menunggu Review" 
                value={pendingCount} 
                icon={Clock} 
                alert={pendingCount > 0} 
                color="amber" 
                href={route('admin.pendaftaran.index')} 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard 
                title="Belum Ditempatkan" 
                value={unassignedCount} 
                icon={AlertTriangle} 
                alert={unassignedCount > 0} 
                color="rose" 
              />
            </motion.div>
            <motion.div variants={itemVariants}><MetricCard title="Total Kelompok" value={stats?.total_groups ?? 0} icon={LayoutGrid} /></motion.div>
          </motion.div>

          {/* ── MAIN CONTENT (List Padat & Ringkas) ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* KOLOM KIRI: Pendaftaran Terbaru (Lebar 2/3) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-cyan-100 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-cyan-100 flex justify-between items-center">
                <h2 className="text-[10px] font-black text-cyan-950 uppercase tracking-[0.2em] flex items-center gap-3 font-display">
                  <ClipboardList size={16} className="text-cyan-600" strokeWidth={2.5} /> Antrian Pendaftaran
                </h2>
                <Link href={route('admin.pendaftaran.index')} className="text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:text-cyan-800 transition-colors font-display">
                  Lihat Semua &rarr;
                </Link>
              </div>
              
              <div className="flex-1">
                {recentRegistrations.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentRegistrations.slice(0, 6).map((reg: any) => (
                      <div key={reg.id} className="flex items-center justify-between px-6 py-4 hover:bg-cyan-50/50 transition-all group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="h-10 w-10 rounded-xl bg-white border-2 border-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-black shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {reg.mahasiswa?.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-cyan-950 truncate tracking-tight group-hover:text-cyan-600 transition-colors font-dm">{reg.mahasiswa?.user?.name || '—'}</p>
                            <p className="text-[11px] font-medium text-slate-500 truncate tracking-wide mt-0.5 font-dm">{reg.mahasiswa?.nim || '—'}</p>
                          </div>
                        </div>
                        <span className="shrink-0 ml-4 inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black bg-lime-500 text-white border border-lime-600 uppercase tracking-widest font-display shadow-[0_2px_10px_rgba(132,204,22,0.2)]">
                          Audit
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Antrian Kosong</p>
                    <p className="text-xs text-slate-500">Semua pendaftaran telah divalidasi.</p>
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: Progres & Pintasan (Lebar 1/3) */}
            <div className="space-y-4">
              
              {/* Progres Penempatan */}
              <div className="bg-white rounded-2xl border-2 border-cyan-100 shadow-sm p-6">
                <h2 className="text-[10px] font-black text-cyan-950 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 font-display">
                  <MapPin size={16} className="text-cyan-600" strokeWidth={2.5} /> Progres Penempatan
                </h2>
                <div className="space-y-4">
                  <CompactProgress label="Verifikasi Posko" current={stats?.reported_posko ?? 0} total={stats?.total_groups ?? 1} />
                  <CompactProgress label="Alokasi Mahasiswa" current={stats?.assigned_students ?? 0} total={stats?.total_students ?? 1} />
                </div>
              </div>

              {/* Pesan Peringatan (Jika ada yang belum ditempatkan) */}
              {unassignedCount > 0 && (
                <div className="bg-rose-50 rounded-lg ring-1 ring-rose-200 p-3 flex gap-3">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-900 mb-0.5">Tindakan Diperlukan</p>
                    <p className="text-[11px] text-rose-700 leading-tight">
                      <strong className="font-bold">{unassignedCount} mahasiswa</strong> belum dialokasikan ke kelompok KKN.
                    </p>
                  </div>
                </div>
              )}

              {/* Menu Pintasan */}
              <div className="bg-white rounded-lg ring-1 ring-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akses Cepat</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  <QuickMenu href={route('admin.lokasi.index')} icon={MapPin} label="Kelola Wilayah & Lokasi" />
                  <QuickMenu href={route('admin.mahasiswa.index')} icon={Users} label="Direktori Mahasiswa" />
                  <QuickMenu href={route('admin.kelompok.index')} icon={LayoutGrid} label="Manajemen Kelompok" />
                  <QuickMenu href={route('admin.laporan.harian.index')} icon={FileText} label="Laporan Harian" />
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Modal Konfirmasi Ubah Fase ── */}
      <AnimatePresence>
        {confirmPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-cyan-950 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Konfirmasi Fase
                </h3>
              </div>
              <div className="p-5 bg-slate-50">
                <p className="text-sm text-slate-700 mb-3">
                  Anda akan mengubah status sistem ke fase <strong className="font-bold text-cyan-950">"{PHASE_LABELS[confirmPhase]}"</strong>.
                </p>
                <p className="text-xs text-rose-600 font-medium">
                  Perhatian: Tindakan ini akan seketika mengubah menu dan hak akses bagi mahasiswa serta DPL di seluruh portal.
                </p>
              </div>
              <div className="p-4 bg-white flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setConfirmPhase(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={submitPhaseChange}
                  disabled={switching}
                  className="px-4 py-2 text-sm font-bold text-white bg-amber-500 rounded hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50 shadow-[0_4px_14px_rgba(245,158,11,0.3)] transition-all"
                >
                  {switching && <Loader2 size={14} className="animate-spin" />}
                  Ya, Ubah Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

Dashboard.layout = AppLayout.layout;

// ── Sub-components (Kompak & Bersih) ───────────────────────────────────

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.p className={className}>{display}</motion.p>;
}

function MetricCard({ title, value, icon: Icon, alert = false, color = 'cyan', href }: any) {
  const Wrapper = href ? Link : 'div';
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;

  return (
    <Wrapper 
      {...(href ? { href } : {})}
      className={clsx(
        "bg-white rounded-2xl border-2 p-6 flex items-start justify-between transition-all duration-300 shadow-sm group",
        alert && color === 'amber' ? "border-amber-100 bg-amber-50/20 hover:bg-amber-50" : 
        alert && color === 'rose' ? "border-rose-100 bg-rose-50/20 hover:bg-rose-50" : "border-cyan-100 hover:bg-cyan-50/50",
        href && "cursor-pointer hover:shadow-lg hover:shadow-cyan-900/5 active:scale-95"
      )}
    >
      <div>
        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] font-display">{title}</p>
        <AnimatedCounter 
          value={numericValue} 
          className={clsx(
            "text-4xl font-black tabular-nums tracking-tighter font-display leading-none",
            alert && color === 'amber' ? "text-amber-700" :
            alert && color === 'rose' ? "text-rose-700" : "text-cyan-950"
          )} 
        />
      </div>
      <div className={clsx(
        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6",
        alert && color === 'amber' ? "bg-amber-100 text-amber-600" :
        alert && color === 'rose' ? "bg-rose-100 text-rose-600" : "bg-cyan-50 text-cyan-600"
      )}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
    </Wrapper>
  );
}

function CompactProgress({ label, current, total }: { label: string; current: number; total: number }) {
  const safe = total > 0 ? total : 1;
  const pct = Math.min(100, Math.round((current / safe) * 100));

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-cyan-950 uppercase tracking-widest font-display">{label}</span>
        <span className="text-[10px] font-black text-lime-700 tabular-nums bg-lime-50 px-2 py-0.5 rounded-lg border border-lime-100 font-display">
          {current}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
        <div className="h-full bg-lime-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(132,204,22,0.5)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickMenu({ href, icon: Icon, label }: any) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-cyan-50 group transition-colors">
      <div className="flex items-center gap-3 text-cyan-950 group-hover:text-cyan-700 transition-colors">
        <Icon size={16} strokeWidth={2.5} className="text-cyan-600/70 group-hover:text-cyan-600" />
        <span className="text-sm font-black uppercase tracking-tight font-display">{label}</span>
      </div>
      <ChevronRight size={16} className="text-cyan-300 group-hover:text-cyan-500 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
