import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, Button } from '@/Components/ui';
import FormTextarea from '@/Components/ui/FormTextarea';
import { route } from 'ziggy-js';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';

export default function StudentIzinCreate() {
    const { data, setData, post, processing, errors } = useForm({
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_kembali: new Date().toISOString().split('T')[0],
        alasan: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('student.izin.store'));
    };

    return (
        <AppLayout title="Ajukan Izin">
            <Head title="Ajukan Izin" />

            <div className="max-w-4xl mx-auto space-y-10 py-6 px-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('student.izin.index')}
                        className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-emerald-100/60 rounded-xl text-xs font-bold text-emerald-950 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> KEMBALI KE DAFTAR IZIN
                    </Link>
                </div>

                <section className="rounded-[2.5rem] border border-emerald-100/60 bg-white p-12 shadow-sm">
                    <div className="space-y-2 mb-12">
                        <h1 className="text-3xl font-bold text-black tracking-tight uppercase">Ajukan Izin <span className="text-emerald-500">Meninggalkan.</span></h1>
                        <p className="text-xs font-bold text-emerald-950 font-semibold uppercase text-xs">
                            Permohonan izin akan diverifikasi oleh Dosen Pembimbing Lapangan.
                        </p>
                    </div>

                    <div className="mb-12 rounded-3xl border border-amber-100 bg-amber-50/50 p-6 flex items-start gap-4">
                        <div className="h-10 w-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">Aturan Izin Penting</p>
                            <p className="text-sm font-bold text-amber-700/70 leading-relaxed uppercase tracking-wide">
                                Izin hanya dapat diajukan untuk hari ini atau setelahnya.
                                <br />Akumulasi 3 hari tanpa keterangan mengakibatkan pembatalan KKN.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <FormInput
                            type="date"
                            id="tanggal_mulai"
                            label="Tanggal Mulai"
                            layout="horizontal"
                            value={data.tanggal_mulai}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setData('tanggal_mulai', e.target.value)}
                            error={errors.tanggal_mulai}
                            required
                        />

                        <FormInput
                            type="date"
                            id="tanggal_kembali"
                            label="Tanggal Kembali"
                            layout="horizontal"
                            value={data.tanggal_kembali}
                            min={data.tanggal_mulai}
                            onChange={(e) => setData('tanggal_kembali', e.target.value)}
                            error={errors.tanggal_kembali}
                            required
                        />

                        <FormTextarea
                            id="alasan"
                            label="Alasan Izin"
                            layout="horizontal"
                            rows={5}
                            value={data.alasan}
                            onChange={(e) => setData('alasan', e.target.value)}
                            placeholder="Tuliskan alasan detail mengapa Anda meninggalkan lokasi..."
                            error={errors.alasan}
                            required
                        />

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-10 border-t border-slate-50">
                            <div className="sm:min-w-[180px]" /> {/* Spacer for horizontal alignment */}
                            <Button
                                type="submit"
                                size="lg"
                                loading={processing}
                                icon={<Send className="h-4 w-4" />}
                                className="w-full sm:w-auto px-6 rounded-2xl uppercase text-sm font-bold tracking-widest h-14"
                            >
                                KIRIM PERMOHONAN
                            </Button>
                            <Link
                                href={route('student.izin.index')}
                                className="text-sm font-bold text-emerald-950 hover:text-emerald-950 transition-colors font-semibold uppercase text-xs px-6"
                            >
                                Batalkan
                            </Link>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
