import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
    UploadCloud, 
    FileText, 
    ChevronLeft,
    Sparkles,
    ShieldCheck,
    Info,
    AlertTriangle,
    Zap,
    FileUp,
    History,
    Activity,
    Lock,
} from 'lucide-react';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

interface Props extends PageProps {
    group: { name: string } | null;
    existingReport: { id: number; title: string; status: string; file_name?: string } | null;
    isLeader: boolean;
}

export default function StudentFinalReportCreate({ group, existingReport, isLeader }: Props) {
    const form = useForm({
        title: existingReport?.title ?? '',
        abstract: '',
        file: null as File | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/student/final-report', { forceFormData: true });
    }

    if (!group) {
        return (
            <AppLayout title="Laporan Akhir">
                <Head title="Akses Ditolak - Laporan Akhir" />
                <div className="bg-white rounded-[3.5rem] border border-slate-100 p-24 text-center group max-w-4xl mx-auto mt-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                        <AlertTriangle className="h-64 w-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex p-10 bg-rose-50 rounded-full border border-rose-100 mb-8 italic">
                            <AlertTriangle className="h-16 w-16 text-rose-200" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900  uppercase italic mb-4 leading-none">Kelompok Belum Terdeteksi</h3>
                        <p className="text-slate-400 font-bold uppercase  text-[11px] max-w-sm mx-auto leading-relaxed opacity-70 italic">Anda harus terdaftar dalam kelompok aktif sebelum dapat mengirimkan laporan akhir ke sistem pusat.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Laporan Akhir">
            <Head title="Pusat Laporan Akhir Mahasiswa" />
            
            <div className="max-w-6xl mx-auto space-y-12 pb-24">
                {/* Modern Professional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => window.history.back()}
                            className="h-16 w-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary/20 hover:shadow-xl transition-all active:scale-95 group italic"
                        >
                            <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black text-slate-400 uppercase  italic decoration-slate-100 leading-none">Dokumentasi Final Mahasiswa</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                                Pusat <span className="text-primary italic">Laporan</span> Akhir
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 bg-white p-6rounded-lg border border-slate-100 min-w-[240px]">
                        <div className="p-4 bg-primary/10 rounded-lg text-primary border border-primary/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase  block mb-1 italic">Akses Pengiriman</span>
                            <span className={clsx("text-xs font-black uppercase italic  leading-none", isLeader ? "text-emerald-600" : "text-amber-500")}>
                                {isLeader ? 'Ketua Terotorisasi' : 'Anggota (Baca Saja)'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        {existingReport && (
                            <section className="bg-white rounded-[3rem] border border-slate-100 p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-12 transition-transform">
                                    <Sparkles className="h-40 w-40" />
                                </div>
                                
                                <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8 relative z-10 italic">
                                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase  italic text-slate-900 leading-none">Status Laporan Kelompok</h3>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic leading-none opacity-60">Arsip Dokumentasi Tersimpan</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <h4 className="text-xl font-black text-slate-900 uppercase italic  leading-tight">{existingReport.title}</h4>
                                        <div className="flex items-center gap-3 italic">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase  italic truncate max-w-[300px]">{existingReport.file_name || 'Dokumen Terunggah'}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={existingReport.status} className="px-8 py-3 rounded-lg text-[10px] font-black uppercase  border-none italic shrink-0" />
                                </div>
                            </section>
                        )}

                        {isLeader ? (
                            <section className="bg-white rounded-[3.5rem] border border-slate-100 p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-primary group-hover:scale-125 transition-transform[2000ms] pointer-events-none">
                                    <UploadCloud className="h-96 w-96" />
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                                    <div className="space-y-5">
                                        <label htmlFor="title" className="text-[11px] font-black text-slate-400 uppercase  ml-1 italic group-hover:text-primary transition-colors">Judul Laporan Akhir</label>
                                        <input 
                                            id="title" 
                                            type="text"
                                            value={form.data.title} 
                                            onChange={(e) => form.setData('title', e.target.value)} 
                                            placeholder="Judul lengkap sesuai draf final..."
                                            required 
                                            className="w-full bg-slate-50 border-slate-100 rounded-[1.5rem] h-16 px-8 text-base font-black text-slate-900 uppercase italic  focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-300"
                                        />
                                        {form.errors.title && <p className="text-[10px] font-black text-rose-500 uppercase  ml-2 italic">{form.errors.title}</p>}
                                    </div>
                                    
                                    <div className="space-y-5">
                                        <label htmlFor="abstract" className="text-[11px] font-black text-slate-400 uppercase  ml-1 italic">Ringkasan Laporan (Abstrak)</label>
                                        <textarea 
                                            id="abstract" 
                                            value={form.data.abstract} 
                                            onChange={(e) => form.setData('abstract', e.target.value)} 
                                            rows={6} 
                                            placeholder="Tuliskan ringkasan singkat hasil pelaksanaan pengabdian..."
                                            className="w-full bg-slate-50 border-slate-100 rounded-[2.5rem] p-8 text-sm font-medium leading-relaxed italic focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <label className="text-[11px] font-black text-slate-400 uppercase  ml-1 italic">Unggah Dokumen Laporan <span className="text-rose-500">*</span></label>
                                        <div className="relative group/dropzone overflow-hidden">
                                            <input 
                                                type="file" 
                                                accept=".pdf,.doc,.docx" 
                                                onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)} 
                                                className="hidden"
                                                id="final-file-upload"
                                            />
                                            <label 
                                                htmlFor="final-file-upload"
                                                className={clsx(
                                                    "flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer text-center relative z-10",
                                                    form.data.file 
                                                        ? "bg-primary/5 border-primary/30 text-primary 
                                                        : "bg-slate-50 border-slate-100 text-slate-300 hover:bg-white hover:border-primary/40"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "h-20 w-20 rounded-full border flex items-center justify-center mb-8 transition-transform group-hover/dropzone:scale-110",
                                                    form.data.file ? "bg-primary text-white border-white" : "bg-white text-slate-200 border-slate-100"
                                                )}>
                                                    <FileUp className="h-8 w-8" />
                                                </div>
                                                <p className="text-[12px] font-black uppercase  max-w-sm leading-relaxed italic">
                                                    {form.data.file ? form.data.file.name : 'Klik untuk memilih arsip laporan final (.pdf, .doc, .docx)'}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase  mt-4 italic opacity-60">
                                                    Maksimal Ukuran File: 20MB
                                                </p>
                                            </label>
                                        </div>
                                        {form.errors.file && <p className="text-[10px] font-black text-rose-500 uppercase  mt-2 px-4 italic">{form.errors.file}</p>}
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-slate-50">
                                        <button 
                                            type="submit" 
                                            disabled={form.processing}
                                            className="h-20 px-16rounded-lg bg-slate-900 hover:bg-black text-white font-black uppercase text-[11px]  active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-4 italic group/btn"
                                        >
                                            <Zap className={clsx("h-6 w-6 text-primary transition-all", form.processing ? "animate-spin" : "group-hover/btn:rotate-12")} />
                                            {existingReport ? 'Simpan Perubahan Laporan' : 'Kirim Laporan Akhir'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        ) : (
                            <section className="bg-white rounded-[3.5rem] border border-slate-100 p-16 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                                    <Lock className="h-64 w-64" />
                                </div>
                                <div className="relative z-10">
                                    <div className="inline-flex p-10 bg-amber-50 rounded-full border border-amber-100 mb-8 italic">
                                        <Lock className="h-16 w-16 text-amber-300" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900  uppercase italic mb-4 leading-none">Otoritas Terbatas</h3>
                                    <p className="text-slate-400 font-bold uppercase  text-[11px] max-w-sm mx-auto leading-relaxed opacity-70 italic">
                                        Hanya <span className="text-primary italic">Ketua Kelompok</span> yang diizinkan untuk mengelola pengiriman Laporan Akhir Kelompok. Anda tetap dapat melihat status laporan yang telah dikirimkan di atas.
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="space-y-12">
                        <section className="bg-primary/5 rounded-[3rem] p-12 border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.05] text-primary group-hover:scale-125 transition-transform pointer-events-none">
                                <Info className="h-40 w-40" />
                            </div>
                            
                            <h4 className="text-[11px] font-black mb-10 flex items-center gap-4 uppercase  italic text-primary">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                                Panduan Pengiriman
                            </h4>
                            
                            <div className="space-y-10 relative z-10">
                                <GuideItem 
                                    icon={UploadCloud} 
                                    title="Integritas File" 
                                    desc="Gunakan format PDF untuk memastikan tata letak dokumen tidak berubah selama proses audit."
                                />
                                <GuideItem 
                                    icon={FileText} 
                                    title="Pemeriksaan Final" 
                                    desc="Pastikan seluruh tanda tangan DPL dan instansi terkait telah lengkap sebelum diunggah."
                                />
                                <GuideItem 
                                    icon={Lock} 
                                    title="Status Final" 
                                    desc="Laporan yang telah disetujui oleh Admin tidak dapat diubah kembali tanpa pengajuan resmi."
                                />
                            </div>
                        </section>
                        
                        <div className="rounded-[3rem] bg-slate-950 p-12 text-white relative overflow-hidden group italic border border-slate-900">
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
                             <h4 className="text-[10px] font-black mb-8 uppercase  opacity-40 italic">Audit Alur Evaluasi</h4>
                             <p className="text-[13px] font-bold leading-relaxed uppercase italic  relative z-10 opacity-80">
                                Laporan akhir kelompok Anda akan melewati proses verifikasi bertahap oleh Dosen Pembimbing Lapangan sebelum disetujui secara permanen dalam basis data Universitas.
                             </p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[10px] font-black text-slate-300 uppercase  italic leading-none">
                        Pusat Dokumentasi Akhir • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

function GuideItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-6 items-start italic">
            <div className="h-10 w-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-900 uppercase  mb-1.5 leading-none">{title}</p>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase  opacity-70">{desc}</p>
            </div>
        </div>
    );
}
