import { useState } from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    UserPlus,
    Mail,
    ShieldCheck,
    Lock,
    Unlock,
    Trash2,
    Filter,
    ArrowRight,
    ShieldAlert,
    Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
    email_verified_at: string | null;
}

interface Props {
    users: {
        data: User[];
        meta: Record<string, unknown>;
    };
    filters: { search?: string };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true });
    };

    const destroy = (id: number) => {
        if (confirm('AUDIT_CONFIRMATION: Apakah Anda yakin ingin mencabut hak akses bagi personel ini secara permanen?')) {
            router.delete(route('admin.users.destroy', id));
        }
    };

    return (
        <AppLayout title="Manajemen Pengguna">
            <Head title="Direktori Personel" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Direktori Personel</h1>
                        <p className="text-sm text-slate-500 mt-1">Kelola otorisasi akun dan hak akses seluruh entitas pengguna sistem.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="cari"
                            placeholder="Cari Berdasarkan Nama / Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-sm font-semibold tracking-tight text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500 outline-none italic"
                        />
                    </form>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <button className="flex-1 xl:w-auto h-15 px-8 bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-4 group/add">
                            <UserPlus className="w-5 h-5 shadow-sm group-hover/add:scale-110 transition-transform" />
                            Provision_New_Account
                        </button>
                         <button className="h-15 w-15 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all group/opt">
                            <Filter className="w-5 h-5 shadow-sm group-hover/opt:rotate-12 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="divide-y divide-slate-50 relative z-10 font-bold italic">
                        {users.data.map((user) => (
                            <div key={user.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group/row">
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary flex items-center justify-center shadow-lg group-hover/row:scale-110 transition-transform italic text-lg font-black">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "text-xs font-black uppercase italic tracking-widest  px-2 py-0.5 rounded border shadow-sm",
                                                user.roles[0]?.toLowerCase() === 'superadmin' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-primary/10 text-primary border-primary/20"
                                            )}>
                                                {user.roles[0]?.toUpperCase() || 'NO_ROLE'}
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">ACCOUNT_ID: #{user.id.toString().padStart(4, '0')}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 uppercase italic tracking-tighter text-sm  group-hover/row:text-emerald-600 transition-colors uppercase">{user.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user.email}</span>
                                            </div>
                                            {user.email_verified_at && (
                                                <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100 text-emerald-600">
                                                    <ShieldCheck className="h-2.5 w-2.5 shadow-sm shadow-emerald-500/20" />
                                                    <span className="text-xs font-black uppercase tracking-widest">VERIFIED</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-5">
                                    <div className="flex items-center gap-3 translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                        <button className="h-10 w-10 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 shadow-sm rounded-lg flex items-center justify-center transition-all hover:border-emerald-100">
                                            <Lock className="w-4 h-4 shadow-sm" />
                                        </button>
                                        <button 
                                            onClick={() => destroy(user.id)}
                                            className="h-10 w-10 bg-white border border-rose-50 text-rose-300 hover:text-rose-600 shadow-sm rounded-lg flex items-center justify-center transition-all hover:border-rose-100"
                                        >
                                            <Trash2 className="w-4 h-4 shadow-sm px-[1px]" />
                                        </button>
                                        <button className="h-10 px-6 bg-slate-900 text-primary border border-slate-800 rounded-xl font-bold uppercase italic tracking-widest text-xs shadow-lg shadow-slate-900/10 flex items-center gap-3 transition-all active:scale-95 group/btn hover:bg-emerald-600 hover:text-white">
                                            <ArrowRight className="w-4 h-4 shadow-sm" />
                                            Credentials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={users.meta} />
                </div>

                {/* Footer Security Section */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="space-y-3">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <ShieldAlert className="w-6 h-6 text-emerald-500 animate-pulse" />
                                <h4 className="text-sm font-bold text-white uppercase italic tracking-widest">Authority_Audit_Governance</h4>
                            </div>
                            <p className="text-sm text-slate-400 font-medium  max-w-4xl italic uppercase">
                                Seluruh modifikasi hak akses personel terekam secara permanen dalam ledger kedaulatan data. Pastikan otorisasi telah sesuai dengan kebijakan keamanan institusi.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-emerald-500 text-xs font-bold">
                                FEDERATION_SECURED
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
