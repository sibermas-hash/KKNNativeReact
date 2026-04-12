import React, { useState, useRef, useEffect } from 'react';
import { Link, Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import {
    type LucideIcon,
    Users,
    FileText,
    ClipboardList,
    GraduationCap,
    BarChart3,
    FolderKanban,
    AlertTriangle,
    FileCheck,
    ArrowRight,
    CalendarDays,
    ChevronDown,
    CheckCircle2,
    Plus,
    LayoutGrid,
    MapPin,
    ShieldCheck,
    Shuffle,
    Cpu,
    Award,
    Presentation,
    Globe,
    Megaphone,
    Download,
    Settings,
    Layers,
    Activity,
    Zap,
    ChevronRight,
    Sparkles,
    Search
} from 'lucide-react';
import { ConfirmDialog } from '@/Components/ui';
import { clsx } from 'clsx';

interface Registration {
    id: number;
    status: string;
    mahasiswa?: { nim: string; user?: { name: string; }; };
    periode?: { nama: string; };
}

interface DashboardStats {
    total_students: number;
    total_groups: number;
    total_reports: number;
    pending_registrations: number;
    total_work_programs: number;
    total_final_reports: number;
    assigned_students: number;
    unassigned_students: number;
    reported_posko: number;
    active_period: string;
}

interface Props {
    stats?: DashboardStats;
    recentRegistrations?: Registration[];
    intelligence?: {
        high_risk_count: number;
        anomalies?: any[];
    };
    ui?: {
        is_faculty_admin?: boolean;
        can_manage_public_content?: boolean;
    };
    current_phase?: {
        key: string;
        label: string;
        color: string;
    };
    active_period_id?: number;
    active_period_name?: string;
    active_periods?: { id: number; nama: string }[];
    phase_context?: {
        hint: string;
        actions?: { label: string; href: string; color: string; }[];
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function AdminDashboard({ 
    stats, 
    recentRegistrations, 
    intelligence, 
    ui, 
    current_phase, 
    active_period_id, 
    active_period_name,
    active_periods = [],
    phase_context 
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [phaseConfirm, setPhaseConfirm] = useState({ show: false, target: '', label: '' });
    const [processing, setProcessing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const roles = ((auth.user as any)?.roles || []).map((r: any) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isAdmin = roles.includes('admin') || roles.includes('superadmin');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePeriodSwitch = (id: number) => {
        setDropdownOpen(false);
        router.get('/admin', { period_id: id }, { preserveState: false });
    };

    return (
        <AppLayout title="Dashboard">
            <Head title="Admin Dashboard | KKN UIN Saizu" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-12 pb-32"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Pusat Kendali Operasional</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                             Dashboard <span className="text-emerald-600">Administrasi</span>
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-3 px-6 py-2.5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-50 transition-all group lg:min-w-[280px]"
                                >
                                    <CalendarDays size={16} className="text-emerald-500" />
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Focus Period</span>
                                        <span className="text-[12px] font-black text-slate-900 tracking-tight truncate uppercase">{active_period_name || 'NO ACTIVE PERIOD'}</span>
                                    </div>
                                    <ChevronDown size={14} className={clsx("ml-auto text-slate-300 transition-transform duration-500", dropdownOpen && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-4 w-full min-w-[320px] bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] z-[100] overflow-hidden p-4"
                                        >
                                            <div className="space-y-2">
                                                {active_periods.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handlePeriodSwitch(p.id)}
                                                        className={clsx(
                                                            "w-full flex items-center justify-between p-5 rounded-2xl text-[11px] font-black tracking-widest transition-all uppercase",
                                                            p.id === active_period_id 
                                                                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" 
                                                                : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                                        )}
                                                    >
                                                        <span>{p.nama}</span>
                                                        {p.id === active_period_id && <CheckCircle2 size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {current_phase && (
                                <div className="px-6 py-3 bg-slate-900 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border border-slate-800 shadow-xl shadow-slate-200">
                                    Phase: <span className="text-white">{current_phase.label}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden xl:flex items-center gap-8 bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm">
                         <div className="flex items-center gap-5 border-r border-slate-100 pr-8">
                              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                   <Activity size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Load</p>
                                   <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nominal</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-5">
                              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                   <ShieldCheck size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
                                   <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Secure</p>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- STATS & WORKFLOW GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                        <div className="absolute bottom-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
                            <Layers size={300} strokeWidth={1} />
                        </div>

                        <div className="flex items-center gap-5 mb-14 relative z-10">
                            <div className="p-4 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/20">
                                <FolderKanban size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-1">Operational Flow</h2>
                                <p className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Alur Kerja Strategis</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
                            <StageBtn label="1. Pendaftaran" active={current_phase?.key === 'registration'} done={['placement', 'execution', 'grading', 'finished'].includes(current_phase?.key || '')} onAction={() => setPhaseConfirm({ show: true, target: 'registration', label: 'Buka Pendaftaran' })} />
                            <StageBtn label="2. Plotting" active={current_phase?.key === 'placement'} done={['execution', 'grading', 'finished'].includes(current_phase?.key || '')} onAction={() => setPhaseConfirm({ show: true, target: 'placement', label: 'Mulai Plotting' })} />
                            <StageBtn label="3. Lapangan" active={current_phase?.key === 'execution'} done={['grading', 'finished'].includes(current_phase?.key || '')} onAction={() => setPhaseConfirm({ show: true, target: 'execution', label: 'Terjun Lapangan' })} />
                            <StageBtn label="4. Penilaian" active={current_phase?.key === 'grading'} done={['finished'].includes(current_phase?.key || '')} onAction={() => setPhaseConfirm({ show: true, target: 'grading', label: 'Buka Penilaian' })} />
                        </div>

                        <div className="mt-14 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl relative z-10">
                            <div className="flex items-center gap-4 text-emerald-400 mb-4">
                                <Zap size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quick Hint</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">
                                Kontrol alur otomatis membatasi akses fitur tertentu secara global. Pastikan database mahasiswa telah disinkronkan sebelum membuka fase plotting koordinat lokasi.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-5 mb-14">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                                <CheckCircle2 size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600 mb-1">Integrity Check</h2>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Kesiapan Sistem</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <StatusRow label="Sinkronisasi Data" status="OPTIMAL" badge="emerald" />
                            <StatusRow label="Plotting Group" status="SECURED" badge="blue" icon={<ShieldCheck size={16} />} />
                            <StatusRow label="ABCD Engine" status="READY" badge="emerald" icon={<Zap size={16} className="text-amber-500 animate-pulse" />} />
                            <StatusRow label="Credential Server" status="ACTIVE" badge="emerald" />
                        </div>
                    </motion.div>
                </div>

                {/* --- METRICS Bento --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <Metric title="Peserta KKN" subtitle="Terdaftar di SIKAD" value={stats?.total_students || 0} icon={Users} color="emerald" />
                    <Metric title="Total Unit" subtitle="Siap Terjun" value={stats?.total_groups || 0} icon={LayoutGrid} color="blue" />
                    <Metric title="Laporan Harian" subtitle="Log Digital" value={stats?.total_reports || 0} icon={FileText} color="purple" />
                    <Metric title="Antologi Akhir" subtitle="Produk Final" value={stats?.total_final_reports || 0} icon={FileCheck} color="amber" />
                </div>

                {/* --- NAVIGATION CENTER (PREMIUM GRID) --- */}
                <div className="space-y-12">
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                                <LayoutGrid size={30} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em] mb-1">Operational Matrix</h2>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pusat Navigasi Portal</p>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm group cursor-pointer hover:border-emerald-500/30 transition-all">
                             <Search size={18} className="text-slate-300 group-hover:text-emerald-500" />
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-emerald-700">Quick Navigation Finder...</span>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                        <NavGroup title="Infrastruktur & Master" color="emerald" icon={CalendarDays}>
                            <NavLink label="Tahun Akademik" href={route('admin.tahun-akademik.index')} desc="Konfigurasi tahunan" />
                            <NavLink label="Periode KKN" href={route('admin.periode.index')} desc="Manajemen siklus aktif" />
                            <NavLink label="Lokasi KKN" href={route('admin.lokasi.index')} desc="Database wilayah" />
                            <NavLink label="Data Mahasiswa" href={route('admin.mahasiswa.index')} desc="Sinkronisasi SIKAD" />
                        </NavGroup>

                        <NavGroup title="Mesin Operasional" color="blue" icon={Shuffle}>
                            <NavLink label="Validasi Berkas" href={route('admin.pendaftaran.index')} desc="Review registrasi" />
                            <NavLink label="Plotting Unit" href={route('admin.kelompok.index')} desc="Distribusi peserta" />
                            <NavLink label="Penugasan DPL" href={route('admin.dpl.penugasan')} desc="Workflow pembimbing" />
                            <NavLink label="Mutasi Peserta" href={route('admin.peserta.pindah.index')} desc="Redistribusi manual" />
                        </NavGroup>

                        <NavGroup title="Monitoring & Audit" color="purple" icon={Activity}>
                            <NavLink label="Log Aktivitas" href={route('admin.laporan.index')} desc="Tracking log digital" />
                            <NavLink label="Program Kerja" href={route('admin.laporan.program-kerja.index')} desc="Audit progker" />
                            <NavLink label="Audit Kualitas" href={route('admin.activity-audit.index')} desc="Deep system check" />
                            <NavLink label="Rekapitulasi Nilai" href={route('admin.grade-reports.index')} desc="Final sertifikasi" />
                        </NavGroup>

                        <NavGroup title="Informasi & Publik" color="amber" icon={Globe}>
                            <NavLink label="Profil LPPM" href={route('admin.konten.profil.index')} desc="CMS profil lembaga" />
                            <NavLink label="Warta Utama" href={route('admin.warta-utama.index')} desc="Broadcast pengumuman" />
                            <NavLink label="Unduhan Dokumen" href={route('admin.unduhan.index')} desc="Bank data dokumen" />
                            <NavLink label="Sistem Param" href={route('admin.pengaturan.sistem')} desc="Global settings" />
                        </NavGroup>
                    </div>
                </div>

                {/* --- INTELLIGENCE ALERT (URGENT FIX) --- */}
                {(intelligence?.high_risk_count ?? 0) > 0 && (
                    <motion.div 
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="bg-rose-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-rose-200"
                    >
                        <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none rotate-12">
                             <AlertTriangle size={260} strokeWidth={1} />
                        </div>
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center gap-4 border-b border-white/20 pb-6 w-fit">
                                    <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Audit Intelligence Security</span>
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">
                                     {intelligence?.high_risk_count} Anomali Pendaftaran Ditemukan
                                </h3>
                                <p className="text-sm font-black text-rose-100 uppercase tracking-tight opacity-70 leading-relaxed max-w-2xl">
                                    Sistem mendeteksi adanya ketidaksesuaian data pendaftaran antar faksi atau indikasi duplikasi NIK. Tindakan manual diperlukan untuk menjaga integritas database KKN 2026/2027.
                                </p>
                            </div>
                            <Link 
                                href="/admin/auditor-aktivitas" 
                                className="px-16 py-8 bg-white text-rose-600 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all shadow-2xl shadow-rose-900/20 active:scale-95"
                            >
                                Jalankan Auditor
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            <ConfirmDialog
                open={phaseConfirm.show}
                onClose={() => setPhaseConfirm({ ...phaseConfirm, show: false })}
                onConfirm={() => {
                    if (active_period_id) {
                        setProcessing(true);
                        router.post('/admin/dashboard/switch-phase', { target: phaseConfirm.target, period_id: active_period_id }, { onSuccess: () => { setPhaseConfirm({ show: false, target: '', label: '' }); setProcessing(false); } });
                    }
                }}
                title="Konfirmasi Fase"
                message={`Pindahkan program ke fase ${phaseConfirm.label.toUpperCase()}?`}
                confirmLabel="Eksekusi"
                confirmVariant="primary"
                processing={processing}
            />
        </AppLayout>
    );
}

interface NavGroupProps {
    title: string;
    children: React.ReactNode;
    color: string;
    icon: LucideIcon;
}

function NavGroup({ title, children, color, icon: Icon }: NavGroupProps) {
    const borders: Record<string, string> = { 
        emerald: 'border-emerald-100 bg-emerald-50/20', 
        blue: 'border-blue-100 bg-blue-50/20', 
        purple: 'border-purple-100 bg-purple-50/20', 
        amber: 'border-amber-100 bg-amber-50/20' 
    };
    const groupTexts: Record<string, string> = { 
        emerald: 'text-emerald-500', 
        blue: 'text-blue-500', 
        purple: 'text-purple-500', 
        amber: 'text-amber-500' 
    };

    return (
        <motion.div 
            whileHover={{ y: -8 }}
            className={clsx(
                "border rounded-[3rem] p-10 space-y-10 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200 group relative overflow-hidden",
                borders[color]
            )}
        >
            <div className={clsx("absolute -top-4 -right-4 opacity-[0.03] transition-opacity duration-700 group-hover:opacity-[0.08]", groupTexts[color])}>
                 <Icon size={120} strokeWidth={1} />
            </div>
            <h4 className={clsx("text-[10px] font-black uppercase tracking-[0.4em] mb-2 pl-1", groupTexts[color])}>{title}</h4>
            <div className="grid grid-cols-1 gap-3 relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

function NavLink({ label, href, desc }: { label: string; href: string; desc: string }) {
    return (
        <Link 
            href={href} 
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-50 text-slate-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all group/link shadow-sm hover:shadow-xl hover:shadow-emerald-100"
        >
            <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-tight leading-none mb-1 text-slate-800 group-hover/link:text-white transition-colors">{label}</p>
                <p className="text-[9px] font-bold text-slate-400 group-hover/link:text-emerald-100 uppercase tracking-widest truncate">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-200 group-hover/link:text-white transition-all transform group-hover/link:translate-x-1" />
        </Link>
    );
}

function Metric({ title, subtitle, value, icon: Icon, color }: { title: string; subtitle: string; value: number; icon: LucideIcon; color: string }) {
    const iconColors: Record<string, string> = { emerald: 'text-emerald-500 bg-emerald-50', blue: 'text-blue-500 bg-blue-50', purple: 'text-purple-500 bg-purple-50', amber: 'text-amber-500 bg-amber-50' };
    
    return (
        <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-100 flex flex-col justify-between group overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-10 text-slate-50 pointer-events-none group-hover:text-emerald-500/5 transition-colors">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center mb-8 border border-transparent transition-all group-hover:bg-slate-900 group-hover:text-white", iconColors[color])}>
                <Icon size={26} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 group-hover:text-emerald-600 transition-colors">{title}</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block mb-4">{subtitle}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value.toLocaleString()}</p>
            </div>
        </motion.div>
    );
}

function StageBtn({ label, active, done, onAction }: { label: string; active: boolean; done: boolean; onAction: () => void }) {
    return (
        <motion.button 
            whileHover={!active && !done ? { scale: 1.05 } : {}}
            whileTap={!active && !done ? { scale: 0.95 } : {}}
            onClick={onAction} 
            disabled={active || done} 
            className={clsx(
                "px-8 py-5 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all border uppercase",
                active 
                    ? "bg-emerald-600 text-white border-white shadow-2xl shadow-emerald-500/30 scale-110 z-20" 
                    : done 
                        ? "bg-emerald-950/20 text-emerald-500 border-white/5 opacity-50 cursor-default" 
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-emerald-500/30 hover:text-emerald-500"
            )}
        >
            {label}
        </motion.button>
    );
}

function StatusRow({ label, status, badge, icon }: { label: string; status: string; badge: string; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between group py-3 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
                 <div className={clsx("h-2 w-2 rounded-full", badge === 'emerald' ? "bg-emerald-500" : badge === 'blue' ? "bg-blue-500" : "bg-amber-500")} />
                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                 <span className={clsx(
                    "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                    badge === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    badge === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                    "bg-amber-50 text-amber-600 border-amber-100"
                 )}>
                    {status}
                 </span>
                 {icon && <div className="hidden group-hover:block transition-all transform scale-125">{icon}</div>}
            </div>
        </div>
    );
}
