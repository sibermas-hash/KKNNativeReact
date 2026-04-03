import { useState } from 'react';
import { useForm, router, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    CloudArrowDownIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    CpuChipIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    FingerPrintIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';

interface AvailableDosen {
    id?: number | null;
    nip: string;
    name: string;
    email: string | null;
    organization_id: number | null;
    organization_name: string | null;
}

interface Props {
    availableDosen: AvailableDosen[];
    filters: {
        search?: string;
    };
    title: string;
}

export default function DplSync({ availableDosen, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.dpl.sync'), { search }, { preserveState: true });
    };

    const handleSync = (dosen: AvailableDosen) => {
        router.post(route('admin.dpl.sync.store'), {
            master_id: dosen.id,
            nip: dosen.nip,
            name: dosen.name,
            email: dosen.email,
            organization_id: dosen.organization_id,
            birth_date: (dosen as any).birth_date,
            gender: (dosen as any).gender,
        });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <AppLayout title="Protokol Aktivasi DPL">
            <Head title="Aktivasi Personel DPL" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <CommandLineIcon className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                DPL_ACTIVATION_GATEWAY_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Aktivasi <span className="text-emerald-300 text-glow-emerald italic">Personel</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Sinkronisasi data silsilah dosen dari pangkalan data eksternal untuk inisialisasi orkestrasi penugasan DPL secara terintegrasi.
                        </p>

                        <div className="flex items-center gap-6 pt-4">
                            <Link href="/admin/dpl" className="text-[11px] font-black text-emerald-200/60 uppercase  hover:text-white transition-all flex items-center gap-2 group/link italic">
                                <IdentificationIcon className="w-4 h-4 text-emerald-500 group-hover/link:text-white transition-colors" />
                                Direktori DPL
                            </Link>
                            <div className="h-1 w-1 rounded-full bg-emerald-500/30" />
                            <Link href="/admin/dpl/assignment" className="text-[11px] font-black text-emerald-200/60 uppercase  hover:text-white transition-all flex items-center gap-2 group/link italic">
                                <CpuChipIcon className="w-4 h-4 text-emerald-500 group-hover/link:text-white transition-colors" />
                                Matriks Penugasan
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[220px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <IdentificationIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Kandidat Terdeteksi</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{availableDosen.length} Personel</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.reload()} 
                            className="flex items-center gap-4 px-10 py-5.5 bg-white hover:bg-emerald-50 text-primary rounded-[1.5rem] font-black text-xs uppercase  transition-all hover:-translate-y-1 active:scale-95 italic"
                        >
                            <ArrowPathIcon className="w-5 h-5 stroke-[2.5px] text-primary" />
                            Pindai Ulang Kandidat
                        </button>
                    </div>
                </div>

                {/* Operations Navigator */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:mx-2">
                    <form onSubmit={handleSearch} className="relative group flex-1 max-w-2xl">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-all z-10" />
                        <input
                            placeholder="Cari berdasarkan NIP atau nama kandidat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5.5 bg-white border border-slate-100rounded-lg text-sm font-black text-slate-900 outline-none focus:border-primary/50 transition-all italic uppercase placeholder:opacity-30"
                        />
                    </form>
                    <div className="flex items-center gap-5 text-slate-400 italic shrink-0">
                         <div className="h-1 w-12 bg-slate-100 rounded-full" />
                        <span className="text-[10px] font-black uppercase ">Status_Sistem: <span className="text-emerald-500 italic">Siaga_Aktivasi</span></span>
                    </div>
                </div>

                {/* Tactical Registry Ledger */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden group/ledger lg:mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50 italic">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-12 py-8 text-left text-[11px] font-black uppercase  text-slate-400 italic">Identitas_Kandidat</th>
                                    <th className="px-12 py-8 text-center text-[11px] font-black uppercase  text-slate-400 italic">Unit_Afiliasi_Asal</th>
                                    <th className="px-12 py-8 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-16">Protokol_Otorisasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {availableDosen.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-10 opacity-30">
                                                <div className="p-10 bg-slate-50 rounded-full border border-slate-100 group-hover/ledger:scale-110 transition-transform">
                                                    <CloudArrowDownIcon className="h-24 w-24 text-slate-200" />
                                                </div>
                                                <p className="text-[12px] font-black text-slate-400 uppercase  italic">SYSTEM_INFO: NO_CANDIDATES_IN_REMOTE_CACHE</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    availableDosen.map((dosen) => (
                                        <tr key={dosen.nip} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                            <td className="px-12 py-12">
                                                <div className="flex items-center gap-7">
                                                    <div className="relative">
                                                        <div className="p-4 rounded-lg bg-slate-900 text-primary group-hover/row:scale-110 group-hover/row:shadow-primary/30 group-hover/row:rotate-3 transition-all h-16 w-16 flex items-center justify-center text-xl font-black italic">
                                                            {getInitials(dosen.name)}
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-white rounded-full border-2 border-slate-50 flex items-center justify-center group-hover/row:scale-125 transition-transform">
                                                            <FingerPrintIcon className="h-3 w-3 text-primary" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2.5">
                                                        <span className="text-2xl font-black text-slate-900 group-hover/row:text-primary transition-colors uppercase  leading-none italic">{dosen.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase  leading-none px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 opacity-60 group-hover/row:opacity-100 transition-all">NIP: {dosen.nip}</span>
                                                            {dosen.email && (
                                                                <span className="text-[10px] font-black text-slate-300 lowercase italic opacity-50 group-hover/row:text-slate-400 transition-colors">{dosen.email}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-12 text-center">
                                                <div className="inline-flex px-6 py-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-[11px] font-black uppercase  transition-all group-hover/row:bg-white group-hover/row:border-primary/30 group-hover/row:text-primary group-hover/row:shadow-xl group-hover/row:shadow-primary/5">
                                                    {dosen.organization_name || 'UNIT_UNIDENTIFIED'}
                                                </div>
                                            </td>
                                            <td className="px-12 py-12 text-right pr-16">
                                                <button
                                                    onClick={() => handleSync(dosen)}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-4 px-10 py-4 bg-primary text-white text-[11px] font-black uppercase  rounded-lg hover:bg-primary-dark hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 italic leading-none"
                                                >
                                                    <UserPlusIcon className="w-5 h-5 stroke-[2.5px]" />
                                                    Aktifkan Akun Personel
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group mx-2">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <ShieldCheckIcon className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">ACTIVATION_GOVERNANCE_PROTOCOL_V3</h4>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Protokol Aktivasi: Pengaktifan personel dari kanal feeder akan memicu orkestrasi pembuatan akun pengguna baru dengan privilese DPL. 
                                Username primer akan disinkronkan secara absolut mengikuti NIP kandidat. Keamanan transmisi record dijaga melalui <span className="text-primary font-black uppercase italic">"End-to-End Encryption"</span> saat proses penulisan ke registry utama. 
                                Gunakan fitur <span className="text-white">Pindai Ulang</span> untuk rekonsiliasi data terbaru.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">GATEWAY_ENCRYPTED</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <CpuChipIcon className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <FingerPrintIcon className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        DPL Activation Center • Gateway System Ver. 3.2.0 • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
