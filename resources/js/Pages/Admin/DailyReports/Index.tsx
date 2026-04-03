import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Filter,
    IdCard,
    List,
    ShieldCheck,
    Calendar,
    Activity,
    Search,
    Fingerprint,
    Cpu
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
    filters: { status?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const onFilterChange = (value: string) => {
        router.get(route('admin.reports.daily.index'), value ? { status: value } : {}, { preserveState: true });
    };

    return (
        <AppLayout title="Audit Logbook Harian">
            <Head title="Logbook Aktivitas KKN" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                FIELD_ACTIVITY_LOG_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Arsip <span className="text-emerald-300 text-glow-emerald italic">Harian</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Audit real-time terhadap logbook aktivitas operasional mahasiswa KKN. Pastikan validitas dan akuntabilitas pelaksanaan program kerja di lapangan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <List className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Entri</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{reports.data?.length ?? 0} Laporan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:mx-2">
                    <div className="relative group flex-1 max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                        <input
                            placeholder="Cari logbook atau nama personel mahasiswa..."
                            className="w-full pl-16 pr-8 py-5.5 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 outline-none focus:border-primary/50 transition-all italic uppercase placeholder:opacity-30"
                        />
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-4 bg-white/50 p-2rounded-lg border border-slate-100
                            <div className="p-3.5 bg-white text-slate-400 border border-slate-100 rounded-lg
                                <Filter className="h-5 w-5" />
                            </div>
                            <select
                                value={filters.status ?? ''}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-black uppercase  text-slate-600 w-64 h-12 focus:ring-0 cursor-pointer italic px-4 appearance-none"
                            >
                                <option value="">SEMUA STATUS OPERASIONAL</option>
                                <option value="submitted">STATUS: TERKIRIM</option>
                                <option value="approved">STATUS: TERVERIFIKASI</option>
                                <option value="revision">STATUS: PERLU REVISI</option>
                                <option value="draft">STATUS: DRAF</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden group lg:mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Tanggal_Kejadian</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Rincian_Aktivitas</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Identitas_Personel</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Unit_Sektor</th>
                                    <th className="px-10 py-7 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-14">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {(reports.data ?? []).length > 0 ? (reports.data ?? []).map((r) => (
                                    <tr key={r.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                        <td className="px-10 py-9 whitespace-nowrap">
                                            <div className="flex items-center gap-5">
                                                <div className="p-3 bg-white border border-slate-100 rounded-lg text-slate-300 group-hover/row:text-primary group-hover/row:bg-primary/5 group-hover/row:border-primary/20 transition-all
                                                    <Calendar className="h-5 w-5 stroke-[2px]" />
                                                </div>
                                                <span className="text-[13px] font-black text-slate-900 italic 
                                            </div>
                                        </td>
                                        <td className="px-10 py-9">
                                            <span className="text-[17px] font-black text-slate-900 group-hover/row:text-primary transition-colors  italic leading-none line-clamp-1 max-w-[300px] uppercase">
                                                {r.title}
                                            </span>
                                        </td>
                                        <td className="px-10 py-9">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 text-primary flex items-center justify-center font-black text-lg group-hover/row:scale-110 transition-transform italic shrink-0 leading-none">
                                                    {r.student?.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col gap-1.5 min-w-0">
                                                    <span className="text-[14px] font-black text-slate-900 truncate uppercase  italic leading-none group-hover/row:text-primary transition-colors">{r.student?.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <IdCard className="h-3.5 w-3.5 text-slate-300" />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase  italic leading-none opacity-50 px-2 bg-slate-50 rounded-lg py-0.5 border border-slate-100">NIM: {r.student?.nim}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-9">
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                                                <span className="text-[12px] font-black text-slate-900 uppercase  italic group-hover/row:text-primary transition-colors">{r.group?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-9 text-right pr-14">
                                            <StatusBadge status={r.status} className="px-5 py-2 rounded-lg text-[10px] font-black uppercase  italic border-none />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-10 opacity-30">
                                                <div className="p-10 bg-slate-50 rounded-full border border-slate-100 italic">
                                                     <Activity className="h-20 w-20 text-slate-200" />
                                                </div>
                                                <p className="text-[12px] font-black uppercase  text-slate-400 italic">SYSTEM_INFO: NO_ACTIVITY_LOGS_DETECTED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-2">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">LOGBOOK_AUDIT_PROTOCOL_V3</h4>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Logbook merupakan bukti operasional primer yang menjadi basis penilaian kompetensi mahasiswa KKN UIN SAIZU. 
                                Seluruh data laporan harian diaudit secara temporal untuk menjamin akuntabilitas pengabdian yang presisi. 
                                Pastikan verifikasi <span className="text-primary font-black uppercase italic">"Verified"</span> dilakukan berdasarkan validasi lapangan yang akurat.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">REALTIME_LOG_SYNC</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Cpu className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        Field Activity Monitor • System Integrity Ver. 3.2.0 • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
