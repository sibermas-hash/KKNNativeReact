import { type FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CloudDownload, Database, RefreshCw, Search, UserRoundPlus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

interface AvailableDosen {
    id?: number | null;
    nip: string;
    name: string;
    email: string | null;
}

interface Props {
    availableDosen: AvailableDosen[];
    filters: {
        search?: string;
    };
}

export default function DplSync({ availableDosen, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [syncingNip, setSyncingNip] = useState<string | null>(null);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('admin.dpl.sync'), { search }, { preserveState: true, preserveScroll: true });
    };

    const handleSync = (dosen: AvailableDosen) => {
        setSyncingNip(dosen.nip);
        router.post(
            route('admin.dpl.sync.store'),
            {
                master_id: dosen.id,
                nip: dosen.nip,
                name: dosen.name,
                email: dosen.email,
            },
            {
                preserveScroll: true,
                onFinish: () => setSyncingNip(null),
            },
        );
    };

    return (
        <AppLayout title="Sinkronisasi Master Dosen">
            <Head title="Sinkronisasi Master Dosen" />

            <div className="space-y-8 pb-20">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sinkronisasi Master Dosen</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Ambil data dosen dari master kampus ke basis data lokal. Proses ini belum membuat akun
                            login DPL.
                        </p>
                    </div>
                    <Link
                        href={route('admin.dpl.assignment')}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        Lanjut ke penugasan DPL
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari NIP atau nama dosen..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                        />
                    </form>

                    <div className="flex items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        <CloudDownload className="h-4 w-4" />
                        {availableDosen.length} dosen siap disinkronkan
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">Daftar dosen dari master kampus</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Setelah tersinkron, dosen dapat diaktifkan sebagai DPL pada periode tertentu.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Identitas dosen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {availableDosen.length > 0 ? (
                                        availableDosen.map((dosen) => (
                                            <tr key={dosen.nip}>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">{dosen.name}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                                        NIP {dosen.nip}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {dosen.email || 'Belum tersedia'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSync(dosen)}
                                                        disabled={syncingNip === dosen.nip}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                                    >
                                                        {syncingNip === dosen.nip ? (
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Database className="h-4 w-4" />
                                                        )}
                                                        Sinkronkan
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-16 text-center text-sm text-slate-500">
                                                Tidak ada dosen baru yang cocok dengan filter saat ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                                    <UserRoundPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Pola baru DPL</h2>
                                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                                        <p>Sinkronisasi ini hanya mengisi master dosen lokal.</p>
                                        <p>Akun login DPL baru dibuat saat dosen diaktifkan pada periode tertentu.</p>
                                        <p>Penugasan kelompok dan koordinator kecamatan dilakukan dari halaman penugasan DPL.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                            <h2 className="text-lg font-semibold text-amber-900">Catatan keamanan</h2>
                            <p className="mt-2 text-sm leading-6 text-amber-800">
                                Dosen yang baru diaktifkan sebagai DPL akan menerima kata sandi sementara dan wajib
                                menggantinya saat login pertama.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
