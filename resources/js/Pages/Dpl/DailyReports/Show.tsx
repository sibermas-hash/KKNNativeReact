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
    ExternalLink
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
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button 
                        onClick={() => setLightboxUrl(null)} 
                        className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={lightboxUrl} 
                        alt="Bukti Kegiatan" 
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/dpl/laporan-harian" 
                            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                        >
                            <ArrowLeft size={22} strokeWidth={2.5} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{report.title}</h1>
                            <p className="text-sm text-slate-400 font-bold mt-1">
                                <span className="text-slate-300">#{String(report.id).padStart(4, '0')}</span>
                                <span className="mx-3 text-slate-200">•</span>
                                {report.date}
                                <span className="mx-3 text-slate-200">•</span>
                                <StatusBadge status={report.status} />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profil Mahasiswa - Compact Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black shrink-0 border border-emerald-100">
                            {report.student.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">{report.student.name}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{report.student.nim}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">{report.group.name}</span>
                        </div>
                        {report.group.location?.village_name && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                <Navigation size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700">{report.group.location.village_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
                    {/* Main Content Column */}
                    <div className="space-y-8">
                        {/* Narasi Kegiatan */}
                        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <FileText size={18} className="text-emerald-500" />
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Deskripsi Kegiatan</h2>
                            </div>
                            <div className="p-8">
                                <p className="text-base text-slate-700 leading-[1.9] whitespace-pre-line font-medium">
                                    {report.activity}
                                </p>
                                {report.output && (
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target & Output</span>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-line">
                                            {report.output}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Galeri Foto Bukti - INLINE PREVIEW */}
                        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Camera size={18} className="text-emerald-500" />
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bukti Dokumentasi</h2>
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    {report.file_kegiatan.length} Lampiran
                                </span>
                            </div>
                            <div className="p-8">
                                {imageFiles.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {imageFiles.map((file) => (
                                            <div key={file.id} className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-emerald-300 transition-all shadow-sm aspect-[4/3] bg-slate-50">
                                                <img 
                                                    src={file.preview_url} 
                                                    alt={file.file_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                {/* Overlay Controls */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <button
                                                            onClick={() => setLightboxUrl(file.preview_url)}
                                                            className="h-10 px-4 rounded-xl bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/30 transition-all flex-1 justify-center"
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
                                                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-[9px] font-bold text-white/80 truncate max-w-[80%]">
                                                    {file.file_name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <Camera size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-xs font-bold text-slate-300">Tidak ada foto yang diunggah</p>
                                    </div>
                                )}

                                {/* Non-Image Files */}
                                {otherFiles.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Berkas Lainnya</p>
                                        {otherFiles.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.download_url}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText size={18} className="text-slate-400 group-hover:text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.file_name}</span>
                                                </div>
                                                <Download size={14} className="text-slate-300 group-hover:text-emerald-500" />
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
                                    <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Catatan Revisi Sebelumnya</h3>
                                </div>
                                <p className="text-sm font-medium text-amber-700 leading-relaxed italic">
                                    "{report.review_notes}"
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Geotagging Section */}
                        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <Navigation size={16} className="text-emerald-500" />
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Verifikasi Lokasi</h2>
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
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="block text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Lat</span>
                                                <span className="text-xs font-bold text-slate-900 tabular-nums">{Number(report.latitude).toFixed(6)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="block text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Lng</span>
                                                <span className="text-xs font-bold text-slate-900 tabular-nums">{Number(report.longitude).toFixed(6)}</span>
                                            </div>
                                        </div>
                                        {report.gps?.accuracy && (
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Akurasi GPS</span>
                                                <span className={clsx(
                                                    "text-xs font-black tabular-nums",
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
                                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Jarak dari {report.gps.reference_label ?? 'Posko'}</span>
                                                    <span className={clsx(
                                                        "text-lg font-black tabular-nums",
                                                        report.gps.distance_to_reference_meters <= 5000 ? "text-emerald-700" : "text-rose-700"
                                                    )}>
                                                        {report.gps.distance_to_reference_meters >= 1000 
                                                            ? `${(report.gps.distance_to_reference_meters / 1000).toFixed(1)} km`
                                                            : `${report.gps.distance_to_reference_meters} m`
                                                        }
                                                    </span>
                                                </div>
                                                {report.gps.distance_to_reference_meters <= 5000 
                                                    ? <CheckCircle2 size={24} className="text-emerald-500" />
                                                    : <AlertCircle size={24} className="text-rose-500" />
                                                }
                                            </div>
                                        )}
                                        <a
                                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                                        >
                                            Buka di Google Maps <ExternalLink size={12} />
                                        </a>
                                    </>
                                ) : (
                                    <div className="py-12 text-center">
                                        <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-xs font-bold text-slate-300">Koordinat tidak tersedia</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Panel Verifikasi DPL */}
                        <section className="bg-white rounded-[2rem] border-2 border-emerald-500 shadow-lg shadow-emerald-100/50 overflow-hidden">
                            <div className="bg-emerald-600 px-6 py-5 flex items-center gap-4 text-white">
                                <ShieldCheck size={22} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Panel Verifikasi</p>
                                    <p className="text-sm font-black">Keputusan DPL</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-500 leading-relaxed">
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
                                    className="w-full h-14 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
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
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Catatan Revisi
                                        </label>
                                        <textarea
                                            value={revisionForm.data.revision_notes}
                                            onChange={(e) => revisionForm.setData('revision_notes', e.target.value)}
                                            rows={3}
                                            disabled={!canReview}
                                            className="w-full rounded-xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition disabled:opacity-50 placeholder:text-slate-300 resize-none"
                                            placeholder="Tulis arahan perbaikan untuk mahasiswa..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!canReview || revisionForm.processing || !revisionForm.data.revision_notes.trim()}
                                        className="w-full h-12 bg-white border-2 border-amber-400 text-amber-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-400 hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
