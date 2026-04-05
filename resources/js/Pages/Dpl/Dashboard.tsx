import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
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
    Globe
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
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500",
        amber: "text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-500",
        rose: "text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-500",
        cyan: "text-cyan-600 bg-cyan-50 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500"
    };

    return (
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 group hover:shadow-2xl transition-all relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all rotate-12 group-hover:rotate-0 duration-1000 pointer-events-none">
                <Icon size={120} className="text-slate-950" />
            </div>
            <div className="relative z-10 space-y-8 flex flex-col items-center text-center">
                <div className={`p-5 rounded-[1.5rem] transition-all border shadow-sm ${colors[color]}`}>
                    <Icon size={28} />
                </div>
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">{title}</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</p>
                </div>
                <p className="text-[10px] font-black text-slate-300 leading-relaxed uppercase tracking-widest italic pt-2">{description}</p>
            </div>
        </div>
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
        <AppLayout title="TERMINAL KENDALI DPL">
            <Head title="Dashboard DPL | KKN UIN" />

            <div className="space-y-12 pb-24">
                {/* --- HEADER TERMINAL --- */}
                <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-16 relative overflow-hidden group/header shadow-2xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover/header:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                         <Globe size={300} className="text-white" />
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10a853]" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.6em] italic leading-none">DPL_OPERATIONAL_UNIT_V3.5</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-widest italic uppercase leading-none">
                                DASBOR PENGENDALI <span className="text-emerald-500">DPL.</span>
                            </h1>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic max-w-2xl opacity-60 group-hover/header:opacity-100 transition-opacity">Monitoring integrasi laporan harian mahasiwa, rekapitulasi data nilai personel, <br className="hidden lg:block" /> dan optimalisasi koordinasi wilayah penempatan se-kabupaten.</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-8 group-hover/header:scale-105 transition-transform duration-700">
                                <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-900/20">
                                    <UserCheck size={28} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] leading-none mb-2 italic">STATUS_OTORITAS</p>
                                    <p className="text-lg font-black text-white uppercase italic tracking-widest leading-none">DPL_TERVERIFIKASI</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- STAT CARDS GRID --- */}
                <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 px-2">
                    <DashboardCard
                        title="UNIT_BIMBINGAN"
                        value={groups.length}
                        color="emerald"
                        icon={Users}
                        description="KELOMPOK_AKTIF_OPERASIONAL"
                    />
                    <DashboardCard
                        title="QUEUE_LAPORAN"
                        value={pendingReports}
                        color="amber"
                        icon={FileText}
                        description="PENDING_VERIFICATION_SYNC"
                    />
                    <DashboardCard
                        title="PROGRES_GRADING"
                        value={gradingProgress}
                        color="cyan"
                        icon={CheckCircle2}
                        description="PERSONEL_EVALUATION_RATE"
                    />
                    <DashboardCard
                        title="AREA_KOORDINASI"
                        value={coordinatorAreas.length}
                        color="rose"
                        icon={MapPin}
                        description="DISTRICT_COORDINATOR_ZONE"
                    />
                </section>

                <section className="grid gap-12 lg:grid-cols-[2fr,1fr] px-2">
                    {/* --- GROUPS TABLE --- */}
                    <div className="rounded-[3rem] border border-slate-100 bg-white shadow-2xl overflow-hidden flex flex-col group/table relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-50 overflow-hidden">
                            <div className="h-full w-1/4 bg-emerald-500 animate-[loading_6s_infinite]" />
                        </div>
                        
                        <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <div className="space-y-2">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                    <Layers className="w-6 h-6 text-emerald-600" />
                                    Kelompok Bimbingan DPL
                                </h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Daftar unit operasional bimbingan terverifikasi aktif</p>
                            </div>
                            <div className="h-14 w-14 bg-white border border-slate-100 rounded-[1.2rem] flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-colors shadow-sm">
                                <Search size={20} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/10 border-b border-slate-50 font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 italic">
                                        <th className="px-12 py-8">Terminal_ID</th>
                                        <th className="px-10 py-8">Nama / Periode</th>
                                        <th className="px-10 py-8">Geospasial_Village</th>
                                        <th className="px-10 py-8 text-right pr-14">Kontrol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groups.length > 0 ? (
                                        groups.map((group) => (
                                            <tr key={group.id} className="group/row hover:bg-emerald-50/20 transition-all duration-300">
                                                <td className="px-12 py-8">
                                                    <span className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic shadow-lg shadow-slate-900/10 group-hover/row:bg-emerald-600 transition-colors">
                                                        #{group.code}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-left">
                                                    <div className="space-y-1.5 flex flex-col">
                                                        <p className="text-base font-black text-slate-900 uppercase italic tracking-tighter group-hover/row:text-emerald-700 transition-colors leading-none">{group.name}</p>
                                                        <div className="flex items-center gap-3">
                                                             <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none opacity-60">{group.period_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3 text-slate-600">
                                                        <MapPin size={14} className="text-rose-500 animate-bounce" />
                                                        <span className="text-xs font-black uppercase italic tracking-widest">{group.village_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-14">
                                                    <Link
                                                        href={`/dpl/kelompok/${group.id}`}
                                                        className="h-12 px-8 inline-flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest italic text-slate-900 group-hover/row:bg-emerald-600 group-hover/row:text-white group-hover/row:border-emerald-500 transition-all shadow-sm active:scale-95 gap-3"
                                                    >
                                                        OPEN_INTERFACE
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-32 text-center">
                                                <div className="flex flex-col items-center gap-10 opacity-10">
                                                    <Target className="w-24 h-24 text-slate-400" />
                                                    <p className="text-xl font-black text-slate-400 uppercase tracking-[0.5em] italic">NULL_UNITS_ASSIGNED</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-12">
                        {/* --- RISK PANEL --- */}
                        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-2xl group/risk relative overflow-hidden">
                             <div className="absolute top-0 right-0 h-1 w-full bg-rose-500/10">
                                 <div className="h-full w-2/3 bg-rose-600 animate-pulse" />
                             </div>
                            <div className="space-y-3 mb-12">
                                <h2 className="text-sm font-black text-rose-600 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                    <ShieldAlert size={20} className="animate-bounce" />
                                    Personel Berisiko
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Inaktivitas Terminal &gt; 72 jam terdeteksi</p>
                            </div>
                            <div className="space-y-4">
                                {atRiskStudents.length > 0 ? (
                                    atRiskStudents.map((student) => (
                                        <div key={student.id} className="rounded-3xl border border-rose-50 bg-rose-50/20 p-6 group/item hover:bg-rose-50 transition-all duration-500 shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-600 font-black text-xl italic shadow-inner">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <p className="text-[13px] font-black text-slate-900 uppercase italic tracking-tighter leading-none">{student.name}</p>
                                                    <div className="flex items-center gap-3">
                                                         <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest italic opacity-70">NIM: {student.nim}</span>
                                                         <div className="h-1 w-1 bg-rose-300 rounded-full" />
                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">UNIT {student.group_code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-slate-100 italic relative overflow-hidden group/all-ok">
                                        <div className="absolute inset-0 bg-emerald-500/5 rotate-12 -translate-x-full group-hover/all-ok:translate-x-full transition-transform duration-[2s]" />
                                        <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-[0.3em] relative z-10 italic">Seluruh Personel Sinkron Aktif</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- TREND FEED --- */}
                        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-2xl group/pulse relative">
                            <div className="flex items-center gap-4 mb-10">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Tren Aktivitas &bull; 14 Hari</span>
                            </div>
                            <div className="space-y-4">
                                {activityTrend.length > 0 ? (
                                    activityTrend.map((item) => (
                                        <div
                                            key={item.date}
                                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-6 py-4 border border-transparent hover:border-emerald-100 hover:bg-white transition-all duration-300 font-bold group/feed shadow-sm"
                                        >
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{item.date}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[12px] font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                                                    {item.count} Entries
                                                </span>
                                                <ArrowUpRight size={14} className="text-emerald-500 opacity-0 group-hover/feed:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">DATA_FLOW_NULL</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- COORDINATOR ZONE --- */}
                <section className="rounded-[3rem] border border-slate-100 bg-white overflow-hidden shadow-2xl group/coord">
                    <div className="bg-emerald-600 border-b border-emerald-500 px-12 py-12 flex items-center justify-between text-white relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10" />
                        <div className="space-y-4 relative z-10">
                             <div className="flex items-center gap-4">
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-200 leading-none italic">GEOSPATIAL_COORDINATOR_NETWORK</span>
                             </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-widest leading-none">Otoritas Wilayah Penugasan</h2>
                        </div>
                        <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-[1.8rem] border border-white/20 flex items-center justify-center text-white shadow-2xl relative z-10 group-hover/coord:rotate-12 transition-transform duration-700">
                             <Briefcase size={36} />
                        </div>
                    </div>
                    <div className="grid gap-8 p-12 md:grid-cols-2 xl:grid-cols-3 bg-slate-50/30">
                        {coordinatorAreas.length > 0 ? (
                            coordinatorAreas.map((area) => (
                                <div key={area.id} className="rounded-[2.5rem] border border-slate-100 bg-white p-10 group/area hover:border-emerald-200 hover:shadow-2xl transition-all duration-500 relative">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-sm group-hover/area:scale-110 transition-transform">
                                            <Target size={28} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic opacity-40">{area.district_id}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-widest leading-tight group-hover/area:text-emerald-700 transition-colors">
                                            {area.district_name}
                                            {area.regency_name ? <span className="block text-[11px] font-black text-slate-400 mt-2 uppercase tracking-widest opacity-60 italic">{area.regency_name}</span> : ''}
                                        </p>
                                        <div className="flex items-center gap-3">
                                             <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60 leading-none">{area.period_name}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-50 pt-10">
                                        {[
                                            { label: 'UNIT', value: area.groups_count },
                                            { label: 'LOK', value: area.villages_count },
                                            { label: 'PERS', value: area.students_count }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50 text-center group-hover/area:bg-emerald-50 transition-colors">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 italic leading-none">{stat.label}</p>
                                                <p className="text-xl font-black text-slate-900 leading-none italic">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-[3rem] border border-dashed border-slate-200 bg-white py-24 text-center">
                                <div className="flex flex-col items-center gap-8 opacity-10">
                                    <Cpu size={100} className="text-slate-200" />
                                    <p className="text-xl font-black text-slate-400 uppercase tracking-[0.5em] italic leading-none">NULL_GEOSPATIAL_MAP_RECORDED</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- FOOTER SECTION --- */}
                <div className="bg-white rounded-[3rem] border border-slate-100 p-12 lg:p-16 flex flex-col md:flex-row md:items-center justify-between gap-12 shadow-2xl relative overflow-hidden group/footer">
                    <div className="absolute top-0 right-0 h-[2px] w-full bg-slate-50">
                        <div className="h-full w-1/2 bg-emerald-600 animate-[loading_5s_infinite]" />
                    </div>
                    
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-20 w-20 bg-emerald-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-900/20 group-hover/footer:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={36} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-widest leading-none">Protokol Verifikasi Otoritas</h4>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic leading-relaxed max-w-2xl opacity-60">Setiap aksi verifikasi dan inspeksi unit bimbingan terekam dalam terminal log pusat <br className="hidden lg:block" /> UIN SAIZU untuk akuntabilitas akademik operasional.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 relative z-10">
                         <div className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] italic shadow-2xl">
                              System_Heartbeat_OK
                         </div>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic opacity-40">TRK_SYNC_ACTIVE_2026</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}} />
        </AppLayout>
    );
}


