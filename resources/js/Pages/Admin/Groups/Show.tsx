import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    Users, 
    MapPin, 
    Calendar, 
    Layers, 
    ShieldCheck, 
    UserCheck, 
    Activity, 
    ArrowLeft, 
    Zap, 
    Fingerprint, 
    ExternalLink, 
    Database, 
    Globe, 
    Navigation, 
    Camera, 
    ClipboardList, 
    Clock, 
    Hash,
    Binary,
    Flag,
    X,
    Map as MapIcon
} from 'lucide-react';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
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
        full_name?: string | null;
        address?: string | null;
    } | null;
    dosen?: GroupLecturer[];
    peserta?: GroupStudent[];
    program_kerja?: WorkProgram[];
    posko?: {
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
}

export default function GroupShow({ group }: Props) {
    const lecturers = group.dosen ?? [];
    const registrations = group.peserta ?? [];
    const workPrograms = group.program_kerja ?? [];
    const chiefLecturer = lecturers.find((lecturer) => lecturer.pivot?.role === 'Ketua') ?? lecturers[0] ?? null;

    return (
        <AppLayout title={`Unit Dossier: ${group.code || ''}`}>
            <Head title={`Detail Kelompok ${group.code || group.nama_kelompok || ''}`} />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">TACTICAL_UNIT_DOSSIER_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Layers className="w-10 h-10 text-emerald-600" />
                            {group.nama_kelompok || 'UNIT'} <span className="text-emerald-600">STATE</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Otorisasi data unit operasional, penempatan geografis, dan komposisi personel KKN.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link 
                            href="/admin/kelompok" 
                            className="h-20 px-10 bg-white border border-slate-200 rounded-[2rem] flex items-center gap-6 group hover:border-emerald-600 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Go Back</span>
                                <span className="text-sm font-black text-slate-900 italic tracking-tighter leading-none">REGISTRY_INDEX</span>
                            </div>
                        </Link>

                        <div className="px-8 py-5 bg-emerald-600 border border-emerald-500 rounded-[2rem] flex items-center gap-8 shadow-2xl">
                             <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest leading-none mb-1.5">Unit Status</span>
                                 <StatusBadge status={group.status} />
                             </div>
                             <div className="h-10 w-px bg-emerald-500/50" />
                             <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest leading-none mb-1.5">Group Token</span>
                                 <span className="text-lg font-black text-white italic tracking-tighter leading-none">{group.token || 'N/A'}</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-10 xl:grid-cols-12 items-start">
                    {/* Primary Dashboard Column */}
                    <div className="xl:col-span-8 space-y-10">
                        {/* Information Grid */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative group/section"
                        >
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.8rem] shadow-sm group-hover/section:scale-110 transition-transform border border-emerald-100">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">Informasi_Global</h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">Metadata operasional dan penempatan temporal</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { label: 'PERIODE_WAKTU', value: group.periode?.name || '-', icon: Clock },
                                    { label: 'KAPASITAS_UNIT', value: `${registrations.length} / ${group.capacity || 0} PERSONEL`, icon: Users },
                                    { label: 'LOKASI_TARGET', value: group.lokasi?.full_name || group.lokasi?.village_name || '-', icon: MapPin },
                                    { label: 'ALAMAT_OPS', value: group.lokasi?.address || '-', icon: Navigation, colSpan: true },
                                    { label: 'UNIT_CODE', value: group.code || '-', icon: Hash }
                                ].map((item, idx) => (
                                    <div key={idx} className={clsx("space-y-4", item.colSpan && "lg:col-span-2")}>
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 text-emerald-600" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{item.label}</span>
                                        </div>
                                        <p className="text-base font-black text-slate-950 italic tracking-tight uppercase border-l-2 border-slate-100 pl-4">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Participant Registry */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.8rem] shadow-sm border border-emerald-100">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">Personnel_Registry</h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">Daftar mahasiswa yang terdaftar dalam unit ini</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Operator_Name</th>
                                            <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Identity_Hash</th>
                                            <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Operational_Role</th>
                                            <th className="px-12 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">System_State</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {registrations.length > 0 ? (
                                            registrations.map((registration, idx) => (
                                                <motion.tr 
                                                    key={registration.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 + 0.2 }}
                                                    className="group/row hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-12 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-xs italic shadow-sm group-hover/row:scale-110 transition-transform">
                                                                {registration.mahasiswa?.nama?.charAt(0) || 'U'}
                                                            </div>
                                                            <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover/row:text-emerald-600 transition-colors">{registration.mahasiswa?.nama || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <span className="text-xs font-black text-slate-400 tabular-nums italic tracking-widest">{registration.mahasiswa?.nim || '-'}</span>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <Badge className="px-4 py-1.5 bg-slate-100 text-slate-600 border-none text-[9px] font-black uppercase italic tracking-widest">
                                                                {registration.role || 'ANGGOTA'}
                                                            </Badge>
                                                            {registration.role !== 'Ketua' && (
                                                                <Link
                                                                    href={route('admin.pendaftaran.make-leader', registration.id)}
                                                                    method="post"
                                                                    as="button"
                                                                    className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"
                                                                    title="Tetapkan sebagai Ketua"
                                                                >
                                                                    <ShieldCheck size={16} />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-6">
                                                            <StatusBadge status={registration.status} />
                                                            <Link
                                                                href={route('admin.pendaftaran.assign-group', registration.id)}
                                                                method="post"
                                                                data={{ kelompok_id: null }}
                                                                as="button"
                                                                className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                                                title="Lepas dari Kelompok"
                                                                preserveScroll
                                                            >
                                                                <X size={16} />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-12 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-6 opacity-20">
                                                        <Fingerprint className="w-16 h-16 text-slate-300" />
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">NO_PERSONNEL_LOGGED</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* Work Programs */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.8rem] shadow-sm border border-emerald-100">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-950">Mission_Parameters</h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">Daftar rencana dan eksekusi program kerja unit</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 space-y-6">
                                {workPrograms.length > 0 ? (
                                    workPrograms.map((program, idx) => (
                                        <div key={program.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group/prog hover:bg-white hover:border-emerald-500 hover:shadow-2xl transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-1 flex-shrink-0 bg-emerald-500 rounded-full group-hover/prog:h-18 transition-all" />
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-950 uppercase italic tracking-tight">{program.title || 'NULL_MISSION_TITLE'}</h4>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">MISSION_ID: #{program.id}</span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                        <span className={clsx(
                                                            "text-[9px] font-black uppercase italic tracking-[0.2em]",
                                                            program.status === 'Selesai' ? 'text-emerald-600' : 'text-amber-600'
                                                        )}>Status_State: {program.status?.toUpperCase() || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href="/admin/laporan/program-kerja" className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm active:scale-90">
                                                <ExternalLink className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center opacity-30 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                        <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">NO_MISSION_PLAN_DETECTED</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>

                    {/* Secondary Context Column */}
                    <div className="xl:col-span-4 space-y-10">
                        {/* Supervisor Info */}
                        <motion.section 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-900 rounded-[3rem] border border-emerald-800 p-10 shadow-3xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.1] text-white">
                                <ShieldCheck size={100} className="-rotate-12" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-5 pb-8 border-b border-white/10">
                                    <div className="p-4 bg-emerald-500 rounded-2xl shadow-xl">
                                        <UserCheck className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Lead_Supervisor</h2>
                                </div>
                                
                                {chiefLecturer ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{chiefLecturer.nama || '-'}</h3>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                                                <Badge variant="success" className="px-2 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-400 border-none">{chiefLecturer.pivot?.role || 'Ketua'}</Badge>
                                                IDENTITY_HASH: {chiefLecturer.nip || '-'}
                                            </p>
                                        </div>
                                        {lecturers.length > 1 && (
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Global_DPL_Stack</span>
                                                <span className="text-xs font-black text-emerald-500 italic tabular-nums leading-none">{lecturers.length} UNITS</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-center">
                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">SUPERVISOR_NOT_ASSIGNED</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* GIS Field Station */}
                        <motion.section 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm relative group/gis"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl group-hover/gis:rotate-12 transition-transform">
                                        <MapIcon className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] italic text-slate-950">FIELD_STATION_GIS</h2>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                {group.posko ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">LATITUDE</span>
                                                <span className="text-xs font-black text-slate-900 tabular-nums italic leading-none">{group.posko.latitude || '-'}</span>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">LONGITUDE</span>
                                                <span className="text-xs font-black text-slate-900 tabular-nums italic leading-none">{group.posko.longitude || '-'}</span>
                                            </div>
                                        </div>

                                        {group.posko.gmaps_link && (
                                            <a
                                                href={group.posko.gmaps_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full h-18 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.3em] italic hover:bg-emerald-700 transition-all shadow-xl group/link"
                                            >
                                                <ExternalLink className="w-4 h-4 group-hover/link:rotate-12 transition-transform" />
                                                OPEN_MOBILE_RADAR
                                            </a>
                                        )}

                                        {group.posko.photo_url && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                                        <Camera className="w-3 h-3 text-emerald-500" />
                                                        STATION_VISUAL_CAPTURE
                                                    </span>
                                                </div>
                                                <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-2xl relative group/img">
                                                    <img
                                                        src={group.posko.photo_url}
                                                        alt={group.posko.photo_name || 'Station Visual'}
                                                        className="w-full h-64 object-cover scale-100 group-hover/img:scale-110 transition-transform duration-1000"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-[9px] font-black text-slate-300 uppercase tracking-widest italic border-t border-slate-50 pt-8">
                                            <Clock className="w-3 h-3" />
                                            SYNC_STAMP: {group.posko.updated_at || 'UNDEFINED'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center opacity-30 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50">
                                        <Activity className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] italic leading-tight px-10">NO_FIELD_STATION_DATA_TRANSMITTED</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        <div className="text-center">
                             <div className="inline-flex items-center justify-center gap-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.6em] italic opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                                 <Binary className="w-4 h-4 text-emerald-600" />
                                 SECURE_DATA_UNIT • STABLE_STATE • {new Date().getFullYear()}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
