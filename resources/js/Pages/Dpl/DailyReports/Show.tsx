import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import {
    Calendar,
    User,
    Users,
    MapPin, 
    FileText, 
    Image as ImageIcon,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Navigation,
    Zap,
    Activity,
    MessageSquare,
    ExternalLink,
    RefreshCw,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface Props extends PageProps {
    report: {
        id: number;
        date: string;
        title: string;
        activity: string;
        output?: string;
        latitude?: number | null;
        longitude?: number | null;
        status: string;
        review_notes?: string;
        student: { name: string; nim: string };
        group: { name: string; location?: { village_name: string } };
        file_kegiatan: { id: number; file_name: string; file_path: string }[];
    };
}

export default function DplDailyReportShow({ report }: Props) {
    const [showRevision, setShowRevision] = useState(false);
    const approveForm = useForm({});
    const revisionForm = useForm({ revision_notes: '' });

    const canReview = report.status === 'submitted' || report.status === 'revision';
    const hasCoordinates = report.latitude && report.longitude;

    const gmapsUrl = hasCoordinates 
        ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
        : null;

    return (
        <AppLayout title="Review Laporan Harian">
            <Head title="Verifikasi Absensi Mahasiswa" />
            
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 italic">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/dpl/daily-reports"
                            className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary/20 hover:shadow-xl transition-all italic"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-2 italic">
                                <Zap className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black text-slate-400 uppercase  leading-none italic">Siklus Verifikasi Lapangan</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900  uppercase italic leading-none">
                                Review <span className="text-primary italic">Laporan</span> Harian
                            </h1>
                        </div>
                    </div>
                    <StatusBadge status={report.status} className="px-8 py-3 rounded-lg text-[10px] font-black uppercase  border-none italic" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Main Content Card */}
                        <section className="bg-white rounded-lg border border-slate-100 p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                                <FileText className="h-64 w-64" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-4 border-b border-slate-50 pb-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase  italic leading-none">Identitas Kegiatan</p>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase italic  leading-tight underline decoration-primary/10 underline-offset-8">
                                        {report.title}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
                                    <MetaInfo icon={Calendar} label="Siklus Tanggal" value={report.date} />
                                    <MetaInfo icon={User} label="Identitas Mahasiswa" value={`${report.student.name} (${report.student.nim})`} />
                                    <MetaInfo icon={Users} label="Unit Kelompok" value={report.group.name} />
                                    <MetaInfo icon={MapPin} label="Sektor Penugasan" value={report.group.location?.village_name ?? 'Belum ditetapkan'} />
                                </div>

                                <div className="space-y-10 pt-10 border-t border-slate-50">
                                    <div className="space-y-4 italic">
                                        <h3 className="text-[10px] font-black uppercase  text-primary flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Uraian Operasional
                                        </h3>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-8 rounded-lg italic
                                            {report.activity}
                                        </p>
                                    </div>

                                    {report.output && (
                                        <div className="space-y-4 italic">
                                            <h3 className="text-[10px] font-black uppercase  text-emerald-600 flex items-center gap-2">
                                                <Zap className="w-4 h-4" /> Hasil / Output
                                            </h3>
                                            <p className="text-sm font-black text-slate-900 leading-relaxed uppercase italic italic 
                                                {report.output}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Attachments Section */}
                        {report.file_kegiatan.length > 0 && (
                            <section className="bg-white rounded-lg border border-slate-100 p-10 italic">
                                <h3 className="text-xs font-black uppercase  text-slate-900 mb-8 flex items-center gap-3">
                                    <ImageIcon className="w-5 h-5 text-slate-400" /> Bukti Dokumentasi Lapangan
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {report.file_kegiatan.map((f) => (
                                        <a
                                            key={f.id}
                                            href={`/storage/${f.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-5 p-5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/30 transition-all
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-900 uppercase  truncate italic">{f.file_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Buka Dokumen <ExternalLink className="inline-block w-2.5 h-2.5 ml-1" /></p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="space-y-10 italic">
                        {/* Geotagging Verification Card */}
                        <section className="bg-slate-900 rounded-lg p-10 border border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-primary group-hover:scale-125 transition-transform pointer-events-none">
                                <Navigation className="h-32 w-32" />
                            </div>
                            <h3 className="text-[10px] font-black mb-10 flex items-center gap-3 uppercase  italic text-slate-400">
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                Autentikasi Geotag
                            </h3>
                            
                            {hasCoordinates ? (
                                <div className="space-y-8 relative z-10 italic">
                                    <div className="p-6 rounded-lg bg-white/5 border border-white/5
                                        <p className="text-[9px] font-black text-primary uppercase  mb-3 italic">Koordinat GPS Terkunci</p>
                                        <div className="space-y-2 tabular-nums">
                                            <p className="text-xs font-black text-white italic">LAT: {report.latitude}</p>
                                            <p className="text-xs font-black text-white italic">LNG: {report.longitude}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={gmapsUrl!}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-4 py-5 bg-primary text-white rounded-lg text-[10px] font-black uppercase  hover:bg-primary-dark transition-all active:scale-95 italic"
                                    >
                                        <MapPin className="w-4 h-4" /> Verifikasi di Peta
                                    </a>
                                </div>
                            ) : (
                                <div className="py-10 text-center italic opacity-40">
                                    <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase  Lokasi Tidak Ditemukan</p>
                                </div>
                            )}
                        </section>

                        {/* Review Action Card */}
                        {canReview && (
                            <section className="bg-white rounded-lg border border-slate-100 p-10 italic">
                                <h3 className="text-xs font-black uppercase  text-slate-900 mb-8 border-b border-slate-50 pb-6 italic">Otoritas Verifikasi</h3>
                                <div className="space-y-5 italic">
                                    <button 
                                        onClick={() => approveForm.patch(`/dpl/daily-reports/${report.id}/approve`)}
                                        disabled={approveForm.processing}
                                        className="w-full flex items-center justify-center gap-4 py-5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase  hover:bg-emerald-600 transition-all active:scale-95 italic"
                                    >
                                        {approveForm.processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Setujui Laporan
                                    </button>
                                    <button 
                                        onClick={() => setShowRevision(!showRevision)}
                                        className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[10px] font-black uppercase  hover:border-amber-200 hover:text-amber-600 transition-all italic"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Minta Revisi
                                    </button>
                                </div>

                                {showRevision && (
                                    <div className="mt-8 space-y-6 italic">
                                        <textarea
                                            placeholder="Tulis instruksi revisi untuk mahasiswa..."
                                            value={revisionForm.data.revision_notes}
                                            onChange={(e) => revisionForm.setData('revision_notes', e.target.value)}
                                            rows={4}
                                            className="w-full bg-slate-50 border-slate-100 rounded-lg p-6 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none italic
                                        />
                                        <button 
                                            onClick={() => revisionForm.patch(`/dpl/daily-reports/${report.id}/revision`)}
                                            disabled={revisionForm.processing}
                                            className="w-full py-4 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase  hover:bg-amber-600 transition-all italic"
                                        >
                                            Kirim Instruksi Revisi
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {report.review_notes && (
                            <section className="bg-amber-50 rounded-lg border border-amber-100 p-8 italic">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <h4 className="text-[10px] font-black text-amber-800 uppercase  Revisi Aktif</h4>
                                </div>
                                <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase italic 
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function MetaInfo({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-start gap-4 italic group">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors italic">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase  mb-1 italic leading-none">{label}</p>
                <p className="text-xs font-black text-slate-900 uppercase italic truncate leading-none">{value}</p>
            </div>
        </div>
    );
}
