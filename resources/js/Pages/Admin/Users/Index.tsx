import { useState, useEffect } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

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

    // Debounced Search & Role Filter
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || role !== (filters.role || '')) {
                router.get('/admin/users', { search, role }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, role]);

    return (
        <AppLayout title="Manajemen Pengguna">
            {/* Header section with Search & Filter */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 max-w-2xl gap-3">
                    <div className="flex-1">
                        <FormInput
                            placeholder="Cari nama, email, username, NIM, atau NIP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div className="w-48">
                        <FormSelect
                            options={[
                                { value: '', label: 'Semua Peran' },
                                { value: 'admin', label: 'Administrator' },
                                { value: 'dpl', label: 'Dosen (DPL)' },
                                { value: 'student', label: 'Mahasiswa' }
                            ]}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className="hidden lg:block text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        {users.meta?.total || 0} Pengguna
                    </p>
                    <Link href="/admin/users/create">
                        <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            + Tambah Pengguna
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Identitas</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Username/Email</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Peran</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((u) => (
                                    <tr key={u.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{u.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                    {u.mahasiswa?.nim || u.dosen?.nip || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-bold text-slate-700">{u.username}</span>
                                                <span className="text-slate-400 font-medium">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.roles.map((r) => (
                                                <Badge key={r.name} variant="primary" className="mr-1 capitalize text-[10px] font-black px-2 py-0.5">
                                                    {r.name === 'dpl' ? 'Dosen (DPL)' : r.name === 'student' ? 'Mahasiswa' : r.name}
                                                </Badge>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.is_active ? 'success' : 'danger'} className="text-[9px] font-black uppercase tracking-widest">
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`font-black text-[10px] uppercase tracking-wider ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                onClick={() => toggleForm.patch(`/admin/users/${u.id}/toggle-active`)}
                                                loading={toggleForm.processing}
                                            >
                                                {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {users.meta && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                        <Pagination meta={users.meta} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
