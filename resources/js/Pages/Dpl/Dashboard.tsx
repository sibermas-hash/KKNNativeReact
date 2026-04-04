import { useState, useEffect, useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 Users2,
 BookOpen,
 Star,
 MapPin,
 ArrowRight,
 BarChart3,
 Sparkles,
 Cpu,
 Fingerprint,
 
 ShieldCheck,
 Activity
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
 groups: any[];
 pendingReports: number;
 gradingProgress: string;
 atRiskStudents: any[];
 activityTrend: any[];
}

export default function DplDashboard({ groups, pendingReports, gradingProgress, atRiskStudents, activityTrend }: Props) {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 const heatmap = useMemo(() => {
 return Array.from({ length: 14 }).map((_, i) => {
 const d = new Date();
 d.setDate(d.getDate() - (13 - i));
 const dateStr = d.toISOString().split('T')[0];
 const dayData = activityTrend.find(a => String(a.date).split(' ')[0] === dateStr);
 return {
 date: dateStr,
 count: dayData ? dayData.count : 0,
 label: d.toLocaleDateString('id-ID', { weekday: 'short' })
 };
 });
 }, [activityTrend]);

 return (
 <AppLayout title="Dasbor Pembimbing">
 <Head title="Pusat Komando Pembimbing" />
 
 <div className="space-y-10 pb-16">
 {/* Sleek Minimalist Operational Header */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-200 pb-10">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-2 w-2 rounded-lg bg-emerald-500 />
 <span className="text-[10px] font-semibold text-emerald-600 ">
 DPL_COMMAND_TERMINAL_V3.2
 </span>
 </div>
 <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 ">
 Pusat <span className="text-primary">Komando</span> Pembimbing
 </h1>
 <p className="text-slate-400 text-sm text-xs flex items-center gap-2">
 <Activity className="h-3.5 w-3.5 text-emerald-500" />
 Validasi logbook dan evaluasi capaian taktis unit bimbingan.
 </p>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-6 py-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-6
 <div className="text-right">
 <span className="block text-[9px] font-semibold text-slate-400 mb-1">Status Otoritas</span>
 <span className="text-sm font-semibold text-slate-900 
 </div>
 <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-primary">
 <ShieldCheck className="h-5 w-5 stroke-[2.5px]" />
 </div>
 </div>
 </div>
 </div>

 {/* Telemetry Summary */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 <AnalyticsCard
 title="Unit Kelompok"
 value={groups.length}
 unit="Kelompok"
 icon={Users2}
 color="primary"
 delay={0}
 mounted={mounted}
 />
 <AnalyticsCard
 title="Logbook Masuk"
 value={pendingReports}
 unit="Menunggu"
 icon={BookOpen}
 color="amber"
 delay={100}
 mounted={mounted}
 />
 <AnalyticsCard
 title="Progres Penilaian"
 value={gradingProgress}
 unit="Progres"
 icon={BarChart3}
 color="emerald"
 delay={200}
 mounted={mounted}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Activity Heatmap & Unit List */}
 <div className="lg:col-span-2 space-y-6">
 {/* Heatmap Section */}
 <div className="bg-white rounded-lg border border-slate-200 p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-slate-900 pointer-events-none ">
 <Cpu className="h-32 w-32" />
 </div>
 
 <div className="relative z-10 flex items-center justify-between mb-10">
 <div>
 <h3 className="text-xl font-semibold text-slate-900 ">Aktivitas Masuk</h3>
 <p className="text-[10px] text-sm text-slate-400 mt-2">Telemetri logbook 14 siklus terakhir</p>
 </div>
 <div className="p-3 bg-slate-50 rounded-lg text-slate-300 border border-slate-200
 <BarChart3 className="h-6 w-6" />
 </div>
 </div>

 <div className="flex items-end justify-between gap-3 h-40 px-4 relative z-10">
 {heatmap.map((day: any, i: number) => {
 const height = Math.min(100, (day.count / 10) * 100);
 return (
 <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
 <div
 className={clsx(
 "w-full rounded-t-xlrelative",
 day.count > 0 ? "bg-primary : "bg-slate-100"
 )}
 style={{ height: mounted ? `${Math.max(5, height)}%` : '0%' }}
 >
 <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] text-sm py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100whitespace-nowrap z-20 pointer-events-none 
 {day.count} Laporan · {day.date}
 </div>
 </div>
 <span className="text-[9px] text-sm text-slate-400 
 </div>
 )
 })}
 </div>
 </div>

 {/* Groups Registry */}
 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
 <div className="px-6 py-8 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
 <div>
 <h3 className="text-xl font-semibold text-slate-900 ">Daftar Unit Bimbingan</h3>
 <p className="text-[10px] text-sm text-slate-400 mt-2">Daftar kelompok dalam jurisdiksi Anda</p>
 </div>
 <Fingerprint className="h-6 w-6 text-slate-300" />
 </div>
 
 {groups.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10">
 {groups.map((group) => (
 <div key={group.id} className="bg-white border border-slate-200rounded-lg p-8 hover:border-primary/30group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-6 text-primary group-transition-transform">
 <Users2 className="h-20 w-20" />
 </div>
 
 <div className="flex items-center justify-between mb-6 relative z-10">
 <div className="px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 text-primary text-[9px] font-semibold 
 {group.periode?.name || 'REGULER'}
 </div>
 <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary">
 <Users2 className="h-5 w-5" />
 </div>
 </div>
 
 <h4 className="text-2xl font-semibold text-slate-900 group-hover:text-primary transition ">{group.code}</h4>
 <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 mb-8 font-semibold opacity-50">
 <MapPin className="h-3.5 w-3.5" />
 {group.lokasi?.village_name || group.desa || '---'}
 </div>

 <div className="grid grid-cols-2 gap-4 mb-8">
 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200
 <p className="text-[9px] text-slate-400 text-sm mb-1">Populasi</p>
 <p className="text-xl font-semibold text-slate-900 <span className="text-[10px] text-sm text-slate-400 
 </div>
 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200
 <p className="text-[9px] text-slate-400 text-sm mb-1">Arsip</p>
 <p className="text-xl font-semibold text-slate-900 <span className="text-[10px] text-sm text-slate-400 
 </div>
 </div>

 <Link
 href={`/dpl/groups/${group.id}`}
 className="w-full h-14 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-primary hover:text-white hover:border-primaryflex items-center justify-center gap-3"
 >
 Lihat Detail <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-24 text-center">
 <div className="relative inline-block">
 <Users2 className="h-16 w-16 text-slate-100 mx-auto mb-6" />
 <div className="absolute top-0 right-0 h-4 w-4 bg-slate-200 rounded-lg" />
 </div>
 <h3 className="text-xl font-extrabold text-slate-300 ">Unit Kosong</h3>
 <p className="text-[10px] text-sm text-slate-400 mt-2">Belum ada unit pendelegasian terdeteksi.</p>
 </div>
 )}
 </div>
 </div>

 {/* Operational Intelligence Sidebar */}
 <div className="lg:col-span-1 space-y-6">
 <section className="bg-white rounded-lg p-10 border border-slate-200 relative overflow-hidden group h-fit">
 <div className="absolute top-0 right-0 p-8 text-rose-500 pointer-events-none group-transition-transform">
 <Zap className="h-32 w-32" />
 </div>
 
 <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-4 mb-10 relative z-10">
 <span className="flex h-2.5 w-2.5 rounded-lg bg-rose-500 />
 Status Anomali
 </h3>

 <div className="space-y-6 relative z-10">
 {atRiskStudents.length > 0 ? (
 <>
 <div className="flex items-center justify-between px-1 mb-2">
 <span className="text-[10px] text-sm text-slate-400 Inaktif</span>
 <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 72 Jam</span>
 </div>
 
 <div className="space-y-4">
 {atRiskStudents.slice(0, 5).map((s) => (
 <div key={s.id} className="p-5 rounded-lg bg-slate-50 border border-slate-200 hover:border-rose-100 hover:bg-whitegroup/item">
 <div className="flex justify-between items-start mb-2">
 <p className="text-sm font-extrabold text-slate-900 group-hover/item:text-rose-500 transition-colors ">{s.user?.name}</p>
 </div>
 <div className="flex items-center gap-2">
 <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
 <p className="text-[10px] text-slate-400 text-sm · KELP {s.peserta?.[0]?.kelompok?.code || '---'}</p>
 </div>
 </div>
 ))}
 {atRiskStudents.length > 5 && (
 <div className="text-center pt-4 border-t border-slate-200">
 <p className="text-[9px] text-slate-400 font-semibold ">
 + {atRiskStudents.length - 5} Anomali Sinyal Lainnya
 </p>
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="py-24 text-center">
 <div className="w-20 h-20 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-6 border border-emerald-100
 <Star className="w-10 h-10 text-emerald-500" />
 </div>
 <p className="text-sm font-semibold text-emerald-600 Optimal</p>
 <p className="text-[10px] text-slate-400 mt-2 text-sm leading-normal">Seluruh unit bimbingan terdeteksi aktif.</p>
 </div>
 )}
 </div>
 </section>

 <div className="p-8 bg-slate-50rounded-lg border border-slate-200 space-y-5">
 <div className="flex items-center gap-3">
 <Sparkles className="w-5 h-5 text-primary" />
 <h4 className="text-[10px] font-extrabold text-primary ">Catatan Singkat</h4>
 </div>
 <p className="text-[10px] text-slate-400 font-medium leading-normal">
 Gunakan fitur <span className="text-slate-900 text-sm">Persetujuan Massal</span> pada modul Laporan Harian untuk memproses arsip dalam jumlah besar. 
 Pemantauan anomali membantu mencegah hambatan akademik mahasiswa.
 </p>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function AnalyticsCard({ title, value, unit, icon: Icon, color, delay, mounted }: any) {
 const colorClasses: any = {
 primary: 'text-primary bg-primary/5 border-primary/10',
 amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
 emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
 };

 return (
 <div
 className={clsx(
 "bg-white border border-slate-200 rounded-lg p-10 relative overflow-hidden",
 mounted ? "opacity-100y-0" : "opacity-0y-8"
 )}
 style={{ transitionDelay: `${delay}ms` }}
 >
 <div className="flex items-start justify-between relative z-10">
 <div className={clsx("p-4 rounded-lg border transition-transform group-colorClasses[color])}>
 <Icon className="h-8 w-8" />
 </div>
 <div className="text-right">
 <p className="text-slate-400 text-xs font-semibold mb-1">{title}</p>
 <div className="flex items-baseline justify-end gap-2">
 <h4 className="text-5xl font-semibold text-slate-900 ">{value}</h4>
 {unit && <span className="text-[10px] text-sm text-slate-400 
 </div>
 </div>
 </div>
 
 <div className="mt-8 pt-8 border-t border-slate-200 flex items-center justify-between relative z-10">
 <span className="text-[9px] text-sm text-slate-400 group-hover:text-primary transition-colors">Sinkronisasi Langsung</span>
 <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-primary group-hover:translate-x-1" />
 </div>
 </div>
 );
}
