import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, 
    Users, 
    MapPin, 
    FileText, 
    Clock, 
    CheckCircle2, 
    ChevronLeft, 
    Edit, 
    BarChart3, 
    Info,
    ArrowRight,
    Target,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Props {
    period: {
        id: number;
        name: string;
        academic_year: { name: string };
        registration_start: string;
        registration_end: string;
        execution_start: string;
        execution_end: string;
        grading_start: string;
        grading_end: string;
        status_kkn: string;
        description: string | null;
        is_active: boolean;
        stats?: {
            total_students: number;
            total_groups: number;
            total_locations: number;
        };
    };
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
    }).format(new Date(dateString));
}

export default function PeriodShow({ period }: Props) {
    return (
        <AppLayout>
            <Head title={`Detail Periode - ${period.name}`} />

            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* --- HEADER --- */}
                <div className="space-y-4">
                    <Link 
                        href="/admin/periode" 
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> Kembali ke Daftar
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    period.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                )}>
                                    {period.is_active ? 'Periode Aktif' : 'Nonaktif'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Thn Akademik: {period.academic_year.name}
                                </span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-black tracking-tight flex items-center gap-4">
                                {period.name}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/admin/periode"
                                className="h-11 px-8 bg-emerald-500 text-white rounded-full flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 font-bold text-sm"
                            >
                                <ArrowRight size={18} /> Kelola via Panel Utama
                            </Link>
                        </div>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard 
                        label="Total Pendaftar" 
                        value={period.stats?.total_students || 0} 
                        unit="Mahasiswa" 
                        icon={Users} 
                        color="emerald" 
                    />
                    <InfoCard 
                        label="Jumlah Kelompok" 
                        value={period.stats?.total_groups || 0} 
                        unit="Kelompok" 
                        icon={Target} 
                        color="sky" 
                    />
                    <InfoCard 
                        label="Titik Lokasi" 
                        value={period.stats?.total_locations || 0} 
                        unit="Wilayah" 
                        icon={MapPin} 
                        color="amber" 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- LEFT: TIMELINE --- */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-sm font-black text-black uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Clock size={18} className="text-emerald-500" /> Timeline Pelaksanaan
                            </h3>
                            
                            <div className="space-y-12 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                <TimelineItem 
                                    title="Pendaftaran Mahasiswa" 
                                    date={`${formatDate(period.registration_start)} — ${formatDate(period.registration_end)}`} 
                                    active={period.status_kkn === 'pendaftaran'}
                                />
                                <TimelineItem 
                                    title="Pelaksanaan Lapangan" 
                                    date={`${formatDate(period.execution_start)} — ${formatDate(period.execution_end)}`} 
                                    active={period.status_kkn === 'pelaksanaan'}
                                />
                                <TimelineItem 
                                    title="Tahap Penilaian" 
                                    date={`${formatDate(period.grading_start)} — ${formatDate(period.grading_end)}`} 
                                    active={period.status_kkn === 'penilaian'}
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-sm font-black text-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText size={18} className="text-emerald-500" /> Deskripsi Periode
                            </h3>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    {period.description || 'Tidak ada deskripsi tambahan untuk periode pendaftaran ini.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: STATUS & QUICK ACTIONS --- */}
                    <div className="space-y-8">
                        <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-200">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Activity size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-[0.2em] mb-1">Status Alur Kerja</p>
                                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white">
                                        {period.status_kkn === 'pendaftaran' ? 'TAHAP PENDAFTARAN' : 
                                         period.status_kkn === 'pelaksanaan' ? 'TAHAP PELAKSANAAN' : 
                                         period.status_kkn === 'penilaian' ? 'TAHAP PENILAIAN' : period.status_kkn.toUpperCase()}
                                    </h4>
                                </div>
                                <div className="h-px bg-white/20 w-full" />
                                <div className="space-y-1">
                                    <p className="text-xs text-emerald-50 leading-relaxed">
                                        Saat ini periode berada pada <span className="text-white font-bold">{
                                            period.status_kkn === 'pendaftaran' ? 'tahap pendaftaran mahasiswa' :
                                            period.status_kkn === 'pelaksanaan' ? 'tahap kegiatan lapangan' :
                                            period.status_kkn === 'penilaian' ? 'tahap pemasukan nilai' : period.status_kkn
                                        }</span>. Seluruh operasional mengikuti alur ini.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 space-y-6">
                            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={16} /> Akses Cepat
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <QuickLink href="/admin/pendaftaran" label="Daftar Peserta" />
                                <QuickLink href="/admin/kelompok" label="Manajemen Kelompok" />
                                <QuickLink href="/admin/pendaftaran/plot" label="Plot Lokasi" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function InfoCard({ label, value, unit, icon: Icon, color }: { label: string, value: number, unit: string, icon: LucideIcon, color: 'emerald' | 'sky' | 'amber' }) {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all group">
            <div className={clsx('h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', colorMap[color])}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-black tracking-tight tabular-nums">
                    {value.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">{unit}</p>
            </div>
        </div>
    );
}

function TimelineItem({ title, date, active }: { title: string, date: string, active: boolean }) {
    return (
        <div className="flex gap-6 relative">
            <div className={clsx(
                "h-[36px] w-[36px] rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm transition-all",
                active ? "bg-emerald-500 ring-4 ring-emerald-100 scale-110" : "bg-slate-200"
            )}>
                {active ? <CheckCircle2 size={16} className="text-white" /> : <div className="h-2 w-2 bg-white rounded-full" />}
            </div>
            <div className={clsx("space-y-1 transition-all", active ? "opacity-100 translate-x-1" : "opacity-40")}>
                <h4 className={clsx("text-sm font-black uppercase tracking-wider", active ? "text-emerald-700" : "text-black")}>
                    {title}
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest tracking-tight">
                    {date}
                </p>
            </div>
        </div>
    );
}

function QuickLink({ href, label }: { href: string, label: string }) {
    return (
        <Link 
            href={href} 
            className="flex items-center justify-between p-4 bg-white border border-emerald-100 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all group"
        >
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{label}</span>
            <ArrowRight size={14} className="text-emerald-300 group-hover:text-emerald-600 transition-colors group-hover:translate-x-1" />
        </Link>
    );
}
