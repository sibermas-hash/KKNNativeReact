import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import {
    Download,
    FileText,
    FileUp,
    Film,
    ImageIcon,
    Map,
    ShieldCheck,
    UploadCloud,
} from 'lucide-react';

interface ProgressItem {
    type: string;
    name: string;
    status: string;
    report: {
        id: number;
        title: string;
        file_name: string;
        status: string;
        submitted_at: string | null;
    } | null;
}

interface ReportTypeOption {
    type: string;
    name: string;
    allowed_types: string[];
    max_size_mb: number;
}

interface Props {
    progress: ProgressItem[];
    reportTypes: ReportTypeOption[];
}

function getReportIcon(type: string) {
    switch (type) {
        case 'video_documentation':
            return <Film className="h-5 w-5" />;
        case 'photo_documentation':
            return <ImageIcon className="h-5 w-5" />;
        case 'village_map':
            return <Map className="h-5 w-5" />;
        default:
            return <FileText className="h-5 w-5" />;
    }
}

export default function StudentReportsIndex({ progress, reportTypes }: Props) {
    const form = useForm({
        type: reportTypes[0]?.type ?? '',
        title: '',
        file: null as File | null,
    });

    const selectedType = reportTypes.find((item) => item.type === form.data.type) ?? reportTypes[0] ?? null;

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.post('/student/reports/upload', {
            forceFormData: true,
            onSuccess: () => form.reset('title', 'file'),
        });
    };

    return (
        <AppLayout title="Pusat Dokumen Kelompok">
            <Head title="Pusat Dokumen Kelompok" />

            <div className="space-y-12 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  italic">
                                Arsip Pendukung KKN
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                            Pusat <span className="text-primary italic">Dokumen</span> Kelompok
                        </h1>
                        <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-2xl">
                            Unggah dokumen pendukung kelompok seperti peta desa, dokumentasi foto, video kegiatan, daftar hadir, dan laporan evaluasi.
                        </p>
                    </div>

                    <div className="bg-whiterounded-lg border border-slate-100 p-6 min-w-[240px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase  mb-2 italic">
                            Status Arsip
                        </p>
                        <p className="text-2xl font-black text-slate-900 italic 
                            {progress.filter((item) => item.report).length}
                            <span className="text-[10px] font-bold text-slate-300 uppercase ml-2">
                                Terkirim
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <section className="xl:col-span-2 space-y-6">
                        {progress.map((item) => (
                            <article
                                key={item.type}
                                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-primary/20 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-5">
                                        <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                            {getReportIcon(item.type)}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase  italic">
                                                {item.name}
                                            </p>
                                            <h3 className="text-xl font-black text-slate-900  uppercase italic">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 italic">
                                                {item.report?.title ?? 'Belum ada dokumen yang diunggah untuk kategori ini.'}
                                            </p>
                                            {item.report?.file_name && (
                                                <p className="text-[11px] font-bold text-slate-400 uppercase  italic">
                                                    File: {item.report.file_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <StatusBadge
                                            status={item.report?.status ?? item.status}
                                            className="px-5 py-2 rounded-xl text-[9px] font-black uppercase  border-none
                                        />
                                        {item.report && (
                                            <a
                                                href={`/reports/${item.report.id}/download`}
                                                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-all inline-flex items-center gap-2 text-[10px] font-black uppercase 
                                            >
                                                <Download className="h-4 w-4" />
                                                Unduh
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>

                    <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 h-fit">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase  italic text-slate-900">
                                    Upload Dokumen
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase  italic mt-1">
                                    Kirim arsip pendukung kelompok
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase  italic">
                                    Jenis Dokumen
                                </label>
                                <select
                                    value={form.data.type}
                                    onChange={(event) => form.setData('type', event.target.value)}
                                    className="w-full h-14 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-900 outline-none focus:border-primary/40"
                                    required
                                >
                                    {reportTypes.map((type) => (
                                        <option key={type.type} value={type.type}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.type && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase  italic">
                                        {form.errors.type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase  italic">
                                    Judul Dokumen
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder={selectedType ? `Contoh: ${selectedType.name} Kelompok` : 'Masukkan judul dokumen'}
                                    className="w-full h-14 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-900 outline-none focus:border-primary/40"
                                    required
                                />
                                {form.errors.title && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase  italic">
                                        {form.errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase  italic">
                                    File Dokumen
                                </label>
                                <label className="flex flex-col items-center justify-centerrounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center cursor-pointer hover:border-primary/40 transition-all">
                                    <FileUp className="h-8 w-8 text-slate-300 mb-4" />
                                    <span className="text-[11px] font-black text-slate-700 uppercase  italic">
                                        {form.data.file ? form.data.file.name : 'Klik untuk memilih file'}
                                    </span>
                                    {selectedType && (
                                        <span className="text-[9px] font-bold text-slate-400 uppercase  mt-3 italic">
                                            Format: {selectedType.allowed_types.join(', ')} • Maks {selectedType.max_size_mb} MB
                                        </span>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                                        accept={selectedType ? selectedType.allowed_types.map((extension) => `.${extension}`).join(',') : undefined}
                                        required
                                    />
                                </label>
                                {form.errors.file && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase  italic">
                                        {form.errors.file}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing || reportTypes.length === 0}
                                className="w-full h-14 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase  hover:bg-black transition-all disabled:opacity-50"
                            >
                                {form.processing ? 'Mengirim Dokumen...' : 'Kirim Dokumen'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
