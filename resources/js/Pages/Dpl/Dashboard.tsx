import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    type LucideIcon,
    LayoutDashboard,
    Users,
    FileText,
    CheckCircle2,
    MapPin,
    Zap,
    ShieldAlert,
    Activity,
    ChevronRight,
    Search,
    Cpu,
    Target,
    Clock,
    Briefcase,
    ShieldCheck,
    UserCheck,
    Calendar,
    Layers,
    ArrowUpRight,
    ArrowRight,
    Globe,
    Sparkles,
    TrendingUp,
    Shield
} from 'lucide-react';
import { clsx } from 'clsx';

interface GroupSummary {
    id: number;
    code: string;
    name: string;
    period_name: string;
    village_name: string;
    member_count: number;
    daily_report_count: number;
}

interface RiskStudent {
    id: number;
    name: string;
    nim: string;
    group_code: string;
}

interface ActivityTrendItem {
    date: string;
    count: number;
}

interface CoordinatorArea {
    id: number;
    district_id: string;
    district_name: string;
    regency_name: string | null;
    period_name: string;
    groups_count: number;
    villages_count: number;
    students_count: number;
}

interface Props {
    groups: GroupSummary[];
    pendingReports: number;
    gradingProgress: string;
    atRiskStudents: RiskStudent[];
    activityTrend: ActivityTrendItem[];
    coordinatorAreas: CoordinatorArea[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

function DashboardCard({
    title,
    value,
    description,
    icon: Icon,
    color = "emerald"
}: {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    color?: "emerald" | "amber" | "rose" | "cyan";
}) {
    const colors = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        cyan: "text-cyan-600 bg-cyan-50 border-cyan-100"
    };

    return (
        <motion.div 
            variants={itemVariants}
            whileHover={{ y: -10 }}
            className="rounded-[3.5rem] border border-slate-100 bg-white p-12 group transition-all relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-100"
        >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none duration-1000">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-8">
                <div className={clsx(
                    "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white border border-transparent",
                    colors[color]
                )}>
                    <Icon size={28} strokeWidth={2.5} />
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1 group-hover:text-emerald-600 transition-colors">{title}</h3>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block opacity-60 leading-none">{description}</p>
                    </div>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">{value}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function DplDashboard({
    groups,
    pendingReports,
    gradingProgress,
    atRiskStudents,
    activityTrend,
    coordinatorAreas,
}: Props) {
    return (
        <AppLayout title="Bimbingan & Pengabdian DPL">
            <Head title="Dashboard DPL | KKN UIN SAIZU" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-16 pb-32"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-slate-100 pb-4 relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Management Console</span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                                Portal <span className="text-emerald-600">Bimbingan</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-tight max-w-2xl leading-relaxed italic opacity-80">
                                Monitor integrasi laporan, verifikasi capaian harian, dan koordinasi wilayah mitra strategis secara terintegrasi.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm group hover:border-emerald-500/30 transition-all">
                         <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                              <UserCheck size={26} strokeWidth={2.5} />
                         </div>
                         <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Akses Terverifikasi</p>
                              <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Dosen Pembimbing</p>
                         </div>
                    </div>
                </motion.div>

                {/* --- STAT CARDS GRID --- */}
                <section className="grid gap-10 md:grid-cols-2 xl:grid-cols-4 px-2">
                    <DashboardCard
                        title="Unit Bimbingan"
                        value={groups.length}
                        color="emerald"
                        icon={Users}
                        description="Kelompok bimbingan aktif"
                    />
                    <DashboardCard
                        title="Laporan Masuk"
                        value={pendingReports}
                        color="amber"
                        icon={FileText}
                        description="Menunggu verifikasi"
                    />
                    <DashboardCard
                        title="Progres Nilai"
                        value={gradingProgress}
                        color="cyan"
                        icon={CheckCircle2}
                        description="Kemajuan penilaian mahasiswa"
                    />
                    <DashboardCard
                        title="Wilayah Koordinasi"
                        value={coordinatorAreas.length}
                        color="rose"
                        icon={MapPin}
                        description="Wilayah penugasan aktif"
                    />
                </section>

                <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
                    {/* --- MAIN OPERATIONAL TABLE --- */}
                    <motion.div variants={itemVariants} className="rounded-[4rem] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col group/table relative">
                        <div className="px-12 py-12 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/20">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 text-emerald-600">
                                     <Layers size={22} strokeWidth={2.5} />
                                     <h2 className="text-xs font-black uppercase tracking-[0.4em]">Unit Operasional</h2>
                                </div>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Kelompok Bimbingan DPL</p>
                            </div>
                            <div className="h-14 w-full sm:w-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-all shadow-sm group-hover/table:border-emerald-500/30 cursor-pointer">
                                <Search size={20} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                        <th className="px-12 py-8 text-left">Kode Unit</th>
                                        <th className="px-10 py-8 text-left">Entitas Kelompok</th>
                                        <th className="px-10 py-8 text-left">Lokasi</th>
                                        <th className="px-12 py-8 text-right">Opsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groups.length > 0 ? (
                                        groups.map((group) => (
                                            <tr key={group.id} className="group/row hover:bg-emerald-50/30 transition-all duration-300">
                                                <td className="px-12 py-10">
                                                    <span className="px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 group-hover/row:bg-emerald-600 transition-colors">
                                                        #{group.code}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-10 text-left">
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-black text-slate-900 uppercase tracking-tighter group-hover/row:text-emerald-700 transition-colors leading-none">{group.name}</p>
                                                        <div className="flex items-center gap-3">
                                                             <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-60 italic">{group.period_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <div className="flex items-center gap-3 text-slate-600">
                                                        <MapPin size={16} className="text-rose-500 group-hover/row:animate-bounce" />
                                                        <span className="text-xs font-black uppercase tracking-widest leading-none">{group.village_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <Link
                                                        href={`/dpl/kelompok/${group.id}`}
                                                        className="h-12 px-8 inline-flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover/row:bg-emerald-600 group-hover/row:text-white group-hover/row:border-emerald-500 transition-all shadow-sm active:scale-95 gap-3"
                                                    >
                                                        Buka Detail
                                                        <ArrowRight size={14} strokeWidth={2.5} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-32 text-center">
                                                <div className="flex flex-col items-center gap-10 opacity-10">
                                                    <Target size={120} strokeWidth={1} className="text-slate-400" />
                                                    <p className="text-xl font-black text-slate-400 uppercase tracking-[0.4em]">Belum Ada Unit Bimbingan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    <div className="space-y-12">
                        {/* --- RISK INTEL PANEL --- */}
                        <motion.div variants={itemVariants} className="rounded-[3.5rem] border border-slate-100 bg-white p-12 shadow-sm group/risk relative overflow-hidden flex flex-col">
                            <div className="space-y-4 mb-12">
                                <div className="flex items-center gap-4 text-rose-600">
                                     <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 group-hover/risk:bg-rose-600 group-hover/risk:text-white transition-all">
                                          <ShieldAlert size={20} strokeWidth={2.5} />
                                     </div>
                                     <div>
                                          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">Risk Intel</h2>
                                          <p className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Atensi Mahasiswa</p>
                                     </div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-60">Sistem mendeteksi inaktivitas laporan &gt; 72 jam.</p>
                            </div>
                            <div className="space-y-4">
                                {atRiskStudents.length > 0 ? (
                                    atRiskStudents.map((student) => (
                                        <div key={student.id} className="rounded-3xl border border-rose-50 bg-rose-50/30 p-8 group/item hover:bg-rose-600 hover:text-white transition-all duration-500 shadow-sm border-l-8 border-l-rose-500">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-600 font-black text-xl shadow-inner group-hover/item:border-rose-400 group-hover/item:text-rose-900">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <p className="text-base font-black uppercase tracking-tighter leading-none group-hover/item:text-white">{student.name}</p>
                                                    <div className="flex items-center gap-3">
                                                         <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest opacity-80 group-hover/item:text-rose-100 transition-colors">{student.nim}</span>
                                                         <div className="h-1 w-1 bg-rose-300 rounded-full group-hover/item:bg-white/30" />
                                                         <span className="text-[9px] font-black uppercase tracking-widest leading-none group-hover/item:text-rose-100 opacity-60">{student.group_code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center bg-emerald-50 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden group/all-ok">
                                        <div className="absolute inset-0 bg-emerald-600/10 -translate-x-full group-hover/all-ok:translate-x-full transition-transform duration-[2s]" />
                                        <div className="relative z-10 space-y-4">
                                             <Sparkles className="mx-auto text-emerald-500" />
                                             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.3em]">All Students Active</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* --- ANALYTIC TRENDS --- */}
                        <motion.div variants={itemVariants} className="rounded-[3rem] border border-slate-100 bg-slate-900 p-12 shadow-2xl shadow-slate-200 group/pulse relative text-white overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                                 <TrendingUp size={120} />
                            </div>
                            <div className="flex items-center gap-5 mb-12">
                                <div className="p-4 bg-emerald-600 rounded-2xl text-white">
                                     <Activity size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.4em]">Activity Pulse</span>
                            </div>
                            <div className="space-y-3 relative z-10">
                                {activityTrend.length > 0 ? (
                                    activityTrend.map((item) => (
                                        <div
                                            key={item.date}
                                            className="flex items-center justify-between rounded-2xl bg-white/5 px-6 py-5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 group/feed"
                                        >
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.date}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-base font-black text-emerald-500 tracking-tighter uppercase leading-none">
                                                    {item.count} <span className="text-[10px] text-white opacity-40 ml-1">Entri</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-12 text-center">Analytic Feed Empty</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* --- COORDINATOR MATRIX --- */}
                <section className="space-y-12">
                    <motion.div variants={itemVariants} className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                            <Globe size={30} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em] mb-1">Sovereignty Zone</h2>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Otoritas Wilayah Penugasan</p>
                        </div>
                    </motion.div>

                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {coordinatorAreas.length > 0 ? (
                            coordinatorAreas.map((area) => (
                                <motion.div 
                                    variants={itemVariants}
                                    whileHover={{ y: -10 }}
                                    key={area.id} 
                                    className="rounded-[3.5rem] border border-slate-100 bg-white p-12 group/area hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-12 text-slate-50 pointer-events-none group-hover:text-emerald-500/5 transition-colors">
                                         <Briefcase size={120} strokeWidth={1} />
                                    </div>
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-sm group-hover/area:bg-slate-900 group-hover/area:text-white group-hover/area:scale-110 transition-all">
                                            <Target size={28} strokeWidth={2.5} />
                                        </div>
                                        <span className="px-4 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">Dist: {area.district_id}</span>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover/area:text-emerald-700 transition-colors">
                                            {area.district_name}
                                            {area.regency_name ? <span className="block text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">{area.regency_name}</span> : ''}
                                        </p>
                                        <div className="flex items-center gap-3">
                                             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-60">{area.period_name}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-50 pt-10">
                                        {[
                                            { label: 'UNIT', value: area.groups_count, icon: Users },
                                            { label: 'LOK', value: area.villages_count, icon: MapPin },
                                            { label: 'PERS', value: area.students_count, icon: Shield }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50 text-center group-hover/area:bg-emerald-50 transition-colors">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 leading-none">{stat.label}</p>
                                                <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-[4rem] border border-dashed border-slate-200 bg-white py-32 text-center">
                                <div className="flex flex-col items-center gap-8 opacity-10">
                                    <Cpu size={140} strokeWidth={1} className="text-slate-200" />
                                    <p className="text-xl font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Infrastructure Segment Empty</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- FOOTER PROTOCOL --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[4rem] p-16 flex flex-col md:flex-row md:items-center justify-between gap-12 text-white relative overflow-hidden group/footer shadow-2xl shadow-slate-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.1),transparent)] opacity-50" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover/footer:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={40} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Security & <span className="text-emerald-500">Audit Protocol</span></h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl opacity-80">
                                Setiap aksi verifikasi dan inspeksi unit bimbingan terekam dalam terminal log pusat UIN SAIZU untuk ekosistem akademik yang akuntabel.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 relative z-10">
                         <div className="px-10 py-5 bg-white text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20 hover:scale-105 transition-transform cursor-default">
                              Terminal Online
                         </div>
                         <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Session Synchronization Active</p>
                         </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

