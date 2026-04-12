import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { Printer, Download, ArrowLeft } from 'lucide-react';

interface RekapRow {
    id: number;
    uraian_kegiatan: string;
    satuan: string;
    volume: number;
    swadaya_mhs: number;
    swadaya_masyarakat: number;
    bantuan_pemerintah: number;
    donatur_lain: number;
    jumlah: number;
    keterangan?: string;
}

interface Lokasi {
    village_name: string;
    district_name: string;
    regency_name: string;
}

interface Periode {
    name: string;
}

interface KelompokData {
    id: number;
    nama_kelompok: string;
    lokasi: Lokasi;
    periode: Periode;
}

interface DplData {
    nama: string;
}

interface Props {
    kelompok: KelompokData;
    rekapitulasi: RekapRow[];
    dpl: DplData;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('id-ID');
}

export default function AdminRekapitulasiIndex({ kelompok, rekapitulasi, dpl }: Props) {
    const totalSwadayaMhs = rekapitulasi.reduce((sum, item) => sum + (item.swadaya_mhs || 0), 0);
    const totalSwadayaMasyarakat = rekapitulasi.reduce((sum, item) => sum + (item.swadaya_masyarakat || 0), 0);
    const totalBantuan = rekapitulasi.reduce((sum, item) => sum + (item.bantuan_pemerintah || 0), 0);
    const totalDonatur = rekapitulasi.reduce((sum, item) => sum + (item.donatur_lain || 0), 0);
    const totalJumlah = rekapitulasi.reduce((sum, item) => sum + (item.jumlah || 0), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout title="Rekapitulasi Kegiatan">
            <Head title="Rekapitulasi Kegiatan | Admin KKN" />

            <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href={route('admin.kelompok.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Printer className="h-4 w-4" /> Cetak
                        </button>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            <Download className="h-4 w-4" /> Unduh PDF
                        </button>
                    </div>
                </div>

                {/* Main Document */}
                <div className="rounded-lg border border-slate-200 bg-white p-8 print:shadow-none print:border-0">
                    {/* Document Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                            REKAPITULASI LAPORAN KEGIATAN KKN
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            UIN Prof. K.H. Saifuddin Zuhri Purwokerto
                        </p>
                    </div>

                    {/* Info Section */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
                        <div className="flex">
                            <span className="text-slate-500 w-28 shrink-0">Desa</span>
                            <span className="text-slate-400">:</span>
                            <strong className="ml-2 text-slate-900">{kelompok.lokasi.village_name}</strong>
                        </div>
                        <div className="flex">
                            <span className="text-slate-500 w-28 shrink-0">Kelompok</span>
                            <span className="text-slate-400">:</span>
                            <strong className="ml-2 text-slate-900">{kelompok.nama_kelompok}</strong>
                        </div>
                        <div className="flex">
                            <span className="text-slate-500 w-28 shrink-0">Kecamatan</span>
                            <span className="text-slate-400">:</span>
                            <strong className="ml-2 text-slate-900">{kelompok.lokasi.district_name}</strong>
                        </div>
                        <div className="flex">
                            <span className="text-slate-500 w-28 shrink-0">Periode</span>
                            <span className="text-slate-400">:</span>
                            <strong className="ml-2 text-slate-900">{kelompok.periode.name}</strong>
                        </div>
                        <div className="flex">
                            <span className="text-slate-500 w-28 shrink-0">Kabupaten</span>
                            <span className="text-slate-400">:</span>
                            <strong className="ml-2 text-slate-900">{kelompok.lokasi.regency_name}</strong>
                        </div>
                    </div>

                    {/* Rekapitulasi Table - Lampiran 6 Format */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 w-8">No</th>
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 min-w-[200px]">Uraian Kegiatan</th>
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 w-16">Satuan</th>
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 w-16">Vol</th>
                                    <th colSpan={5} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700">Biaya (Rp)</th>
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 w-24">Jumlah (Rp)</th>
                                    <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 w-32">Keterangan</th>
                                </tr>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600 text-[10px]">Swadaya Mhs</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600 text-[10px]">Swadaya Masy</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600 text-[10px]">Bantuan Pemkot</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600 text-[10px]">Donatur</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600 text-[10px]">Sumber Lain</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {rekapitulasi.length > 0 ? (
                                    rekapitulasi.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500">{index + 1}</td>
                                            <td className="border border-slate-300 px-3 py-2 font-medium text-slate-900">{item.uraian_kegiatan}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-600">{item.satuan}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-600">{item.volume}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-600">{formatCurrency(item.swadaya_mhs)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-600">{formatCurrency(item.swadaya_masyarakat)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-600">{formatCurrency(item.bantuan_pemerintah)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-600">{formatCurrency(item.donatur_lain)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(item.jumlah)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-slate-500 ">{item.keterangan || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="border border-slate-300 px-3 py-8 text-center text-slate-400 ">
                                            Belum ada data rekapitulasi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-emerald-50">
                                    <td colSpan={4} className="border border-slate-300 px-3 py-3 font-bold text-sm text-emerald-800 text-right uppercase">Total</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-800">{formatCurrency(totalSwadayaMhs)}</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-800">{formatCurrency(totalSwadayaMasyarakat)}</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-800">{formatCurrency(totalBantuan)}</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-800">{formatCurrency(totalDonatur)}</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-800">-</td>
                                    <td className="border border-slate-300 px-3 py-3 text-right font-bold text-emerald-900">{formatCurrency(totalJumlah)}</td>
                                    <td className="border border-slate-300 px-3 py-3"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Tanda Tangan Section */}
                    <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm print:mt-16">
                        <div>
                            <p className="text-slate-600 mb-16">Dosen Pembimbing Lapangan (DPL)</p>
                            <p className="font-semibold text-slate-900 underline">{dpl.nama}</p>
                            <p className="text-slate-500 text-xs mt-1">NIP. ................................</p>
                        </div>
                        <div>
                            <p className="text-slate-600 mb-16">Ketua Kelompok KKN</p>
                            <p className="font-semibold text-slate-900 underline">{kelompok.nama_kelompok}</p>
                            <p className="text-slate-500 text-xs mt-1">NIM. ................................</p>
                        </div>
                    </div>
                </div>

                {/* Print styles */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        .print\\:hidden { display: none !important; }
                        .print\\:border-0 { border: 0 !important; }
                        .print\\:shadow-none { box-shadow: none !important; }
                        body { background: white; }
                    }
                `}} />
            </div>
        </AppLayout>
    );
}
