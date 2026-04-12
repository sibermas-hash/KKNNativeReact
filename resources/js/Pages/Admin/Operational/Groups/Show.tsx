import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { 
    ArrowLeft, 
    ClipboardList, 
    MapPin, 
    ShieldCheck, 
    Users,
    Activity,
    Target,
    Zap,
    Briefcase,
    Building2,
    LayoutDashboard,
    Globe,
    Camera,
    Info,
    CheckCircle2,
    UserCheck,
    Lock,
    ExternalLink,
    Search,
    ChevronRight,
    UserPlus,
    Cpu,
    ArrowRight
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface GroupLecturer {
    id: number;
    nama?: string | null;
    nip?: string | null;
    pivot?: {
        role?: string | null;
    } | null;
}

interface GroupStudent {
    id: number;
    status: string;
    role?: string | null;
    mahasiswa?: {
        nim?: string | null;
        nama?: string | null;
        fakultas?: {
            nama?: string | null;
        } | null;
        prodi?: {
            nama?: string | null;
        } | null;
    } | null;
}

interface WorkProgram {
    id: number;
    title?: string | null;
    status?: string | null;
}

interface GroupData {
    id: number;
    code?: string | null;
    nama_kelompok?: string | null;
    token?: string | null;
    capacity?: number | null;
    status: string;
    periode?: {
        name?: string | null;
    } | null;
    lokasi?: {
        village_name?: string | null;
        district_name?: string | null;
        regency_name?: string | null;
        full_name?: string | null;
        address?: string | null;
    } | null;
    dosen?: GroupLecturer[];
    peserta?: GroupStudent[];
    program_kerja?: WorkProgram[];
    posko?: {
        id?: number;
        latitude?: number | string | null;
        longitude?: number | string | null;
        gmaps_link?: string | null;
        photo_url?: string | null;
        photo_name?: string | null;
        updated_at?: string | null;
    } | null;
}

interface Props extends PageProps {
    group: GroupData;
    members?: GroupStudent[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function GroupShow({ group, members = [] }: Props) {
    const memberRows = members.length > 0 ? members : (group.peserta ?? []);
    const lecturerRows = group.dosen ?? [];
    const workPrograms = group.program_kerja ?? [];
    const mainLecturer = lecturerRows.find((l) => l.pivot?.role === 'Ketua') ?? lecturerRows[0] ?? null;
    const approvedCount = memberRows.filter((m) => m.status === 'approved').length;
    const pendingCount = memberRows.filter((m) => m.status === 'pending').length;
    const availableSlots = Math.max((group.capacity ?? 0) - approvedCount, 0);

    return (
        <AppLayout title={`Unit Detail: ${group.code || ''}`}>
            <Head title={`Group Insight: ${group.nama_kelompok || ''}`} />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Link
                                href={route('admin.kelompok.index')}
                                className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group/back"
                            >
                                <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                            </Link>
                            <div className="space-y-1">
                                <div className="flex items-center gap-4 text-emerald-600">
                                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                     <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Unit Insight</span>
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col pt-2">
                                    Unit <span>{group.code || 'Node'}</span>.
                                </h1>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            {group.nama_kelompok} <br />
                            <span className="text-slate-900 not-italic">Diagnosis menyeluruh terhadap kluster unit, pembina taktis, inventarisasi anggota, dan manifest program kerja.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 shrink-0">
                        <div className="h-24 px-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-center gap-1 shadow-sm group">
                             <div className="flex items-center gap-3">
                                <Lock size={12} className="text-slate-300" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic">Access Token</span>
                             </div>
                             <p className="text-xl font-black text-slate-900 tracking-wider font-mono group-hover:text-emerald-600 transition-colors uppercase leading-none">{group.token || 'UNGENERATED'}</p>
                        </div>
                        <div className="h-24 px-10 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                             <div className="flex flex-col gap-1 relative z-10">
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.3em] leading-none italic">Operational Status</span>
                                <div className="scale-110 origin-left translate-y-1">
                                    <StatusBadge status={group.status} />
                                </div>
                             </div>
                        </div>
                    </div>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <MetricCard label="Active Period" value={group.periode?.name || 'N/A'} icon={Briefcase} color="slate" />
                    <MetricCard label="Lead Director" value={mainLecturer?.nama?.split(' ')[0] || 'UNSET'} icon={UserCheck} color="emerald" />
                    <MetricCard label="Authorized Seats" value={approvedCount} icon={CheckCircle2} color="emerald" />
                    <MetricCard label="Awaiting Review" value={pendingCount} icon={Activity} color="amber" />
                    <MetricCard label="Capacity Delta" value={availableSlots} icon={Lock} color="rose" />
                    <MetricCard label="Work Manifests" value={workPrograms.length} icon={ClipboardList} color="slate" />
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    <div className="xl:col-span-8 space-y-12">
                        {/* --- UNIT PERSONNEL LEDGER --- */}
                        <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                            <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                         <Users size={24} className="text-white" />
                                    </div>
                                    <div className="space-y-1">
                                         <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Personnel Inventory</h3>
                                         <p className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Anggota Kelompok</p>
                                    </div>
                                </div>
                                <div className="h-px flex-1 mx-10 bg-white/5 hidden lg:block" />
                                <div className="flex items-center gap-4 text-white">
                                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Load</span>
                                     <span className="text-2xl font-black text-emerald-500 italic">{memberRows.length}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Identify / NIM</th>
                                            <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Department Vector</th>
                                            <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Assigned Role</th>
                                            <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Verification</th>
                                            <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {memberRows.length > 0 ? memberRows.map((m) => (
                                            <tr key={m.id} className="group hover:bg-emerald-50/20 transition-all">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{m.mahasiswa?.nama || '-'}</span>
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">{m.mahasiswa?.nim || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none">{m.mahasiswa?.prodi?.nama || '-'}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none italic">{m.mahasiswa?.fakultas?.nama || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className={clsx(
                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic leading-none",
                                                        m.role === 'Ketua' ? "bg-emerald-950 text-emerald-500 shadow-xl shadow-emerald-500/10" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {m.role === 'Ketua' && <ShieldCheck size={12} />}
                                                        {m.role || 'ANGGOTA'}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="scale-90 origin-left">
                                                        <StatusBadge status={m.status} />
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                        <Link
                                                            href={route('admin.pendaftaran.show', m.id)}
                                                            className="h-12 px-6 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                                                            title="Inspect"
                                                        >
                                                            Inspect
                                                        </Link>
                                                        {m.role !== 'Ketua' && m.status === 'approved' ? (
                                                            <Link
                                                                href={route('admin.pendaftaran.jadikan-ketua', m.id)}
                                                                method="post"
                                                                as="button"
                                                                className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 hover:rotate-6 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                                                title="Promote to Lead"
                                                            >
                                                                <UserCheck size={18} />
                                                            </Link>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-10 py-24 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic opacity-50">Personnel Database Offline</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* --- WORK MANIFEST INVENTORY --- */}
                        <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                            <div className="px-10 py-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                                         <ClipboardList size={24} className="text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Work Manifests</h3>
                                         <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Daftar Program Kerja</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Threads</span>
                                     <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-black text-slate-900">
                                          {workPrograms.length}
                                     </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-4">
                                {workPrograms.length > 0 ? workPrograms.map((p) => (
                                    <div key={p.id} className="group/pro relative flex items-center justify-between p-8 bg-white border border-slate-100 rounded-3xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-50 transition-all overflow-hidden">
                                        <div className="flex items-center gap-8 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover/pro:bg-slate-900 group-hover/pro:text-emerald-500 transition-all">
                                                <Zap size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-base font-black text-slate-900 uppercase tracking-tighter group-hover/pro:text-emerald-700 transition-colors italic">{p.title || 'Untitled Manifest'}</span>
                                                <div className="flex items-center gap-3">
                                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Protocol ID: #{p.id.toString().padStart(4, '0')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="scale-90 group-hover/pro:scale-100 transition-transform">
                                            <StatusBadge status={p.status || 'draft'} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[2.5rem] bg-slate-50/10 flex flex-col items-center gap-6">
                                        <Info size={48} className="text-slate-200" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest leading-none">No Manifests Detected</p>
                                            <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest italic">Kluster ini belum menginisiasi program kerja.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>

                    {/* --- RIGHT COMMAND SIDEBAR --- */}
                    <div className="xl:col-span-4 space-y-12">
                        {/* --- LEADERSHIP STACK --- */}
                        <motion.section variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-10 relative overflow-hidden group/l shadow-2xl">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                                 <Briefcase size={200} strokeWidth={1} />
                            </div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover/l:bg-emerald-600 group-hover/l:text-white transition-all">
                                     <ShieldCheck size={20} />
                                </div>
                                <div className="space-y-0.5">
                                     <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Leadership Stack</h3>
                                     <p className="text-xl font-black text-white uppercase tracking-tighter">Pembina Kelompok</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                {lecturerRows.length > 0 ? (
                                    lecturerRows.map((l) => (
                                        <div key={l.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group/card hover:bg-white hover:text-slate-950 transition-all flex flex-col gap-4 shadow-sm">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black uppercase tracking-tighter italic leading-none">{l.nama || '-'}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono group-hover/card:text-emerald-600 transition-colors leading-none pt-1">NIP: {l.nip || '-'}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest group-hover/card:bg-slate-950 group-hover/card:text-white transition-all">
                                                     Role: {l.pivot?.role || 'ANGGOTA'}
                                                </div>
                                                <ShieldCheck size={24} className="text-emerald-500 opacity-20 group-hover/card:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm font-bold text-slate-500 italic uppercase">NO LECTURER ASSIGNED TO MODULE.</p>
                                )}
                            </div>
                        </motion.section>

                        {/* --- GEO-INTELLIGENCE HUB --- */}
                        <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-10 space-y-10 shadow-2xl shadow-slate-200/50 group/geo relative overflow-hidden">
                             <div className="flex items-center gap-5">
                                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover/geo:bg-slate-900 group-hover/geo:text-white transition-all">
                                     <MapPin size={20} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-0.5">
                                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Geo-Intelligence</h3>
                                     <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Lokasi & Posko</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic ml-1">Deployment Zone</p>
                                     <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group/loc hover:border-emerald-500 transition-all">
                                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight italic group-hover/loc:text-emerald-700 transition-colors leading-tight mb-2">
                                              {group.lokasi?.full_name || group.lokasi?.village_name || 'UNMAPPED'}
                                          </p>
                                          {group.lokasi?.address && (
                                              <div className="flex items-start gap-3 opacity-60">
                                                   <Building2 size={14} className="shrink-0 mt-0.5" />
                                                   <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight">{group.lokasi.address}</p>
                                              </div>
                                          )}
                                     </div>
                                </div>

                                {group.posko ? (
                                    <div className="space-y-6">
                                        {group.posko.photo_url && (
                                            <div className="relative group/photo rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 group-hover/geo:rotate-1 transition-transform">
                                                <img
                                                    src={group.posko.photo_url}
                                                    alt="Photo"
                                                    className="h-64 w-full object-cover group-hover/photo:scale-110 transition-transform duration-1000"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                                                     <div className="flex items-center gap-3">
                                                          <Camera size={16} className="text-emerald-500" />
                                                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Post Infrastructure Image</span>
                                                     </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-slate-200">
                                            <div className="grid grid-cols-2 gap-6 opacity-60">
                                                <div className="space-y-1">
                                                     <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Lat-Coord</p>
                                                     <p className="text-xs font-black font-mono uppercase">{group.posko.latitude || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                     <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Long-Coord</p>
                                                     <p className="text-xs font-black font-mono uppercase">{group.posko.longitude || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="h-px w-full bg-white/10" />
                                            {group.posko.gmaps_link ? (
                                                <a
                                                    href={group.posko.gmaps_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full h-16 bg-emerald-600 hover:bg-white hover:text-slate-900 rounded-2xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
                                                >
                                                    <Globe size={18} strokeWidth={3} />
                                                    Launch External Map
                                                </a>
                                            ) : (
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 italic">
                                                     <Lock size={12} /> External Signal Interrupted
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50 border-4 border-dashed border-white rounded-[2.5rem] flex flex-col items-center gap-4 group/none hover:border-emerald-100 transition-all">
                                         <Search size={40} className="text-slate-100 group-hover/none:text-emerald-100 transition-colors" />
                                         <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] group-hover/none:text-emerald-500 transition-colors italic">Infrasignal Lost</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>
                </div>

                {/* --- GOVERNANCE FOOTER --- */}
                <motion.div variants={itemVariants} className="bg-emerald-600 rounded-[3.5rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white relative overflow-hidden group/footer shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-10 group-hover/footer:rotate-12 transition-transform duration-700">
                         <Cpu size={250} strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/20">
                            <ShieldCheck size={48} strokeWidth={3} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-3xl font-black uppercase tracking-tighter leading-none italic">Authorized Insight Manifest</h4>
                            <p className="text-sm font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-2xl italic opacity-80">
                                Seluruh data pada unit operasional ini adalah representasi real-time dari sistem manajemen KKN UIN SAIZU. Perubahan pada struktur kepemimpinan, manifest proker, atau koordinat posko akan dicatat secara audit trail demi integritas program pengabdian masyarakat.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                         <div className="text-right hidden lg:block">
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50 italic">System Uptime</p>
                              <p className="text-2xl font-black italic tracking-tighter">99.99% SECURE</p>
                         </div>
                         <div className="h-20 w-px bg-white/20 hidden lg:block" />
                         <div className="h-20 w-20 rounded-[1.5rem] bg-slate-950 flex items-center justify-center shadow-2xl group-hover/footer:scale-110 transition-transform">
                              <Target size={32} className="text-emerald-500" />
                         </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: 'emerald' | 'amber' | 'rose' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Icon size={100} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-5 relative z-10">
                <div className={clsx(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-slate-900 group-hover:text-white",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    color === 'amber' ? "bg-amber-50 text-amber-600" :
                    color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60 italic leading-none">{label}</p>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{value.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
