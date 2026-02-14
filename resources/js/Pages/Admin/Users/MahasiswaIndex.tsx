import { useState, useEffect } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';

interface UserData {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    mahasiswa?: {
        nim: string;
        prodi?: { nama: string; fakultas: { nama: string } };
    };
}

interface Props extends PageProps {
    users: {
        data: UserData[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
    title: string;
}

export default function MahasiswaIndex({ users, filters, title }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const toggleForm = useForm({});

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/mahasiswa', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout title={title}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 max-w-xl">
                    <FormInput
                        placeholder="Cari nama, NIM, atau email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <p className="hidden lg:block text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        {users.meta?.total || 0} Mahasiswa
                    </p>
                    <Link href="/admin/users/create?role=student">
                        <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            + Tambah Mahasiswa
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
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Program Studi</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Username/Email</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 font-medium italic">
                                        Data mahasiswa tidak ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((u) => (
                                    <tr key={u.id} className="transition hover:bg-slate-50/80 group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{u.name}</span>
                                                <span className="text-[10px] font-bold text-primary font-mono bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1 uppercase">
                                                    NIM: {u.mahasiswa?.nim || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{u.mahasiswa?.prodi?.nama || '-'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                                    {u.mahasiswa?.prodi?.fakultas?.nama || '-'}
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
                                            <Badge variant={u.is_active ? 'success' : 'danger'} className="text-[9px] font-black uppercase tracking-widest">
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right border-l border-transparent transition-all group-hover:border-slate-100">
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
