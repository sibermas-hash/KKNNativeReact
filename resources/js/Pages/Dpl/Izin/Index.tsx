import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/ui/Badge';
import { ConfirmDialog } from '@/Components/ui';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { CheckCircle, XCircle, Clock, MapPin, Calendar, User, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import type { PageProps } from '@/types';

interface IzinRow {
    id: number;
    mahasiswa: { nama: string; nim: string };
    kelompok: { nama_kelompok: string };
    tanggal_mulai: string;
    tanggal_kembali: string;
    durasi_hari: number;
    alasan: string;
    status: 'menunggu' | 'disetujui' | 'ditolak';
    catatan_dpl?: string | null;
    diproses_pada?: string | null;
}

interface Props {
    izins: {
        data: IzinRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
}

export default function DplIzinIndex({ izins }: Props) {
    const { flash } = (usePage() as unknown as { props: PageProps }).props;
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmVariant: 'primary' | 'danger';
        confirmLabel: string;
    }>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmVariant: 'primary',
        confirmLabel: '',
    });

    const handleApprove = (izin: IzinRow) => {
        setConfirmDialog({
            open: true,
            title: 'Setujui Izin',
            message: `Apakah Anda yakin ingin menyetujui permohonan izin dari ${izin.mahasiswa.nama}?`,
            confirmVariant: 'primary',
            confirmLabel: 'Ya, Setujui',
            onConfirm: () => {
                router.post(route('dpl.izin.approve', izin.id), {}, {
                    onSuccess: () => setConfirmDialog(prev => ({ ...prev, open: false }))
                });
            }
        });
    };

    const handleReject = (id: number) => {
        const catatan = prompt('Masukkan catatan penolakan:');
        if (catatan && catatan.trim()) {
            router.post(route('dpl.izin.reject', id), { catatan: catatan.trim() });
        }
    };

    const statusColor = (status: string): 'success' | 'danger' | 'warning' => {
        switch (status) {
            case 'disetujui': return 'success';
            case 'ditolak': return 'danger';
            default: return 'warning';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'menunggu': return 'Menunggu';
            case 'disetujui': return 'Disetujui';
            case 'ditolak': return 'Ditolak';
            default: return status;
        }
    };

    return (
        <AppLayout title="Permohonan Izin">
            <Head title="Permohonan Izin Mahasiswa" />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmVariant={confirmDialog.confirmVariant}
                confirmLabel={confirmDialog.confirmLabel}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
            />

            <div className="space-y-8">
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm font-medium text-emerald-950">
                        {flash.success}
                    </div>
                )}

                <section className="rounded-lg border border-emerald-50/60 bg-white p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-emerald-950">Permohonan Izin Mahasiswa</h1>
                            <p className="mt-2 text-sm text-emerald-950">
                                Tinjau permohonan izin mahasiswa yang meninggalkan lokasi KKN.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-emerald-50/60 bg-white">
                    {izins.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-sm text-emerald-950">Belum ada permohonan izin.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-emerald-100/60">
                            {izins.data.map((izin) => (
                                <div key={izin.id} className="p-6 hover:bg-emerald-50/30">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <User className="h-4 w-4 text-emerald-950" />
                                                <span className="text-sm font-semibold text-emerald-950">{izin.mahasiswa.nama}</span>
                                                <span className="text-xs text-emerald-950">({izin.mahasiswa.nim})</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-emerald-950">
                                                <MapPin className="h-4 w-4 text-emerald-950" />
                                                <span>{izin.kelompok.nama_kelompok}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-emerald-950">
                                                <Calendar className="h-4 w-4 text-emerald-950" />
                                                <span>
                                                    {new Date(izin.tanggal_mulai).toLocaleDateString('id-ID')} s/d{' '}
                                                    {new Date(izin.tanggal_kembali).toLocaleDateString('id-ID')}
                                                    {' '}({izin.durasi_hari} hari)
                                                </span>
                                            </div>
                                            <p className="text-sm text-emerald-800 bg-emerald-50/30 rounded-lg p-3">
                                                <span className="font-medium text-emerald-950">Alasan:</span> {izin.alasan}
                                            </p>
                                            {izin.catatan_dpl && (
                                                <p className="text-xs text-emerald-950">
                                                    <span className="font-medium">Catatan DPL:</span> {izin.catatan_dpl}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <Badge variant={statusColor(izin.status)}>
                                                {statusLabel(izin.status)}
                                            </Badge>
                                            {izin.status === 'menunggu' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(izin)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                                    >
                                                        <CheckCircle className="h-3 w-3" /> Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(izin.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                                                    >
                                                        <XCircle className="h-3 w-3" /> Tolak
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {izins.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-50/60 bg-white px-6 py-4">
                        <p className="text-sm text-emerald-950">
                            Halaman {izins.current_page} dari {izins.last_page}
                        </p>
                        <div className="flex gap-2">
                            {izins.links?.slice(1, -1).map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.get(link.url!)}
                                    disabled={!link.url}
                                    className={clsx(
                                        'rounded px-3 py-1 text-sm font-medium',
                                        link.active
                                            ? 'bg-emerald-600 text-white'
                                            : link.url
                                                ? 'bg-white text-emerald-800 hover:bg-emerald-50/60'
                                                : 'text-slate-300 cursor-not-allowed'
                                    )}
                                >
                                    {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
