import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, 
    MapPin, 
    Navigation, 
    Building2, 
    Users2, 
    ChevronRight,
    Map,
    LocateFixed
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion, AnimatePresence } from 'framer-motion';

import Pagination, { PageInfo, PaginationMeta } from '@/Components/ui/Pagination';

interface Location {
    id: number;
    name: string;
    address: string;
    district: string;
    city: string;
    groups_count: number;
}

interface Props {
    locations: {
        data: Location[];
        links: PaginationMeta['links'];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    }
}

export default function Locations({ locations, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/cari-lokasi', { search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <PublicLayout>
            <Head title="Cari Lokasi Penempatan | KKN UIN SAIZU" />

            {/* --- MAJESTIC HERO HEADER --- */}
            <div className="relative pt-40 pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 pointer-events-none -z-10" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -mr-40 -mt-40" />
                
                <div className="container mx-auto px-6 lg:px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 max-w-4xl mx-auto"
                    >
                         <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-50 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.5em] text-emerald-700 shadow-sm">
                            Peta lokasi penempatan
                        </span>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                            <span className="font-serif italic font-normal text-emerald-600 block mb-2">Cari Lokasi</span>
                            Penempatan KKN <span className="text-slate-400">&</span> Pengabdian.
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                            Temukan wilayah mitra pengabdian masyarakat UIN SAIZU di berbagai daerah dengan data unit terintegrasi.
                        </p>
                    </motion.div>

                    {/* --- SEARCH BAR PREMIUM --- */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-16 max-w-2xl mx-auto"
                    >
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-0 bg-emerald-600/5 blur-2xl group-focus-within:bg-emerald-600/10 transition-all rounded-3xl" />
                            <div className="relative bg-white border border-slate-200 p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5">
                                <Search className="ml-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari desa, kecamatan, atau kabupaten..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium text-slate-900 placeholder:text-slate-400 px-6"
                                />
                                <button 
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                                >
                                    CARI
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* --- GRID LOCATIONS --- */}
            <div className="bg-white min-h-[600px] border-t border-slate-100">
                <section className="container mx-auto px-6 lg:px-12 py-24">
                    <AnimatePresence mode="wait">
                        {locations.data.length > 0 ? (
                            <motion.div 
                                key="grid"
                                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {locations.data.map((loc, i) => (
                                    <motion.div
                                        key={loc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-600/5 transition-all hover:-translate-y-2 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all rotate-12 group-hover:rotate-0">
                                            <LocateFixed size={120} />
                                        </div>
                                        
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                    <MapPin size={24} />
                                                </div>
                                                <div className="px-5 py-2 bg-emerald-50 rounded-full border border-emerald-500/10 flex items-center gap-3">
                                                    <Users2 size={14} className="text-emerald-600" />
                                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{loc.groups_count} Kelompok</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">{loc.name}</h3>
                                                <div className="space-y-2 text-slate-500">
                                                    <div className="flex items-center gap-3 text-xs font-bold leading-relaxed">
                                                        <Navigation size={14} className="text-emerald-500" />
                                                        <span className="uppercase tracking-widest">{loc.district}, {loc.city}</span>
                                                    </div>
                                                    <p className="text-[11px] font-medium leading-relaxed opacity-70 flex items-start gap-3 italic">
                                                        <Building2 size={14} className="shrink-0 mt-0.5" />
                                                        {loc.address || 'Alamat lengkap belum terdefinisi secara geospasial.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button className="w-full h-14 border border-slate-100 group-hover:border-emerald-500/20 group-hover:bg-slate-50 rounded-2xl p-4 flex items-center justify-between transition-all">
                                                <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-700 uppercase tracking-[0.2em] italic">Lihat ringkasan</span>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-40 space-y-8"
                            >
                                <div className="h-32 w-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200">
                                    <Map size={60} strokeWidth={1} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic">Lokasi Tidak Ditemukan</h3>
                                    <p className="text-slate-400 font-medium max-w-xs mx-auto">Kami tidak dapat menemukan wilayah yang sesuai dengan kata kunci Anda.</p>
                                </div>
                                <button 
                                    onClick={() => { setSearch(''); router.get('/cari-lokasi'); }}
                                    className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-500/20 hover:border-emerald-600 transition-all pb-1"
                                >
                                    Atur ulang pencarian
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- PAGINATION (ELEGANT) --- */}
                    {locations.meta && locations.meta.last_page > 1 && (
                        <div className="mt-24 border-t border-slate-50 pt-16 flex flex-col items-center gap-8">
                             <Pagination meta={locations.meta} />
                             <PageInfo meta={locations.meta} />
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Sistem Verifikasi Geospasial v4.0.1</p>
                        </div>
                    )}
                </section>
            </div>

            {/* --- CALL TO ACTION --- */}
            <section className="bg-slate-900 py-32 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10a853_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
                <div className="container mx-auto px-6 lg:px-12 text-center relative z-10 space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Siap Berkontribusi?</h2>
                        <p className="text-slate-400 max-w-xl mx-auto font-medium">Jangan tunda pengabdian Anda. Masuk ke portal untuk memulai pendaftaran penempatan.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/login" className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 transition-all">Masuk ke Portal</Link>
                        <Link href="/" className="text-white/60 hover:text-white px-12 py-5 font-black text-xs uppercase tracking-widest transition-all">Kembali Beranda</Link>
                    </div>
                </div>
            </section>

        </PublicLayout>
    );
}
