import { useState, useEffect } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    FingerPrintIcon,
    ShieldCheckIcon,
    UserIcon,
    AtSymbolIcon,
    PowerIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

interface UserData {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    roles: { name: string }[];
    mahasiswa?: { nim: string };
    dosen?: { nip: string };
}

interface Props extends PageProps {
    users: {
        data: UserData[];
        meta: PaginationMeta;
    };
    filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const toggleForm = useForm({});

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || role !== (filters.role || '')) {
                router.get('/admin/users', { search, role }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, role]);

    return (
        <AppLayout title="Authority Identity Nexus">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">SECURED USER REGISTRY</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Identity <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3 font-medium uppercase tracking-[0.15em]">Management of encrypted scholastic identities and orbital authority levels.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">ACTIVE ACCOUNTS</span>
                            <span className="text-xl font-black text-white mt-1">{users.meta?.total || 0}</span>
                        </div>
                        <Link href="/admin/users/create">
                            <button className="group flex items-center gap-3 px-8 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <PlusIcon className="w-5 h-5 text-accent-gold" />
                                <span className="text-[10px] font-black uppercase tracking-widest">INITIALIZE USER</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col lg:flex-row gap-6 p-8 glass rounded-[2.5rem]">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        </div>
                        <FormInput
                            placeholder="SCAN IDENTITY (NAME, EMAIL, USERNAME, NIM, NIP)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-14 py-5 bg-black/40 border-white/10 text-xs font-bold uppercase tracking-widest text-white placeholder:text-white/10 focus:border-accent-gold/50 transition-all rounded-2xl"
                        />
                    </div>
                    <div className="w-full lg:w-72 relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <FunnelIcon className="h-5 w-5 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        </div>
                        <FormSelect
                            options={[
                                { value: '', label: 'ALL PROTOCOLS' },
                                { value: 'superadmin', label: 'ADMINISTRATOR' },
                                { value: 'dpl', label: 'COMMAND OFFICER (DPL)' },
                                { value: 'student', label: 'CANDIDATE (SCHOLAR)' }
                            ]}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="pl-14 py-5 bg-black/40 border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 focus:border-accent-gold/50 transition-all rounded-2xl"
                        />
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <FingerPrintIcon className="h-64 w-64 text-white" />
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Identity</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Uplink Access</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Authority Level</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Protocol</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Nexus Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <ShieldCheckIcon className="h-12 w-12 text-white/5 mb-4" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No identities matches the current scan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center text-lg font-black text-accent-gold group-hover:scale-110 transition-transform shadow-lg">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white group-hover:text-accent-gold transition-colors uppercase tracking-tight">{u.name}</span>
                                                        <span className="text-[9px] font-black text-white/20 font-mono tracking-widest mt-0.5">
                                                            ID: {u.mahasiswa?.nim || u.dosen?.nip || 'INTERNAL'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-3 w-3 text-white/20" />
                                                        <span className="text-[10px] font-bold text-white/60 tracking-wider font-mono">{u.username}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <AtSymbolIcon className="h-3 w-3 text-white/20" />
                                                        <span className="text-[10px] font-bold text-white/30 tracking-wider font-mono">{u.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {u.roles.map((r) => (
                                                        <Badge key={r.name} variant="primary" className="px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                            {r.name === 'dpl' ? 'COMMANDER' : r.name === 'student' ? 'SCHOLAR' : r.name === 'superadmin' ? 'ARCHITECT' : r.name.toUpperCase()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge variant={u.is_active ? 'success' : 'danger'} className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                    {u.is_active ? 'ENABLED' : 'DISABLED'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    disabled={toggleForm.processing}
                                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${u.is_active
                                                        ? 'border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/20 hover:border-rose-500/40'
                                                        : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/20 hover:border-emerald-500/40'}`}
                                                    onClick={() => toggleForm.patch(`/admin/users/${u.id}/toggle-active`)}
                                                >
                                                    <PowerIcon className="h-3 w-3" />
                                                    {u.is_active ? 'DEACTIVATE' : 'AUTHORIZE'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.meta && (
                        <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5">
                            <Pagination meta={users.meta} />
                        </div>
                    )}
                </div>

                {/* Footer UI */}
                <div className="flex items-center justify-between px-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        USER DATABASE: SECURE_VAULT_2026
                    </p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        PROTOCOL: MULTI-LEVEL-AUTH-MODIFIED
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
