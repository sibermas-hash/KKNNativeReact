import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Layers3, Plus, Save, Trash2 } from 'lucide-react';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';

interface SchemeItem {
    title: string;
    description: string;
    color: SchemeColor;
}

interface Props {
    content: {
        title: string;
        intro: string;
        items: SchemeItem[];
    };
}

const colorOptions: Array<{ value: SchemeColor; label: string }> = [
    { value: 'emerald', label: 'Hijau Emerald' },
    { value: 'blue', label: 'Biru' },
    { value: 'amber', label: 'Amber' },
    { value: 'slate', label: 'Slate Gelap' },
];

export default function SchemeContentPage({ content }: Props) {
    const form = useForm({
        title: content.title,
        intro: content.intro,
        schemes: content.items,
    });

    const updateScheme = <K extends keyof SchemeItem>(index: number, field: K, value: SchemeItem[K]) => {
        const nextSchemes = [...form.data.schemes];
        nextSchemes[index] = { ...nextSchemes[index], [field]: value };
        form.setData('schemes', nextSchemes);
    };

    const addScheme = () => {
        form.setData('schemes', [
            ...form.data.schemes,
            {
                title: '',
                description: '',
                color: 'emerald',
            },
        ]);
    };

    const removeScheme = (index: number) => {
        form.setData(
            'schemes',
            form.data.schemes.filter((_, currentIndex) => currentIndex !== index),
        );
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/konten-publik/skema');
    };

    return (
        <AppLayout title="Kelola Skema KKN">
            <Head title="Kelola Skema KKN" />

            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                            <Layers3 className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight text-slate-950">
                                Kelola Halaman Skema KKN
                            </h1>
                            <p className="max-w-3xl text-sm leading-7 text-slate-500">
                                Atur judul, pengantar, dan daftar skema yang tampil pada
                                <span className="font-semibold text-slate-700"> /skema-kkn</span>.
                            </p>
                        </div>
                    </div>
                </section>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="grid gap-5">
                            <div>
                                <label htmlFor="title" className="text-sm font-semibold text-slate-700">
                                    Judul Halaman
                                </label>
                                <input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                />
                                {form.errors.title && <p className="mt-2 text-sm text-red-600">{form.errors.title}</p>}
                            </div>

                            <div>
                                <label htmlFor="intro" className="text-sm font-semibold text-slate-700">
                                    Pengantar Halaman
                                </label>
                                <textarea
                                    id="intro"
                                    rows={4}
                                    value={form.data.intro}
                                    onChange={(event) => form.setData('intro', event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                />
                                {form.errors.intro && <p className="mt-2 text-sm text-red-600">{form.errors.intro}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-950">Daftar Skema</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Minimal satu skema. Maksimal delapan skema.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addScheme}
                                disabled={form.data.schemes.length >= 8}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-700 transition-all hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Skema
                            </button>
                        </div>

                        <div className="mt-8 space-y-5">
                            {form.data.schemes.map((scheme, index) => (
                                <div key={`scheme-${index}`} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-lg font-black tracking-tight text-slate-950">
                                            Skema {index + 1}
                                        </h3>
                                        {form.data.schemes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeScheme(index)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-600 transition-all hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Hapus
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_220px]">
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-sm font-semibold text-slate-700">Nama Skema</label>
                                                <input
                                                    value={scheme.title}
                                                    onChange={(event) => updateScheme(index, 'title', event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                                />
                                                {form.errors[`schemes.${index}.title`] && (
                                                    <p className="mt-2 text-sm text-red-600">{form.errors[`schemes.${index}.title`]}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
                                                <textarea
                                                    rows={4}
                                                    value={scheme.description}
                                                    onChange={(event) => updateScheme(index, 'description', event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                                />
                                                {form.errors[`schemes.${index}.description`] && (
                                                    <p className="mt-2 text-sm text-red-600">{form.errors[`schemes.${index}.description`]}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Warna Kartu</label>
                                            <select
                                                value={scheme.color}
                                                onChange={(event) => updateScheme(index, 'color', event.target.value as SchemeColor)}
                                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                            >
                                                {colorOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors[`schemes.${index}.color`] && (
                                                <p className="mt-2 text-sm text-red-600">{form.errors[`schemes.${index}.color`]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-slate-950">Publikasikan Perubahan</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Simpan untuk memperbarui tampilan skema pada halaman publik.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Menyimpan...' : 'Simpan Skema'}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </AppLayout>
    );
}
