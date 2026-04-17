import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { Plus, Calendar, MapPin, FileText, BarChart3, ChevronRight, Save, ArrowLeft } from 'lucide-react';

interface GroupSummary {
    id: number;
    nama: string;
    periode: string | null;
    total_monitoring: number;
    terakhir_monitoring: string;
}

interface MonitoringRow {
    id: number;
    kelompok: { nama_kelompok: string };
    tanggal_kunjungan: string;
    permasalahan: string;
    solusi: string;
    catatan_tambahan?: string | null;
    periode?: { name: string };
}

interface Props {
    monitorings: {
        data: MonitoringRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    groups: GroupSummary[];
}

export default function DplMonitoringIndex({ monitorings, groups }: Props) {
    return (
        <AppLayout title="Monitoring DPL">
            <Head title="Monitoring DPL" />

            <div className="space-y-8">
                <section className="rounded-lg border border-gray-200/60 bg-white p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-black">Monitoring Kunjungan DPL</h1>
                            <p className="mt-2 text-sm text-gray-900">
                                Pantau hasil kunjungan dan permasalahan yang ditemukan di kelompok bimbingan.
                            </p>
                        </div>
                        <Link
                            href={route('dpl.monitoring.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" /> Tambah Monitoring
                        </Link>
                    </div>
                </section>

                {/* Ringkasan per Kelompok */}
                <section className="rounded-lg border border-gray-200/60 bg-white p-6">
                    <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                        Ringkasan Monitoring per Kelompok
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="rounded-lg border border-gray-200/60 bg-emerald-50/30 p-4 hover:bg-white hover:border-emerald-300 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-gray-900" />
                                    <span className="text-sm font-semibold text-black">{group.nama}</span>
                                </div>
                                {group.periode && (
                                    <p className="text-xs text-gray-900 mb-3">{group.periode}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-gray-900">
                                    <span>Total: <strong className="text-black">{group.total_monitoring}</strong> kunjungan</span>
                                    <span>Terakhir: <strong className="text-black">{group.terakhir_monitoring}</strong></span>
                                </div>
                                <Link
                                    href={route('dpl.monitoring.create', { kelompok_id: group.id })}
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-gray-700"
                                >
                                    Tambah monitoring <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ))}
                        {groups.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                                <MapPin className="h-8 w-8 text-slate-300" />
                                <p className="mt-2 text-sm text-gray-900">Belum ada kelompok bimbingan.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Riwayat Monitoring */}
                <section className="rounded-lg border border-gray-200/60 bg-white">
                    <div className="border-b border-gray-200/60 px-6 py-4">
                        <h2 className="text-lg font-semibold text-black">Riwayat Monitoring</h2>
                    </div>

                    {monitorings.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-sm text-gray-900">Belum ada laporan monitoring.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-emerald-100/60">
                            {monitorings.data.map((m) => (
                                <div key={m.id} className="p-6 hover:bg-emerald-50/30">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-semibold text-black">{m.kelompok.nama_kelompok}</span>
                                                    {m.periode && (
                                                        <span className="ml-2 text-xs text-gray-900 bg-emerald-50/60 rounded px-2 py-0.5">
                                                            {m.periode.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-900">
                                                    {new Date(m.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-gray-700">
                                                    <span className="font-medium text-gray-900">Permasalahan:</span>{' '}
                                                    {m.permasalahan}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-medium text-gray-900">Solusi:</span>{' '}
                                                    {m.solusi}
                                                </p>
                                                {m.catatan_tambahan && (
                                                    <p className="text-xs text-gray-900 ">
                                                        Catatan: {m.catatan_tambahan}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
