import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
import {
    ArrowRight,
    Award,
    BookOpen,
    Download,
    MapPin,
    Newspaper,
    Users,
    Calendar,
    Activity,
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

type AnnouncementItem = {
    id: number;
    title: string;
    category?: string | null;
    published_at?: string | null;
    is_demo?: boolean;
};

type DownloadItem = {
    id: number;
    title: string;
    file_type?: string | null;
    external_url?: string | null;
    file_path?: string | null;
    is_demo?: boolean;
};

type Stats = {
    students?: number;
    groups?: number;
    locations?: number;
    academic_years?: number;
};

interface Props {
    featuredAnnouncements?: AnnouncementItem[];
    featuredDownloads?: DownloadItem[];
    stats?: Stats;
}

function formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export default function Home({
    featuredAnnouncements = [],
    featuredDownloads = [],
    stats = {},
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const portalHref = auth.user ? route('dashboard') : route('login');

    return (
        <PublicLayout>
            <Head title="KKN UIN Saizu | Sistem Informasi Manajemen" />

            <div className="min-h-screen bg-white">
                <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                                Kuliah Kerja Nyata
                                <br />
                                <span className="text-emerald-100">UIN Saizu</span>
                            </h1>
                            <p className="text-xl text-emerald-100 mb-8">
                                Sistem Informasi Manajemen Pengabdian Masyarakat Universitas Islam
                                Negeri Prof. K.H. Saifuddin Zuhri Purwokerto.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href={portalHref}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-medium rounded-lg hover:bg-emerald-50"
                                >
                                    {auth.user ? 'Dashboard' : 'Masuk Portal'}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href={route('public.schemes')}
                                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10"
                                >
                                    Lihat Skema
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-12 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats.students || '-'}
                                </p>
                                <p className="text-sm text-gray-500">Mahasiswa</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats.groups || '-'}
                                </p>
                                <p className="text-sm text-gray-500">Kelompok</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats.locations || '-'}
                                </p>
                                <p className="text-sm text-gray-500">Lokasi</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats.academic_years || '-'}
                                </p>
                                <p className="text-sm text-gray-500">Tahun</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Keunggulan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <BookOpen className="h-10 w-10 text-emerald-600 mb-4" />
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Pembelajaran Terstruktur
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Kurikulum KKN dibangun agar mahasiswa siap bekerja nyata di
                                    lapangan.
                                </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <Users className="h-10 w-10 text-emerald-600 mb-4" />
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Kolaborasi Masyarakat
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Program mempertemukan mahasiswa dengan kebutuhan riil warga.
                                </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <MapPin className="h-10 w-10 text-emerald-600 mb-4" />
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Penempatan Terarah
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Lokasi KKN dikelola melalui sistem zonasi terpusat.
                                </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <Award className="h-10 w-10 text-emerald-600 mb-4" />
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Sertifikasi Resmi
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Luaran tervalidasi secara formal melalui dashboard akademik.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Skema KKN</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="font-semibold text-gray-900 mb-2">KKN Reguler</h3>
                                <p className="text-sm text-gray-500">
                                    Skema utama penempatan mahasiswa pada desa mitra.
                                </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="font-semibold text-gray-900 mb-2">KKN Tematik</h3>
                                <p className="text-sm text-gray-500">
                                    Intervensi strategis berbasis isu prioritas.
                                </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="font-semibold text-gray-900 mb-2">KKN Nusantara</h3>
                                <p className="text-sm text-gray-500">
                                    Program khusus lintas wilayah.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <Link
                                href={route('public.schemes')}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Lihat semua skema →
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Warta Terbaru</h2>
                            <div className="space-y-4">
                                {featuredAnnouncements.length > 0 ? (
                                    featuredAnnouncements.slice(0, 3).map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-gray-200 rounded-lg p-4"
                                        >
                                            <p className="text-xs text-gray-500 mb-1">
                                                {item.category || 'Pengumuman'} •{' '}
                                                {formatDate(item.published_at)}
                                            </p>
                                            <h3 className="font-medium text-gray-900">
                                                {item.title}
                                            </h3>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">Belum ada warta.</p>
                                )}
                            </div>
                            <Link
                                href={route('public.announcements')}
                                className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Lihat semua warta →
                            </Link>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Unduhan</h2>
                            <div className="space-y-4">
                                {featuredDownloads.length > 0 ? (
                                    featuredDownloads.slice(0, 3).map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {item.file_type || 'Dokumen'}
                                                </p>
                                                <h3 className="font-medium text-gray-900">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <Download className="h-5 w-5 text-gray-400" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">Belum ada unduhan.</p>
                                )}
                            </div>
                            <Link
                                href={route('public.downloads')}
                                className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Lihat semua unduhan →
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
