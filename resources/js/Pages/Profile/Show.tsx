import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState, type FormEventHandler } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    username: string;
    avatar: string | null;
    phone: string | null;
    address: string | null;
    must_change_password: boolean;
}

interface Props extends PageProps {
 user: UserData;
}

export default function ProfileShow() {
    const { user } = usePage<Props>().props;
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const profileForm = useForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const avatarForm = useForm<{ avatar: File | null }>({
        avatar: null,
    });

    const handleProfileSubmit: FormEventHandler = (event) => {
        event.preventDefault();
        profileForm.put('/profile', { preserveScroll: true });
    };

    const handlePasswordSubmit: FormEventHandler = (event) => {
        event.preventDefault();
        passwordForm.post('/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        avatarForm.setData('avatar', file);
        avatarForm.post('/profile/avatar', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const avatarUrl = previewUrl || (user.avatar ? `/storage/${user.avatar}` : null);

    return (
        <AppLayout title="Profil Saya">
            <Head title="Profil Saya" />

            <div className="space-y-6">
                {user.must_change_password ? (
                    <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-5">
                        <h1 className="text-base font-semibold text-amber-900">Ganti kata sandi sementara</h1>
                        <p className="mt-1 text-sm text-amber-800">
                            Akun ini baru diaktifkan sebagai akun DPL. Demi keamanan, silakan ganti kata sandi
                            sementara sebelum melanjutkan ke menu lain.
                        </p>
                    </section>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="text-center">
                            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-500">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
                            >
                                Ubah foto
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />

                            <h1 className="mt-4 text-xl font-semibold text-slate-900">{user.name}</h1>
                            <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
                            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                            {avatarForm.errors.avatar && (
                                <p className="mt-3 text-sm text-red-600">{avatarForm.errors.avatar}</p>
                            )}
                        </div>
                    </section>

                    <div className="space-y-6 lg:col-span-2">
                        <section className="rounded-lg border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-slate-900">Informasi Profil</h2>
                            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                                <FormInput
                                    label="Nama lengkap"
                                    value={profileForm.data.name}
                                    onChange={(event) => profileForm.setData('name', event.target.value)}
                                    error={profileForm.errors.name}
                                />
                                <FormInput label="Email" value={user.email} disabled />
                                <FormInput
                                    label="Nomor telepon"
                                    value={profileForm.data.phone}
                                    onChange={(event) => profileForm.setData('phone', event.target.value)}
                                    error={profileForm.errors.phone}
                                />
                                <FormTextarea
                                    label="Alamat"
                                    value={profileForm.data.address}
                                    onChange={(event) => profileForm.setData('address', event.target.value)}
                                    error={profileForm.errors.address}
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                                    >
                                        {profileForm.processing ? 'Menyimpan...' : 'Simpan profil'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-slate-900">Ubah Kata Sandi</h2>
                            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                                <FormInput
                                    type="password"
                                    label="Kata sandi saat ini"
                                    value={passwordForm.data.current_password}
                                    onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                    error={passwordForm.errors.current_password}
                                />
                                <FormInput
                                    type="password"
                                    label="Kata sandi baru"
                                    value={passwordForm.data.password}
                                    onChange={(event) => passwordForm.setData('password', event.target.value)}
                                    error={passwordForm.errors.password}
                                />
                                <FormInput
                                    type="password"
                                    label="Konfirmasi kata sandi baru"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                                    error={passwordForm.errors.password_confirmation}
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                                    >
                                        {passwordForm.processing ? 'Menyimpan...' : 'Ubah kata sandi'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
