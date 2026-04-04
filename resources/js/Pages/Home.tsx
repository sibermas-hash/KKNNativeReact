import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Layers, MapPin, Star, Users } from 'lucide-react';
import { route } from 'ziggy-js';
import PublicLayout from '@/Layouts/PublicLayout';

interface Props {
    stats: {
        students: number;
        groups: number;
        locations: number;
    };
    featuredAnnouncements: Array<unknown>;
    featuredDownloads: Array<unknown>;
}

export default function Home({ stats }: Props) {
    return (
        <PublicLayout>
            <Head title="SIM-KKN | Portal Kuliah Kerja Nyata UIN Prof. K.H. Saifuddin Zuhri" />

            <section className="relative -mt-24 flex min-h-screen items-center overflow-hidden bg-emerald-600 pb-20 pt-32 lg:pb-44 lg:pt-52">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/landing/hero.png"
                        alt="Mahasiswa KKN"
                        className="h-full w-full object-cover brightness-[0.7] saturate-[1.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/90 via-emerald-800/40 to-amber-500/10" />

                    <div className="absolute right-1/4 top-1/4 hidden text-9xl font-black tracking-tighter text-white opacity-20 lg:block">
                        UINSAIZU
                    </div>
                </div>

                <div className="container relative z-10 mx-auto px-6 text-center lg:px-12 lg:text-left">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-10 inline-flex items-center gap-4 rounded-full border border-white/20 bg-white/10 px-6 py-2 backdrop-blur-md"
                        >
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white">
                                Pendaftaran KKN 2026 Aktif
                            </span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="mb-10 text-6xl font-black leading-[0.9] tracking-tighter text-white lg:text-[100px]"
                        >
                            ARSITEKTUR <br />
                            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                                PENGABDIAN.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="mb-14 max-w-2xl text-xl font-bold italic leading-relaxed text-emerald-50 lg:text-2xl"
                        >
                            Ekselen dalam pengabdian, presisi dalam orkestrasi data. SIM-KKN menghadirkan solusi digital
                            integratif untuk pelaksanaan KKN yang berdampak nyata.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="flex flex-col items-center gap-6 sm:flex-row"
                        >
                            <Link
                                href={route('login')}
                                className="flex w-full items-center justify-center gap-4 rounded-2xl bg-amber-400 px-14 py-6 text-lg font-black tracking-[0.1em] text-slate-950 shadow-2xl shadow-amber-500/40 transition-all hover:scale-105 hover:bg-white active:scale-95 sm:w-auto"
                            >
                                MASUK SEKARANG
                                <ChevronRight className="h-6 w-6" />
                            </Link>
                            <Link
                                href={route('public.about')}
                                className="flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-white/30 bg-white/20 px-10 py-6 text-sm font-black tracking-[0.1em] text-white backdrop-blur-xl transition-all hover:bg-white/30 sm:w-auto"
                            >
                                PROFIL LPPM
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="relative z-20 container mx-auto -mt-20 mb-32 px-6 lg:px-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="group relative flex flex-col gap-8 overflow-hidden rounded-[2.5rem] border-b-8 border-emerald-500 bg-white p-12 shadow-2xl shadow-emerald-900/10"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-5">
                            <Users className="h-24 w-24" />
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-500 group-hover:bg-emerald-500 group-hover:text-white">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                                Total Peserta
                            </span>
                            <span className="text-4xl font-black tracking-tighter text-slate-950">
                                {stats.students.toLocaleString()}+
                            </span>
                            <p className="mt-2 text-xs font-bold lowercase text-emerald-600">
                                peserta terverifikasi aktif
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="group relative flex flex-col gap-8 overflow-hidden rounded-[2.5rem] border-b-8 border-amber-400 bg-white p-12 shadow-2xl shadow-emerald-900/10"
                    >
                        <div className="absolute right-0 top-0 p-8 text-amber-500 opacity-5">
                            <Layers className="h-24 w-24" />
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-all duration-500 group-hover:bg-amber-400 group-hover:text-white">
                            <Layers className="h-8 w-8" />
                        </div>
                        <div>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                                Unit Distribusi
                            </span>
                            <span className="text-4xl font-black tracking-tighter text-slate-950">
                                {stats.groups.toLocaleString()}
                            </span>
                            <p className="mt-2 text-xs font-bold lowercase text-amber-600">
                                kelompok pengabdian mandiri
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="group relative flex flex-col gap-8 overflow-hidden rounded-[2.5rem] border-b-8 border-emerald-500 bg-white p-12 shadow-2xl shadow-emerald-900/10"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-5">
                            <MapPin className="h-24 w-24" />
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-500 group-hover:bg-emerald-500 group-hover:text-white">
                            <MapPin className="h-8 w-8" />
                        </div>
                        <div>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                                Radius Lokasi
                            </span>
                            <span className="text-4xl font-black tracking-tighter text-slate-950">
                                {stats.locations.toLocaleString()}
                            </span>
                            <p className="mt-2 text-xs font-bold lowercase text-emerald-600">
                                wilayah jangkauan operasional
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="mb-20 bg-white py-24">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
                        <div className="group rounded-[4rem] border-2 border-slate-100 bg-slate-50 p-16 transition-all hover:border-emerald-500">
                            <h4 className="mb-8 text-4xl font-black uppercase tracking-tighter text-slate-950">
                                Skema KKN Terkini
                            </h4>
                            <p className="mb-10 text-lg font-bold italic text-slate-500">
                                Pelajari beragam skema pengabdian mulai dari Reguler, Internasional, hingga Nusantara.
                            </p>
                            <Link
                                href={route('public.schemes')}
                                className="inline-flex items-center gap-3 rounded-2xl border-2 border-emerald-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white"
                            >
                                Lihat Semua Skema
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                        <div className="group rounded-[4rem] border-4 border-slate-950 bg-slate-950 p-16 text-white transition-all hover:border-amber-400">
                            <h4 className="mb-8 text-4xl font-black uppercase tracking-tighter">Informasi LPPM</h4>
                            <p className="mb-10 text-lg font-bold italic uppercase leading-tight text-slate-400">
                                Kenali lebih dekat profil, visi, dan misi LPPM UIN Prof. K.H. Saifuddin Zuhri.
                            </p>
                            <Link
                                href={route('public.about')}
                                className="inline-flex items-center gap-3 rounded-2xl border-2 border-amber-400 px-8 py-4 text-xs font-black uppercase tracking-widest text-amber-400 transition-all hover:bg-amber-400 hover:text-slate-950"
                            >
                                Baca Profil Kami
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
