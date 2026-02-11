import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';

interface UserData {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    roles: { name: string }[];
}

interface PaginatedUsers {
    data: UserData[];
    links?: { prev: string | null; next: string | null };
}

interface Props extends PageProps {
    users: PaginatedUsers;
    filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, filters }: Props) {
    const searchForm = useForm({ search: filters.search ?? '', role: filters.role ?? '' });
    const toggleForm = useForm({});

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        searchForm.get('/admin/users', { preserveState: true });
    }

    return (
        <AppLayout title="Pengguna">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <FormInput
                        placeholder="Cari nama/email..."
                        value={searchForm.data.search}
                        onChange={(e) => searchForm.setData('search', e.target.value)}
                        className="w-64"
                    />
                    <FormSelect
                        options={[{ value: '', label: 'Semua Role' }, { value: 'admin', label: 'Admin' }, { value: 'dpl', label: 'DPL' }, { value: 'student', label: 'Mahasiswa' }]}
                        value={searchForm.data.role}
                        onChange={(e) => searchForm.setData('role', e.target.value)}
                    />
                    <Button type="submit" loading={searchForm.processing}>Cari</Button>
                </form>
                <Link href="/admin/users/create">
                    <Button>+ Tambah Pengguna</Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Username</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(users.data ?? []).map((u) => (
                                <tr key={u.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{u.username}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{u.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        {u.roles.map((r) => (
                                            <Badge key={r.name} variant="primary" className="mr-1 capitalize">{r.name}</Badge>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleForm.patch(`/admin/users/${u.id}/toggle-active`)}
                                        >
                                            {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
