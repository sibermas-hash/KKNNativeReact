import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Users, Activity, CheckCircle2, Calendar, ChevronRight, ChevronDown, LayoutGrid, FileText, ClipboardList, Loader2, Clock, AlertTriangle, ArrowRight, MapPin, ShieldCheck
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
 <AppLayout title="Dashboard Utama">
 <Head title="Dashboard Utama" />

 <div className="space-y-6 max-w-7xl mx-auto font-sans">
 
 {/* HEADER SECTION */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Activity size={16} className="text-emerald-600" />
 <span className="text-sm font-medium text-gray-500">Ringkasan Eksekutif</span>
 </div>
 <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard Utama KKN</h1>
 </div>
 
 <div className="relative">
 <button onClick={() => setPeriodDropdown(!periodDropdown)} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200">
 <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
 <Calendar size={16} strokeWidth={2} />
 </div>
 <div className="flex flex-col items-start pr-2">
 <span className="text-xs font-medium text-gray-500 mb-0.5">Periode Sistem</span>
 <span className="text-sm font-semibold text-gray-900 leading-none">{active_period_name || 'Tidak Ada Periode Aktif'}</span>
 </div>
 <ChevronDown size={16} className={clsx("text-gray-400 transition-transform", periodDropdown && "rotate-180")} />
 </button>
 
 <AnimatePresence>
 {periodDropdown && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setPeriodDropdown(false)} />
 <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
 {active_periods.length > 0 ? active_periods.map((p: any) => (
 <Link key={p.id} href={`/admin?period_id=${p.id}`} onClick={() => setPeriodDropdown(false)} className={clsx("flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors", p.id === active_period_id ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700 hover:bg-gray-50")}>
 <span>{p.nama}</span>
 {p.id === active_period_id && <CheckCircle2 size={16} className="text-emerald-500" />}
 </Link>
 )) : (
 <div className="px-3 py-2 text-sm text-gray-500 text-center">Tidak ada periode</div>
 )}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* METRICS ROW */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <StandardStat label="Total Pendaftar" value={stats?.total_students} icon={Users} color="emerald" />
 <StandardStat label="Menunggu Validasi" value={stats?.pending_registrations} icon={ClipboardList} highlight={stats?.pending_registrations > 0} color="amber" />
 <StandardStat label="Belum Dapat Kelompok" value={stats?.unassigned_students} icon={AlertTriangle} highlight={stats?.unassigned_students > 0} color="rose" alertMsg={isPlottingCrisis ? "Perlu Di-Plotting" : null} />
 <StandardStat label="Total Kelompok" value={stats?.total_groups} icon={LayoutGrid} color="cyan" />
 <StandardStat label="Laporan Masuk" value={stats?.total_reports} icon={FileText} color="emerald" />
 </div>

 {/* PHASE CONTROL PANEL */}
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
 <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
 <div className="p-1.5 bg-white rounded border border-gray-200 shadow-sm"><Activity size={16} className="text-emerald-600" /></div> Pengaturan Fase Pelaksanaan KKN
 </h2>
 <div className="flex items-center gap-3">
 <span className="text-xs font-medium text-gray-500">Fase Saat Ini:</span>
 <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-md border", currentPhaseKey === 'upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200') }>
 {phaseLabels[currentPhaseKey] || currentPhaseKey}
 </span>
 </div>
 </div>
 <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
 {phases.map((p) => {
 const isActive = currentPhaseKey === p.id;
 return (
 <button key={p.id} onClick={() => !isActive && active_period_id && setConfirmPhase(p.id)} disabled={switching} className={clsx("flex items-center justify-between p-4 rounded-lg border transition-all text-left", isActive ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300")}>
 <div className="flex flex-col gap-1">
 <span className={clsx("text-sm font-semibold", isActive ? "text-emerald-900" : "text-gray-700")}>{p.label}</span>
 <span className={clsx("text-xs font-medium", isActive ? "text-emerald-600" : "text-gray-400")}>{isActive ? 'Sedang Aktif' : 'Aktifkan Fase'}</span>
 </div>
 {isActive && <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={2.5} />}
 </button>
 );
 })}
 </div>
 </div>

 {/* DATA PANELS ROW */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* RECENT REGISTRATIONS LIST */}
 <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[380px]">
 <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
 <div className="flex items-center gap-3">
 <h3 className="text-sm font-semibold text-gray-800">Pendaftar Terbaru</h3>
 <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Real-Time</span>
 </div>
 <Link href="/admin/pendaftaran" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white hover:bg-emerald-50 border border-gray-200 px-3 py-1.5 rounded transition-colors">
 Lihat Semua Pendaftar <ChevronRight size={14} />
 </Link>
 </div>
 <div className="divide-y divide-gray-100 overflow-y-auto flex-1 h-full p-2">
 {recentRegistrations.length > 0 ? recentRegistrations.map((reg: any) => (
 <div key={reg.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 group-hover:bg-emerald-100 transition-colors">
 {reg.mahasiswa?.user?.name ? reg.mahasiswa.user.name[0].toUpperCase() : 'M'}
 </div>
 <div className="overflow-hidden">
 <p className="text-sm font-medium text-gray-900 truncate mb-1">{reg.mahasiswa?.user?.name || 'Nama Tidak Tersedia'}</p>
 <div className="flex items-center gap-3">
 <span className="text-xs text-gray-500">{reg.mahasiswa?.nim || 'No NIM'}</span>
 <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Menunggu Validasi</span>
 </div>
 </div>
 </div>
 <ArrowRight size={16} className="text-gray-300 group-hover:text-emerald-500 shrink-0" />
 </div>
 )) : (
 <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-70">
 <ShieldCheck size={32} className="text-white mb-3" strokeWidth={1.5} />
 <p className="text-sm font-medium text-gray-600">Sistem Bersih</p>
 <p className="text-xs text-gray-500 mt-1">Tidak ada pendaftar baru yang menunggu validasi.</p>
 </div>
 )}
 </div>
 </div>

 {/* LOGISTICS & ALERTS */}
 <div className="space-y-6">
 <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
 <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
 Kesiapan Lokasi & Posko <MapPin size={16} className="text-emerald-600" />
 </h3>
 <div className="space-y-5">
 <StandardProgress label="Posko Terlapor" count={stats?.reported_posko ?? 0} total={stats?.total_groups ?? 1} />
 <StandardProgress label="Mahasiswa Diplot" count={stats?.assigned_students ?? 0} total={stats?.total_students ?? 1} />
 </div>
 </div>
 
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
 <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
 <AlertTriangle size={16} className="text-amber-600" /> Informasi Sistem
 </h4>
 <p className="text-xs font-medium text-amber-700/90 leading-relaxed">
 Pastikan seluruh pendaftar telah dialokasikan ke kelompok (Diplot) sebelum memindahkan fase ke <strong>Pelaksanaan</strong>. Sistem akan mengunci mutasi data setelahnya.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* CONFIRMATION MODAL */}
 <AnimatePresence>
 {confirmPhase && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
 <div className="p-6 flex flex-col gap-4 text-center items-center">
 <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-1"><AlertTriangle size={28} /></div>
 <div className="space-y-2">
 <h3 className="text-lg font-bold text-gray-900">Aktifkan Fase {phaseLabels[confirmPhase]}?</h3>
 <p className="text-sm text-gray-500 leading-relaxed">Hak akses pengguna dan dosen pendamping akan disesuaikan secara otomatis. Lanjutkan?</p>
 </div>
 </div>
 <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
 <button onClick={() => setConfirmPhase(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
 <button onClick={() => handleSwitchPhase(confirmPhase)} disabled={switching} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 hover:bg-emerald-700 transition-colors">
 {switching && <Loader2 size={16} className="animate-spin" />}
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

function StandardStat({ label, value, icon: Icon, highlight, color = 'emerald', alertMsg }: any) {
 const colors: any = {
 emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-700' },
 amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-700' },
 rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'text-rose-700' },
 cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-700' }
 };
 const c = colors[color] || colors.emerald;
 
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-28 hover:shadow-md transition-shadow group relative overflow-hidden">
 {alertMsg && <div className="absolute top-0 right-0 p-1.5"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span></span></div>}
 
 <div className="flex justify-between items-start z-10 relative">
 <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center", c.bg, c.icon)}>
 <Icon size={18} strokeWidth={2} />
 </div>
 </div>
 <div className="z-10 relative">
 <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value ?? 0}</p>
 <div className="flex items-center justify-between">
 <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
 </div>
 {alertMsg && <p className="text-[10px] font-medium text-rose-600 mt-1 max-w-full truncate">{alertMsg}</p>}
 </div>
 </div>
 );
}

function StandardProgress({ label, count, total }: any) {
 const safeTotal = total && total > 0 ? total : 1;
 const p = Math.min(100, Math.round((count / safeTotal) * 100));
 
 return (
 <div className="space-y-2">
 <div className="flex justify-between items-end pb-1">
 <span className="text-xs font-medium text-gray-600">{label}</span>
 <div className="text-right flex items-center gap-2">
 <span className="text-xs font-bold text-gray-900">{count}/{total}</span>
 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 rounded">{p}%</span>
 </div>
 </div>
 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
 <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
 </div>
 </div>
 );
}
