import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BookOpenText, Save } from 'lucide-react';

interface Props {
    content: {
        about: string;
        visi: string;
        misi: string;
    };
}

export default function ProfileContentPage({ content }: Props) {
    const form = useForm({
        about: content.about,
        visi: content.visi,
        misi: content.misi,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/content/profile');
    };

    return (
        <AppLayout title="Kelola Profil LPPM">
            <Head title="Kelola Profil LPPM" />

            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                            <BookOpenText className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight text-slate-950">
                                Kelola Halaman Profil LPPM
                            </h1>
                            <p className="max-w-3xl text-sm leading-7 text-slate-500">
                                Perubahan di halaman ini akan langsung memengaruhi konten publik pada
                                <span className="font-semibold text-slate-700"> /profil</span>.
                            </p>
                        </div>
                    </div>
                </section>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="about" className="text-sm font-semibold text-slate-700">
                                    Tentang LPPM
                                </label>
                                <textarea
                                    id="about"
                                    rows={7}
                                    value={form.data.about}
                                    onChange={(event) => form.setData('about', event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                />
                                {form.errors.about && <p className="mt-2 text-sm text-red-600">{form.errors.about}</p>}
                            </div>

                            <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                    <label htmlFor="visi" className="text-sm font-semibold text-slate-700">
                                        Visi
                                    </label>
                                    <textarea
                                        id="visi"
                                        rows={5}
                                        value={form.data.visi}
                                        onChange={(event) => form.setData('visi', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                    {form.errors.visi && <p className="mt-2 text-sm text-red-600">{form.errors.visi}</p>}
                                </div>

                                <div>
                                    <label htmlFor="misi" className="text-sm font-semibold text-slate-700">
                                        Misi
                                    </label>
                                    <textarea
                                        id="misi"
                                        rows={5}
                                        value={form.data.misi}
                                        onChange={(event) => form.setData('misi', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-7 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                    {form.errors.misi && <p className="mt-2 text-sm text-red-600">{form.errors.misi}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-slate-950">Simpan Perubahan</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Simpan perubahan untuk memperbarui tampilan halaman profil publik.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Menyimpan...' : 'Simpan Konten'}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </AppLayout>
    );
}
