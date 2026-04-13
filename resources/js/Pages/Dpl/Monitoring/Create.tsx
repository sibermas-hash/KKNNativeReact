import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { ArrowLeft, Save } from 'lucide-react';

interface KelompokOption {
    id: number;
    nama_kelompok: string;
    periode?: { name: string };
}

interface Props {
    groups: KelompokOption[];
    selectedGroupId?: number | null;
}

export default function DplMonitoringCreate({ groups, selectedGroupId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        kelompok_id: selectedGroupId?.toString() ?? '',
        tanggal_kunjungan: new Date().toISOString().split('T')[0],
        permasalahan: '',
        solusi: '',
        catatan_tambahan: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('dpl.monitoring.store'));
    };

    return (
        <AppLayout title="Tambah Monitoring">
            <Head title="Tambah Monitoring" />

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('dpl.monitoring.index')}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Monitoring
                    </Link>
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Form Laporan Monitoring</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Catat hasil kunjungan monitoring ke kelompok bimbingan Anda.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="kelompok_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Kelompok <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="kelompok_id"
                                value={data.kelompok_id}
                                onChange={(e) => setData('kelompok_id', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            >
                                <option value="">-- Pilih Kelompok --</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.nama_kelompok}
                                        {g.periode ? ` (${g.periode.name})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.kelompok_id && (
                                <p className="mt-1 text-xs text-rose-600">{errors.kelompok_id}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="tanggal_kunjungan" className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Kunjungan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="tanggal_kunjungan"
                                value={data.tanggal_kunjungan}
                                onChange={(e) => setData('tanggal_kunjungan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            />
                            {errors.tanggal_kunjungan && (
                                <p className="mt-1 text-xs text-rose-600">{errors.tanggal_kunjungan}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="permasalahan" className="block text-sm font-medium text-gray-700 mb-1">
                                Permasalahan <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                id="permasalahan"
                                rows={4}
                                value={data.permasalahan}
                                onChange={(e) => setData('permasalahan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Jelaskan permasalahan yang ditemukan di lapangan..."
                                required
                            />
                            {errors.permasalahan && (
                                <p className="mt-1 text-xs text-rose-600">{errors.permasalahan}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="solusi" className="block text-sm font-medium text-gray-700 mb-1">
                                Solusi <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                id="solusi"
                                rows={4}
                                value={data.solusi}
                                onChange={(e) => setData('solusi', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Jelaskan solusi atau tindak yang telah dilakukan..."
                                required
                            />
                            {errors.solusi && (
                                <p className="mt-1 text-xs text-rose-600">{errors.solusi}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="catatan_tambahan" className="block text-sm font-medium text-gray-700 mb-1">
                                Catatan Tambahan
                            </label>
                            <textarea
                                id="catatan_tambahan"
                                rows={2}
                                value={data.catatan_tambahan}
                                onChange={(e) => setData('catatan_tambahan', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Catatan tambahan (opsional)..."
                            />
                            {errors.catatan_tambahan && (
                                <p className="mt-1 text-xs text-rose-600">{errors.catatan_tambahan}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Monitoring'}
                            </button>
                            <Link
                                href={route('dpl.monitoring.index')}
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
