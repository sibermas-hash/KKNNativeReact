import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import GeotaggingMap from '@/Components/ui/GeotaggingMap';
import { 
    ArrowLeft, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Download, 
    Clock, 
    User,
    ShieldCheck,
    Navigation,
    Target,
    MapPin,
    Camera,
    X,
    ZoomIn,
    ExternalLink,
    LayoutGrid
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface Attachment {
    id: number;
    file_name: string;
    file_path: string;
    download_url: string;
    preview_url: string;
    is_image: boolean;
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
        name: string;
        nim: string;
    };
    group: {
        name: string;
        location?: {
            village_name?: string | null;
            address?: string | null;
        };
    };
    file_kegiatan: Attachment[];
    ai_summary?: string;
    ai_analysis?: {
        summary: string;
        abcd_compliance: number;
        quality_score: number;
        feedback: string;
        tags: string[];
    };
}

interface Props {
    report: ReportDetail;
}

export default function DplDailyReportShow({ report }: Props) {
    const approveForm = useForm({});
    const revisionForm = useForm({
        revision_notes: report.review_notes ?? '',
    });
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const canReview = report.can_review;
    const hasCoordinates = report.latitude != null && report.longitude != null;
    const imageFiles = report.file_kegiatan.filter(f => f.is_image);
    const otherFiles = report.file_kegiatan.filter(f => !f.is_image);

    return (
        <AppLayout title="Detail Logbook">
            <Head title={`Logbook: ${report.title}`} />

            {/* Lightbox Modal */}
            {lightboxUrl && (
                <div 
                    className="fixed inset-0 z-[100] bg-emerald-950/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button 
                        onClick={() => setLightboxUrl(null)} 
                        className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[90vh] flex items-center justify-center"
                    >
                        <img 
                            src={lightboxUrl} 
                            alt="Bukti kegiatan mahasiswa" 
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/dosen/laporan-harian" 
                            className="h-12 w-12 rounded-2xl bg-white border border-emerald-50 flex items-center justify-center text-emerald-950 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                        >
                            <ArrowLeft size={22} strokeWidth={2.5} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">{report.title}</h1>
                            <p className="text-sm text-emerald-950 font-bold mt-1">
                                <span className="text-emerald-300">#{String(report.id).padStart(4, '0')}</span>
                                <span className="mx-3 text-emerald-100">•</span>
                                {report.date}
                                <span className="mx-3 text-emerald-100">•</span>
                                <StatusBadge status={report.status} />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profil Mahasiswa - Compact Bar */}
                <div className="bg-white rounded-2xl border border-emerald-50 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold shrink-0 border border-emerald-100">
                            {report.student.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-950">{report.student.name}</p>
                            <p className="text-xs font-bold text-emerald-950 uppercase">{report.student.nim}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 rounded-xl border border-emerald-50">
                            <MapPin size={14} className="text-emerald-950" />
                            <span className="text-xs font-bold text-emerald-950">{report.group.name}</span>
                        </div>
                        {report.group.location?.village_name && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                <Navigation size={14} className="text-[#1a7a4a]" />
                                <span className="text-xs font-bold text-emerald-800">{report.group.location.village_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
                    {/* Main Content Column */}
                    <div className="space-y-8">
                        {/* Narasi Kegiatan */}
                        <section className="bg-white rounded-xl border border-emerald-50 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-emerald-50 flex items-center gap-3">
                                <FileText size={18} className="text-[#1a7a4a]" />
                                <h2 className="text-sm font-bold text-emerald-950 uppercase">Deskripsi Kegiatan</h2>
                            </div>
                            <div className="p-8">
                                <p className="text-base text-emerald-950 leading-[1.9] whitespace-pre-line font-medium">
                                    {report.activity}
                                </p>
                                {report.output && (
                                    <div className="mt-8 pt-6 border-t border-emerald-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target size={14} className="text-[#1a7a4a]" />
                                            <span className="text-sm font-bold text-emerald-950 uppercase">Target & Output</span>
                                        </div>
                                        <p className="text-sm text-emerald-950 leading-relaxed bg-emerald-50/30 p-6 rounded-2xl border border-emerald-50 whitespace-pre-line">
                                            {report.output}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Galeri Foto Bukti - INLINE PREVIEW */}
                        <section className="bg-white rounded-xl border border-emerald-50 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-emerald-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Camera size={18} className="text-[#1a7a4a]" />
                                    <h2 className="text-sm font-bold text-emerald-950 uppercase">Bukti Dokumentasi</h2>
                                </div>
                                <span className="text-sm font-bold text-emerald-300 uppercase bg-emerald-50/30 px-3 py-1 rounded-full border border-emerald-50">
                                    {report.file_kegiatan.length} Lampiran
                                </span>
                            </div>
                            <div className="p-8">
                                {imageFiles.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {imageFiles.map((file) => (
                                            <div key={file.id} className="group relative rounded-2xl overflow-hidden border-2 border-emerald-50/60 hover:border-emerald-300 transition-all shadow-sm aspect-[4/3] bg-emerald-50/30">
                                                <img 
                                                    src={file.preview_url} 
                                                    alt={file.file_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                {/* Overlay Controls */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <button
                                                            onClick={() => setLightboxUrl(file.preview_url)}
                                                            className="h-10 px-4 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-bold uppercase flex items-center gap-2 hover:bg-white/30 transition-all flex-1 justify-center"
                                                        >
                                                            <ZoomIn size={14} /> Perbesar
                                                        </button>
                                                        <a 
                                                            href={file.download_url}
                                                            className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-all shrink-0"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                                {/* File Name Tag */}
                                                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-emerald-950/40 backdrop-blur-sm text-sm font-bold text-white/80 truncate max-w-[80%]">
                                                    {file.file_name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center border-2 border-dashed border-emerald-50 rounded-2xl">
                                        <Camera size={32} className="mx-auto text-emerald-100 mb-3" />
                                        <p className="text-xs font-bold text-emerald-300">Tidak ada foto yang diunggah</p>
                                    </div>
                                )}

                                {/* Non-Image Files */}
                                {otherFiles.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <p className="text-sm font-bold text-emerald-950 uppercase mb-3">Berkas Lainnya</p>
                                        {otherFiles.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.download_url}
                                                className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-xl border border-emerald-50 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText size={18} className="text-emerald-950 group-hover:text-emerald-600" />
                                                    <span className="text-xs font-bold text-emerald-800 truncate max-w-[200px]">{file.file_name}</span>
                                                </div>
                                                <Download size={14} className="text-emerald-100 group-hover:text-emerald-600" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Catatan Revisi Sebelumnya */}
                        {report.review_notes && (
                            <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Clock size={16} className="text-amber-500" />
                                    <h3 className="text-sm font-bold text-amber-800 font-semibold uppercase text-xs">Catatan Revisi Sebelumnya</h3>
                                </div>
                                <p className="text-sm font-medium text-amber-700 leading-relaxed">
                                    "{report.review_notes}"
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* AI Intelligence Audit Panel */}
                        {report.ai_analysis && (
                            <section className="bg-white rounded-xl border-2 border-emerald-50 shadow-xl shadow-emerald-500/5 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700">
                                    <ShieldCheck size={160} />
                                </div>
                                <div className="bg-emerald-50 px-6 py-5 flex items-center gap-4 border-b border-emerald-50">
                                    <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <LayoutGrid size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold uppercase text-emerald-950">Automated Audit</p>
                                        <p className="text-sm font-bold text-emerald-600">AI Assistant Review</p>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse shadow-lg shadow-emerald-200">
                                            <div className="w-1 h-1 rounded-full bg-white animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-8 space-y-6 relative">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="block text-sm font-bold text-emerald-950 uppercase">ABCD Compliance</span>
                                            <div className="flex items-end gap-2 text-3xl font-bold text-emerald-950 leading-none tracking-tighter">
                                                {report.ai_analysis.abcd_compliance}
                                                <span className="text-sm text-emerald-200">/10</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-emerald-50/30 rounded-full overflow-hidden border border-emerald-50 mt-2">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${report.ai_analysis.abcd_compliance * 10}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="block text-sm font-bold text-emerald-950 uppercase">Quality Score</span>
                                            <div className="flex items-end gap-2 text-3xl font-bold text-emerald-950 leading-none tracking-tighter">
                                                {report.ai_analysis.quality_score}
                                                <span className="text-sm text-emerald-200">/10</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-emerald-50/30 rounded-full overflow-hidden border border-emerald-50 mt-2">
                                                <div 
                                                    className="h-full bg-emerald-600 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${report.ai_analysis.quality_score * 10}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="block text-sm font-bold text-emerald-950 uppercase">AI Feedback</span>
                                        <p className="text-xs font-bold text-emerald-900 leading-relaxed bg-emerald-50/30 p-4 rounded-xl border border-emerald-50">
                                            "{report.ai_analysis.feedback}"
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {report.ai_analysis.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-sm font-bold uppercase rounded-lg border border-emerald-50 transition-colors hover:bg-emerald-100">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                        {/* Geotagging Section */}
                        <section className="bg-white rounded-xl border border-emerald-50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-emerald-50 flex items-center gap-3">
                                <Navigation size={16} className="text-[#1a7a4a]" />
                                <h2 className="text-sm font-bold text-emerald-950 uppercase">Verifikasi Lokasi</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {hasCoordinates ? (
                                    <>
                                        <GeotaggingMap 
                                            lat={report.latitude!} 
                                            lng={report.longitude!} 
                                            label={report.title} 
                                            height="200px" 
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-50">
                                                <span className="block text-sm font-bold text-emerald-300 uppercase mb-1">Lat</span>
                                                <span className="text-xs font-bold text-emerald-950 tabular-nums">{Number(report.latitude).toFixed(6)}</span>
                                            </div>
                                            <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-50">
                                                <span className="block text-sm font-bold text-emerald-300 uppercase mb-1">Lng</span>
                                                <span className="text-xs font-bold text-emerald-950 tabular-nums">{Number(report.longitude).toFixed(6)}</span>
                                            </div>
                                        </div>
                                        {report.gps?.accuracy && (
                                            <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-50 flex items-center justify-between">
                                                <span className="text-sm font-bold text-emerald-950 uppercase">Akurasi GPS</span>
                                                <span className={clsx(
                                                    "text-xs font-bold tabular-nums",
                                                    report.gps.accuracy <= 50 ? "text-emerald-600" : report.gps.accuracy <= 150 ? "text-amber-600" : "text-rose-600"
                                                )}>
                                                    ±{Math.round(report.gps.accuracy)}m
                                                </span>
                                            </div>
                                        )}
                                        {report.gps?.distance_to_reference_meters != null && (
                                            <div className={clsx(
                                                "p-4 rounded-xl border flex items-center justify-between",
                                                report.gps.distance_to_reference_meters <= 5000 
                                                    ? "bg-emerald-50 border-emerald-100" 
                                                    : "bg-rose-50 border-rose-100"
                                            )}>
                                                <div>
                                                    <span className="block text-sm font-bold uppercase text-emerald-950">Jarak dari {report.gps.reference_label ?? 'Posko'}</span>
                                                    <span className={clsx(
                                                        "text-lg font-bold tabular-nums",
                                                        report.gps.distance_to_reference_meters <= 5000 ? "text-emerald-950" : "text-rose-700"
                                                    )}>
                                                        {report.gps.distance_to_reference_meters >= 1000 
                                                            ? `${(report.gps.distance_to_reference_meters / 1000).toFixed(1)} km`
                                                            : `${report.gps.distance_to_reference_meters} m`
                                                        }
                                                    </span>
                                                </div>
                                                {report.gps.distance_to_reference_meters <= 5000 
                                                    ? <CheckCircle2 size={24} className="text-[#1a7a4a]" />
                                                    : <AlertCircle size={24} className="text-rose-500" />
                                                }
                                            </div>
                                        )}
                                        <a
                                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full h-10 rounded-xl bg-emerald-900 text-white text-sm font-bold font-semibold uppercase text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                                        >
                                            Buka di Google Maps <ExternalLink size={12} />
                                        </a>
                                    </>
                                ) : (
                                    <div className="py-6 text-center">
                                        <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-xs font-bold text-slate-300">Koordinat tidak tersedia</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Panel Verifikasi DPL */}
                        <section className="bg-white rounded-xl border-2 border-[#f3f4f6]0 shadow-lg shadow-emerald-100/50 overflow-hidden">
                            <div className="bg-emerald-600 px-6 py-5 flex items-center gap-4 text-white">
                                <ShieldCheck size={22} />
                                <div>
                                    <p className="text-sm font-bold font-semibold uppercase text-xs text-emerald-200">Panel Verifikasi</p>
                                    <p className="text-sm font-bold">Keputusan DPL</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-50 text-xs font-bold text-emerald-950 leading-relaxed uppercase">
                                    {canReview 
                                        ? "Laporan ini menunggu keputusan Anda. Silahkan periksa narasi, bukti foto, dan lokasi GPS sebelum mengambil tindakan."
                                        : "Laporan ini sudah difinalisasi dan tidak dapat diubah lagi."
                                    }
                                </div>

                                {/* Tombol ACC */}
                                <button
                                    type="button"
                                    disabled={!canReview || approveForm.processing}
                                    onClick={() => approveForm.patch(`/dpl/laporan-harian/${report.id}/setujui`)}
                                    className="w-full h-14 bg-emerald-600 text-white font-bold text-sm font-semibold uppercase text-xs rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
                                >
                                    <CheckCircle2 size={20} /> Setujui Logbook
                                </button>

                                {/* Form Revisi */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        revisionForm.patch(`/dpl/laporan-harian/${report.id}/revisi`);
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-bold text-emerald-950 uppercase mb-2">
                                            Catatan Revisi
                                        </label>
                                        <textarea
                                            value={revisionForm.data.revision_notes}
                                            onChange={(e) => revisionForm.setData('revision_notes', e.target.value)}
                                            rows={3}
                                            disabled={!canReview}
                                            className="w-full rounded-xl border border-emerald-50 p-4 text-sm font-bold text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition disabled:opacity-50 placeholder:text-black resize-none"
                                            placeholder="Tulis arahan perbaikan untuk mahasiswa..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!canReview || revisionForm.processing || !revisionForm.data.revision_notes.trim()}
                                        className="w-full h-12 bg-white border-2 border-amber-400 text-amber-600 font-bold text-xs font-semibold uppercase text-xs rounded-2xl hover:bg-amber-400 hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Kembalikan untuk Revisi
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
