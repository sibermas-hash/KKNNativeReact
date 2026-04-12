import { useState } from 'react';
import { router, Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users as UsersIcon,
    Search,
    UserPlus,
    Lock,
    Unlock,
    KeyRound,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    ShieldAlert,
    Database,
    Zap,
    Fingerprint,
    Shield,
    MoreVertical,
    FileText,
    Target,
    Activity,
    Globe,
    Cpu,
    RefreshCw,
    ShieldQuestion,
    Layout,
    ArrowRight,
    Binary,
    Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    roles: string[];
    email_verified_at: string | null;
    is_active?: boolean;
}

interface Props {
    users: {
        data: User[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { flash } = usePage<PageProps>().props;

    if (!users || !users.data) {
        return (
            <AppLayout title="Registry Error">
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                     <div className="text-center space-y-6">
                          <ShieldAlert size={80} className="text-rose-500 mx-auto opacity-20" />
                          <p className="text-xl font-black text-rose-500 uppercase tracking-widest italic">Identity_Fetch_Error: BUFFER_NULL</p>
                     </div>
                </div>
            </AppLayout>
        );
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/pengguna', { search }, { preserveState: true });
    };

    const toggleStatus = (user: User) => {
        const primaryRole = user.roles[0]?.toLowerCase();
        if (primaryRole !== 'student') {
            window.alert('Saat ini hanya akun mahasiswa yang dapat dikelola status aksesnya dari halaman ini.');
            return;
        }
        const actionLabel = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${actionLabel} akun ${user.name}?`)) {
            router.patch(`/admin/pengguna/${user.id}/toggle-status`, {}, { preserveScroll: true });
        }
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Biometric Identity Registry">
            <Head title="Manajemen Pengguna | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Biometric Identity Registry</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Identity <span>Matrix.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pengawasan kredensial global. <br />
                            <span className="text-slate-900 not-italic">Manajemen akses multi-level untuk Administrator, Satuan Tugas, Dosen Pembimbing, dan Personel Mahasiswa.</span>
                        </p>
                    </div>

                    <Link 
                        href="/admin/pengguna/buat" 
                        className="h-24 px-12 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] active:scale-95 group duration-500"
                    >
                        <UserPlus size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                        REGISTER_NEW_ENTITY
                    </Link>
                </motion.div>

                {/* --- SECURITY TELEMETRY --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Registry Density" value={(users.meta?.total || 0).toLocaleString()} icon={Fingerprint} color="emerald" desc="Total entities in registry" />
                    <MetricCard label="System Integrity" value="NOMINAL" icon={ShieldCheck} color="emerald" desc="Auth layers running strictly" />
                    <MetricCard label="Access Uplink" value="ENCRYPTED" icon={Lock} color="emerald" desc="Global session stream secure" />
                </motion.div>

                {/* Password Flash Message */}
                <AnimatePresence>
                    {flash?.temporary_password && flash?.temporary_username && (
                        <motion.section 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-emerald-600 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)]"
                        >
                            <div className="absolute right-0 top-0 h-full w-64 bg-white/10 -skew-x-12 translate-x-20 group-hover:translate-x-10 transition-transform duration-1000" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="h-20 w-20 bg-white text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                    <KeyRound size={36} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Ephemeral Credential Issued</h3>
                                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] italic opacity-80 underline underline-offset-4 decoration-white/30">Transfer credentials via secure channel only.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-10 relative z-10">
                                <div className="px-10 py-5 bg-white/10 border border-white/20 rounded-[1.25rem] backdrop-blur-xl">
                                    <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1 italic opacity-60">Entity_Identification</p>
                                    <p className="text-xl font-black text-white italic tracking-tighter uppercase">{flash.temporary_username}</p>
                                </div>
                                <div className="px-10 py-5 bg-white rounded-[1.25rem] shadow-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Generated_Key</p>
                                    <p className="text-xl font-black text-emerald-600 font-mono tracking-[0.2em] italic">{flash.temporary_password}</p>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* --- COMMAND FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <form onSubmit={handleSearch} className="flex-1 w-full relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH ENTITY NAME / USERID / METRIC_EMAIL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-20 pr-8 bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200 uppercase tracking-tight"
                        />
                    </form>
                </motion.div>

                {/* --- IDENTITY LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Binary size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Registry stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Global Identity Ledger</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Meta</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {users.data.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Entity Identification</th>
                                    <th className="px-12 py-8 text-center">Authorization Level</th>
                                    <th className="px-12 py-8 text-center">Binary Status</th>
                                    <th className="px-12 py-8 text-right">Kernel Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {users.data.length > 0 ? users.data.map((user) => (
                                    <tr key={user.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-8">
                                                <div className="h-16 w-16 bg-slate-50 border border-slate-100 text-slate-200 rounded-[1.25rem] flex items-center justify-center font-black text-xl group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all group-hover:rotate-6 shadow-inner italic">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col gap-2 leading-none">
                                                    <span className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tighter uppercase italic">{user.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic text-emerald-600">@{user.username}</span>
                                                        <div className="h-1 w-1 bg-slate-200 rounded-full" />
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] font-mono italic truncate max-w-[200px]">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                 <span className={clsx(
                                                    "inline-flex h-8 items-center px-6 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border italic",
                                                    user.roles[0]?.toLowerCase() === 'superadmin' 
                                                        ? "bg-slate-900 text-emerald-500 border-slate-900 shadow-xl" 
                                                        : "bg-white text-slate-400 border-slate-200"
                                                 )}>
                                                    {user.roles[0] || 'NULL_ROLE'}
                                                 </span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                {user.email_verified_at ? (
                                                    <div className="flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                                        <ShieldCheck size={11} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest italic leading-none pt-0.5">VERIFIED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 px-6 py-2 bg-slate-100 text-slate-300 rounded-xl border border-slate-200 opacity-50">
                                                        <ShieldQuestion size={11} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest italic leading-none pt-0.5">UNVERIFIED</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                <button
                                                    onClick={() => resetTemporaryPassword(user)}
                                                    className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                                                    title="Reset Machine Key"
                                                >
                                                    <KeyRound size={18} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(user)}
                                                    disabled={user.roles[0]?.toLowerCase() !== 'student'}
                                                    className={clsx(
                                                        "h-12 w-12 border rounded-2xl transition-all flex items-center justify-center active:scale-95 shadow-sm",
                                                        user.roles[0]?.toLowerCase() !== 'student' 
                                                            ? "opacity-10 cursor-not-allowed text-slate-200 border-slate-100" 
                                                            : user.is_active 
                                                                ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200" 
                                                                : "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200"
                                                    )}
                                                    title={user.is_active ? 'Restrict Node' : 'Initialize Node'}
                                                >
                                                    {user.is_active ? <Lock size={18} strokeWidth={2.5} /> : <Unlock size={18} strokeWidth={2.5} />}
                                                </button>
                                                <Link 
                                                    href={`/admin/pengguna/${user.id}/edit`}
                                                    className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                                                >
                                                    <ChevronRight size={18} strokeWidth={3} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Fingerprint size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Entity Buffer Null</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO IDENTITIES DETECTED IN REGISTRY PIPELINE.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity Hall. {users.meta?.current_page || 1} / {users.meta?.last_page || 1} Transmitted</span>
                        </div>
                        {users.meta && <Pagination meta={users.meta} />}
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldAlert size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Shield className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Identity Governance</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Institutional Security Standard</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Seluruh aktivitas akses pengguna dalam matriks ini dicatat dalam audit log sistem demi keamanan data LPPM UIN SAIZU. Otorisasi kredensial adalah tanggung jawab administratif utama.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Access Monitoring Active</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm border border-slate-50",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none tabular-nums">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
