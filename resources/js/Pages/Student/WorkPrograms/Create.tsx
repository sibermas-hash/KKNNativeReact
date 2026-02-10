import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/UI';
import type { PageProps } from '@/types';
import React from 'react';

const SDG_LIST = [
    { id: 1, name: 'Tanpa Kemiskinan', color: 'bg-red-600' },
    { id: 2, name: 'Tanpa Kelaparan', color: 'bg-amber-600' },
    { id: 3, name: 'Kehidupan Sehat & Sejahtera', color: 'bg-emerald-600' },
    { id: 4, name: 'Pendidikan Berkualitas', color: 'bg-rose-700' },
    { id: 5, name: 'Kesetaraan Gender', color: 'bg-orange-600' },
    { id: 6, name: 'Air Bersih & Sanitasi', color: 'bg-sky-500' },
    { id: 7, name: 'Energi Bersih & Terjangkau', color: 'bg-yellow-500' },
    { id: 8, name: 'Pekerjaan Layak & Pertumbuhan Ekonomi', color: 'bg-red-800' },
    { id: 9, name: 'Industri, Inovasi & Infrastruktur', color: 'bg-orange-700' },
    { id: 10, name: 'Berkurangnya Kesenjangan', color: 'bg-pink-600' },
    { id: 11, name: 'Kota & Pemukiman Berkelanjutan', color: 'bg-amber-500' },
    { id: 12, name: 'Konsumsi & Produksi Bertanggung Jawab', color: 'bg-orange-800' },
    { id: 13, name: 'Penanganan Perubahan Iklim', color: 'bg-emerald-800' },
    { id: 14, name: 'Ekosistem Lautan', color: 'bg-blue-600' },
    { id: 15, name: 'Ekosistem Daratan', color: 'bg-lime-600' },
    { id: 16, name: 'Perdamaian, Keadilan & Kelembagaan Kuat', color: 'bg-blue-800' },
    { id: 17, name: 'Kemitraan untuk Mencapai Tujuan', color: 'bg-slate-800' },
];

export default function StudentWorkProgramCreate(_props: PageProps) {
    const form = useForm({
        title: '',
        description: '',
        sdg_goals: [] as number[],
        objectives: '',
        target_participants: '',
        budget: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/student/work-programs');
    }

    const toggleSdg = (id: number) => {
        const current = [...form.data.sdg_goals];
        const index = current.indexOf(id);
        if (index > -1) current.splice(index, 1);
        else current.push(id);
        form.setData('sdg_goals', current);
    };

    return (
        <AppLayout title="Ajukan Program Kerja">
            <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tight">Ajukan Program Kerja</h2>
                    <p className="text-slate-400 mt-2">Pastikan program kerja Anda selaras dengan target SDG.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <FormInput id="title" label="Judul Proker" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} error={form.errors.title} required />
                        <FormTextarea id="description" label="Deskripsi Lengkap" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} error={form.errors.description} rows={4} />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-300 uppercase tracking-widest">Target SDG (Sustainable Development Goals)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SDG_LIST.map((sdg) => (
                                <button
                                    key={sdg.id}
                                    type="button"
                                    onClick={() => toggleSdg(sdg.id)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${form.data.sdg_goals.includes(sdg.id)
                                        ? `${sdg.color} text-white border-transparent ring-2 ring-white/20`
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center font-bold text-xs">
                                        {sdg.id}
                                    </span>
                                    <span className="text-[11px] font-bold leading-tight">{sdg.name}</span>
                                </button>
                            ))}
                        </div>
                        {form.errors.sdg_goals && <p className="text-red-400 text-xs mt-1 font-bold">{form.errors.sdg_goals}</p>}
                    </div>

                    <div className="space-y-4">
                        <FormTextarea id="objectives" label="Tujuan & Target Luaran" value={form.data.objectives} onChange={(e) => form.setData('objectives', e.target.value)} error={form.errors.objectives} rows={2} />
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <FormInput id="target_participants" label="Estimasi Peserta" type="number" value={form.data.target_participants} onChange={(e) => form.setData('target_participants', e.target.value)} error={form.errors.target_participants} />
                            <FormInput id="budget" label="Anggaran (Rp)" type="number" value={form.data.budget} onChange={(e) => form.setData('budget', e.target.value)} error={form.errors.budget} required />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition disabled:opacity-50 shadow-xl shadow-blue-600/20"
                        >
                            {form.processing ? 'Memproses...' : 'Ajukan Program'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                input, textarea {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    border-radius: 12px !important;
                }
                label {
                    color: #94a3b8 !important;
                }
            `}</style>
        </AppLayout>
    );
}

