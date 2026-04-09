import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import GeotaggingMap from '@/Components/ui/GeotaggingMap';
import { 
    ArrowLeft, 
    MapPin, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Download, 
    Activity, 
    Clock, 
    User,
    Layers,
    ShieldCheck,
    Navigation,
    Target,
    BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';

interface Attachment {
    id: number;
    file_name: string;
    download_url: string;
}

interface ReportDetail {
    id: number;
    date: string;
    title: string;
    activity: string;
    output?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    gps?: {
        accuracy?: number | null;
        captured_at?: string | null;
        source?: string | null;
        reference_label?: string | null;
        distance_to_reference_meters?: number | null;
    };
    status: string;
    can_review: boolean;
    review_notes?: string | null;
    student: {
        id: number;
        name: string;
        nim: string;
    };
    group: {
        id: number;
        name: string;
        location?: {
            village_name?: string | null;
            address?: string | null;
        };
    };
    file_kegiatan: Attachment[];
}

interface Props {
    report: ReportDetail;
}

export default function DplDailyReportShow({ report }: Props) {
    const approveForm = useForm({});
    const revisionForm = useForm({
        revision_notes: report.review_notes ?? '',
    });

    const canReview = report.can_review;
    const hasCoordinates = report.latitude !== null && report.latitude !== undefined && report.longitude !== null && report.longitude !== undefined;

    return (
        <AppLayout title="Inspeksi Aktivitas Harian">
            <Head title={`Audit Logbook: ${report.title}`} />

            <div className="space-y-12 pb-24">
                {/* --- TACTICAL HEADER --- */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 -mx-12 -mt-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/10 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/dpl/laporan-harian" 
                                className="h-10 w-10 bg-slate-900 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-900/10"
                            >
                                <ArrowLeft size={18} />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 italic font-black">Daily Report Audit Module</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none">
                            {report.title}
                        </h1>
                        <div className="flex items-center gap-8 mt-4">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic mb-1">DOKUMEN TERCATAT</span>
                                <span className="text-xs font-black text-emerald-950 uppercase italic tracking-widest">ID: #{report.id.toString().padStart(6, '0')}</span>
                             </div>
                             <div className="h-8 w-[1px] bg-emerald-50" />
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic mb-1">STAMPEL TANGGAL</span>
                                <span className="text-xs font-black text-emerald-950 uppercase italic tracking-widest leading-none">{report.date.toUpperCase()}</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 relative z-10">
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic mb-2">STATUS LAPORAN</span>
                            <StatusBadge status={report.status} />
                         </div>
                         <div className="h-12 w-[1px] bg-emerald-100 hidden xl:block" />
                         <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                             <FileText className="text-emerald-500" size={28} />
                         </div>
                    </div>
                </div>

                <div className="grid gap-12 lg:grid-cols-[2fr,1fr] px-2">
                    {/* --- CORE CONTENT --- */}
                    <div className="space-y-12">
                        {/* AKTIVITAS PANEL */}
                        <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                             <div className="absolute top-0 right-0 p-32 opacity-[0.02] rotate-12 pointer-events-none">
                                 <FileText size={400} className="text-emerald-600" />
                             </div>
                             
                             <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-950 text-emerald-400">
                                        <Layers size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Log Deskripsi Kegiatan</h2>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1 italic">Naratif Operasional Lapangan</p>
                                    </div>
                                </div>
                             </div>
                             
                             <div className="p-12 space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <p className="text-lg font-bold text-emerald-950 italic leading-relaxed whitespace-pre-line tracking-tight">
                                        {report.activity}
                                    </p>
                                </div>

                                {report.output && (
                                    <div className="pt-10 border-t border-emerald-50 space-y-4">
                                         <div className="flex items-center gap-3">
                                            <Target size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Target & Output</span>
                                         </div>
                                         <p className="text-sm font-bold text-slate-500 italic leading-loose whitespace-pre-line bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                            {report.output}
                                         </p>
                                    </div>
                                )}
                             </div>
                        </section>

                        {/* LAMPIRAN PANEL */}
                        <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                             <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Download size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Artefak Dokumentasi</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1 italic leading-none">Lampiran Lampiran Pendukung Aktivitas</p>
                                </div>
                             </div>
                             
                             <div className="p-10">
                                {report.file_kegiatan.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {report.file_kegiatan.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.download_url}
                                                className="group/file p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between hover:bg-emerald-600 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-5">
                                                     <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 group-hover/file:bg-emerald-500 group-hover/file:text-white transition-all shadow-inner border border-emerald-50">
                                                         <FileText size={18} />
                                                     </div>
                                                     <div className="flex flex-col">
                                                         <span className="text-xs font-black text-emerald-950 uppercase tracking-widest truncate w-40 group-hover/file:text-white transition-colors">{file.file_name}</span>
                                                         <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest group-hover/file:text-emerald-200 transition-colors italic">Artifact Registry</span>
                                                     </div>
                                                </div>
                                                <Download size={16} className="text-emerald-300 group-hover/file:text-white transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center border-4 border-dashed border-emerald-50 rounded-[3rem] italic">
                                        <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.4em]">Tidak ada artefak dokumentasi yang diunggah</p>
                                    </div>
                                )}
                             </div>
                        </section>
                    </div>

                    {/* --- ACTION & METRIC SIDEBAR --- */}
                    <div className="space-y-12">
                        {/* PERSONEL METRIC */}
                        <section className="bg-emerald-950 p-10 text-white space-y-8 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150 pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
                                 <User size={120} />
                             </div>
                             
                             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] italic leading-none">Profil Mahasiswa</span>
                                    <p className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-widest italic leading-none opacity-60">Aktor Laporan Lapangan</p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <BadgeCheck size={16} />
                                </div>
                             </div>

                             <div className="flex items-center gap-6">
                                <div className="h-20 w-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl font-black italic shadow-2xl shadow-emerald-500/20 border-4 border-white/10 group-hover:rotate-6 transition-transform">
                                    {report.student.name.charAt(0)}
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">{report.student.name}</h4>
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest italic">{report.student.nim}</span>
                                    <Link 
                                        href={`/dpl/kelompok/${report.group.id}`}
                                        className="text-[9px] font-black text-emerald-200/40 uppercase tracking-widest italic hover:text-white transition-colors"
                                    >
                                        UNIT: {report.group.name} &rarr;
                                    </Link>
                                </div>
                             </div>
                        </section>

                        {/* SPATIAL METRIC (MAP INTEGRATION) */}
                        <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                             <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-950 text-emerald-400">
                                        <Navigation size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Sinyal Geotagging</h2>
                                        <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1 italic">Verifikasi Lokasi Pelaksanaan</p>
                                    </div>
                                </div>
                             </div>
                             
                             <div className="p-8 space-y-8">
                                {hasCoordinates ? (
                                    <>
                                        <div className="space-y-6">
                                            <GeotaggingMap 
                                                lat={report.latitude!} 
                                                lng={report.longitude!} 
                                                label={report.title} 
                                                height="240px" 
                                            />
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                                    <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Latitude</span>
                                                    <span className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">{report.latitude}</span>
                                                </div>
                                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                                    <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Longitude</span>
                                                    <span className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">{report.longitude}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 bg-slate-900 p-8 text-white rounded-[2rem] shadow-xl">
                                             <div className="flex items-center gap-3">
                                                 <Activity size={12} className="text-emerald-500 animate-pulse" />
                                                 <span className="text-[9px] font-black uppercase tracking-widest italic text-emerald-400">Sensor Metadata Audit</span>
                                             </div>
                                             
                                             <div className="space-y-4">
                                                 {report.gps?.accuracy && (
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-[9px] font-black text-white/30 uppercase italic leading-none">Radius Akurasi</span>
                                                         <span className="text-xs font-black italic text-white tabular-nums">{Math.round(report.gps.accuracy)} Meters</span>
                                                     </div>
                                                 )}
                                                 {report.gps?.captured_at && (
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-[9px] font-black text-white/30 uppercase italic leading-none">Waktu Sinkron</span>
                                                         <span className="text-xs font-black italic text-white tabular-nums">{new Date(report.gps.captured_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                     </div>
                                                 )}
                                             </div>

                                             <a
                                                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full py-5 bg-emerald-600 text-white text-center text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-emerald-500 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group/btn"
                                            >
                                                TERMINAL MAPS LOKAL
                                                <ArrowLeft size={14} className="group-hover/btn:rotate-[225deg] transition-transform" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-24 text-center bg-slate-50 border border-slate-100 rounded-[2.5rem] italic space-y-6 flex flex-col items-center">
                                        <AlertCircle size={48} className="text-slate-200" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-8">Audit Sinyal: Gagal Memuat Koordinat Spasial Mahasiswa pada Laporan In i</p>
                                    </div>
                                )}
                             </div>
                        </section>

                        {/* REVIEW & AUTH ACTIONS */}
                        <section className="bg-white border-2 border-emerald-600 shadow-2xl overflow-hidden shadow-emerald-500/10">
                             <div className="bg-emerald-600 px-10 py-8 border-b border-emerald-500 flex items-center justify-between text-white relative">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-white/20 rounded-2xl flex items-center justify-center">
                                         <ShieldCheck size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-100 italic">Otoritas Validasi DPL</h2>
                                        <p className="text-sm font-black uppercase italic tracking-widest leading-none">Terminal Inspeksi Akhir</p>
                                    </div>
                                </div>
                             </div>
                             
                             <div className="p-10 space-y-8">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        {canReview 
                                            ? "Unit laporan ini dalam status AKTIF. Anda memiliki otoritas penuh untuk Menyetujui atau mengembalikan sebagai REVISI."
                                            : "Protokol inspeksi terkunci. Laporan ini telah difinalisasi dalam database akademik."
                                        }
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <button
                                        type="button"
                                        disabled={!canReview || approveForm.processing}
                                        onClick={() => approveForm.patch(`/dpl/daily-reports/${report.id}/setujui`)}
                                        className="w-full py-6 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.5em] italic hover:bg-emerald-700 shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                                    >
                                        <span className="flex items-center justify-center gap-4">
                                            SETUJUI LOG AKTIVITAS
                                            <CheckCircle2 size={18} className="group-hover/btn:scale-125 transition-transform" />
                                        </span>
                                    </button>

                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            revisionForm.patch(`/dpl/daily-reports/${report.id}/revision`);
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-3">
                                            <label htmlFor="revision_notes" className="text-[9px] font-black uppercase tracking-widest text-emerald-400 italic ml-1 leading-none inline-block">Instruksi Revisi & Ketentuan</label>
                                            <textarea
                                                id="revision_notes"
                                                value={revisionForm.data.revision_notes}
                                                onChange={(event) => revisionForm.setData('revision_notes', event.target.value)}
                                                rows={4}
                                                disabled={!canReview}
                                                className="w-full rounded-[1.5rem] border border-emerald-50 bg-emerald-50/10 p-6 text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-emerald-500 focus:bg-white transition disabled:opacity-50"
                                                placeholder="TULIS ARAHAN PERBAIKAN DI SINI..."
                                            />
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={!canReview || revisionForm.processing}
                                            className="w-full py-5 bg-white border-2 border-amber-400 text-amber-600 text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-amber-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            KIRIM PROTOKOL REVISI
                                        </button>
                                    </form>
                                </div>
                             </div>
                        </section>

                        {report.review_notes && (
                            <section className="bg-amber-50 p-10 border border-amber-200 shadow-lg shadow-amber-500/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform">
                                    <Clock size={120} className="text-amber-800" />
                                </div>
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                     <Clock size={16} className="text-amber-500" />
                                     <h2 className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic leading-none">Audit History: Review Terakhir</h2>
                                </div>
                                <p className="text-xs font-black text-amber-700 italic leading-relaxed uppercase tracking-tight relative z-10">
                                    "{report.review_notes}"
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
