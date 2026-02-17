import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui';
import { router } from '@inertiajs/react';
import {
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    GlobeAltIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    lecturer?: {
        nip: string;
        faculty?: { name: string };
    };
}

interface Props {
    users: {
        data: User[];
        links: any[];
    };
    filters: {
        search: string;
    };
}

export default function DosenIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users/dosen', { search }, { preserveState: true });
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/users/${id}/toggle`);
    };

    return (
        <AppLayout title="Officer Commissioning Registry">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">FIELD COMMAND OVERSIGHT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Officer <span className="text-accent-gold text-glow-gold">Registry</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Managing commissioned field supervisors and academic officers.</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6 group hover:border-accent-gold/20 transition-all">
                        <ShieldCheckIcon className="h-6 w-6 text-accent-gold group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">ACTIVE COMMANDERS</span>
                            <span className="text-xl font-black text-white mt-1 tabular-nums">{users.data.filter(u => u.is_active).length} UNITS</span>
                        </div>
                    </div>
                </div>

                {/* Operations Control */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <form onSubmit={handleSearch} className="relative group w-full max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN OFFICER IDENTIFIERS OR NAMES..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                        />
                    </form>
                </div>

                {/* Registry Ledger (Table) */}
                <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Officer Asset</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">NIP Identifier</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Academic Sector</th>
                                    <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Auth Status</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Override</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-white/20">
                                            <div className="flex flex-col items-center gap-6">
                                                <ShieldCheckIcon className="h-16 w-16 opacity-10" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">No officer assets found in current sweep.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-white/10 flex items-center justify-center text-primary-light font-black group-hover:scale-110 transition-transform">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{user.name}</span>
                                                        <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase mt-2">{user.email || 'NO_ENCRYPTED_EMAIL'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <span className="text-xs font-black text-white/40 tabular-nums tracking-[0.2em] font-mono uppercase">
                                                    {user.lecturer?.nip || 'UNINITIALIZED'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-3">
                                                    <GlobeAltIcon className="w-4 h-4 text-primary-light opacity-30" />
                                                    <span className="text-[10px] font-black text-white tracking-[0.1em] uppercase">
                                                        {user.lecturer?.faculty?.name || 'GENERIC COMMAND'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <Badge
                                                    variant={user.is_active ? 'success' : 'danger'}
                                                    className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg"
                                                >
                                                    {user.is_active ? 'AUTHORIZED' : 'REVOKED'}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <button
                                                    onClick={() => toggleStatus(user.id)}
                                                    className={`p-3 rounded-xl border transition-all hover:scale-110 active:scale-90 ${user.is_active
                                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                                        }`}
                                                    title={user.is_active ? 'REVOKE AUTHORITY' : 'GRANT AUTHORITY'}
                                                >
                                                    <BoltIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Ledger Note */}
                <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <BoltIcon className="h-24 w-24" />
                    </div>
                    <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        Oversight Protocol
                    </h4>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8 max-w-4xl">
                        COMMAND OFFICERS (DPL) ARE RESPONSIBLE FOR FIELD VALIDATION AND MERIT ASSIGNMENT. REVOKING AUTHORITY WILL PREVENT OFFICER ACCESS TO OPERATIONAL HUBS. ALL CHANGES ARE LOGGED PERMANENTLY.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
