'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore, usePeriodStore } from '@/stores';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import dynamicImport from 'next/dynamic';
import { ActivityStatsWidget } from '@/components/admin/activity-stats-widget';

const AreaChart = dynamicImport(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });

import {
  Users, LayoutGrid, FileText, ClipboardList, AlertTriangle,
  MapPin, Clock, ArrowRight, ShieldCheck, Activity, TrendingUp,
  ChevronDown, BookOpen, BarChart3, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CountUp } from '@/components/ui/motion-effects';

/* ─── Counter using motion-effects CountUp ── */
function Counter({ to, delay: _delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <span ref={ref}>
      {inView ? <CountUp end={to} duration={1.2} /> : '0'}
    </span>
  );
}

/* ─── Radix Progress ── */
function RadixProgress({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100" style={{ transform: 'translateZ(0)' }}>
      <div
        className="h-full w-full flex-1 rounded-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: `translateX(-${100 - value}%)`, background: color }}
      />
    </div>
  );
}

/* ─── Tooltip ── */
function Tip({ children, content }: { children: React.ReactNode; content: string }) {
  return <span title={content}>{children}</span>;
}

/* ─── Chart tooltip ── */
interface TooltipPayload { name: string; value: number; color: string; }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border border-slate-100 shadow-lg px-3 py-2.5 text-xs font-sans">
      <p className="font-semibold text-slate-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

const PHASES = [
  { id: 'registration', label: 'Pendaftaran', short: 'Daftar' },
  { id: 'placement',    label: 'Penempatan',  short: 'Tempat' },
  { id: 'execution',    label: 'Pelaksanaan', short: 'Laksana' },
  { id: 'grading',      label: 'Penilaian',   short: 'Nilai' },
  { id: 'finished',     label: 'Selesai',     short: 'Selesai' },
];


const NAV = [
  { href: '/admin/pendaftaran',    icon: ClipboardList, label: 'Pendaftaran' },
  { href: '/admin/kelompok',       icon: Users,         label: 'Kelompok'    },
  { href: '/admin/nilai',          icon: FileText,      label: 'Nilai'       },
  { href: '/admin/lokasi',         icon: MapPin,        label: 'Lokasi'      },
  { href: '/admin/laporan/harian', icon: BookOpen,      label: 'Laporan'     },
  { href: '/admin/rekapitulasi',   icon: BarChart3,     label: 'Rekap Nilai' },
];

const ENTER = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboardPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const { activePeriod, currentPhase } = usePeriodStore();
  const qc = useQueryClient();
  const [selPeriod, setSelPeriod] = useState<number | undefined>(
    activePeriod?.id != null ? Number(activePeriod.id) : undefined
  );

  useEffect(() => {
    if (activePeriod?.id != null && !selPeriod) setSelPeriod(Number(activePeriod.id));
  }, [activePeriod, selPeriod]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard', { periode_id: selPeriod }],
    queryFn: async () => {
      const res = await adminApi.dashboard({ periode_id: selPeriod || undefined });
      return (res as { data: unknown })?.data ?? res;
    },
  });

  const phaseMut = useMutation({
    mutationFn: (p: { periode_id: number; phase: string }) => adminApi.switchPhase(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['period-context'] });
      toast.success('Fase berhasil diubah');
    },
    onError: () => toast.error('Gagal mengubah fase'),
  });

  const d          = data as Record<string, unknown> | undefined;
  const stats      = (d?.stats as Record<string, unknown> | undefined)?.summary as Record<string, number> | undefined;
  const period     = d?.period as Record<string, unknown> | undefined;
  const availablePeriods = (d?.available_periods as Record<string, Array<Record<string, unknown>>> | undefined);
  const periodOptions = availablePeriods ? Object.values(availablePeriods).flat() : [];
  const phaseContext = d?.phase_context as { hint?: string; counters?: Array<{ label: string; value: number; color?: string }>; actions?: Array<{ label: string; route?: string; href?: string; color?: string }> } | undefined;
  const trendData  = (d?.weekly_trend as Array<{ day: string; daftar: number; validasi: number }> | undefined);
  const phaseKey   = (d?.current_phase as string) || (period?.current_phase as string) || currentPhase || 'registration';
  const rawPhaseIdx = PHASES.findIndex(p => p.id === phaseKey);
  const phaseIdx   = rawPhaseIdx >= 0 ? rawPhaseIdx : 0;
  const periodId   = period?.id != null ? Number(period.id) : undefined;

  const totalStudents    = stats?.total_students        ?? 0;
  const pendingCount     = stats?.pending_registrations ?? 0;
  const unassignedCount  = stats?.unassigned_students   ?? 0;
  const totalGroups      = stats?.total_groups          ?? 0;
  const assignedStudents = stats?.assigned_students     ?? 0;
  const reportedPosko    = stats?.reported_posko        ?? 0;
  const studentAccountsTotal = stats?.student_accounts_total ?? 0;
  const studentNotLoggedIn = stats?.student_not_logged_in ?? 0;
  const studentLoggedIncomplete = stats?.student_logged_in_profile_incomplete ?? 0;
  const studentProfileComplete = stats?.student_profile_complete ?? 0;

  const poskoPct = totalGroups   > 0 ? Math.round((reportedPosko    / totalGroups)   * 100) : 0;
  const alokPct  = totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0;

  const STAT_CARDS = useMemo(() => [
    { label: 'Pendaftar Periode', value: totalStudents,  icon: Users,         color: '#3b82f6', bg: '#eff6ff', href: '/admin/pendaftaran', alert: false },
    { label: 'Menunggu Review',   value: pendingCount,   icon: Clock,         color: '#f59e0b', bg: '#fffbeb', href: '/admin/pendaftaran', alert: pendingCount > 0 },
    { label: 'Belum Ditempatkan', value: unassignedCount,icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', href: undefined,            alert: unassignedCount > 0 },
    { label: 'Total Kelompok',    value: totalGroups,    icon: LayoutGrid,    color: '#10b981', bg: '#ecfdf5', href: '/admin/kelompok',    alert: false },
  ], [totalStudents, pendingCount, unassignedCount, totalGroups]);

  return (
    <motion.div
      className="space-y-4 font-display"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* ── Header ── */}
      <motion.div variants={ENTER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-[1.35rem] font-bold text-slate-900 tracking-tight leading-none">
            Dashboard <span className="text-slate-400 font-normal">·</span> {user?.name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Fase aktif: <span className="font-semibold text-slate-600">{PHASES[phaseIdx]?.label ?? '—'}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative">
            <select
              value={selPeriod ?? ''}
              onChange={e => setSelPeriod(e.target.value ? Number(e.target.value) : undefined)}
              className="h-8 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer font-sans"
              aria-label="Pilih periode KKN"
            >
              {!selPeriod && <option value="">Pilih Periode</option>}
              {periodOptions.map(p => <option key={String(p.id)} value={Number(p.id)}>{String(p.name ?? p.periode ?? '-')}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={phaseKey}
              disabled={!periodId || phaseMut.isPending}
              onChange={e => periodId && phaseMut.mutate({ periode_id: periodId, phase: e.target.value })}
              className="h-8 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-sans">
              <option value="upcoming">Pra-Pendaftaran</option>
              {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {isError && (
        <motion.div variants={ENTER} className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Dashboard gagal dimuat. {(error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Periksa koneksi API atau data periode.'}
        </motion.div>
      )}

      {phaseContext?.hint && (
        <motion.div variants={ENTER} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-sans">
          {phaseContext.hint}
        </motion.div>
      )}

      {/* ── Phase stepper ── */}
      <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 px-5 py-3 flex items-center">
        {PHASES.map((p, i) => (
          <div key={p.id} className="flex items-center flex-1 min-w-0">
            <Tip content={p.label}>
              <button
                disabled={!periodId || phaseMut.isPending}
                onClick={() => periodId && phaseMut.mutate({ periode_id: periodId, phase: p.id })}
                className="flex flex-col items-center gap-1 shrink-0 group disabled:cursor-not-allowed disabled:opacity-60">
                <div className={[
                  'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200',
                  i < phaseIdx   ? 'bg-slate-800 text-white' : '',
                  i === phaseIdx ? 'bg-blue-600 text-white ring-4 ring-blue-100' : '',
                  i > phaseIdx   ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200' : '',
                ].join(' ')}>
                  {i < phaseIdx ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className={[
                  'text-[9px] font-bold uppercase tracking-wide hidden sm:block whitespace-nowrap transition-colors',
                  i === phaseIdx ? 'text-blue-600' : i < phaseIdx ? 'text-slate-600' : 'text-slate-300',
                ].join(' ')}>{p.short}</span>
              </button>
            </Tip>
            {i < PHASES.length - 1 && (
              <div className={['flex-1 h-px mx-2 transition-all duration-500', i < phaseIdx ? 'bg-slate-800' : 'bg-slate-100'].join(' ')} />
            )}
          </div>
        ))}
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((c, i) => {
          const card = (
            <motion.div key={c.label} variants={ENTER}
              className="bg-white rounded-xl border border-slate-100 p-4 relative overflow-hidden group hover:shadow-md transition-shadow cursor-default">
              {c.alert && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full opacity-60" style={{ background: c.color }} />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: c.color }} />
                </span>
              )}
              <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3" style={{ background: c.bg, color: c.color }}>
                <c.icon size={17} strokeWidth={2} />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 font-sans">{c.label}</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: c.color }}>
                {isLoading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-100" /> : <Counter to={c.value} delay={0.1 + i * 0.07} />}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: c.color }} />
            </motion.div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{card}</Link> : card;
        })}
      </div>

      <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Status Onboarding Mahasiswa</p>
            <p className="text-[11px] text-slate-400 font-sans">Akun mahasiswa keseluruhan, bukan hanya peserta periode aktif.</p>
          </div>
          <Link href="/admin/mahasiswa" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 font-sans flex items-center gap-1">
            Lihat mahasiswa <ArrowRight size={10} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Akun', value: studentAccountsTotal, color: '#0f172a', bg: '#f8fafc' },
            { label: 'Belum Login', value: studentNotLoggedIn, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Login Belum Lengkap', value: studentLoggedIncomplete, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Profil Lengkap', value: studentProfileComplete, color: '#10b981', bg: '#ecfdf5' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-100 p-3" style={{ background: item.bg }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-sans">{item.label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: item.color }}>
                {isLoading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-white/70" /> : item.value.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {totalStudents === 0 && !isLoading && (
        <motion.div variants={ENTER} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-sans">
          Periode terpilih belum memiliki pendaftar/peserta. Angka operasional periode akan tetap 0 sampai pendaftaran dibuka atau data peserta masuk. Gunakan panel onboarding di atas untuk memantau seluruh akun mahasiswa.
        </motion.div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Chart */}
        <motion.div variants={ENTER} className="lg:col-span-8 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={15} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Tren Pendaftaran Minggu Ini</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold font-sans">
              <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-blue-500" />Daftar</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500" />Validasi</span>
            </div>
          </div>
          <div className="p-4 h-52">
            {isLoading || !trendData ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-sans">
                Belum ada data pendaftaran minggu ini
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="daftar" name="Daftar" stroke="#3b82f6" strokeWidth={2} fill="url(#gBlue)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey="validasi" name="Validasi" stroke="#10b981" strokeWidth={2} fill="url(#gGreen)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-4">
          {/* Antrian */}
          <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Antrian</span>
                {pendingCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <Link href="/admin/pendaftaran" className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors font-sans flex items-center gap-1">
                Semua <ArrowRight size={10} />
              </Link>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[100px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full space-y-2">
                    {[0, 1].map(i => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}
                  </motion.div>
                ) : pendingCount === 0 ? (
                  <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
                    <ShieldCheck size={20} className="text-emerald-400 mx-auto mb-1.5" strokeWidth={2} />
                    <p className="text-xs font-semibold text-slate-500">Semua tervalidasi</p>
                  </motion.div>
                ) : (
                  <motion.div key="p" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Activity size={16} className="text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800">{pendingCount} menunggu</p>
                        <p className="text-[10px] text-amber-600 font-sans">Perlu validasi segera</p>
                      </div>
                      <Link href="/admin/pendaftaran"
                        className="shrink-0 rounded-lg bg-amber-500 text-white px-2.5 py-1.5 text-[10px] font-bold hover:bg-amber-600 transition-colors font-sans">
                        Proses
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Progres Penempatan</span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Verifikasi Posko',  pct: poskoPct, cur: reportedPosko,    tot: totalGroups,   color: '#8b5cf6' },
                { label: 'Alokasi Mahasiswa', pct: alokPct,  cur: assignedStudents, tot: totalStudents, color: '#3b82f6' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 font-sans">{item.label}</span>
                    <span className="text-[11px] font-bold tabular-nums font-sans" style={{ color: item.color }}>{item.pct}%</span>
                  </div>
                  <RadixProgress value={item.pct} color={item.color} />
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">{item.cur} / {item.tot}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {phaseContext?.counters?.length ? (
            <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 font-sans">Fokus Fase</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {phaseContext.counters.map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold text-slate-400 font-sans">{item.label}</p>
                    <p className="mt-1 text-lg font-black text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* ── Nav grid ── */}
      <motion.div variants={ENTER} className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 font-sans">Navigasi Cepat</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
              <item.icon size={16} className="text-slate-500 group-hover:text-slate-800 transition-colors" strokeWidth={2} />
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors text-center font-sans">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={ENTER}>
        <ActivityStatsWidget />
      </motion.div>
    </motion.div>
  );
}
