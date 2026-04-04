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
        meta: any;
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
            <Head title="Ledger Otoritas Personel" />

            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-emerald-600">Direktori Personel</h1>
                        <p className="text-sm text-slate-500 mt-1">Otorisasi dan administrasi hak akses seluruh entitas pengguna sistem.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">
                                {users.meta?.total || 0} Akun Terdaftar
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                        <input
                            type="search"
                            placeholder="SEARCH_ACCOUNT_LEDGER (NAME / EMAIL)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-16 pr-8 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm focus:border-emerald-500 outline-none placeholder:italic placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                        />
                    </form>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <button className="flex-1 xl:w-auto h-15 px-8 bg-slate-900 border border-slate-800 text-primary text-[10px] font-black uppercase italic tracking-[0.25em] rounded-xl shadow-2xl shadow-slate-900/40 active:scale-95 transition-all hover:bg-emerald-600 hover:text-white flex items-center justify-center gap-4 group/add">
                            <UserPlus className="w-5 h-5 shadow-sm group-hover/add:scale-110 transition-transform" />
                            Provision_New_Account
                        </button>
                         <button className="h-15 w-15 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Users Registry List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/5 overflow-hidden group relative">
                    <div className="divide-y divide-slate-50 relative z-10">
                        {users.data.map((user) => (
                            <div key={user.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group/row">
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-primary flex items-center justify-center shadow-lg group-hover/row:scale-110 transition-transform italic font-black text-lg">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "text-[9px] font-black uppercase italic tracking-widest leading-none px-2 py-0.5 rounded border transition-colors",
                                                user.roles[0]?.toLowerCase() === 'superadmin' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
                                            )}>
                                                {user.roles[0]?.toUpperCase() || 'NO_ROLE'}
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest font-mono">ACCOUNT_ID: #{user.id.toString().padStart(4, '0')}</span>
                                        </div>
                                        <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm leading-none group-hover/row:text-primary transition-colors">{user.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest opacity-50">{user.email}</span>
                                            </div>
                                            {user.email_verified_at && (
                                                <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-500 shadow-sm" />
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase italic tracking-widest">VERIFIED</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-5">
                                    <div className="flex items-center gap-3 opacity-0 group-hover/row:opacity-100 translate-x-3 group-hover/row:translate-x-0 transition-all">
                                        <button className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-all shadow-sm">
                                            <Lock className="w-4 h-4 shadow-sm" />
                                        </button>
                                        <button 
                                            onClick={() => destroy(user.id)}
                                            className="h-12 w-12 bg-white border border-rose-100 text-rose-300 hover:text-white hover:bg-rose-500 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4 shadow-sm" />
                                        </button>
                                        <button className="h-12 px-6 bg-slate-900 text-white rounded-xl font-bold uppercase italic tracking-widest tracking-[0.2em] text-[9px] shadow-lg shadow-slate-900/10 flex items-center gap-3 transition-all active:scale-95 group/btn border border-slate-800 hover:bg-emerald-600">
                                            <ArrowRight className="w-4 h-4" />
                                            CREDENTIAL_INSPECT
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

                {/* Tactical Command Authorization Monitor */}
                <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <ShieldAlert className="h-6 w-6 text-primary shadow-[0_0_15px_rgba(16,168,83,0.3)] animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white italic tracking-widest uppercase leading-none">ADMINISTRATIVE_AUTHORITY_SURVEILLANCE_V3.2</h4>
                                    <p className="text-[10px] font-bold text-emerald-400 italic mt-2 uppercase">STATUS: IDENTITY_FEDERATION_SECURED</p>
                                </div>
                            </div>
                            <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75 uppercase italic font-bold">
                                Seluruh modifikasi terhadap ledger otoritas personel dipantau secara real-time oleh protokol keamanan kedaulatan data. Penyalahgunaan hak akses akan memicu pembekuan identitas secara otomatis.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
                                <span className="text-[9px] font-black text-slate-100 uppercase italic tracking-widest">IDENTITY_ORCHESTRATION_OK</span>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
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
