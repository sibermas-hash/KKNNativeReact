import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
 MapPin,
 Users,
 GraduationCap,
 QrCode,
 ShieldCheck,
 Calendar,
 ChevronLeft,
 Layers,
 CheckCircle2,
 CloudUpload,
 Map as MapIcon,
 Briefcase,
 Cpu,
 Fingerprint,
 Globe,
 Activity,
 Compass,
 Target,
} from 'lucide-react';
import { Link, Head } from '@inertiajs/react';
import { clsx } from 'clsx';

interface Props extends PageProps {
 group: {
 id: number;
 code: string;
 name: string;
 token: string;
 capacity: number;
 status: string;
 period: { name: string };
 location: { village_name: string; address?: string };
 lecturer: { name: string; nip: string } | null;
 registrations: { id: number; status: string; student: { nim: string; name: string } }[];
 work_programs: { id: number; title: string; status: string }[];
 posko?: {
 latitude: number;
 longitude: number;
 photo_url: string;
 photo_name: string;
 updated_at: string;
 } | null;
 };
}

export default function GroupShow({ group }: Props) {
 return (
 <AppLayout title={`Audit Sektor: ${group.code}`}>
 <Head title={`Sektor ${group.code} | KKN UIN SAIZU`} />
 
 <div className="space-y-8 pb-24">
 {/* 
 Emerald Premium Header 
 Replacing basic header with tactical emerald gradient monitor
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <Link href="/admin/groups" className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg border border-slate-200 text-xs font-semibold text-emerald-100 hover:bg-white/20mb-2">
 <ChevronLeft className="w-3.5 h-3.5" />
 KEMBALI KE DIREKTORI_GRUP
 </Link>
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <Target className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 SECTOR_ANALYSIS_UNIT_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Kelompok <span className="text-emerald-300">{group.code}</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl flex items-center gap-3">
 <Layers className="w-5 h-5 text-emerald-300 opacity-50" />
 {group.name} — Unit Pengabdian Masyarakat Terintegrasi
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-6 shrink-0 relative z-10">
 <div className="px-6 py-6 bg-white/10 rounded-lg border border-slate-200 flex items-center gap-8 min-w-[240px] group/token">
 <div className="p-4 bg-white rounded-lg text-primary transition-transform">
 <QrCode className="h-7 w-7" />
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-emerald-200/60 mb-2.5">Akurasi_Token</span>
 <span className="text-2xl font-semibold text-white ">{group.token}</span>
 </div>
 </div>
 <StatusBadge status={group.status} className="px-6 py-5rounded-lg text-xs font-semibold border-slate-200" />
 </div>
 </div>

 {/* Core Data Grid - Tactical Modules */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:mx-2">
 <div className="lg:col-span-2 space-y-6">
 {/* Location Details - High Density */}
 <div className="bg-white p-12 rounded-lg border border-slate-200 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-14 text-slate-900 pointer-events-none group-">
 <MapPin className="h-80 w-full" />
 </div>

 <div className="flex items-center justify-between mb-12 relative z-10">
 <div className="space-y-2">
 <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary">
 <Compass className="w-6 h-6 stroke-[2.5px]" />
 </div>
 Lokasi_Penempatan
 </h3>
 <p className="text-[10px] font-semibold text-slate-400 opacity-50 ml-16">GEOGRAFIS OPERASIONAL SEKTOR</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-4">
 <InfoItem icon={MapPin} label="Sektor Desa / Kelurahan" value={group.location.village_name} />
 <InfoItem icon={Globe} label="Alamat_Fisik_Posko" value={group.location.address || 'DATA_EMPTY'} />
 <InfoItem icon={Calendar} label="Kalibrasi Periode KKN" value={group.period.name} />
 <InfoItem icon={Users} label="Kapasitas_Unit" value={`${group.registrations.length} / ${group.capacity} PERSONEL`} status={group.registrations.length >= group.capacity ? 'Kapasitas Penuh' : 'Slot Tersedia'} />
 </div>
 </div>

 {/* Posko Details - Tactical Multimedia */}
 <div className="bg-white p-12 rounded-lg border border-slate-200 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-12 text-primary pointer-events-none ">
 <ShieldCheck className="h-64 w-64" />
 </div>

 <div className="flex items-center justify-between mb-12 relative z-10">
 <div className="space-y-2">
 <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary">
 <Activity className="w-6 h-6 stroke-[2.5px]" />
 </div>
 Audit_Posko_Lapangan
 </h3>
 <p className="text-[10px] font-semibold text-slate-400 opacity-50 ml-16">INTEGRITAS FASILITAS OPERASIONAL</p>
 </div>
 </div>

 {group.posko ? (
 <div className="space-y-8 relative z-10">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-8">
 <div className="grid grid-cols-2 gap-6">
 <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg group/lathover:bg-white">
 <p className="text-[9px] font-semibold text-slate-400 mb-3 group-hover/lat:text-primary">Garis Lintang</p>
 <p className="font-mono text-base font-semibold text-slate-900">{group.posko.latitude}</p>
 </div>
 <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg group/longhover:bg-white">
 <p className="text-[9px] font-semibold text-slate-400 mb-3 group-hover/long:text-primary">Garis Bujur</p>
 <p className="font-mono text-base font-semibold text-slate-900">{group.posko.longitude}</p>
 </div>
 </div>
 <div className="p-8 bg-emerald-50 border border-emerald-100rounded-lg flex items-start gap-5
 <div className="p-2.5 bg-white rounded-lg text-emerald-600">
 <CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />
 </div>
 <div className="space-y-1.5 pt-1">
 <p className="text-[11px] font-semibold text-emerald-900 ">Geo_Lock_Verified</p>
 <p className="text-[13px] text-sm text-emerald-800/70 leading-normal">Koordinat lokasi telah terverifikasi secara presisi melalui sinkronisasi sensor perangkat mahasiswa.</p>
 </div>
 </div>
 <a 
 href={`https://www.google.com/maps?q=${group.posko.latitude},${group.posko.longitude}`}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center justify-center gap-4 w-full py-6 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800active:group/map"
 >
 <MapIcon className="w-5 h-5 " />
 OPEN_MAPS_GATEWAY
 </a>
 </div>
 <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group/img">
 <img 
 src={group.posko.photo_url} 
 alt="Foto Posko" 
 className="w-full h-full object-cover group-hover/img:transition-transform[2000ms]"
 />
 <div className="absolute inset-0 bg-gradient-transition-opacity flex flex-col justify-end p-10
 <div className="transformy-4 group-hover/img:transition-transform">
 <p className="text-[10px] font-semibold text-primary/80 mb-2">Capture_Visual_Report</p>
 <p className="text-lg font-semibold text-white line-clamp-2 leading-normal">{group.posko.photo_name}</p>
 <div className="mt-4 flex items-center gap-3 text-white/40 text-[9px] font-semibold ">
 <Activity className="h-3 w-3" /> Updated: {group.posko.updated_at}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="py-24 border-3 border-dashed border-slate-200 rounded-lg bg-slate-50/30 flex flex-col items-center justify-center text-center px-6 group/empty">
 <div className="p-8 bg-white rounded-lg text-slate-100 group-hover/empty:transition-transform">
 <CloudUpload className="w-16 h-16" />
 </div>
 <h4 className="text-lg font-semibold text-slate-900/40 mt-8 mb-3">Data_Posko_Null</h4>
 <p className="text-[12px] font-semibold text-slate-300 max-w-sm leading-normal">Mahasiswa belum menginisialisasi protokol pelaporan lokasi atau dokumentasi visual sektor.</p>
 </div>
 )}
 </div>

 {/* Student Manifest - Tactical Emerald Table */}
 <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="p-12 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
 <div className="flex items-center gap-8">
 <div className="p-4 bg-primary text-white rounded-lg relative overflow-hidden group/m">
 <Users className="h-8 w-8 stroke-[2.5px] relative z-10" />
 <div className="absolute inset-0 bg-white/20y-full group-hover/m:transition-transform" />
 </div>
 <div>
 <h3 className="text-3xl font-semibold text-white ">Manifest_Personel</h3>
 <p className="text-[10px] font-semibold text-emerald-400 mt-3 opacity-50">PERSONEL_LIST_AUTH_OK</p>
 </div>
 </div>
 <div className="px-6 py-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center gap-4">
 <div className="h-2 w-2 rounded-lg bg-emerald-500" />
 <span className="text-[12px] font-semibold text-emerald-100 ">
 {group.registrations.length} Entitas_Aktif
 </span>
 </div>
 </div>

 <div className="overflow-x-auto relative z-10">
 <table className="min-w-full divide-y divide-white/5">
 <thead className="bg-white">
 <tr>
 <th className="px-12 py-8 text-left text-xs font-semibold text-slate-500">Identitas_Personel</th>
 <th className="px-12 py-8 text-left text-xs font-semibold text-slate-500">ID_Akademik</th>
 <th className="px-12 py-8 text-right text-xs font-semibold text-slate-500">Status_Otoritas</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {group.registrations.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-12 py-32 text-center">
 <div className="flex flex-col items-center gap-8 opacity-20 group">
 <Cpu className="h-16 w-16 text-white " />
 <p className="text-[13px] font-semibold text-white ">NULL_ALLOCATION_DETECTED</p>
 </div>
 </td>
 </tr>
 ) : (
 group.registrations.map((reg) => (
 <tr key={reg.id} className="group hover:bg-white">
 <td className="px-12 py-8">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-white/5 border border-slate-200 flex items-center justify-center text-emerald-400 font-semibold">
 {reg.student.name.charAt(0)}
 </div>
 <span className="text-[16px] font-semibold text-slate-100 group-hover:text-primary transition-colors">{reg.student.name}</span>
 </div>
 </td>
 <td className="px-12 py-8">
 <span className="text-sm font-semibold text-slate-500 
 </td>
 <td className="px-12 py-8 text-right">
 <StatusBadge status={reg.status} className="text-[9px] font-semibold border-none />
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Secondary Intelligence Panel (Right) */}
 <div className="space-y-8">
 {/* Lecturer Panel - Tactical Profile */}
 <div className="bg-white p-12 rounded-lg border border-slate-200 relative overflow-hidden group">
 <div className="absolute -top-12 -right-12 p-12 text-primary pointer-events-none group-transition-transform">
 <GraduationCap className="w-64 h-64" />
 </div>

 <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-8 relative z-10">
 <div className="p-3 bg-emerald-50 text-primary rounded-lg border border-primary
 <Cpu className="w-6 h-6 stroke-[2.5px]" />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-slate-900 ">Leader_Intel</h3>
 <p className="text-[10px] font-semibold text-slate-400 mt-2 opacity-50">KOMANDO_LAPANGAN</p>
 </div>
 </div>

 {group.lecturer ? (
 <div className="space-y-8 relative z-10">
 <div className="flex flex-col gap-6 items-center text-center">
 <div className="relative">
 <div className="h-32 w-32 rounded-lg bg-slate-900 text-primary border-4 border-white flex items-center justify-center text-5xl font-semibold ring-1 ring-slate-100">
 {group.lecturer.name.charAt(0)}
 </div>
 <div className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 text-white rounded-lg border-4 border-white">
 <ShieldCheck className="h-5 w-5 fill-white" />
 </div>
 </div>
 <div className="space-y-3">
 <p className="text-2xl font-semibold text-slate-900 leading-normal">{group.lecturer.name}</p>
 <div className="flex justify-center">
 <p className="text-[10px] font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg border border-primary/10">Pembimbing_Utama</p>
 </div>
 </div>
 </div>
 <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg group/niphover:bg-white">
 <p className="text-[9px] font-semibold text-slate-400 mb-3 group-hover/nip:text-primary">Identitas_NIP</p>
 <p className="text-lg font-semibold text-slate-900 ">{group.lecturer.nip}</p>
 </div>
 </div>
 ) : (
 <div className="py-16 flex flex-col items-center justify-center border-3 border-dashed border-slate-200 rounded-lg bg-slate-50/50 group/dpl">
 <div className="p-6 bg-white rounded-lg mb-6 text-slate-100 transition-transform">
 <GraduationCap className="w-12 h-12" />
 </div>
 <p className="text-[12px] font-semibold text-slate-400 text-center px-6 opacity-50 leading-normal">Command_Center: Dosen pembimbing belum didelegasikan.</p>
 </div>
 )}

 <div className="mt-12 pt-10 border-t border-slate-200 relative z-10">
 <div className="flex gap-4">
 <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0">
 <Fingerprint className="h-4 w-4" />
 </div>
 <p className="text-[10px] text-sm text-slate-400 leading-normal opacity-50">
 Semua aktivitas lapangan berada di bawah protokol validasi bimbingan akademik.
 </p>
 </div>
 </div>
 </div>

 {/* Program Statistics - High Contrast Emerald */}
 <div className="bg-whitep-12 rounded-lg relative overflow-hidden group hover:-border border-slate-200">
 <div className="absolute -bottom-8 -right-8 p-12 text-white pointer-events-none group-group-hover:-rotate-12 transition-transform">
 <Briefcase className="w-64 h-64" />
 </div>
 
 <div className="relative z-10 space-y-6">
 <h3 className="text-xl font-semibold text-white flex items-center gap-4">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200">
 <Briefcase className="w-5 h-5 text-emerald-300" />
 </div>
 Statistik_Agenda
 </h3>
 <div className="flex items-end justify-between">
 <div className="space-y-3">
 <span className="text-8xl font-semibold text-white block ">
 {group.work_programs.length}
 </span>
 <span className="text-[11px] font-semibold text-emerald-200 ml-2">PROKER_AKTIF_SEKTOR</span>
 </div>
 <div className="p-8 bg-white/10 rounded-lg border border-slate-200 group-hover:bg-white group-hover:text-primary">
 <Activity className="w-12 h-12 stroke-[2.5px]" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function InfoItem({ icon: Icon, label, value, status }: { icon: any; label: string; value: string; status?: string }) {
 return (
 <div className="group/item space-y-5">
 <div className="flex items-center gap-3.5">
 <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 group-hover/item:bg-primary/20 group-hover/item:border-primary/30">
 <Icon className="w-4 h-4 text-primary transition-transform" />
 </div>
 <span className="text-[10px] font-semibold text-slate-300 group-hover/item:text-primary transition-colors">{label}</span>
 </div>
 <div className="space-y-4 ml-1">
 <p className="text-[17px] font-semibold text-slate-900 group-hover/item:translate-x-1 transition-transform leading-normal">
 {value}
 </p>
 {status && (
 <div className={clsx(
 "inline-flex items-center gap-3 px-4 py-1.5 rounded-lg text-[9px] font-semibold border",
 status.includes('Penuh') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
 )}>
 <div className={clsx("h-1.5 w-1.5 rounded-lg", status.includes('Penuh') ? 'bg-rose-500' : 'bg-emerald-500')} />
 {status}
 </div>
 )}
 </div>
 </div>
 );
}
