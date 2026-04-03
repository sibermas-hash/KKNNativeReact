import { Head, router } from '@inertiajs/react';
import { useState, type ComponentType } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Calendar,
    CheckCircle2,
    Clock3,
    MapPin,
    Presentation,
    Users,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Workshop {
    id: number;
    title: string;
    description: string | null;
    methodology: string | null;
    date: string;
    time: string;
    location: string | null;
    registered: number;
    max_participants: number | null;
    is_full: boolean;
    is_registered: boolean;
    attendance_status?: string | null;
}

interface Props {
    workshops: Workshop[];
}

export default function StudentWorkshopsIndex({ workshops }: Props) {
    const [submittingId, setSubmittingId] = useState<number | null>(null);

    const register = (workshopId: number) => {
        setSubmittingId(workshopId);

        router.post(`/student/workshops/${workshopId}/register`, {}, {
            preserveScroll: true,
            onFinish: () => setSubmittingId(null),
        });
    };

    return (
        <AppLayout title="Pembekalan Mahasiswa">
            <Head title="Pembekalan Mahasiswa" />

            <div className="space-y-12 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Presentation className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  italic">
                                Pembekalan Mahasiswa
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                            Jadwal <span className="text-primary italic">Pembekalan</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-2xl">
                            Pantau agenda pembekalan resmi dan daftarkan diri Anda ke sesi yang masih tersedia.
                        </p>
                    </div>

                    <div className="bg-whiterounded-lg border border-slate-100 p-6 min-w-[260px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase  mb-2 italic">
                            Ringkasan Agenda
                        </p>
                        <p className="text-2xl font-black text-slate-900 italic 
                            {workshops.length}
                            <span className="text-[10px] font-bold text-slate-300 uppercase ml-2">
                                Sesi Aktif
                            </span>
                        </p>
                    </div>
                </div>

                {workshops.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-100 p-20 text-center
                        <div className="inline-flex p-8 bg-slate-50 rounded-full border border-slate-100 mb-6">
                            <Calendar className="h-12 w-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic 
                            Belum Ada Pembekalan Terjadwal
                        </h2>
                        <p className="text-slate-400 font-bold uppercase  text-[10px] mt-3 italic">
                            Informasi pembekalan akan muncul otomatis saat admin menambahkan agenda baru.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {workshops.map((workshop) => {
                            const isProcessing = submittingId === workshop.id;
                            const seatLabel = workshop.max_participants
                                ? `${workshop.registered}/${workshop.max_participants} peserta`
                                : `${workshop.registered} peserta`;

                            return (
                                <article
                                    key={workshop.id}
                                    className="bg-white rounded-lg border border-slate-100 p-8 hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-5 mb-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase  italic">
                                                Agenda Pembekalan
                                            </p>
                                            <h2 className="text-2xl font-black text-slate-900  uppercase italic">
                                                {workshop.title}
                                            </h2>
                                            {workshop.description && (
                                                <p className="text-sm font-medium text-slate-500 italic leading-relaxed">
                                                    {workshop.description}
                                                </p>
                                            )}
                                        </div>

                                        {workshop.is_registered ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase 
                                                <CheckCircle2 className="h-4 w-4" />
                                                Terdaftar
                                            </span>
                                        ) : workshop.is_full ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase 
                                                Penuh
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase 
                                                Tersedia
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                        <Metric icon={Calendar} label="Tanggal" value={workshop.date} />
                                        <Metric icon={Clock3} label="Waktu" value={workshop.time} />
                                        <Metric icon={MapPin} label="Lokasi" value={workshop.location ?? 'Menyusul'} />
                                        <Metric icon={Users} label="Kapasitas" value={seatLabel} />
                                    </div>

                                    {workshop.methodology && (
                                        <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-5 mb-8">
                                            <p className="text-[9px] font-black text-slate-400 uppercase  mb-2 italic">
                                                Metodologi
                                            </p>
                                            <p className="text-sm font-medium text-slate-600 italic">
                                                {workshop.methodology}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        disabled={workshop.is_registered || workshop.is_full || isProcessing}
                                        onClick={() => register(workshop.id)}
                                        className={clsx(
                                            'w-full h-14 rounded-lg font-black text-[10px] uppercase  transition-all',
                                            workshop.is_registered
                                                ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                                                : workshop.is_full
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-900 text-white hover:bg-black'
                                        )}
                                    >
                                        {isProcessing
                                            ? 'Memproses pendaftaran...'
                                            : workshop.is_registered
                                                ? `Status: ${formatAttendanceStatus(workshop.attendance_status)}`
                                                : workshop.is_full
                                                    ? 'Kuota Penuh'
                                                    : 'Daftar Pembekalan'}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function formatAttendanceStatus(status?: string | null) {
    switch (status) {
        case 'attended':
            return 'hadir';
        case 'absent':
            return 'tidak hadir';
        case 'registered':
        case null:
        case undefined:
            return 'terdaftar';
        default:
            return status.replace(/_/g, ' ');
    }
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1.5rem] bg-slate-50 border border-slate-100 p-5 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase  mb-2 italic">
                    {label}
                </p>
                <p className="text-sm font-black text-slate-900 italic leading-tight">
                    {value}
                </p>
            </div>
        </div>
    );
}
