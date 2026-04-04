import { useState } from 'react';
import { useForm, router, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
 CloudDownload,
 UserPlus,
 Search,
 RefreshCw,
 Cpu,
 Fingerprint,
 ShieldCheck,
 Terminal,
 ChevronLeft,
 IdCard,
} from 'lucide-react';
import { clsx } from 'clsx';

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
 });
 };

 const getInitials = (name: string) => {
 return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
 };

 return (
 <AppLayout title="Protokol Aktivasi DPL">
 <Head title="Aktivasi Personel DPL" />
 
 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 DPL_ACTIVATION_CORE_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <Link href="/admin/users/dosen" className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all ">
 <ChevronLeft className="h-4 w-4" />
 </Link>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Aktivasi <span className="text-primary">Personel</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <IdCard className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Detected_Candidates</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {availableDosen.length} OFFICERS
 </span>
 </div>
 </div>
 </div>

 <button 
 onClick={() => router.reload()}
 className="px-6 py-3 bg-white border border-slate-200 text-slate-900 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3"
 >
 <RefreshCw className="w-3.5 h-3.5 text-primary" />
 RESCAN_CANDIDATES
 </button>
 </div>
 </div>

 {/* Operations Toolbar */}
 <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="relative group flex-1 w-full max-w-2xl">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_CANDIDATE_REGISTRY (NAME / NIP)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>
 </form>

 {/* Tactical Registry Ledger */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">OFFICER_CANDIDATE_IDENTITY</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">AFFILLIATED_ORGANIZATION</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">INITIALIZE_ACTIVATION</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {availableDosen.map((dosen) => (
 <tr key={dosen.nip} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="relative">
 <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[13px] font-semibold flex items-center justify-center ">
 {getInitials(dosen.name)}
 </div>
 <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-lg border border-slate-100 flex items-center justify-center ">
 <Fingerprint className="h-3 w-3 text-primary" />
 </div>
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-sm font-semibold text-slate-900 truncate max-w-[300px] group-hover/row:text-primary transition-colors">
 {dosen.name}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIP: {dosen.nip}
 </span>
 {dosen.email && (
 <span className="text-[9px] font-semibold text-slate-300 opacity-40 lowercase">[{dosen.email}]</span>
 )}
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="inline-flex px-4 py-1.5 bg-white border border-slate-100 rounded-lg text-[9px] font-semibold text-slate-900 ">
 {dosen.organization_name || 'UNDEFINED_UNIT'}
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <button
 onClick={() => handleSync(dosen)}
 disabled={processing}
 className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-primary transition-all rounded-lg text-[9px] font-semibold group/btn"
 >
 <UserPlus className="w-3.5 h-3.5 text-primary group-hover/btn:translate-y-[-1px] transition-transform" />
 ACTIVATE_OFFICER
 </button>
 </td>
 </tr>
 ))}
 {availableDosen.length === 0 && (
 <tr>
 <td colSpan={3} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <CloudDownload className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">NO_CANDIDATES_IN_REMOTE_CACHE</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Operational Governance Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Terminal className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">ACTIVATION_GOVERNANCE_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: SECURE_INJECTION_AUTHORIZED</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Protokol Aktivasi: Pengaktifan personel dari kanal feeder akan memicu pembuatan akun pengguna baru dengan privilese DPL secara otomatis. Keamanan transmisi data dijaga melalui enkripsi ujung-ke-ujung.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">GATEWAY_ENCRYPTED</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <ShieldCheck className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
