import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useState, type ElementType, type FormEvent } from 'react';
import {
    Activity,
    ArrowRight,
    Award,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    FileCheck2,
    FileText,
    FolderDown,
    GraduationCap,
    Layers,
    LifeBuoy,
    LineChart,
    MapPin,
    Megaphone,
    ShieldCheck,
    Sparkles,
    Users,
    Workflow,
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { SectionHeading } from '@/Components/Premium/SectionHeading';

const safeRoute = (name: string, params?: any) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

type AnnouncementItem = {
    id: number;
    title: string;
    category?: string | null;
    published_at?: string | null;
};

type DownloadItem = {
    id: number;
    title: string;
    file_type?: string | null;
    external_url?: string | null;
    file_path?: string | null;
};

type Stats = {
    students?: number;
    groups?: number;
    locations?: number;
    academic_years?: number;
};

type AboutContent = {
    about?: string;
    visi?: string;
    misi?: string;
};

type ActivePeriodData = {
    id?: number;
    name?: string | null;
    academic_year?: string | null;
    jenis?: string | null;
    current_phase?: string | null;
};

interface Props {
    featuredAnnouncements?: AnnouncementItem[];
    featuredDownloads?: DownloadItem[];
    stats?: Stats;
    aboutContent?: AboutContent;
}

type PhaseKey =
    | 'upcoming'
    | 'registration'
    | 'placement'
    | 'execution'
    | 'grading'
    | 'finished';

const phaseOrder: PhaseKey[] = [
    'upcoming',
    'registration',
    'placement',
    'execution',
    'grading',
    'finished',
];

const phaseMeta: Record<
    PhaseKey,
    {
        label: string;
        shortLabel: string;
        description: string;
    }
> = {
    upcoming: {
        label: 'Persiapan Sistem',
        shortLabel: 'Persiapan',
        description: 'Publik dapat memantau informasi awal, skema, dan materi persiapan sebelum pendaftaran dibuka.',
    },
    registration: {
        label: 'Pendaftaran Aktif',
        shortLabel: 'Pendaftaran',
        description: 'Mahasiswa dapat mulai mendaftar dan melengkapi dokumen sesuai ketentuan periode yang dibuka.',
    },
    placement: {
        label: 'Penempatan Kelompok',
        shortLabel: 'Penempatan',
        description: 'Admin memproses pembagian kelompok dan titik lokasi agar pelaksanaan lebih tertata.',
    },
    execution: {
        label: 'Pelaksanaan Lapangan',
        shortLabel: 'Pelaksanaan',
        description: 'Portal digunakan untuk logbook, program kerja, izin, dan monitoring kegiatan lapangan.',
    },
    grading: {
        label: 'Penilaian dan Evaluasi',
        shortLabel: 'Penilaian',
        description: 'DPL memverifikasi laporan, memberi evaluasi, dan memproses hasil capaian peserta.',
    },
    finished: {
        label: 'Sertifikat dan Penutupan',
        shortLabel: 'Selesai',
        description: 'Hasil akhir dapat direkap, sertifikat diterbitkan, dan publik bisa melakukan verifikasi dokumen.',
    },
};

function formatDate(value?: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function normalizePhase(phase?: string | null): PhaseKey {
    if (phase && phaseOrder.includes(phase as PhaseKey)) {
        return phase as PhaseKey;
    }

    return 'upcoming';
}

export default function Home({
    featuredAnnouncements = [],
    featuredDownloads = [],
    stats = {},
    aboutContent = {},
}: Props) {
    const page = usePage<
        PageProps & {
            auth: PageProps['auth'] & { active_phase?: string };
            activePeriod?: ActivePeriodData | null;
        }
    >().props;

    const { auth, activePeriod } = page;
    const [certificateToken, setCertificateToken] = useState('');

    const getDashboardRoute = () => {
        if (!auth.user) return safeRoute('login');

        const roles = (auth.user.roles as any[])?.map((role) => (typeof role === 'string' ? role : role.name)) || [];
        if (roles.includes('superadmin') || roles.includes('faculty_admin') || roles.includes('admin')) {
            return safeRoute('admin.dashboard');
        }
        if (roles.includes('dpl') || roles.includes('dosen')) {
            return safeRoute('dosen.dashboard');
        }

        return safeRoute('student.dashboard');
    };

    const activePhase = normalizePhase(activePeriod?.current_phase || auth.active_phase);
    const activePhaseIndex = phaseOrder.indexOf(activePhase);
    const activePhaseContent = phaseMeta[activePhase];
    const portalHref = getDashboardRoute();
    const loginHref = safeRoute('login');

    const quickLinks = [
        { label: 'Profil LPPM', href: safeRoute('public.about') },
        { label: 'Skema KKN', href: safeRoute('public.schemes') },
        { label: 'Pengumuman', href: safeRoute('public.announcements') },
        { label: 'Repositori', href: safeRoute('public.downloads') },
        { label: 'Lokasi', href: safeRoute('public.locations') },
        { label: 'Sertifikat', href: '#verifikasi-sertifikat', native: true },
    ];

    const serviceMenus = [
        {
            title: 'Profil LPPM',
            description: 'Memperkenalkan mandat, orientasi pengabdian, dan identitas kelembagaan kepada publik secara ringkas dan meyakinkan.',
            href: safeRoute('public.about'),
            icon: Building2,
        },
        {
            title: 'Skema KKN',
            description: 'Menjelaskan ragam KKN reguler, tematik, kolaborasi, hingga internasional agar calon peserta memahami pilihan program.',
            href: safeRoute('public.schemes'),
            icon: Layers,
        },
        {
            title: 'Pengumuman Resmi',
            description: 'Menjadi pusat informasi perubahan jadwal, agenda, dan kebijakan KKN yang wajib dipantau mahasiswa, dosen, dan mitra.',
            href: safeRoute('public.announcements'),
            icon: Megaphone,
        },
        {
            title: 'Dokumen dan Panduan',
            description: 'Menyediakan panduan, template, dan arsip berkas operasional agar kebutuhan administratif tidak tersebar ke banyak kanal.',
            href: safeRoute('public.downloads'),
            icon: FolderDown,
        },
        {
            title: 'Peta Lokasi KKN',
            description: 'Menunjukkan cakupan wilayah, sebaran desa, dan jumlah kelompok agar portal terasa terbuka dan berbasis data lapangan.',
            href: safeRoute('public.locations'),
            icon: MapPin,
        },
        {
            title: 'Verifikasi Sertifikat',
            description: 'Menguatkan kepercayaan publik melalui pemeriksaan keaslian sertifikat digital KKN secara mandiri.',
            href: '#verifikasi-sertifikat',
            icon: ShieldCheck,
            native: true,
        },
    ];

    const digitalPillars = [
        {
            title: 'Layanan Berbasis Audiens',
            description: 'Home publik harus memisahkan jalur mahasiswa, dosen, mitra, dan publik agar orang langsung tiba di layanan yang relevan.',
            icon: Users,
            points: ['Pisahkan jalur per peran', 'Kurangi kebingungan sebelum login', 'Dorong self-service'],
        },
        {
            title: 'Transparansi Tahapan',
            description: 'Portal KKN yang matang wajib menampilkan fase aktif, dokumen, jadwal, dan lokasi secara terbuka di permukaan halaman.',
            icon: Workflow,
            points: ['Fase dan timeline terlihat', 'Dokumen mudah dicari', 'Lokasi terbuka untuk publik'],
        },
        {
            title: 'Kepercayaan dan Validasi',
            description: 'Kontak resmi, verifikasi sertifikat, dan kanal bantuan membuat portal terasa sah, aman, dan bertanggung jawab.',
            icon: ShieldCheck,
            points: ['Validasi dokumen', 'Kontak resmi yang jelas', 'Kanal bantuan dan aspirasi'],
        },
        {
            title: 'Bukti Dampak Program',
            description: 'Digitalisasi tidak berhenti di pendaftaran; publik juga perlu melihat hasil pengabdian, luaran, dan nilai manfaat program.',
            icon: LineChart,
            points: ['Dashboard dampak', 'Luaran dan publikasi', 'Narasi keberhasilan KKN'],
        },
    ];

    const upgradeMenus = [
        {
            title: 'Kalender Periode dan Timeline',
            priority: 'Prioritas 1',
            readiness: 'Data dasar sudah tersedia',
            description:
                'Portal KKN kampus lain hampir selalu menaruh jadwal, pembekalan, penempatan, dan pelaporan di area publik karena ini informasi yang paling sering dicari.',
            basis: 'Dapat memanfaatkan `activePeriod`, `availablePeriods`, dan fase bisnis yang sudah ada di sistem.',
        },
        {
            title: 'FAQ dan Pusat Bantuan',
            priority: 'Prioritas 1',
            readiness: 'Cepat dibangun',
            description:
                'Standar layanan publik menuntut informasi yang cepat, sederhana, dan mudah dipahami. FAQ menurunkan pertanyaan berulang soal syarat, dokumen, dan alur.',
            basis: 'Konten awal bisa diambil dari alur pendaftaran, peran DPL, sertifikat, dan lokasi penugasan.',
        },
        {
            title: 'Dashboard Dampak Pengabdian',
            priority: 'Prioritas 1',
            readiness: 'Butuh agregasi data',
            description:
                'Home publik yang kuat tidak berhenti di proses. Ia perlu menunjukkan hasil: desa dampingan, program kerja, luaran, dan jejak manfaat yang sudah tercapai.',
            basis: 'Repo sudah punya bahan baku dari logbook, program kerja, rekapitulasi, poster potensi desa, dan laporan akhir.',
        },
        {
            title: 'Kemitraan dan Ajukan Kolaborasi',
            priority: 'Prioritas 2',
            readiness: 'Konten plus form sederhana',
            description:
                'Arah KKN berdampak akan lebih terasa jika desa, sekolah, pesantren, pemda, dan komunitas punya jalur resmi untuk mengusulkan kolaborasi.',
            basis: 'Selaras dengan skema reguler, tematik, kolaborasi PTKIN, hingga internasional yang sudah dikenal sistem.',
        },
        {
            title: 'Pengaduan dan Aspirasi Layanan',
            priority: 'Prioritas 2',
            readiness: 'Tahap awal bisa berupa kanal resmi',
            description:
                'Layanan publik digital yang matang menyediakan kanal aspirasi dan pengaduan agar akuntabilitas sistem terlihat dan kepercayaan pengguna meningkat.',
            basis: 'Bisa dimulai dari tautan kanal resmi, kontak helpdesk, SOP singkat, dan status tindak lanjut aduan.',
        },
        {
            title: 'Arsip Luaran dan Publikasi KKN',
            priority: 'Prioritas 2',
            readiness: 'Kurasi konten berkala',
            description:
                'Publikasi hasil KKN penting untuk memperlihatkan bahwa pengabdian tidak berhenti di lapangan, tetapi terdokumentasi dan dapat diwariskan.',
            basis: 'Sangat cocok dengan poster potensi desa, artikel kegiatan, seminar hasil, prosiding, dan publikasi LPPM.',
        },
    ];

    const audienceMenus = [
        {
            title: 'Calon Mahasiswa Peserta',
            description: 'Jalur layanan untuk melihat periode, memahami syarat, memulai pendaftaran, dan memantau keluaran akhir.',
            points: ['Periode aktif', 'Dokumen syarat', 'Laporan dan sertifikat'],
            href: portalHref,
            icon: GraduationCap,
            actionLabel: auth.user ? 'Buka Dashboard Mahasiswa' : 'Masuk Portal Mahasiswa',
        },
        {
            title: 'Dosen dan DPL',
            description: 'Pintu masuk dosen untuk workshop, pendaftaran DPL, monitoring kelompok, dan evaluasi lapangan.',
            points: ['Workshop pembekalan', 'Pendaftaran DPL', 'Monitoring dan evaluasi'],
            href: auth.user ? portalHref : loginHref,
            icon: Users,
            actionLabel: auth.user ? 'Buka Portal Dosen' : 'Masuk Portal Dosen',
        },
        {
            title: 'Publik dan Mitra',
            description: 'Akses cepat untuk melihat program, lokasi, dokumen, pengumuman, dan validasi sertifikat tanpa harus login.',
            points: ['Informasi kelembagaan', 'Lokasi dan dokumen', 'Validasi sertifikat'],
            href: safeRoute('public.locations'),
            icon: Activity,
            actionLabel: 'Jelajahi Layanan Publik',
        },
    ];

    const handleCertificateVerification = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedToken = certificateToken.trim();
        if (!trimmedToken) {
            return;
        }

        window.location.assign(`/verify-certificate/${encodeURIComponent(trimmedToken)}`);
    };

    return (
        <PublicLayout>
            <Head title="Beranda Publik KKN | UIN SAIZU" />

            <section className="relative overflow-hidden border-b border-emerald-100 bg-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(5,150,105,0.10),transparent_34%),linear-gradient(to_bottom,rgba(236,253,245,0.9),rgba(255,255,255,1))]" />
                <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-20 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:pb-24 lg:pt-28">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
                            <Sparkles size={15} className="text-emerald-600" />
                            Portal Publik KKN Berdampak
                        </div>

                        <div className="space-y-5">
                            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-emerald-950 sm:text-5xl lg:text-6xl">
                                Beranda publik yang menata layanan, membuka data, dan memperkuat kepercayaan terhadap KKN.
                            </h1>
                            <p className="max-w-3xl text-base leading-8 text-emerald-900 sm:text-lg">
                                Riset portal KKN dan prinsip layanan publik digital menunjukkan bahwa home terbaik bukan sekadar wajah informasi. Ia harus menjadi pusat orientasi, pusat layanan mandiri, pusat transparansi tahapan, dan gerbang validasi dokumen resmi.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                href={portalHref}
                                className="inline-flex items-center gap-3 rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-bold text-white no-underline transition hover:bg-emerald-900"
                            >
                                {auth.user ? 'Masuk Dashboard' : 'Masuk Portal KKN'}
                                <ArrowRight size={18} className="text-emerald-300" />
                            </Link>
                            <Link
                                href={safeRoute('public.locations')}
                                className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-bold text-emerald-950 no-underline transition hover:border-emerald-500"
                            >
                                Lihat Peta Lokasi
                                <MapPin size={18} className="text-emerald-600" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {quickLinks.map((item) =>
                                item.native ? (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 no-underline transition hover:border-emerald-500 hover:text-emerald-950"
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 no-underline transition hover:border-emerald-500 hover:text-emerald-950"
                                    >
                                        {item.label}
                                    </Link>
                                ),
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard label="Mahasiswa Terdata" value={stats.students ?? 0} icon={Users} />
                            <StatCard label="Kelompok KKN" value={stats.groups ?? 0} icon={Layers} />
                            <StatCard label="Lokasi Pengabdian" value={stats.locations ?? 0} icon={MapPin} />
                            <StatCard label="Siklus Akademik" value={stats.academic_years ?? 0} icon={Calendar} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-sm shadow-emerald-100/60">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Status Layanan Publik</p>
                                    <h2 className="text-2xl font-bold text-emerald-950">{activePhaseContent.label}</h2>
                                </div>
                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-7 text-emerald-900">{activePhaseContent.description}</p>

                            <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-5">
                                <FieldRow label="Periode Aktif" value={activePeriod?.name || 'Menunggu publikasi LPPM'} />
                                <FieldRow label="Tahun Akademik" value={activePeriod?.academic_year || 'Mengikuti pengaturan sistem'} />
                                <FieldRow label="Skema Utama" value={activePeriod?.jenis || 'Skema akan diumumkan'} />
                            </div>

                            <div className="mt-6 grid gap-3">
                                {phaseOrder.map((phase, index) => (
                                    <PhaseRow
                                        key={phase}
                                        label={phaseMeta[phase].shortLabel}
                                        description={phaseMeta[phase].description}
                                        isActive={index === activePhaseIndex}
                                        isCompleted={index < activePhaseIndex}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-7">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Temuan Riset Menu</p>
                            <div className="mt-4 space-y-4 text-sm leading-7 text-emerald-950">
                                <div className="flex items-start gap-3">
                                    <Calendar size={18} className="mt-1 shrink-0 text-emerald-600" />
                                    <p>Pengunjung publik paling sering mencari jadwal, panduan, pengumuman, dan lokasi sebelum mereka siap masuk ke portal internal.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck size={18} className="mt-1 shrink-0 text-emerald-600" />
                                    <p>Verifikasi sertifikat, kontak resmi, dan kanal bantuan memberi rasa aman bahwa portal ini benar-benar kanal resmi KKN.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <LineChart size={18} className="mt-1 shrink-0 text-emerald-600" />
                                    <p>Portal modern perlu menunjukkan dampak pengabdian, bukan hanya prosedur administratif, agar nilai KKN terlihat oleh publik dan mitra.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <SectionHeading
                        title="Pilar Digitalisasi Home"
                        subtitle="Empat pilar ini saya tarik dari perpaduan riset eksternal dan kemampuan sistem di repo: citizen-centric, transparansi, kepercayaan, dan bukti dampak."
                        className="max-w-3xl"
                    />

                    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {digitalPillars.map((pillar) => (
                            <PillarCard
                                key={pillar.title}
                                title={pillar.title}
                                description={pillar.description}
                                icon={pillar.icon}
                                points={pillar.points}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-emerald-100 bg-emerald-50/60 py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <SectionHeading
                        title="Menu Publik Prioritas"
                        subtitle="Enam menu ini paling layak ditonjolkan sekarang karena semuanya sudah nyambung dengan kebutuhan pengguna nyata dan fitur inti yang sudah tersedia di repo."
                        className="max-w-3xl"
                    />

                    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {serviceMenus.map((menu) => (
                            <ServiceCard
                                key={menu.title}
                                title={menu.title}
                                description={menu.description}
                                icon={menu.icon}
                                href={menu.href}
                                native={menu.native}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <SectionHeading
                        title="Menu Upgrade Tahap Berikutnya"
                        subtitle="Ini adalah daftar menu yang paling strategis untuk menaikkan level digitalisasi home publik setelah fondasi informasi dasarnya rapi."
                        className="max-w-3xl"
                    />

                    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {upgradeMenus.map((item) => (
                            <UpgradeCard
                                key={item.title}
                                title={item.title}
                                priority={item.priority}
                                readiness={item.readiness}
                                description={item.description}
                                basis={item.basis}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-emerald-100 bg-emerald-50/60 py-20 lg:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
                    <div className="rounded-[2rem] border border-emerald-200 bg-white p-8">
                        <SectionHeading
                            title="Cerita Besar Portal"
                            subtitle="Konten profil tidak sebaiknya berdiri sendiri. Di beranda publik, bagian ini membangun kepercayaan sekaligus menunjukkan arah pengabdian yang ingin dibawa sistem."
                        />

                        <div className="mt-6 space-y-5 text-sm leading-8 text-emerald-950">
                            <p>
                                {aboutContent.about ||
                                    'LPPM UIN SAIZU mengelola pengabdian masyarakat secara terintegrasi agar proses KKN lebih tertib, terbuka, terukur, dan mampu dibaca publik secara lebih mudah.'}
                            </p>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <InfoPanel
                                icon={BookOpen}
                                title="Visi Publik"
                                description={
                                    aboutContent.visi ||
                                    'Menjadi pusat unggulan pengabdian masyarakat yang adaptif, terbuka, dan memberi manfaat nyata lintas wilayah.'
                                }
                            />
                            <InfoPanel
                                icon={Award}
                                title="Arah Digital"
                                description={
                                    aboutContent.misi ||
                                    'Menghadirkan layanan informasi, operasional, validasi hasil, dan publikasi KKN dalam satu pengalaman publik yang utuh.'
                                }
                            />
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-emerald-200 bg-white p-8">
                        <SectionHeading
                            title="Akses Berdasarkan Kebutuhan"
                            subtitle="Home yang baik tidak memaksa semua orang membaca hal yang sama. Ia memisahkan jalur layanan berdasarkan tujuan dan peran pengguna."
                        />

                        <div className="mt-6 space-y-4">
                            {audienceMenus.map((item) => (
                                <AudienceCard
                                    key={item.title}
                                    title={item.title}
                                    description={item.description}
                                    points={item.points}
                                    href={item.href}
                                    actionLabel={item.actionLabel}
                                    icon={item.icon}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <SectionHeading
                        title="Informasi yang Perlu Cepat Ditemukan"
                        subtitle="Konten publik yang paling sering dicari harus tetap dekat dengan beranda. Untuk proyek ini, dua blok terpenting adalah pengumuman resmi dan dokumen operasional."
                        className="max-w-3xl"
                    />

                    <div className="mt-10 grid gap-8 lg:grid-cols-2">
                        <div className="rounded-[2rem] border border-emerald-200 bg-white p-7">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                        <Megaphone size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-950">Pengumuman Resmi</h3>
                                        <p className="text-sm text-emerald-800">Perubahan jadwal, agenda, dan kebijakan KKN.</p>
                                    </div>
                                </div>
                                <Link
                                    href={safeRoute('public.announcements')}
                                    className="text-sm font-bold text-emerald-700 no-underline transition hover:text-emerald-950"
                                >
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="mt-6 space-y-4">
                                {featuredAnnouncements.length > 0 ? (
                                    featuredAnnouncements.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"
                                        >
                                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                                                {item.category || 'Pengumuman'} · {formatDate(item.published_at)}
                                            </p>
                                            <p className="mt-3 text-base font-bold leading-7 text-emerald-950">{item.title}</p>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyCard message="Belum ada pengumuman yang dipublikasikan." icon={Megaphone} />
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-emerald-200 bg-white p-7">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-950">Dokumen Operasional</h3>
                                        <p className="text-sm text-emerald-800">Panduan, template, dan arsip berkas yang siap dipakai.</p>
                                    </div>
                                </div>
                                <Link
                                    href={safeRoute('public.downloads')}
                                    className="text-sm font-bold text-emerald-700 no-underline transition hover:text-emerald-950"
                                >
                                    Buka repositori
                                </Link>
                            </div>

                            <div className="mt-6 space-y-4">
                                {featuredDownloads.length > 0 ? (
                                    featuredDownloads.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.external_url || item.file_path || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 text-emerald-950 no-underline transition hover:border-emerald-400 hover:bg-white"
                                        >
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                                                    {item.file_type || 'Dokumen'}
                                                </p>
                                                <p className="mt-3 text-base font-bold leading-7 text-emerald-950">{item.title}</p>
                                            </div>
                                            <ArrowRight size={18} className="shrink-0 text-emerald-600" />
                                        </a>
                                    ))
                                ) : (
                                    <EmptyCard message="Belum ada dokumen publik yang tersedia." icon={FolderDown} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="verifikasi-sertifikat" className="border-y border-emerald-100 bg-emerald-950 py-20 lg:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
                    <div className="space-y-5">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Kepercayaan Publik</p>
                        <h2 className="text-3xl font-bold leading-tight text-white lg:text-4xl">
                            Verifikasi sertifikat perlu terlihat jelas di beranda karena ini adalah fitur legitimasi paling kuat.
                        </h2>
                        <p className="max-w-2xl text-sm leading-8 text-emerald-100">
                            Repo ini sudah memiliki alur verifikasi sertifikat publik. Menaruh akses ini di beranda akan memperkuat citra sistem sebagai portal resmi yang dapat dipercaya oleh mahasiswa, orang tua, instansi, dan mitra pengabdian.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            <TrustCard
                                icon={FileCheck2}
                                title="Validasi Dokumen"
                                description="Publik dapat memeriksa keaslian dokumen tanpa meminta bantuan operator secara manual."
                            />
                            <TrustCard
                                icon={LifeBuoy}
                                title="Jejak Resmi"
                                description="Fitur ini memperjelas bahwa sertifikat, data penerbitan, dan status pencabutan dikelola dalam sistem."
                            />
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-emerald-800 bg-white p-7">
                        <h3 className="text-xl font-bold text-emerald-950">Cek Keaslian Sertifikat</h3>
                        <p className="mt-2 text-sm leading-7 text-emerald-800">
                            Masukkan token verifikasi dari sertifikat untuk melihat status dokumen dan data penerbitannya.
                        </p>

                        <form onSubmit={handleCertificateVerification} className="mt-6 space-y-4">
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                                    Token Verifikasi
                                </span>
                                <input
                                    type="text"
                                    value={certificateToken}
                                    onChange={(event) => setCertificateToken(event.target.value)}
                                    placeholder="Contoh: KKN-2026-ABC123"
                                    className="w-full rounded-2xl border border-emerald-200 px-4 py-4 text-sm font-medium text-emerald-950 outline-none transition placeholder:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                />
                            </label>

                            <button
                                type="submit"
                                className="inline-flex items-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                                Verifikasi Sekarang
                                <ShieldCheck size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-8 lg:p-10">
                        <SectionHeading
                            title="Prioritas Eksekusi Frontend"
                            subtitle="Kalau kita lanjutkan iterasinya setelah ini, urutan paling aman dan bernilai tinggi adalah timeline publik, FAQ bantuan, lalu dashboard dampak."
                            className="max-w-3xl"
                        />

                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            <PriorityStep
                                step="Tahap 1"
                                title="Timeline Publik"
                                description="Buka tahapan, tanggal penting, dan status periode ke permukaan home."
                            />
                            <PriorityStep
                                step="Tahap 2"
                                title="FAQ dan Bantuan"
                                description="Kurangi pertanyaan berulang dengan jawaban ringkas berbasis peran pengguna."
                            />
                            <PriorityStep
                                step="Tahap 3"
                                title="Dashboard Dampak"
                                description="Tampilkan luaran, lokasi, dan hasil pengabdian sebagai bukti manfaat KKN."
                            />
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: ElementType;
}) {
    return (
        <div className="rounded-[1.6rem] border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-100/50">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-3xl font-bold text-emerald-950 tabular-nums">{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">{label}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

function FieldRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-emerald-100 pb-3 last:border-b-0 last:pb-0">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">{label}</span>
            <span className="text-right text-sm font-bold text-emerald-950">{value}</span>
        </div>
    );
}

function PillarCard({
    title,
    description,
    icon: Icon,
    points,
}: {
    title: string;
    description: string;
    icon: ElementType;
    points: string[];
}) {
    return (
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm shadow-emerald-100/50">
            <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <Icon size={22} />
                </div>
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Pilar
                </span>
            </div>

            <h3 className="mt-6 text-xl font-bold text-emerald-950">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-800">{description}</p>

            <div className="mt-5 flex flex-wrap gap-2">
                {points.map((point) => (
                    <span
                        key={point}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
                    >
                        {point}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ServiceCard({
    title,
    description,
    icon: Icon,
    href,
    native = false,
}: {
    title: string;
    description: string;
    icon: ElementType;
    href: string;
    native?: boolean;
}) {
    const classes =
        'group rounded-[2rem] border border-emerald-200 bg-white p-6 no-underline transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100/60';

    const content = (
        <>
            <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-950 group-hover:text-white">
                    <Icon size={22} />
                </div>
                <ArrowRight size={18} className="text-emerald-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-emerald-950">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-800">{description}</p>
        </>
    );

    if (native) {
        return (
            <a href={href} className={classes}>
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={classes}>
            {content}
        </Link>
    );
}

function UpgradeCard({
    title,
    priority,
    readiness,
    description,
    basis,
}: {
    title: string;
    priority: string;
    readiness: string;
    description: string;
    basis: string;
}) {
    return (
        <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/50 p-6">
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {priority}
                </span>
                <span className="rounded-full border border-emerald-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">
                    {readiness}
                </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-emerald-950">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-800">{description}</p>

            <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Basis Implementasi</p>
                <p className="mt-2 text-sm leading-7 text-emerald-900">{basis}</p>
            </div>
        </div>
    );
}

function InfoPanel({
    icon: Icon,
    title,
    description,
}: {
    icon: ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-emerald-600">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">{title}</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-emerald-800">{description}</p>
        </div>
    );
}

function AudienceCard({
    title,
    description,
    points,
    href,
    actionLabel,
    icon: Icon,
}: {
    title: string;
    description: string;
    points: string[];
    href: string;
    actionLabel: string;
    icon: ElementType;
}) {
    return (
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-emerald-600">
                    <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-emerald-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-emerald-800">{description}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {points.map((point) => (
                    <span
                        key={point}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800"
                    >
                        {point}
                    </span>
                ))}
            </div>

            <div className="mt-5">
                <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 no-underline transition hover:text-emerald-950"
                >
                    {actionLabel}
                    <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}

function PhaseRow({
    label,
    description,
    isActive,
    isCompleted,
}: {
    label: string;
    description: string;
    isActive: boolean;
    isCompleted: boolean;
}) {
    return (
        <div
            className={[
                'rounded-2xl border px-4 py-4 transition',
                isActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : isCompleted
                      ? 'border-emerald-200 bg-white'
                      : 'border-emerald-100 bg-white/70',
            ].join(' ')}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        'mt-0.5 h-3 w-3 rounded-full',
                        isActive ? 'bg-emerald-600' : isCompleted ? 'bg-emerald-300' : 'bg-emerald-100',
                    ].join(' ')}
                />
                <div>
                    <p className="text-sm font-bold text-emerald-950">{label}</p>
                    <p className="mt-1 text-xs leading-6 text-emerald-800">{description}</p>
                </div>
            </div>
        </div>
    );
}

function TrustCard({
    icon: Icon,
    title,
    description,
}: {
    icon: ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[1.6rem] border border-emerald-800 bg-emerald-900/40 p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-emerald-200">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-emerald-100">{description}</p>
        </div>
    );
}

function PriorityStep({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">{step}</p>
            <h3 className="mt-3 text-xl font-bold text-emerald-950">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-800">{description}</p>
        </div>
    );
}

function EmptyCard({
    message,
    icon: Icon,
}: {
    message: string;
    icon: ElementType;
}) {
    return (
        <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-400">
                <Icon size={24} />
            </div>
            <p className="mt-4 text-sm font-medium text-emerald-800">{message}</p>
        </div>
    );
}
