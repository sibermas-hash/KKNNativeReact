import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { Upload, FileImage, FileText, AlertCircle, CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import type { PageProps } from '@/types';

interface KelompokData {
    id: number;
    nama_kelompok: string;
    poster_potensi_desa_path: string | null;
    poster_potensi_desa_name: string | null;
}

interface Props extends PageProps {
    kelompok: KelompokData;
    allowedTypes: string[];
    maxSize: string;
}

export default function StudentPosterIndex({ kelompok, allowedTypes, maxSize }: Props) {
    const form = useForm({
        poster: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('student.poster.store'), {
            forceFormData: true,
        });
    };

    const isImage = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
    };

    return (
        <AppLayout title="Poster Peta Potensi Desa">
            <Head title="Poster Peta Potensi Desa" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="rounded-lg border border-emerald-50/60 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-emerald-950">Poster Peta Potensi Desa</h1>
                            <p className="mt-1 text-sm text-emerald-950">
                                Sesuai Lampiran 10 Panduan KKN
                            </p>
                        </div>
                        <Link
                            href={route('student.dashboard')}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-50/60 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50/30"
                        >
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Link>
                    </div>

                    <div className="mt-4 rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4 text-sm text-emerald-950">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-emerald-950">Poster Peta Potensi Desa sesuai Lampiran 10 Panduan KKN</p>
                                <p className="mt-1 text-emerald-950">
                                    Unggah poster peta potensi desa dalam format PDF atau gambar (JPG, JPEG, PNG).
                                    Ukuran file maksimal {maxSize}. Poster ini memuat peta desa beserta potensi yang ada di lokasi KKN.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tujuan & Manfaat Section */}
                <div className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-base font-bold text-bg-emerald-100">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <ImageIcon className="h-5 w-5" />
                        </div>
                        Mengapa Poster Potensi Desa Penting?
                    </h2>
                    <p className="mt-2 text-sm text-emerald-950 leading-relaxed">
                        Poster Potensi Desa merupakan salah satu <strong>luaran wajib KKN</strong> yang berfungsi sebagai media visualisasi hasil observasi dan pemetaan aset desa selama pelaksanaan KKN. Poster ini akan menjadi bagian dari laporan akhir kelompok dan dipublikasikan oleh LPPM.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow-sm border border-[#f3f4f6]">
                            <p className="text-xs font-bold text-emerald-600 font-semibold uppercase text-xs mb-1">Branding Desa</p>
                            <p className="text-sm text-emerald-950 leading-relaxed">
                                Membantu desa mempromosikan aset alam, sosial, dan produk UMKM unggulan kepada masyarakat luas.
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm border border-[#f3f4f6]">
                            <p className="text-xs font-bold text-emerald-600 font-semibold uppercase text-xs mb-1">Visualisasi Aset</p>
                            <p className="text-sm text-emerald-950 leading-relaxed">
                                Menyederhanakan data pemetaan aset desa (metode ABCD) ke dalam bentuk visual yang menarik dan mudah dipahami.
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm border border-[#f3f4f6]">
                            <p className="text-xs font-bold text-emerald-600 font-semibold uppercase text-xs mb-1">Output Akademik</p>
                            <p className="text-sm text-emerald-950 leading-relaxed">
                                Sebagai bukti fisik luaran pengabdian yang akan dipublikasikan di kanal resmi LPPM UIN Saizu.
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm border border-[#f3f4f6]">
                            <p className="text-xs font-bold text-emerald-600 font-semibold uppercase text-xs mb-1">Arsip LPPM</p>
                            <p className="text-sm text-emerald-950 leading-relaxed">
                                Menjadi database potret desa-desa wilayah KKN untuk riset dan pengabdian lanjutan kampus.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Panduan Konten Poster */}
                <div className="rounded-xl border border-emerald-50/60 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-base font-bold text-emerald-950">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        Panduan Isi Poster
                    </h2>
                    <p className="mt-2 text-sm text-emerald-950">Pastikan poster yang Anda buat memuat elemen-elemen berikut:</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                            { label: 'Peta Lokasi Desa', desc: 'Peta desa/kelurahan yang menunjukkan batas wilayah dan lokasi potensi' },
                            { label: 'Profil Singkat Desa', desc: 'Jumlah penduduk, luas wilayah, struktur pemerintahan dasar' },
                            { label: 'Potensi Alam & SDA', desc: 'Pertanian, perkebunan, peternakan, wisata alam, dll' },
                            { label: 'Potensi Sosial & Budaya', desc: 'Kesenian, tradisi, organisasi masyarakat, kearifan lokal' },
                            { label: 'Potensi Ekonomi & UMKM', desc: 'Produk unggulan, home industry, pasar, komoditas utama' },
                            { label: 'Identitas Kelompok KKN', desc: 'Logo UIN Saizu, nama kelompok, periode KKN, nama DPL' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 rounded-lg border border-emerald-50/60 bg-emerald-50/30/50 p-3">
                                <CheckCircle className="h-4 w-4 text-[#0d9488] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-950">{item.label}</p>
                                    <p className="text-xs text-emerald-950 mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
                        <p className="text-xs text-amber-800">
                            <strong>Tips:</strong> Gunakan aplikasi seperti Canva, Adobe Illustrator, atau Microsoft Publisher untuk membuat desain poster yang menarik. Pastikan resolusi gambar minimal 300 DPI untuk kualitas cetak yang baik.
                        </p>
                    </div>
                </div>

                {/* Current Poster Preview */}
                {kelompok.poster_potensi_desa_path && (
                    <div className="rounded-lg border border-emerald-50/60 bg-white p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <div>
                                <h2 className="font-semibold text-emerald-950">Poster Saat Ini</h2>
                                <p className="text-sm text-emerald-950">{kelompok.poster_potensi_desa_name}</p>
                            </div>
                        </div>

                        {isImage(kelompok.poster_potensi_desa_name || '') ? (
                            <div className="rounded-lg border border-emerald-50/60 overflow-hidden bg-emerald-50/30 p-4">
                                <img
                                    src={kelompok.poster_potensi_desa_path}
                                    alt="Poster Peta Potensi Desa"
                                    className="mx-auto max-h-96 w-auto object-contain rounded"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-emerald-950 truncate">{kelompok.poster_potensi_desa_name}</p>
                                    <p className="text-xs text-emerald-950">Dokumen PDF</p>
                                </div>
                                <a
                                    href={kelompok.poster_potensi_desa_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-50/60 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50/30"
                                >
                                    Lihat dokumen
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="rounded-lg border border-emerald-50/60 bg-white p-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Upload className="h-5 w-5 text-emerald-950" />
                            <h2 className="font-semibold text-emerald-950">Unggah Poster Baru</h2>
                        </div>

                        {/* File Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-emerald-800">
                                File Poster <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => form.setData('poster', e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-emerald-800 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100 file:cursor-pointer"
                                />
                            </div>
                            {form.errors.poster && (
                                <p className="text-xs text-rose-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {form.errors.poster}
                                </p>
                            )}
                            <p className="text-xs text-emerald-950">
                                Format: {allowedTypes.join(', ')} | Maks: {maxSize}
                            </p>
                        </div>

                        {/* Preview */}
                        {form.data.poster && (
                            <div className="rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4">
                                <div className="flex items-center gap-4">
                                    {form.data.poster.type.startsWith('image/') ? (
                                        <>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-emerald-950 truncate">{form.data.poster.name}</p>
                                                <p className="text-xs text-emerald-950">
                                                    {(form.data.poster.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-emerald-950 truncate">{form.data.poster.name}</p>
                                                <p className="text-xs text-emerald-950">
                                                    {(form.data.poster.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4 text-xs text-emerald-950 space-y-1">
                            <p className="font-medium text-emerald-800">Ketentuan:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>File berupa PDF atau gambar (JPG, JPEG, PNG)</li>
                                <li>Ukuran file maksimal {maxSize}</li>
                                <li>Poster memuat peta desa dan potensi yang ada</li>
                                <li>Poster akan ditampilkan pada laporan akhir KKN</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Link
                            href={route('student.dashboard')}
                            className="rounded-lg border border-emerald-50/60 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50/30"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing || !form.data.poster}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <FileImage className="h-4 w-4" />
                            {form.processing ? 'Mengunggah...' : 'Unggah Poster'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
