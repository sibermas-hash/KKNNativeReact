import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge, Pagination, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    ClipboardList,
    Filter,
    Search,
    Zap,
    Layers,
    MapPin,
    Calendar,
    Activity,
    ArrowRight,
    Database,
    Globe,
    Binary,
    ShieldCheck,
    Navigation,
    Clock,
    Target,
    ChevronRight,
    Archive,
    History,
    Briefcase,
    LayoutGrid,
    Cpu,
    ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    kelompok?: {
        nama_kelompok?: string | null;
        lokasi?: {
            full_name?: string | null;
            village_name?: string | null;
        } | null;
    } | null;
}

interface Props extends PageProps {
    workPrograms: { data: WorkProgramData[]; meta: PaginationMeta };
    sdg_distribution?: Array<{ id: number; count: number }>;
    filters: { status?: string };
}

const SDG_COLORS = [
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981',
    '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5', '#d1fae5',
    '#111827', '#374151'
];

const SDG_NAMES: Record<number, string> = {
    1: 'Tanpa Kemiskinan', 2: 'Tanpa Kelaparan', 3: 'Kehidupan Sehat', 4: 'Pendidikan Berkualitas',
    5: 'Kesetaraan Gender', 6: 'Air Bersih & Sanitasi', 7: 'Energi Bersih', 8: 'Pekerjaan Layak',
    9: 'Industri & Infrastruktur', 10: 'Berkurangnya Kesenjangan', 11: 'Kota Berkelanjutan',
    12: 'Konsumsi Bertanggung Jawab', 13: 'Perubahan Iklim', 14: 'Ekosistem Lautan',
    15: 'Ekosistem Daratan', 16: 'Perdamaian & Keadilan', 17: 'Kemitraan'
};

export default function AdminWorkProgramsIndex({ workPrograms, sdg_distribution, filters }: Props) {
    const handleFilterChange = (value: string) => {
        router.get('/admin/laporan/program-kerja', { status: value || undefined }, { preserveState: true, replace: true });
    };

    return (
    <AppLayout title="Monitoring Program Kerja">
      <Head title="Program Kerja KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <ClipboardList size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Monitoring & Evaluasi</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Program <span className="text-emerald-500">Kerja.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Direktori Monitoring Inisiatif Strategis dan Kontribusi Capaian SDGs Mahasiswa KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-8 bg-emerald-500 text-white border border-emerald-400 rounded-2xl flex items-center gap-5 shadow-xl shadow-emerald-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest leading-none mb-1">Misi Terdata</span>
                            <span className="text-sm font-black text-white uppercase tabular-nums leading-none tracking-tight">{workPrograms.meta.total} PROGRAM</span>
                        </div>
                        <div className="w-px h-8 bg-emerald-400/50" />
                        <Target size={18} className="text-white" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- SDG ANALYTICS (Compact) --- */}
        {sdg_distribution && (
            <section className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50">
                <div className="p-6 bg-slate-50/20 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white border border-slate-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                             <Globe size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">SDGs Impact Distribution</span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Pemetaan Kontribusi Global</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-4 pb-2">
                        {sdg_distribution.map((sdg) => (
                            <div key={sdg.id} className="h-28 w-28 shrink-0 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center justify-between hover:bg-white hover:border-emerald-200 transition-all cursor-default group">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-100/20 transition-transform group-hover:scale-110" style={{ backgroundColor: SDG_COLORS[(sdg.id - 1) % SDG_COLORS.length] }}>{sdg.id}</div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-900 leading-none tabular-nums">{sdg.count}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate w-20 mx-auto mt-2 opacity-60">{SDG_NAMES[sdg.id]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* --- FILTER & LIST --- */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="p-4 border-b border-slate-100 bg-slate-50/20">
                <select 
                    value={filters.status ?? ''} 
                    onChange={(e) => handleFilterChange(e.target.value)} 
                    className="w-full lg:w-56 h-11 bg-white border border-slate-200 rounded-xl px-4 text-[11px] font-bold uppercase tracking-widest outline-none transition focus:border-emerald-500 shadow-sm"
                >
                    <option value="">SEMUA STATUS PROGRAM</option>
                    <option value="draf">DRAFT (PROSES)</option>
                    <option value="submitted">MENUNGGU VERIFIKASI</option>
                    <option value="disetujui">TERVERIFIKASI</option>
                    <option value="revisi">REVISI DIBUTUHKAN</option>
                </select>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        <tr>
                            <th className="px-10 py-6">Judul Program Kerja</th>
                            <th className="px-10 py-6 text-center">Kelompok Pelaksana</th>
                            <th className="px-10 py-6 text-center">Lokasi Desa</th>
                            <th className="px-10 py-6 text-right">Status & Verifikasi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {workPrograms.data.map((p) => (
                            <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-10 w-10 bg-white border border-slate-100 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all"><ClipboardList size={18} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-bold text-slate-900 uppercase leading-tight line-clamp-1 group-hover:text-emerald-700 transition-colors tracking-tight">{p.title}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">ID Program: #{p.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                     <span className="inline-flex px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm">{p.kelompok?.nama_kelompok || 'INVALID'}</span>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin size={12} className="text-rose-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{p.kelompok?.lokasi?.village_name || 'TIDAK TERLINK'}</span>
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">{p.kelompok?.lokasi?.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex items-center justify-end gap-5">
                                        <StatusBadge status={p.status} className="!h-8 !px-4 !rounded-xl !font-bold !text-[9px] !uppercase !tracking-widest shadow-sm" />
                                        <Link href={`/admin/laporan/program-kerja/${p.id}`} className="h-11 px-5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 rounded-2xl flex items-center justify-center transition-all opacity-40 group-hover:opacity-100 shadow-sm active:scale-95 text-[10px] font-bold uppercase tracking-widest">Detail</Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {workPrograms.data.length === 0 && (
                            <tr><td colSpan={4} className="py-32 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Data program kerja tidak ditemukan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Menampilkan Hal. {workPrograms.meta.current_page} dari {workPrograms.meta.last_page}</span>
                <Pagination meta={workPrograms.meta} />
            </div>
        </section>

        {/* --- INFO CARD (CLEAN EMERALD) --- */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-12 text-emerald-900 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16 text-emerald-600"><Briefcase size={350} /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex items-center gap-10">
                    <div className="h-24 w-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl shadow-emerald-200">
                        <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">Ringkasan Validasi Program Kerja</h4>
                        <p className="text-sm font-medium text-emerald-700/70 max-w-3xl leading-relaxed">
                            Monitoring program kerja memastikan transparansi dan kualitas inisiatif strategis kelompok. Setiap program diverifikasi untuk menjamin keselarasan dengan target capaian SDGs institusi serta efektivitas dampak sosial di lokasi KKN.
                        </p>
                    </div>
                </div>
            </div>
        </div>
            </div>
        </AppLayout>
    );
}
