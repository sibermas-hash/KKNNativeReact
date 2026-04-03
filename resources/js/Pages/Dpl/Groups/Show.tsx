import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
    MapPinIcon, 
    UserGroupIcon, 
    DocumentCheckIcon, 
    AcademicCapIcon, 
    CalendarIcon,
    SparklesIcon,
    InformationCircleIcon,
    FlagIcon,
    UserIcon,
    ShieldCheckIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import type { PageProps } from '@/types';

interface RegistrationData {
    id: number;
    status: string;
    student: { 
        nim: string; 
        name: string; 
        faculty?: { name: string }; 
        program?: { name: string } 
    };
}

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
}

interface Props extends PageProps {
    group: {
        id: number;
        code: string;
        name: string;
        status: string;
        capacity: number;
        period: { name: string };
        location: { village_name: string; address?: string };
        registrations: RegistrationData[];
        work_programs: WorkProgramData[];
        posko?: {
            latitude: number;
            longitude: number;
            photo_url: string;
            photo_name: string;
            updated_at: string;
        } | null;
    };
}

export default function DplGroupShow({ group }: Props) {
    return (
        <AppLayout title={group.name}>
            <Head title={`Arsip Unit: ${group.code}`} />
            
            <div className="space-y-10 pb-16">
                {/* Modern Header */}
                <div className="bg-white rounded-lg border border-slate-200 p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-primary group-hover:scale-110 transition-transform pointer-events-none">
                        <SparklesIcon className="h-48 w-48" />
                    </div>

                    <div className="relative z-10 flex shrink-0">
                        <div className="h-28 w-28rounded-lg bg-primary text-white flex items-center justify-center text-4xl font-extrabold transition-all group-hover:rotate-6 group-hover:scale-105">
                            {group.code.charAt(0)}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <div className="px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase  border border-primary/10">Sektor Operasional</div>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  tabular-nums">{group.code}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900  leading-tight uppercase italic underline decoration-primary/10 underline-offset-8">
                            {group.name}
                        </h1>
                        <p className="text-slate-400 font-bold mt-4 uppercase  text-[10px] italic flex items-center justify-center md:justify-start gap-2">
                             <MapPinIcon className="h-3 w-3" />
                             {group.location.village_name}
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center md:items-end gap-3 shrink-0">
                        <StatusBadge status={group.status} className="px-6 py-3 rounded-lg text-[10px] font-black uppercase  border-slate-100" />
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase  Lokasi Aktif</span>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-10">
                        <section className="bg-white rounded-lg border border-slate-200 p-10 relative overflow-hidden group h-fit">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <InformationCircleIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-black uppercase  italic text-slate-900">Spesifikasi Unit</h3>
                            </div>

                            <dl className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center group/item">
                                    <dt className="text-[10px] font-black text-slate-400 uppercase  group-hover/item:text-primary transition-colors">Koordinasi Periode</dt>
                                    <dd className="text-xs font-bold text-slate-700 uppercase  italic bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{group.period.name}</dd>
                                </div>
                                <div className="flex justify-between items-center group/item">
                                    <dt className="text-[10px] font-black text-slate-400 uppercase  group-hover/item:text-primary transition-colors">Vektor Lokasi</dt>
                                    <dd className="text-xs font-bold text-slate-700 uppercase  italic">{group.location.village_name}</dd>
                                </div>
                                <div className="flex justify-between items-center group/item pt-4 border-t border-slate-50">
                                    <dt className="text-[10px] font-black text-slate-400 uppercase  group-hover/item:text-primary transition-colors">Utilisasi Kapasitas</dt>
                                    <dd className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-900 tabular-nums italic underline decoration-primary/20 decoration-2">{group.registrations.length}</span>
                                        <span className="text-[10px] font-bold text-slate-300">/ {group.capacity} PERSONEL</span>
                                    </dd>
                                </div>
                            </dl>
                            
                            <div className="mt-10 p-5 rounded-lg bg-slate-50 border border-slate-100
                                 <div className="flex items-center gap-2 mb-2">
                                     <CalendarIcon className="h-3 w-3 text-primary" />
                                     <span className="text-[9px] font-black text-slate-400 uppercase  Pembaruan</span>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase  italic">Seluruh data bimbingan disinkronkan secara real-time dari node setiap mahasiswa.</p>
                            </div>
                        </section>

                        {/* Data Posko Lapangan */}
                        <section className="bg-white rounded-lg border border-slate-200 p-10 relative overflow-hidden group h-fit">
                            <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h3 className="text-sm font-black uppercase  italic text-slate-900">Data Posko Lapangan</h3>
                            </div>

                            {group.posko ? (
                                <div className="space-y-8 relative z-10">
                                    <div className="aspect-[4/3] rounded-[1.75rem] overflow-hidden border border-slate-100 relative group/img">
                                        <img 
                                            src={group.posko.photo_url} 
                                            alt="Verifikasi Posko" 
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                            <p className="text-[9px] font-black text-white/60 uppercase  mb-1">Sumber Visual</p>
                                            <p className="text-xs font-black text-white uppercase italic  truncate">{group.posko.photo_name}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase  mb-1">LAT</p>
                                                <p className="font-mono text-[11px] font-black text-slate-900 tabular-nums">{group.posko.latitude}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase  mb-1">LONG</p>
                                                <p className="font-mono text-[11px] font-black text-slate-900 tabular-nums">{group.posko.longitude}</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={`https://www.google.com/maps?q=${group.posko.latitude},${group.posko.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase  hover:bg-black transition-all active:scale-95"
                                        >
                                            <MapPinIcon className="h-3 w-3" />
                                            Buka Peta Posko
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 inline-block mb-4
                                        <CloudArrowUpIcon className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-300 uppercase  italic">Data Menunggu</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase  mt-2 max-w-[150px] mx-auto">Data posko belum dikirim oleh kelompok.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-10 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6 px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FlagIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase  italic text-slate-900">Program Kerja Utama</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase  mt-0.5 italic">Indikator Kinerja Sektor</p>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-black text-xs tabular-nums
                        </div>

                        {group.work_programs.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 inline-block mb-4
                                    <DocumentCheckIcon className="h-10 w-10 text-slate-200" />
                                </div>
                                <h4 className="text-xs font-black text-slate-400 uppercase  italic">Belum Ada Proker Terdefinisi</h4>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {group.work_programs.map((wp) => (
                                    <div key={wp.id} className="group/item flex items-center justify-between p-5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 transition-all hover:shadow-lg cursor-default">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover/item:text-primary transition-colors">
                                                <FlagIcon className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 uppercase  truncate italic">{wp.title}</p>
                                        </div>
                                        <StatusBadge status={wp.status} className="px-3 py-1 rounded-lg text-[8px] font-extrabold uppercase  shrink-0 ml-4" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Member Ledger */}
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl border border-slate-100
                                <UserGroupIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase  italic text-slate-900">Roster Personel Sektor</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase  mt-0.5 italic">Manajemen Profil Mahasiswa</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200
                            <span className="text-[9px] font-black text-slate-300 uppercase  Aktif</span>
                            <span className="h-4 w-[1px] bg-slate-100 mx-2" />
                            <span className="text-sm font-black text-slate-900 tabular-nums italic">{group.registrations.length} <span className="text-[10px] text-slate-400">UNIT</span></span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase  italic">#</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase  italic">Identitas / NIM</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase  italic">Program Studi</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase  italic text-right">Status Pemantauan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.registrations.map((r, i) => (
                                    <tr key={r.id} className="group/row hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                        <td className="px-10 py-8 text-[11px] font-black text-slate-300 tabular-nums">{i + 1}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover/row:bg-primary/5 group-hover/row:text-primary group-hover/row:border-primary/20 transition-all
                                                    <UserIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase  italic mb-1 group-hover/row:text-primary transition-colors">{r.student.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase  tabular-nums italic">{r.student.nim}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <AcademicCapIcon className="h-4 w-4 text-slate-300" />
                                                <p className="text-[11px] font-bold text-slate-600 uppercase  italic">{r.student.program?.name ?? 'Data Akademik Menunggu'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <StatusBadge status={r.status} className="px-4 py-1.5 rounded-xl text-[9px] font-extrabold uppercase  />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
