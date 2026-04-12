import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, FormSelect } from '@/Components/ui';
import { route } from 'ziggy-js';
import { ChevronLeft, FolderPlus, Target, Users, Wallet, Info, CheckCircle2 } from 'lucide-react';

export default function StudentWorkProgramCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        objectives: '',
        target_participants: '',
        budget: '',
        kategori: 'pendukung',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('student.program-kerja.store'));
    };

    return (
        <AppLayout title="Ajukan Program Kerja">
            <Head title="Ajukan Proker | SIM-KKN" />

            <div className="mx-auto max-w-4xl space-y-10 pb-20">
                {/* --- HEADER --- */}
                <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-12 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-4 text-emerald-600 mb-2">
                            <Link
                                href={route('student.program-kerja.index')}
                                className="p-2 hover:bg-emerald-50 rounded-xl transition-colors"
                            >
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </Link>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Kembali ke Daftar</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter uppercase leading-none">Ajukan Proker</h1>
                        <p className="text-sm font-medium text-slate-400 italic">"Membangun masyarakat dengan strategi ABCD yang terukur."</p>
                    </div>
                    
                    <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                        <FolderPlus size={32} />
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-12 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm">
                                <Info size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Klasifikasi & Inti</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Tentukan prioritas program Anda</p>
                            </div>
                        </div>

                        <FormSelect
                            label="Kategori Program"
                            required
                            value={data.kategori}
                            onChange={(event) => setData('kategori', event.target.value)}
                            error={errors.kategori}
                            className="rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white py-4 font-bold text-slate-700"
                        >
                            <option value="unggulan">PROGRAM UNGGULAN (Utama)</option>
                            <option value="pendukung">PROGRAM PENDUKUNG (Rutin)</option>
                        </FormSelect>

                        <FormInput
                            label="Judul Rencana Program"
                            required
                            placeholder="Tuliskan nama kegiatan yang menarik dan jelas..."
                            value={data.title}
                            onChange={(event) => setData('title', event.target.value)}
                            error={errors.title}
                            className="rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white py-4 font-bold text-slate-700"
                        />

                        <FormTextarea
                            label="Deskripsi Mekanisme"
                            placeholder="Gambarkan alur pelaksanaan program dari awal hingga akhir..."
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            error={errors.description}
                            className="rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white py-4 font-medium min-h-[120px]"
                        />
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-12 shadow-sm space-y-8">
                         <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center shadow-sm">
                                <Target size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Target & Budgeting</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Estimasi kebutuhan dan tujuan akhir</p>
                            </div>
                        </div>

                        <FormTextarea
                            label="Tujuan & Target Luaran"
                            placeholder="Apa yang ingin dicapai? (Misal: 100 warga teredukasi)"
                            value={data.objectives}
                            onChange={(event) => setData('objectives', event.target.value)}
                            error={errors.objectives}
                            className="rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white py-4 font-medium"
                        />

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Users size={14} className="text-blue-500" /> Estimasi Peserta
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={data.target_participants}
                                    onChange={(event) => setData('target_participants', event.target.value)}
                                    className="w-full rounded-2xl bg-slate-50/50 border-slate-100 px-5 py-4 text-sm font-bold text-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                {errors.target_participants && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.target_participants}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Wallet size={14} className="text-amber-500" /> Anggaran (Rp)
                                </label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0"
                                    value={data.budget}
                                    onChange={(event) => setData('budget', event.target.value)}
                                    className="w-full rounded-2xl bg-slate-50/50 border-slate-100 px-5 py-4 text-sm font-bold text-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                {errors.budget && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.budget}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-6">
                        <Link
                            href={route('student.program-kerja.index')}
                            className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                        >
                            Batalkan Pengajuan
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-16 px-12 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                        >
                            {processing ? 'Transmitting...' : 'Ajukan Program Ke DPL'}
                            <CheckCircle2 size={18} strokeWidth={3} />
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
