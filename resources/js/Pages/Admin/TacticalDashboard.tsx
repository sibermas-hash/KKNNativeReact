import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { 
 Users, 
 FileText, 
 TrendingUp, 
 Activity,
 ChevronRight,
 MapPin,
 
 Globe,
 ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';

export default function TacticalDashboard() {
 return (
 <AppLayout title="Pusat Komando Taktis">
 <Head title="Gerbang Akses Otoritas" />
 
 <div className="space-y-8 pb-24">
 
 {/* Simple & Powerful Hero Banner */}
 <section className="relative overflow-hidden rounded-lg bg-whitep-12 md:p-20 border border-slate-200 group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.1),transparent_50%)]" />
 
 <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
 <div className="space-y-8 max-w-4xl text-center lg:text-left">
 <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/10 rounded-lg border border-slate-200
 <Zap className="w-4 h-4 text-emerald-300 fill-emerald-300" />
 <span className="text-[11px] font-semibold text-white ">
 SYSTEM_COMMAND_V3.2
 </span>
 </div>
 
 <h1 className="text-6xl md:text-8xl font-semibold text-white ">
 Pusat <br /> 
 <span className="text-emerald-300">KOMANDO</span>
 </h1>
 
 <p className="text-emerald-50/70 text-xl text-sm leading-normal max-w-2xl">
 Orkestrasi terpadu pengabdian masyarakat. Verifikasi laporan berkala dan validasi data KKN secara real-time.
 </p>
 
 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4">
 <button className="flex items-center gap-4 px-6 py-5 bg-white text-emerald-900rounded-lg font-semibold text-xsgroup/btn">
 Kalibrasi Data
 <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>

 <div className="relative z-10 p-1.5 bg-white/10 rounded-lg border border-slate-200 hidden xl:block">
 <div className="bg-slate-900/40 p-12 rounded-lg border border-slate-200 flex flex-col items-center gap-8 text-center min-w-[320px]">
 <div className="p-7 bg-white/10rounded-lg border border-slate-200 text-emerald-300">
 <Activity className="w-16 h-16 stroke-[3px]" />
 </div>
 <div className="space-y-3">
 <span className="block text-xs font-semibold text-emerald-400 ">System Status</span>
 <span className="text-4xl font-semibold text-white">-OK</span>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Clean Metrics Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard label="TOTAL PESERTA" value="3,214" icon={Users} color="primary" trend="+12%" />
 <MetricCard label="UNIT KELOMPOK" value="156" icon={MapPin} color="blue" trend="STABLE" />
 <MetricCard label="LAPORAN HARIAN" value="8,402" icon={FileText} color="amber" trend="ACTIVE" />
 <MetricCard label="INTEGRITAS DATA" value="98.2" icon={ShieldCheck} color="emerald" unit="%" trend="EXCELLENT" />
 </div>

 {/* Intelligence Split View */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 p-12">
 <div className="flex items-center justify-between mb-12">
 <div className="flex items-center gap-6">
 <div className="p-5 bg-primary/5 rounded-lg text-primary">
 <TrendingUp className="w-8 h-8 stroke-[2.5px]" />
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 ">Telemetri Aktivitas</h3>
 </div>
 <div className="px-6 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">Live_Feed</div>
 </div>
 
 <div className="h-64 flex items-end gap-4 px-2">
 {[45, 60, 45, 80, 55, 90, 40, 75, 65, 85, 95].map((h, i) => (
 <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group/bar cursor-default h-full">
 <div 
 className="absolute bottom-0 left-0 w-full bg-primary group-hover/bar:brightness-110rounded-t-lg
 style={{ height: `${h}%` }}
 />
 </div>
 ))}
 </div>
 </div>

 <div className="bg-white rounded-lg border border-slate-100 p-12 space-y-6 relative overflow-hidden">
 <div className="relative z-10">
 <h3 className="text-2xl font-semibold text-slate-900 mb-10">Feed Aktivitas</h3>
 <div className="space-y-8">
 <FeedItem name="Kelp Purwokerto 02" action="Submit Log-book" status="VERIFIED" />
 <FeedItem name="Tim KKN-84" action="Validasi Lokasi" status="SYNC_OK" />
 <FeedItem name="Posko Ajibarang 12" action="Unggah Laporan" status="PENDING" />
 </div>
 </div>
 </div>
 </div>

 {/* Emerald Control Footer */}
 <div className="p-16 bg-[#043d23] rounded-lg border border-slate-200 text-center md:text-left">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center justify-center md:justify-start gap-5">
 <Globe className="h-8 w-8 text-emerald-300" />
 <h4 className="text-[12px] font-semibold text-white ">GLOBAL_INTEGRITY_PROTOCOL</h4>
 </div>
 <p className="text-lg text-emerald-50/60 font-medium max-w-3xl">
 Sistem dalam kepatuhan penuh terhadap Kebijakan Otoritas Akademik UIN SAIZU. Otorisasi akses tingkat satu diaktifkan.
 </p>
 </div>
 <ShieldCheck className="h-24 w-24 text-white/5 hidden lg:block" />
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, unit, trend }: any) {
 const colorMap: Record<string, string> = {
 primary: 'bg-primary text-white
 blue: 'bg-blue-600 text-white
 amber: 'bg-amber-600 text-white
 emerald: 'bg-emerald-600 text-white
 };

 return (
 <div className="bg-white rounded-lg p-10 border border-slate-200 hover:-group cursor-default">
 <div className="flex items-center gap-5 mb-8">
 <div className={clsx("p-5 rounded-lg ", colorMap[color])}>
 <Icon className="w-7 h-7 stroke-[2.5px]" />
 </div>
 <div className="text-[10px] font-semibold text-slate-400 ">{label}</div>
 </div>

 <div className="flex items-baseline gap-3 mb-2">
 <h4 className="text-5xl font-semibold text-slate-900 ">
 {value}
 </h4>
 {unit && <span className="text-lg font-semibold text-slate-300">{unit}</span>}
 </div>
 
 <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{trend}</span>
 </div>
 );
}

function FeedItem({ name, action, status }: any) {
 return (
 <div className="flex items-center gap-6 group cursor-pointer p-2rounded-lg hover:bg-slate-50/50">
 <div className="h-14 w-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-primary font-semibold">
 {name.charAt(0)}
 </div>
 <div className="flex-1 space-y-1">
 <h5 className="font-semibold text-xs text-slate-900">{name}</h5>
 <p className="text-[10px] text-sm text-slate-400">{action}</p>
 </div>
 <div className={clsx(
 "px-3 py-1 rounded-lg text-[9px] font-semibold 
 status === 'VERIFIED' || status === 'SYNC_OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
 )}>
 {status}
 </div>
 </div>
 );
}
