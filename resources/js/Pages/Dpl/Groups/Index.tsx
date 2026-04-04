import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
 MapPinIcon, 
 UserGroupIcon, 
 DocumentTextIcon, 
 FlagIcon, 
 IdentificationIcon,
 ChevronRightIcon,
 SparklesIcon
} from '@heroicons/react/24/outline';
import type { PageProps } from '@/types';

interface GroupData {
 id: number;
 code: string;
 name: string;
 status: string;
 registrations_count: number;
 daily_reports_count: number;
 work_programs_count: number;
 period: { name: string };
 location: { village_name: string };
}

interface Props extends PageProps {
 groups: GroupData[];
}

export default function DplGroupsIndex({ groups }: Props) {
 return (
 <AppLayout title="Unit Bimbingan">
 <Head title="Registry Unit KKN" />
 
 <div className="space-y-10 pb-16">
 {/* Professional Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="h-1.5 w-1.5 rounded-lg bg-primary" />
 <span className="text-[10px] text-sm text-slate-400 Pembimbing</span>
 </div>
 <h1 className="text-3xl font-extrabold text-slate-900 
 Unit <span className="text-primary">Kelompok</span> Bimbingan
 </h1>
 <p className="text-slate-500 text-sm mt-2 font-medium">Manajemen dan pengawasan teknis seluruh unit KKN di bawah koordinasi Anda.</p>
 </div>

 <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200
 <div className="p-3 bg-primary/10 rounded-xl">
 <UserGroupIcon className="h-5 w-5 text-primary" />
 </div>
 <div>
 <span className="text-[10px] text-sm text-slate-400 block">Total Penugasan</span>
 <span className="text-xl font-extrabold text-slate-900">{groups.length} <span className="text-xs text-slate-400">UNIT</span></span>
 </div>
 </div>
 </div>

 {groups.length === 0 ? (
 <div className="bg-white rounded-lg border border-slate-200 p-24 text-center group
 <div className="relative inline-block mb-6">
 <IdentificationIcon className="h-16 w-16 text-slate-100 group-transition-transform" />
 <div className="absolute top-0 right-0 h-4 w-4 bg-slate-200 rounded-lg" />
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-2">Penugasan Belum Terdeteksi</h3>
 <p className="text-slate-400 text-sm text-xs max-w-sm mx-auto">Sinyal penugasan kelompok belum dipancarkan oleh administrator pusat.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
 {groups.map((g) => (
 <Link 
 key={g.id} 
 href={`/dpl/groups/${g.id}`} 
 className="group block bg-white rounded-lg border border-slate-200 p-8 hover:border-primary/30 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-8 text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
 <SparklesIcon className="h-32 w-32" />
 </div>
 
 <div className="mb-8 flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary">
 <UserGroupIcon className="h-6 w-6" />
 </div>
 <div>
 <p className="text-[9px] font-semibold text-slate-400 mb-1">Kode Sektor</p>
 <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition underline decoration-primary/10 decoration-2">{g.code}</h3>
 </div>
 </div>
 <StatusBadge status={g.status} className="px-3 py-1 rounded-lg text-[9px] font-extrabold />
 </div>
 
 <div className="space-y-4 mb-10 relative z-10">
 <div className="flex items-center gap-3 text-slate-500">
 <MapPinIcon className="h-4 w-4 text-primary/50" />
 <span className="text-[11px] text-sm text-slate-600">{g.location.village_name}</span>
 </div>
 <div className="flex items-center gap-3 text-slate-400">
 <IdentificationIcon className="h-4 w-4" />
 <span className="text-[10px] font-semibold ">{g.period.name}</span>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-8 relative z-10">
 <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 text-center group/stat hover:bg-white hover:border-primary">
 <UserGroupIcon className="h-4 w-4 text-slate-300 mx-auto mb-2 group-hover/stat:text-primary transition-colors" />
 <p className="text-[10px] font-semibold text-slate-900">{g.registrations_count}</p>
 <p className="text-[8px] text-sm text-slate-400 mt-1">Anggota</p>
 </div>
 <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 text-center group/stat hover:bg-white hover:border-primary">
 <DocumentTextIcon className="h-4 w-4 text-slate-300 mx-auto mb-2 group-hover/stat:text-primary transition-colors" />
 <p className="text-[10px] font-semibold text-slate-900">{g.daily_reports_count}</p>
 <p className="text-[8px] text-sm text-slate-400 mt-1">Laporan</p>
 </div>
 <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 text-center group/stat hover:bg-white hover:border-primary">
 <FlagIcon className="h-4 w-4 text-slate-300 mx-auto mb-2 group-hover/stat:text-primary transition-colors" />
 <p className="text-[10px] font-semibold text-slate-900">{g.work_programs_count}</p>
 <p className="text-[8px] text-sm text-slate-400 mt-1">Proker</p>
 </div>
 </div>

 <div className="mt-8 flex items-center justify-between px-2 group/btn">
 <span className="text-[9px] font-semibold text-slate-300 group-hover:text-primary transition-colors ">Buka Arsip Pemantauan</span>
 <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary">
 <ChevronRightIcon className="h-4 w-4" />
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 </AppLayout>
 );
}
