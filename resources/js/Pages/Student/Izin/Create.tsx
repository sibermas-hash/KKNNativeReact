import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
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

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('student.izin.index')}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Izin
                    </Link>
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Ajukan Permohonan Izin</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Ajukan izin jika Anda perlu meninggalkan lokasi KKN. Permohonan akan diproses oleh DPL Anda.
                    </p>

                    <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold">Perhatian</p>
                            <p className="mt-1 text-xs text-amber-700">
                                Izin hanya dapat diajukan untuk tanggal hari ini atau setelahnya.
                                Akumulasi 3 hari tanpa keterangan akan mengakibatkan pembatalan KKN.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormInput
                            type="date"
                            id="tanggal_mulai"
                            label="Tanggal Mulai"
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
                            value={data.tanggal_kembali}
                            min={data.tanggal_mulai}
                            onChange={(e) => setData('tanggal_kembali', e.target.value)}
                            error={errors.tanggal_kembali}
                            required
                        />

                        <FormTextarea
                            id="alasan"
                            label="Alasan"
                            rows={5}
                            value={data.alasan}
                            onChange={(e) => setData('alasan', e.target.value)}
                            placeholder="Jelaskan alasan permohonan izin Anda secara detail..."
                            error={errors.alasan}
                            required
                        />

                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                {processing ? 'Mengajukan...' : 'Ajukan Izin'}
                            </button>
                            <Link
                                href={route('student.izin.index')}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
