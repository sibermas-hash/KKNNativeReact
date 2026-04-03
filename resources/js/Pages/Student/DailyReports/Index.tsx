import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
    FileText, 
    Calendar, 
    Edit3,
    AlertTriangle,
    ChevronRight,
    Sparkles,
    Zap,
    Search,
    History,
    Activity,
    PlusCircle,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    review_notes?: string;
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
}

export default function StudentDailyReportsIndex({ reports }: Props) {
    const reportList = reports?.data ?? [];

    return (
        <AppLayout title="Laporan Harian">
            <Head title="Riwayat Laporan Harian" />
            
            <div className="space-y-12 pb-24">
                {/* Clean Professional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <History className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  leading-none italic">Dokumentasi Pelaksanaan KKN</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900  leading-none uppercase italic">
                            Arsip <span className="text-primary italic">Laporan</span> Harian
                        </h1>
                        <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-xl">
                            Kelola rekaman aktivitas harian Anda. Pastikan setiap laporan dikirim tepat waktu untuk proses validasi oleh DPL.
                        </p>
                    </div>

                    <Link href="/student/daily-reports/create">
                        <button className="h-16 px-10 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase  flex items-center gap-4 group transition-all hover:bg-black hover:scale-[1.02] active:scale-95 italic">
                            <PlusCircle className="h-5.5 w-5.5 text-primary group-hover:rotate-90 transition-transform" />
                            Buat Laporan Baru
                        </button>
                    </Link>
                </div>

                {/* Registry Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white border border-slate-50rounded-lg p-8 flex items-center gap-6 group hover:border-primary/10 transition-all">
                        <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors italic">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase  leading-none mb-2 italic">Total Dokumentasi</p>
                            <p className="text-2xl font-black text-slate-900 tabular-nums italic leading-none">{reportList.length} <span className="text-[10px] font-bold text-slate-300 uppercase italic ml-1">Laporan</span></p>
                        </div>
                    </div>
                    
                    {reportList.some(r => r.status === 'revision') ? (
                        <div className="bg-rose-50 border border-rose-100rounded-lg p-8 flex items-center gap-6 animate-pulse">
                            <div className="h-14 w-14 rounded-lg bg-white border border-rose-100 flex items-center justify-center text-rose-500 italic font-black">
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-rose-500 uppercase  leading-none mb-2 italic Sistem</p>
                                <p className="text-lg font-black text-rose-600 uppercase  italic leading-none">Perlu Revisi Segera</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100rounded-lg p-8 flex items-center gap-6 group">
                            <div className="h-14 w-14 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 italic font-black">
                                <Activity className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase  leading-none mb-2 italic Sinkronisasi</p>
                                <p className="text-lg font-black text-emerald-600 uppercase  italic leading-none">Data Terkini (OK)</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-100rounded-lg p-8 flex items-center gap-6 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-primary group-hover:scale-125 transition-all">
                            <Zap className="h-20 w-20" />
                        </div>
                        <div className="h-14 w-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary italic font-black relative z-10
                            <Zap className="h-7 w-7 animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase  leading-none mb-2 italic">Koneksi Data</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase  italic decoration-primary/30">Tersambung ke Server</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {reportList.length === 0 ? (
                        <div className="bg-white rounded-lg border border-slate-100 p-32 text-center group overflow-hidden relative">
                             <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-105 transition-transform[2000ms]">
                                <Search className="h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-flex p-10 bg-slate-50 rounded-full border border-slate-100 mb-8 italic">
                                    <FileText className="h-16 w-16 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900  uppercase italic mb-3 leading-none">Belum Ada Laporan</h3>
                                <p className="text-slate-400 font-bold uppercase  text-[10px] max-w-sm mx-auto leading-relaxed opacity-70 italic">Sistem belum mendeteksi catatan aktivitas untuk periode aktif ini.</p>
                            </div>
                        </div>
                    ) : (
                        reportList.map((r) => (
                            <div 
                                key={r.id} 
                                className="group bg-white rounded-lg border border-slate-100 p-10 transition-all hover:shadow-2xl hover:border-primary/20 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-10"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-6 group-hover:scale-110 transition-transform">
                                    <Sparkles className="h-40 w-40" />
                                </div>
                                
                                <div className="flex flex-col md:flex-row md:items-center flex-1 gap-10 relative z-10">
                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-lg min-w-[120px] italic">
                                        <Calendar className="h-6 w-6 text-slate-300 mb-2.5" />
                                        <p className="text-[14px] font-black text-slate-900 tabular-nums leading-none mb-1.5 uppercase italic">{r.date.split(' ')[0]}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase  opacity-60 leading-none">{r.date.split(' ')[1]}</p>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase  italic decoration-slate-100 leading-none">ID Entri: #{r.id.toString().padStart(4, '0')}</p>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors  italic uppercase truncate leading-tight">{r.title}</h3>
                                        
                                        {r.review_notes && (
                                            <div className="mt-6 flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-lg italic slide-in-from-top-3">
                                                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-rose-600 uppercase  mb-1.5 italic">Umpan Balik Auditor:</p>
                                                    <p className="text-[13px] font-bold text-rose-800 leading-relaxed italic opacity-80">"{r.review_notes}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-6 relative z-10 shrink-0 border-t border-slate-50 md:border-t-0 pt-8 md:pt-0">
                                    <StatusBadge status={r.status} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase  border-none italic" />
                                    
                                    {r.status === 'revision' ? (
                                        <Link 
                                            href={`/student/daily-reports/${r.id}/edit`} 
                                            className="h-12 px-6 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase  hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-2 italic"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Perbaiki Laporan
                                        </Link>
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-white group-hover:border-primary/20 transition-all cursor-default italic">
                                            <ChevronRight className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[10px] font-black text-slate-300 uppercase  italic">
                        Pusat Kendali Dokumen • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
