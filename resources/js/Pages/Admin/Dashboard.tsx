import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Users, Activity, CheckCircle2, Calendar, ChevronRight, ChevronDown, LayoutGrid, FileText, ClipboardList, Loader2, Clock, AlertTriangle, ArrowRight, MapPin, ShieldCheck, Zap, Trophy, Binary, Target
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard({
 active_period_id, active_period_name, active_periods = [], stats = {}, current_phase = {}, recentRegistrations = []
}: PageProps & {
 active_period_id?: number | null; active_period_name?: string | null; active_periods?: any[]; stats?: Record<string, any>; current_phase?: Record<string, any>; recentRegistrations?: any[];
}) {
 const [periodDropdown, setPeriodDropdown] = useState(false);
 const [switching, setSwitching] = useState(false);
 const [confirmPhase, setConfirmPhase] = useState<string | null>(null);
 const currentPhaseKey = current_phase?.key || 'upcoming';

 const phases = [
 { id: 'registration', label: 'Pendaftaran' },
 { id: 'placement', label: 'Plotting' },
 { id: 'execution', label: 'Pelaksanaan' },
 { id: 'grading', label: 'Penilaian' },
 ];

 const phaseLabels: Record<string, string> = {
 registration: 'Pendaftaran', placement: 'Plotting', execution: 'Pelaksanaan', grading: 'Penilaian', upcoming: 'Pra-Pendaftaran', finished: 'Selesai',
 };

 function handleSwitchPhase(target: string) {
 if (!active_period_id || switching) return;
 setSwitching(true);
 router.post('/admin/dashboard/switch-phase', { target, period_id: active_period_id }, {
 preserveScroll: true, onFinish: () => { setSwitching(false); setConfirmPhase(null); },
 });
 }

 const isPlottingCrisis = (stats?.unassigned_students || 0) > 0 && currentPhaseKey === 'placement';

 return (
 <AppLayout title="Dasbor Utama Administrasi">
 <Head title="Dasbor Utama"/>

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-gray-900 font-sans">
 
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-[#1a7a4a]">
 <Activity size={18} />
 <span className="text-xs font-bold opacity-80">Pusat Kendali Operasional</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-3xl font-extrabold text-gray-900">
 Dashboard <span className="text-[#1a7a4a]">Utama.</span>
 </h1>
 <p className="font-semibold text-xs text-gray-700 mt-2 leading-relaxed max-w-2xl">
 Selamat datang kembali. Berikut adalah ringkasan eksekutif dan monitoring status pelaksanaan KKN UIN SAIZU secara real-time.
 </p>
 </div>
 
 <div className="relative">
 <button onClick={() => setPeriodDropdown(!periodDropdown)} className="flex items-center gap-4 px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
 <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#1a7a4a] shadow-inner">
 <Calendar size={18} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col items-start pr-4">
 <span className="text-xs font-bold text-[#1a7a4a] leading-none mb-1.5">Periode Aktif</span>
 <span className="text-sm font-bold text-gray-900 leading-none">{active_period_name || 'BELUM DITENTUKAN'}</span>
 </div>
 <ChevronDown size={16} className={clsx("text-gray-600 transition-transform", periodDropdown &&"rotate-180")} />
 </button>
 
 <AnimatePresence>
 {periodDropdown && (
 <>
 <div className="fixed inset-0 z-40"onClick={() => setPeriodDropdown(false)} />
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-xl shadow-sm z-50 p-2 overflow-hidden">
 {active_periods.length > 0 ? active_periods.map((p: any) => (
 <Link key={p.id} href={`/admin?period_id=${p.id}`} onClick={() => setPeriodDropdown(false)} className={clsx("flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all", p.id === active_period_id ?"bg-gray-50 text-gray-700 font-bold":"text-gray-900 hover:bg-gray-50 hover:text-[#1a7a4a]")}>
 <span className="tracking-wide">{p.nama}</span>
 {p.id === active_period_id && <CheckCircle2 size={16} className="text-[#1a7a4a]"strokeWidth={3} />}
 </Link>
 )) : (
 <div className="px-4 py-6 text-xs font-bold text-gray-600 text-center">Tiada Periode Tersedia</div>
 )}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 {/* METRICS GRID */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <DashboardStat label="Total Pendaftar"value={stats?.total_students} icon={Users} status="success"/>
 <DashboardStat label="Validasi Pending"value={stats?.pending_registrations} icon={ClipboardList} status={stats?.pending_registrations > 0 ? 'warning' : 'success'} />
 <DashboardStat label="Belum Di-Plotting"value={stats?.unassigned_students} icon={AlertTriangle} status={stats?.unassigned_students > 0 ? 'danger' : 'success'} alert={isPlottingCrisis} />
 <DashboardStat label="Total Kelompok"value={stats?.total_groups} icon={LayoutGrid} status="success"/>
 <DashboardStat label="Laporan Masuk"value={stats?.total_reports} icon={FileText} status="success"/>
 </div>

 {/* PHASE CONTROL PANEL */}
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
 <div className="px-6 py-6 border-b-2 border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
 <Zap size={18} className="text-[#1a7a4a]"/>
 </div>
 <div className="flex flex-col">
 <h2 className="text-sm font-bold text-gray-900 leading-none mb-1">Kontrol Fase Pelaksanaan</h2>
 <p className="text-xs font-bold text-[#1a7a4a]">Manajemen Alur Kerja KKN</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-gray-700">Status Saat Ini:</span>
 <div className={clsx("h-8 px-4 flex items-center justify-center rounded-lg border font-bold text-xs transition-all", currentPhaseKey === 'upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#16a34a] text-white border-[#1a7a4a] shadow-sm shadow-none') }>
 {phaseLabels[currentPhaseKey] || currentPhaseKey}
 </div>
 </div>
 </div>
 <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
 {phases.map((p) => {
 const isActive = currentPhaseKey === p.id;
 return (
 <button key={p.id} onClick={() => !isActive && active_period_id && setConfirmPhase(p.id)} disabled={switching} className={clsx("relative group px-5 py-6 rounded-xl border transition-all text-left overflow-hidden", isActive ?"bg-gray-50 border-gray-300 shadow-inner":"bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={40} /></div>
 <div className="flex flex-col gap-1.5 relative z-10">
 <span className={clsx("text-xs font-bold", isActive ?"text-gray-700":"text-gray-900")}>{p.label}</span>
 <span className={clsx("text-xs font-semibold", isActive ?"text-[#1a7a4a]":"text-gray-600")}>{isActive ? 'Tahap Aktif' : 'Aktifkan'}</span>
 </div>
 {isActive && <div className="absolute top-4 right-4"><CheckCircle2 size={18} className="text-[#1a7a4a]"strokeWidth={3} /></div>}
 </button>
 );
 })}
 </div>
 </div>

 {/* DATA PANELS ROW */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* RECENT REGISTRATIONS LIST */}
 <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
 <div className="px-6 py-5 border-b-2 border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
 <div className="flex items-center gap-4">
 <div className="h-8 w-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center"><Binary size={14} className="text-[#1a7a4a]"/></div>
 <h3 className="text-xs font-bold text-gray-900">Pendaftar Terbaru</h3>
 <div className="flex items-center gap-2 bg-[#16a34a] px-2.5 py-1 rounded-md">
 <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"/>
 <span className="text-xs font-semibold text-white">Live</span>
 </div>
 </div>
 <Link href="/admin/pendaftaran"className="h-9 px-4 bg-white border border-gray-200 text-[#1a7a4a] hover:bg-gray-50 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm transition-all">
 Semua Data <ChevronRight size={14} strokeWidth={2.5} />
 </Link>
 </div>
 <div className="divide-y divide-[#f3f4f6] overflow-y-auto flex-1 p-3">
 {recentRegistrations.length > 0 ? recentRegistrations.map((reg: any) => (
 <div key={reg.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group">
 <div className="flex items-center gap-5">
 <div className="h-11 w-11 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center font-semibold group-hover:bg-[#16a34a] group-hover:text-white group-hover:rotate-6 transition-all shadow-sm">
 {reg.mahasiswa?.user?.name ? reg.mahasiswa.user.name[0].toUpperCase() : 'M'}
 </div>
 <div className="flex flex-col">
 <p className="text-sm font-bold text-gray-900 mb-1">{reg.mahasiswa?.user?.name || 'BELUM TERIDENTIFIKASI'}</p>
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-[#1a7a4a] font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{reg.mahasiswa?.nim || 'NO_NIM'}</span>
 <span className="text-xs font-bold text-amber-600">Menunggu Validasi</span>
 </div>
 </div>
 </div>
 <ArrowRight size={18} className="text-gray-700 group-hover:text-[#1a7a4a] transition-colors"/>
 </div>
 )) : (
 <div className="flex flex-col items-center justify-center h-full text-center p-8">
 <ShieldCheck size={48} className="text-gray-700 mb-4"strokeWidth={1.5} />
 <span className="text-sm font-bold text-[#1f2937]">Sistem Bersih</span>
 <p className="text-xs font-semibold text-[#1a7a4a] mt-2">Tidak ada pendaftar baru yang menunggu validasi.</p>
 </div>
 )}
 </div>
 </div>

 {/* LOGISTICS & ALERTS */}
 <div className="space-y-6">
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
 <h3 className="text-xs font-bold text-gray-900 flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
 Kesiapan Penempatan <MapPin size={18} className="text-[#1a7a4a]"/>
 </h3>
 <div className="space-y-6">
 <DashboardProgress label="Posko Terverifikasi"count={stats?.reported_posko ?? 0} total={stats?.total_groups ?? 1} />
 <DashboardProgress label="Mahasiswa Terplot"count={stats?.assigned_students ?? 0} total={stats?.total_students ?? 1} />
 </div>
 </div>
 
 <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><AlertTriangle size={80} /></div>
 <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2 relative z-10">
 <AlertTriangle size={14} className="text-amber-500"/> Peringatan Sistem
 </h4>
 <p className="text-xs font-semibold text-gray-700 leading-relaxed relative z-10">
 Pastikan seluruh mahasiswa telah dialokasikan ke kelompok sebelum memindahkan fase ke Pelaksanaan. Sistem akan mengunci mutasi data setelahnya demi integritas laporan akademik.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* CONFIRMATION MODAL */}
 <AnimatePresence>
 {confirmPhase && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 backdrop-blur-md p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-sm max-w-md w-full overflow-hidden border border-gray-200">
 <div className="p-10 flex flex-col gap-6 text-center items-center">
 <div className="h-20 w-20 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner border border-amber-100"><AlertTriangle size={40} /></div>
 <div className="space-y-3">
 <h3 className="text-xl font-semibold text-gray-900">Aktifkan Fase {phaseLabels[confirmPhase]}?</h3>
 <p className="text-sm font-bold text-[#1a7a4a] leading-relaxed">Hak akses pengguna dan dosen pendamping akan disesuaikan secara otomatis sesuai protokol fase ini. Tindakan ini bersifat krusial.</p>
 </div>
 </div>
 <div className="px-8 py-6 bg-gray-50 flex justify-end gap-3 border-t-2 border-gray-200">
 <button onClick={() => setConfirmPhase(null)} className="px-6 py-3 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all active:scale-95">Batalkan</button>
 <button onClick={() => handleSwitchPhase(confirmPhase)} disabled={switching} className="px-6 py-3 bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-sm shadow-none flex items-center gap-3 hover:bg-[#15803d] transition-all active:scale-95">
 {switching ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16} />}
 Ya, Eksekusi Fase
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

function DashboardStat({ label, value, icon: Icon, status, alert }: any) {
 const colors: any = {
 success: { bg: 'bg-gray-50', text: 'text-gray-900', icon: 'text-[#1a7a4a]', border: 'border-gray-200' },
 warning: { bg: 'bg-amber-50', text: 'text-gray-900', icon: 'text-amber-600', border: 'border-amber-50' },
 danger: { bg: 'bg-rose-50', text: 'text-gray-900', icon: 'text-rose-600', border: 'border-rose-50' },
 };
 const c = colors[status] || colors.success;
 
 return (
 <div className={clsx("bg-white border rounded-xl p-4 flex flex-col justify-between h-32 hover:border-gray-300 transition-all group relative overflow-hidden", c.border)}>
 {alert && <div className="absolute top-2 right-2"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span></span></div>}
 
 <div className="flex justify-between items-start z-10 relative">
 <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all border", c.bg, c.icon, c.border)}>
 <Icon size={20} strokeWidth={2.5} />
 </div>
 </div>
 <div className="z-10 relative">
 <div className="flex flex-col">
 <span className="text-2xl font-semibold text-gray-900 tabular-nums leading-none mb-2 slashed-zero">{value ?? 0}</span>
 <span className="text-xs font-bold text-gray-700 truncate leading-none">{label}</span>
 </div>
 </div>
 </div>
 );
}

function DashboardProgress({ label, count, total }: any) {
 const safeTotal = total && total > 0 ? total : 1;
 const p = Math.min(100, Math.round((count / safeTotal) * 100));
 
 return (
 <div className="space-y-3">
 <div className="flex justify-between items-end">
 <span className="text-xs font-bold text-gray-700">{label}</span>
 <div className="text-right flex items-center gap-2">
 <span className="text-xs font-semibold text-gray-900 tabular-nums">{count}/{total}</span>
 <span className="text-xs font-semibold text-[#1a7a4a] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{p}%</span>
 </div>
 </div>
 <div className="h-2 w-full bg-gray-50 border border-gray-200 rounded-full overflow-hidden shadow-inner">
 <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1.5, ease:"easeOut"}} className="h-full bg-gray-500 rounded-full"/>
 </div>
 </div>
 );
}
