import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
import { CheckCircle2, FileText, Video, Newspaper, Map, Layers, ScrollText, ChevronLeft, UploadCloud, ShieldAlert } from 'lucide-react';

interface Props extends PageProps {
    group: {
        id: number;
        name: string;
    } | null;
    existingReport: {
        id: number;
        title: string;
        status: string;
        file_name?: string | null;
    } | null;
    uploadedBy: string | null;
}

export default function StudentFinalReportCreate({ group, existingReport, uploadedBy }: Props) {
    const form = useForm({
        title: existingReport?.title ?? '',
        abstract: '',
        video_link: '',
        news_link: '',
        article_1: null as File | null,
        article_2: null as File | null,
        poster_1: null as File | null,
        poster_2: null as File | null,
        poster_3: null as File | null,
        file: null as File | null,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('student.laporan-akhir.store'), {
            forceFormData: true,
        });
    };

    if (!group) {
        return (
            <AppLayout title="Laporan Akhir">
                <Head title="Laporan Akhir" />
                <div className="mx-auto max-w-4xl py-20 text-center space-y-6">
                    <div className="mx-auto h-12 w-24 bg-emerald-50/30 rounded-full flex items-center justify-center text-slate-200">
                        <ShieldAlert size={48} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-emerald-950 font-bold text-center">Akses Terbatas</h2>
                        <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs max-w-md mx-auto">
                            Anda belum terdaftar dalam unit kelompok manapun untuk periode ini.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isReportLocked = !!existingReport;

    return (
        <AppLayout title="Laporan Akhir">
            <Head title="Laporan Akhir" />

            <div className="mx-auto max-w-5xl space-y-10 pb-24">
                {/* --- HEADER --- */}
                <section className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="relative z-10 space-y-3">
                         <div className="flex items-center gap-4 text-emerald-600 mb-2">
                            <Link
                                href={route('student.dashboard')}
                                className="p-2 hover:bg-emerald-50 rounded-xl transition-colors"
                            >
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </Link>
                            <span className="text-sm font-bold uppercase tracking-wider text-xs font-semibold opacity-60">Terminal Penutup KKN</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight uppercase leading-none">Final Report & Luaran</h1>
                        <p className="text-sm font-medium text-emerald-950">Puncak dari perjalanan pengabdian unit <span className="text-emerald-600 font-bold">{group.name}</span>.</p>
                    </div>
                    
                    {existingReport && (
                        <div className="relative z-10 flex items-center gap-6 bg-emerald-50/30 px-8 py-6 rounded-xl border border-emerald-50/60">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold leading-none">Status Terkini</p>
                                <p className="text-sm font-bold text-emerald-950 truncate max-w-[150px] tracking-tight">{existingReport.title}</p>
                            </div>
                            <StatusBadge status={existingReport.status} className="rounded-xl px-4 py-2 text-sm font-extrabold" />
                        </div>
                    )}
                </section>

                {/* --- MAIN FORM --- */}
                {!isReportLocked ? (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* 1. DATA IDENTITAS LAPORAN */}
                        <div className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                    <ScrollText size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-950 font-bold text-center leading-none">Identitas Laporan</h2>
                                    <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mt-2 leading-none">Informasi inti dan abstraksi kegiatan</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-8">
                                <FormInput
                                    label="Judul Laporan Kolektif"
                                    required
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    error={form.errors.title}
                                    className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white transition-all text-sm font-bold uppercase tracking-tight py-4"
                                />
                                <FormTextarea
                                    label="Abstraksi Ringkas"
                                    placeholder="Gambarkan inti pengabdian unit dalam 200-300 kata..."
                                    value={form.data.abstract}
                                    onChange={(event) => form.setData('abstract', event.target.value)}
                                    error={form.errors.abstract}
                                    className="rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 focus:bg-white transition-all text-sm font-medium py-4 min-h-[150px]"
                                />
                            </div>
                        </div>

                        {/* 2. TAUTAN MULTIMEDIA & PUBLIKASI */}
                        <div className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-950 font-bold text-center leading-none">Publikasi Digital</h2>
                                    <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mt-2 leading-none">Link jejak digital pengabdian masyarakat</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-emerald-950 font-semibold uppercase text-xs ml-1">
                                        <Video size={14} className="text-rose-500" /> Video Dokumentasi (5-7 Menit)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={form.data.video_link}
                                        onChange={(event) => form.setData('video_link', event.target.value)}
                                        className="w-full rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 px-5 py-4 text-sm font-bold text-emerald-950 focus:ring-[#0d9488] focus:border-[#f3f4f6]0"
                                    />
                                    {form.errors.video_link && <p className="text-sm font-bold text-rose-500 uppercase px-1">{form.errors.video_link}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-emerald-950 font-semibold uppercase text-xs ml-1">
                                        <Newspaper size={14} className="text-blue-500" /> Link Berita / Press Release
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://media-online.com/kkn-uin-saizu"
                                        value={form.data.news_link}
                                        onChange={(event) => form.setData('news_link', event.target.value)}
                                        className="w-full rounded-2xl bg-emerald-50/30/50 border-emerald-50/60 px-5 py-4 text-sm font-bold text-emerald-950 focus:ring-[#0d9488] focus:border-[#f3f4f6]0"
                                    />
                                    {form.errors.news_link && <p className="text-sm font-bold text-rose-500 uppercase px-1">{form.errors.news_link}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 3. DOKUMEN & ARSIP FISIK */}
                        <div className="rounded-[2.5rem] border border-emerald-50/60 bg-white p-10 lg:p-12 shadow-sm space-y-10">
                             <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                                    <UploadCloud size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-950 font-bold text-center leading-none">Arsip Dokumen</h2>
                                    <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mt-2 leading-none">Berkas ilmiah, poster peta, dan laporan utama</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {/* Artikel Section */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Artikel Ilmiah (Min. 2 Berkas)
                                    </h3>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <FileInput label="Artikel Ilmiah 1" icon={<FileText size={18} />} accept=".pdf,.doc,.docx" onChange={(f) => form.setData('article_1', f)} />
                                        <FileInput label="Artikel Ilmiah 2" icon={<FileText size={18} />} accept=".pdf,.doc,.docx" onChange={(f) => form.setData('article_2', f)} />
                                    </div>
                                </div>

                                {/* Poster Section */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Poster Peta Potensi (Min. 3 Berkas)
                                    </h3>
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <FileInput label="Poster I" icon={<Map size={18} />} accept=".jpg,.jpeg,.png,.pdf" onChange={(f) => form.setData('poster_1', f)} />
                                        <FileInput label="Poster II" icon={<Map size={18} />} accept=".jpg,.jpeg,.png,.pdf" onChange={(f) => form.setData('poster_2', f)} />
                                        <FileInput label="Poster III" icon={<Map size={18} />} accept=".jpg,.jpeg,.png,.pdf" onChange={(f) => form.setData('poster_3', f)} />
                                    </div>
                                </div>

                                {/* Main Report Section */}
                                <div className="space-y-6 pt-6 border-t border-slate-50">
                                    <h3 className="text-xs font-bold text-emerald-950 font-semibold uppercase text-xs flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        Main Final Report (Wajib PDF)
                                    </h3>
                                    <div className="relative group/main">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            required
                                            onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="bg-rose-50/30 border-2 border-dashed border-rose-100 rounded-xl p-12 text-center group-hover/main:bg-rose-50 transition-all">
                                            <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm mb-4">
                                                <UploadCloud size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-emerald-950 uppercase tracking-tight">
                                                {form.data.file ? form.data.file.name : 'Upload Laporan Akhir Utama'}
                                            </p>
                                            <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mt-2 leading-none">Sesuai Format Baku LPPM UIN SAIZU</p>
                                        </div>
                                    </div>
                                    {form.errors.file && <p className="text-sm font-bold text-rose-500 uppercase px-1">{form.errors.file}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-10 border-t border-slate-50">
                                <Link
                                    href={route('student.dashboard')}
                                    className="px-6 py-5 rounded-2xl bg-white border border-emerald-50/60 text-sm font-bold text-emerald-950 hover:text-emerald-950 transition-all uppercase tracking-wider text-xs font-semibold"
                                >
                                    Batalkan
                                </Link>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-6 py-5 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-wider text-xs font-semibold flex items-center gap-4"
                                >
                                    {form.processing ? 'Transmitting Data...' : 'Kirim Laporan Akhir'}
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <section className="rounded-[2.5rem] border border-emerald-100 bg-emerald-50/30 p-12 lg:p-16 text-center space-y-6">
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                            <CheckCircle2 size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-emerald-950 font-bold text-center uppercase tracking-tight">Laporan Akhir Terkunci</h2>
                            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold leading-relaxed max-w-md mx-auto">
                                Laporan akhir kelompok <span className="text-emerald-600 font-bold">{group.name}</span> sudah berhasil diunggah oleh anggota: <br />
                                <span className="text-lg text-emerald-950 lowercase mt-2 block font-extrabold">{uploadedBy || 'Rekan Kelompok'}</span>
                            </p>
                            <p className="text-xs text-emerald-700 mt-4 italic">Sesuai kebijakan LPPM, pengunggahan laporan akhir cukup dilakukan oleh satu perwakilan kelompok.</p>
                        </div>
                        <div className="pt-8">
                             <Link
                                href={route('student.dashboard')}
                                className="px-8 py-3 rounded-xl bg-white border border-emerald-50 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Kembali ke Dashboard
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

function FileInput({ label, icon, accept, onChange }: { label: string, icon: React.ReactNode, accept: string, onChange: (file: File | null) => void }) {
    const [fileName, setFileName] = React.useState<string | null>(null);
    
    return (
        <div className="relative group/file">
            <input 
                type="file" 
                accept={accept} 
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFileName(f?.name ?? null);
                    onChange(f);
                }} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <div className="bg-emerald-50/30 border border-emerald-50/60 rounded-2xl p-5 flex items-center gap-4 group-hover/file:bg-white group-hover/file:border-emerald-200 transition-all">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-950 group-hover/file:text-[#0d9488] shadow-sm shrink-0 transition-colors">
                    {icon}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs leading-none mb-1.5">{label}</p>
                    <p className="text-sm font-bold text-emerald-950 truncate uppercase tracking-tight leading-none group-hover/file:text-emerald-600">
                        {fileName || 'Pilih File...'}
                    </p>
                </div>
            </div>
        </div>
    );
}
