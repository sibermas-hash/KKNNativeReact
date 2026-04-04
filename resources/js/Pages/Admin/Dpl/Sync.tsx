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
 <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
 <CommandLineIcon className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-[10px] font-semibold text-emerald-100 ">
 DPL_ACTIVATION_GATEWAY_V3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Aktivasi <span className="text-emerald-300">Personel</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Sinkronisasi data silsilah dosen dari pangkalan data eksternal untuk inisialisasi orkestrasi penugasan DPL secara terintegrasi.
 </p>

 <div className="flex items-center gap-6 pt-4">
 <Link href="/admin/dpl" className="text-[11px] font-semibold text-emerald-200/60 hover:text-whiteflex items-center gap-2 group/link">
 <IdentificationIcon className="w-4 h-4 text-emerald-500 group-hover/link:text-white transition-colors" />
 Direktori DPL
 </Link>
 <div className="h-1 w-1 rounded-lg bg-emerald-500/30" />
 <Link href="/admin/dpl/assignment" className="text-[11px] font-semibold text-emerald-200/60 hover:text-whiteflex items-center gap-2 group/link">
 <CpuChipIcon className="w-4 h-4 text-emerald-500 group-hover/link:text-white transition-colors" />
 Matriks Penugasan
 </Link>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[220px] group/stat">
 <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:transition-transform">
 <IdentificationIcon className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-emerald-200/60 block mb-1.5">Kandidat Terdeteksi</span>
 <span className="text-2xl font-semibold text-white">{availableDosen.length} Personel</span>
 </div>
 </div>
 <button 
 onClick={() => router.reload()} 
 className="flex items-center gap-4 px-6 py-2 bg-white hover:bg-emerald-50 text-primary rounded-lg font-semibold text-xs"
 >
 <ArrowPathIcon className="w-5 h-5 stroke-[2.5px] text-primary" />
 Pindai Ulang Kandidat
 </button>
 </div>
 </div>

 {/* Operations Navigator */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:mx-2">
 <form onSubmit={handleSearch} className="relative group flex-1 max-w-2xl">
 <MagnifyingGlassIcon className="absolute left-6 top-1/2 -/2 w-6 h-6 text-slate-300 group-focus-within:text-primaryz-10" />
 <input
 placeholder="Cari berdasarkan NIP atau nama kandidat..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-16 pr-8 py-2 bg-white border border-slate-200rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-primary/50placeholder:opacity-30"
 />
 </form>
 <div className="flex items-center gap-5 text-slate-400 shrink-0">
 <div className="h-1 w-12 bg-slate-100 rounded-lg" />
 <span className="text-[10px] font-semibold ">Status_Sistem: <span className="text-emerald-500">Siaga_Aktivasi</span></span>
 </div>
 </div>

 {/* Tactical Registry Ledger */}
 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group/ledger lg:mx-2">
 <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-12 py-8 text-left text-xs font-semibold text-slate-400">Identitas_Kandidat</th>
 <th className="px-12 py-8 text-center text-xs font-semibold text-slate-400">Unit_Afiliasi_Asal</th>
 <th className="px-12 py-8 text-right text-xs font-semibold text-slate-400 pr-16">Protokol_Otorisasi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 bg-white">
 {availableDosen.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-12 py-40 text-center">
 <div className="flex flex-col items-center gap-6 opacity-50">
 <div className="p-10 bg-slate-50 rounded-lg border border-slate-200 group-hover/ledger:transition-transform">
 <CloudArrowDownIcon className="h-24 w-24 text-slate-200" />
 </div>
 <p className="text-[12px] font-semibold text-slate-400 ">SYSTEM_INFO: NO_CANDIDATES_IN_REMOTE_CACHE</p>
 </div>
 </td>
 </tr>
 ) : (
 availableDosen.map((dosen) => (
 <tr key={dosen.nip} className="group/row hover:bg-slate-50/20cursor-default">
 <td className="px-12 py-6">
 <div className="flex items-center gap-7">
 <div className="relative">
 <div className="p-4 rounded-lg bg-slate-900 text-primary group-hover/row:group-hover/row:/30 group-hover/row:rotate-3h-16 w-16 flex items-center justify-center text-xl font-semibold">
 {getInitials(dosen.name)}
 </div>
 <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center group-hover/row:transition-transform">
 <FingerPrintIcon className="h-3 w-3 text-primary" />
 </div>
 </div>
 <div className="flex flex-col gap-2.5">
 <span className="text-2xl font-semibold text-slate-900 group-hover/row:text-primary transition-colors ">{dosen.name}</span>
 <div className="flex items-center gap-3">
 <span className="text-[10px] font-semibold text-slate-400 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 opacity-50 group-hover/row:opacity-100">NIP: {dosen.nip}</span>
 {dosen.email && (
 <span className="text-[10px] font-semibold text-slate-300 lowercase opacity-50 group-hover/row:text-slate-400 transition-colors">{dosen.email}</span>
 )}
 </div>
 </div>
 </div>
 </td>
 <td className="px-12 py-6 text-center">
 <div className="inline-flex px-6 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold group-hover/row:bg-white group-hover/row:border-primary/30 group-hover/row:text-primary group-hover/row: group-hover/row:/5">
 {dosen.organization_name || 'UNIT_UNIDENTIFIED'}
 </div>
 </td>
 <td className="px-12 py-6 text-right pr-16">
 <button
 onClick={() => handleSync(dosen)}
 disabled={processing}
 className="inline-flex items-center gap-4 px-6 py-4 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-darkdisabled:opacity-50"
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
 <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-2">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheckIcon className="h-7 w-7 text-primary" />
 </div>
 <h4 className="text-[11px] font-semibold text-white ">ACTIVATION_GOVERNANCE_PROTOCOL_V3</h4>
 </div>
 <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
 Protokol Aktivasi: Pengaktifan personel dari kanal feeder akan memicu orkestrasi pembuatan akun pengguna baru dengan privilese DPL. 
 Username primer akan disinkronkan secara absolut mengikuti NIP kandidat. Keamanan transmisi record dijaga melalui <span className="text-primary font-semibold">"End-Encryption"</span> saat proses penulisan ke registry utama. 
 Gunakan fitur <span className="text-white">Pindai Ulang</span> untuk rekonsiliasi data terbaru.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
 <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500 />
 <span className="text-[11px] font-semibold text-slate-100 ">GATEWAY_ENCRYPTED</span>
 </div>
 <div className="flex gap-5">
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <CpuChipIcon className="h-7 w-7" />
 </div>
 <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
 <FingerPrintIcon className="h-7 w-7" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="text-center pt-8 opacity-20">
 <p className="text-[9px] font-semibold text-slate-300 ">
 DPL Activation Center • Gateway System Ver. 3.2.0 • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
