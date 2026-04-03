import { Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
    BookOpen, 
    Target, 
    ChevronRight,
    Sparkles,
    Zap,
    Search,
    Activity,
    PlusCircle,
    LayoutGrid,
    CheckCircle2,
    Banknote,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface WorkProgram {
    id: number;
    title: string;
    description?: string;
    budget: number;
    status: string;
}

interface Props extends PageProps {
    workPrograms: WorkProgram[];
    canCreate: boolean;
}

export default function StudentWorkProgramsIndex({ workPrograms, canCreate }: Props) {
    return (
        <AppLayout title="Program Kerja">
            <Head title="Manajemen Program Kerja Mahasiswa" />
            
            <div className="space-y-12 pb-24">
                {/* Clean Professional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  leading-none italic decoration-slate-100">Implementasi Program Pengabdian</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                            Program <span className="text-primary italic">Kerja</span> KKN
                        </h1>
                            <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-xl">
                            Kelola draf dan pelaksanaan program kerja kelompok Anda. Pastikan setiap program selaras dengan target SDGs universitas.
                        </p>
                    </div>

                    {canCreate && (
                        <Link href="/student/work-programs/create">
                            <button className="h-16 px-10 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase  flex items-center gap-4 group transition-all hover:bg-black hover:scale-[1.02] active:scale-95 italic">
                                <PlusCircle className="h-5.5 w-5.5 text-primary group-hover:rotate-90 transition-transform" />
                                Ajukan Proker Baru
                            </button>
                        </Link>
                    )}
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white border border-slate-100rounded-lg p-8 flex items-center gap-6 group hover:border-primary/10 transition-all">
                        <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors italic
                            <LayoutGrid className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase  leading-none mb-2 italic">Volume Proker</p>
                            <p className="text-2xl font-black text-slate-900 tabular-nums italic leading-none">{workPrograms.length} <span className="text-[10px] font-bold text-slate-300 uppercase italic ml-1">Program</span></p>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-slate-100rounded-lg p-8 flex items-center gap-6 group hover:border-emerald-100 transition-all">
                        <div className="h-14 w-14 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 italic
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase  leading-none mb-2 italic">Tervalidasi</p>
                            <p className="text-2xl font-black text-slate-900 tabular-nums italic leading-none">{workPrograms.filter(wp => wp.status === 'approved').length} <span className="text-[10px] font-bold text-slate-300 uppercase italic ml-1">Unit</span></p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100rounded-lg p-8 flex items-center gap-6 group overflow-hidden relative italic">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-primary group-hover:scale-125 transition-all">
                            <Zap className="h-20 w-20" />
                        </div>
                        <div className="h-14 w-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary italic font-black relative z-10
                            <Activity className="h-7 w-7 animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase  leading-none mb-2 italic">Status Pelaksanaan</p>
                            <p className="text-[10px] font-black text-slate-900 uppercase  italic">Program Aktif</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {workPrograms.length === 0 ? (
                        <div className="bg-white rounded-lg border border-slate-100 p-32 text-center group overflow-hidden relative">
                             <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-105 transition-transform[2000ms]">
                                <Search className="h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-flex p-10 bg-slate-50 rounded-full border border-slate-100 mb-8 italic">
                                    <BookOpen className="h-16 w-16 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900  uppercase italic mb-3 leading-none">Daftar Proker Kosong</h3>
                                <p className="text-slate-400 font-bold uppercase  text-[10px] max-w-sm mx-auto leading-relaxed opacity-70 italic ajukan program kerja kelompok Anda untuk diverifikasi oleh Dosen Pembimbing Lapangan.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {workPrograms.map((wp) => (
                                <div 
                                    key={wp.id} 
                                    className="group bg-white rounded-lg border border-slate-100 p-10 transition-all hover:shadow-2xl hover:border-primary/20 relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-6 group-hover:scale-110 transition-transform">
                                        <Sparkles className="h-40 w-40" />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-start justify-between gap-4 italic font-black">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase  leading-none">ID Proker: #{wp.id.toString().padStart(3, '0')}</p>
                                            </div>
                                            <StatusBadge status={wp.status} className="px-5 py-1.5 rounded-xl text-[8px] font-black uppercase  border-none italic" />
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors  italic uppercase leading-tight line-clamp-2">{wp.title}</h3>
                                            {wp.description && (
                                                <p className="text-[12px] font-bold text-slate-400 leading-relaxed italic line-clamp-2 opacity-80">{wp.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10 italic">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400
                                                <Banknote className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase  leading-none mb-1">Estimasi Anggaran</p>
                                                <p className="text-sm font-black text-slate-900 tabular-nums leading-none">Rp {wp.budget.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                        
                                        <Link 
                                            href={`/student/work-programs/${wp.id}`} 
                                            className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-white group-hover:border-primary/20 transition-all italic"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[10px] font-black text-slate-300 uppercase  italic leading-none">
                        Pusat Perencanaan Program • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
