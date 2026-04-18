import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ShieldAlert, ArrowLeft, Clock, CheckCircle2, Lock } from 'lucide-react';

interface Props {
    message: string;
    current_phase: string;
}

const phaseInfo: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    upcoming: { label: 'Pra-Pendaftaran', icon: Clock, color: 'text-[#1a7a4a] bg-emerald-50 border-emerald-50' },
    registration: { label: 'Masa Pendaftaran', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    placement: { label: 'Seleksi & Plotting', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    execution: { label: 'Pelaksanaan KKN', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    grading: { label: 'Masa Penilaian', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    finished: { label: 'KKN Selesai', icon: Lock, color: 'text-emerald-400 bg-emerald-50 border-emerald-50' },
    inactive: { label: 'Tidak Aktif', icon: Lock, color: 'text-emerald-400 bg-emerald-50 border-emerald-50' },
};

export default function PhaseBlocked({ message, current_phase }: Props) {
    const info = phaseInfo[current_phase] || phaseInfo.inactive;
    const PhaseIcon = info.icon;

    return (
        <AppLayout title="Akses Dibatasi">
            <Head title="Akses Dibatasi | KKN UIN SAIZU" />

            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-white">
                <div className="max-w-md w-full text-center space-y-8 p-8 rounded-3xl border border-gray-100 shadow-xl shadow-emerald-50/20 bg-white">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 border border-emerald-50 mx-auto shadow-inner">
                        <ShieldAlert size={42} className="text-[#1a7a4a]" />
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold text-bg-emerald-100 tracking-tight">
                            Fitur Belum Tersedia
                        </h1>
                        <p className="text-sm text-emerald-800/70 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    {/* Current Phase Badge */}
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border font-bold tracking-tight shadow-sm ${info.color}`}>
                        <PhaseIcon size={18} />
                        <span className="text-sm uppercase tracking-wider">{info.label}</span>
                    </div>

                    {/* Back Button */}
                    <div className="pt-4">
                        <Link
                            href="/dashboard"
                            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 hover:shadow-emerald-200/80 active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
