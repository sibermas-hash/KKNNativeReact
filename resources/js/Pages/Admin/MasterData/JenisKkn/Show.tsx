import { Head, Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Users, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    Search, 
    ChevronLeft, 
    ArrowUpRight,
    SearchX,
    Calendar,
    GraduationCap,
    Info
} from 'lucide-react';

interface Props {
    jenisKkn: {
        id: number;
        name: string;
        code: string;
        description: string | null;
        registration_mode_label: string;
        placement_mode_label: string;
        min_sks: number;
        min_gpa: string;
        is_active: boolean;
        color: string;
    };
    stats: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    };
    registrations: {
        data: any[];
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function JenisKknShow({ jenisKkn, stats, registrations, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(`/admin/jenis-kkn/${jenisKkn.id}`, { search }, { 
            preserveState: true, 
            replace: true 
        });
    };

    return (
        <AppLayout title={`Detail ${jenisKkn.name}`}>
            <Head title={`Pusat Data ${jenisKkn.name}`} />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('admin.jenis-kkn.index')}
                            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                        >
                            <ChevronLeft size={24} strokeWidth={2.5} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{jenisKkn.name}</h1>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Master Data <span className="mx-2 text-slate-300">/</span> {jenisKkn.code}</p>
                        </div>
                    </div>
                    <Link 
                        href={route('admin.pendaftaran.index', { search: jenisKkn.name })}
                        className="h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 font-black text-sm transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                    >
                        Verifikasi Masal <ArrowUpRight size={18} strokeWidth={3} />
                    </Link>
                </div>

                {/* Statistics Grid - Standard Horizontal */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pendaftar</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{stats.total.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Approved</p>
                            <p className="text-3xl font-black text-emerald-600 leading-none">{stats.approved.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Review</p>
                            <p className="text-3xl font-black text-amber-600 leading-none">{stats.pending.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <XCircle size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rejected</p>
                            <p className="text-3xl font-black text-rose-600 leading-none">{stats.rejected.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>

                {/* Syarat Minimum - Sebaris Horizontal */}
                <section className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm overflow-hidden">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-8 xl:gap-14">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-200"><Info size={20} /></div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Syarat Minimum</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-sm font-bold">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-medium">Akumulasi SKS:</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-800">{jenisKkn.min_sks} SKS</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-medium">Minimum IPK:</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-800">{jenisKkn.min_gpa}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-medium">Model:</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg uppercase text-[10px] font-black tracking-widest border border-emerald-100">{jenisKkn.registration_mode_label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-300 italic font-medium">{jenisKkn.description || 'Tidak ada deskripsi tambahan untuk skema ini.'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Full Width Table - Detail Area */}
                <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">Daftar Pendaftar Terbaru</h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Audit mendetail log pendaftaran masuk ke sistem.</p>
                        </div>
                        <form onSubmit={handleSearch} className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari NIM, Nama, atau Fakultas..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-14 pl-14 pr-6 rounded-2xl border-transparent bg-slate-50 shadow-inner text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all w-full md:w-96"
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Mahasiswa</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fakultas & Prodi</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Edisi KKN</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tgl Daftar</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Penempatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {registrations.data.length > 0 ? registrations.data.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shrink-0">{reg.mahasiswa.nama.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-[900] text-slate-900">{reg.mahasiswa.nama}</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{reg.mahasiswa.nim}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={16} className="text-slate-300" />
                                                <p className="text-xs font-bold text-slate-600">{reg.mahasiswa.fakultas.nama}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase ring-1 ring-slate-200">
                                                Batch #{reg.periode.periode}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
                                                <Calendar size={14} />
                                                {new Date(reg.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            {reg.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase ring-1 ring-emerald-100">Approved</span>}
                                            {reg.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase ring-1 ring-amber-100">Reviewing</span>}
                                            {reg.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase ring-1 ring-rose-100">Rejected</span>}
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            {reg.kelompok ? (
                                                <div className="flex flex-col items-end">
                                                    <p className="text-xs font-black text-slate-800">{reg.kelompok.nama_kelompok}</p>
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{reg.kelompok.code}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Belum Diatur</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-200">
                                                <SearchX size={48} strokeWidth={1.5} />
                                                <p className="text-xl font-black text-slate-300">Data Tidak Ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
