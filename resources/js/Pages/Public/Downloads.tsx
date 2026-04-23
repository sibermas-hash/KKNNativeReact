import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Download as DownloadIcon, ExternalLink, FileText, FolderDown, Globe } from 'lucide-react';

interface Download {
    id: number;
    title: string;
    file_type?: string | null;
    file_path: string | null;
    external_url: string | null;
}

interface Props {
    downloads: Download[];
}

function accessHref(item: Download) {
    return item.external_url || item.file_path || '#';
}

function sourceType(item: Download) {
    return item.external_url ? 'Tautan eksternal' : 'Berkas publik';
}

export default function Downloads({ downloads }: Props) {
    const internalFiles = downloads.filter((item) => !item.external_url).length;
    const externalFiles = downloads.filter((item) => item.external_url).length;

    return (
        <PublicLayout>
            <Head title="Unduhan | SIBERMAS KKN UIN SAIZU" />

            <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,#f8fcfa_0%,#ffffff_68%)] pb-10 pt-28 lg:pt-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
                        <div className="max-w-4xl">
                            <p className="home-kicker text-emerald-600">Unduhan Publik</p>
                            <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl lg:text-5xl">
                                Dokumen dan berkas pendukung KKN yang bisa diakses publik.
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                                Halaman ini memuat panduan, dokumen administrasi, dan tautan publik yang dibutuhkan untuk
                                mengikuti informasi dan pelaksanaan KKN UIN SAIZU.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <SummaryCard label="Total Dokumen" value={`${downloads.length}`} />
                            <SummaryCard label="Berkas Internal" value={`${internalFiles}`} />
                            <SummaryCard label="Tautan Eksternal" value={`${externalFiles}`} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 sm:py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    {downloads.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {downloads.map((item) => (
                                <a
                                    key={item.id}
                                    href={accessHref(item)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-[1.4rem] border border-emerald-100 bg-white p-5 no-underline shadow-[0_14px_40px_rgba(6,78,59,0.05)] transition-transform hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                            <FileText size={20} />
                                        </div>
                                        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                            {item.file_type || 'Dokumen'}
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <h2 className="text-lg font-display font-bold leading-snug text-emerald-950">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm leading-6 text-slate-600">
                                            {sourceType(item)} untuk kebutuhan informasi dan referensi program KKN.
                                        </p>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-emerald-100 pt-4">
                                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                            Buka dokumen
                                        </span>
                                        {item.external_url ? (
                                            <ExternalLink size={16} className="text-emerald-700" />
                                        ) : (
                                            <DownloadIcon size={16} className="text-emerald-700" />
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 px-8 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600">
                                <FolderDown size={24} />
                            </div>
                            <h2 className="mt-5 text-xl font-display font-bold text-emerald-950 sm:text-2xl">
                                Belum ada dokumen yang dipublikasikan.
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                Begitu dokumen publik tersedia, daftar unduhan akan muncul otomatis di halaman ini.
                            </p>
                        </div>
                    )}

                    <div className="mt-10 rounded-[1.4rem] border border-emerald-100 bg-emerald-50/55 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700">
                                <Globe size={18} />
                            </div>
                            <div>
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                    Catatan Akses
                                </p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                    Beberapa dokumen dapat berbentuk tautan eksternal, sementara dokumen lainnya langsung
                                    mengarah ke berkas yang tersimpan di portal publik KKN.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[1.1rem] border border-emerald-100 bg-white p-4 shadow-[0_12px_35px_rgba(6,78,59,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">{label}</p>
            <p className="mt-2 text-2xl font-display font-bold text-emerald-950">{value}</p>
        </div>
    );
}
