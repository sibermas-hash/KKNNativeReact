import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState, type ChangeEvent, type FormEventHandler } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';

interface UserData {
    id: number;
    name: string;
    email: string;
    username: string;
    avatar: string | null;
    phone: string | null;
    address: string | null;
    domicile_village_name: string | null;
    domicile_district_name: string | null;
    domicile_regency_name: string | null;
    address_verified_at: string | null;
    must_change_password: boolean;
}

interface StudentData {
    nim: string;
    nik: string | null;
    name: string;
    mother_name: string | null;
    faculty: string | null;
    program: string | null;
    batch_year: number | null;
    gender: 'L' | 'P' | null;
    birth_place: string | null;
    birth_date: string | null;
    bpjs_complete: boolean;
    missing_bpjs_fields: string[];
    domicile_complete: boolean;
    domicile_verified: boolean;
    domicile_verified_at: string | null;
    missing_domicile_fields: string[];
}

interface Props extends PageProps {
    user: UserData;
    student: StudentData | null;
}

export default function ProfileShow() {
    const { user, student } = usePage<Props>().props;
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const profileForm = useForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        domicile_village_name: user.domicile_village_name ?? '',
        domicile_district_name: user.domicile_district_name ?? '',
        domicile_regency_name: user.domicile_regency_name ?? '',
        address_verified: !!user.address_verified_at,
        nik: student?.nik ?? '',
        mother_name: student?.mother_name ?? '',
        gender: student?.gender ?? '',
        birth_place: student?.birth_place ?? '',
        birth_date: student?.birth_date ?? '',
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
        profileForm.put(route('profile.update'), { preserveScroll: true });
    };

    const handlePasswordSubmit: FormEventHandler = (event) => {
        event.preventDefault();
        passwordForm.post(route('profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        avatarForm.setData('avatar', file);
        avatarForm.post(route('profile.avatar'), {
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
                            <h2 className="text-lg font-semibold text-slate-900">{student ? 'Biodata Peserta & BPJS' : 'Informasi Profil'}</h2>
                            {student ? (
                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nama lengkap</p>
                                            <p className="mt-1 font-medium text-slate-800">{student.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NIM</p>
                                            <p className="mt-1 font-medium text-slate-800">{student.nim}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fakultas</p>
                                            <p className="mt-1 font-medium text-slate-800">{student.faculty ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Program studi</p>
                                            <p className="mt-1 font-medium text-slate-800">{student.program ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Angkatan</p>
                                            <p className="mt-1 font-medium text-slate-800">{student.batch_year ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status biodata BPJS</p>
                                            <p className={`mt-1 font-medium ${student.bpjs_complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {student.bpjs_complete ? 'Lengkap' : 'Masih perlu dilengkapi'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status domisili penempatan</p>
                                            <p className={`mt-1 font-medium ${student.domicile_complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {student.domicile_complete ? 'Siap dipakai untuk auto-plotting' : 'Belum siap dipakai'}
                                            </p>
                                        </div>
                                    </div>

                                    {!student.bpjs_complete && student.missing_bpjs_fields.length > 0 ? (
                                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Lengkapi data berikut sebelum mendaftar KKN: {student.missing_bpjs_fields.join(', ')}.
                                        </div>
                                    ) : null}
                                    {!student.domicile_complete && student.missing_domicile_fields.length > 0 ? (
                                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Lengkapi domisili berikut dan lakukan verifikasi alamat sebelum mendaftar KKN: {student.missing_domicile_fields.join(', ')}.
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                                {!student ? (
                                    <FormInput
                                        label="Nama lengkap"
                                        value={profileForm.data.name}
                                        onChange={(event) => profileForm.setData('name', event.target.value)}
                                        error={profileForm.errors.name}
                                    />
                                ) : null}
                                <FormInput label="Email" value={user.email} disabled />

                                {student ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormInput
                                            label="NIK"
                                            value={profileForm.data.nik}
                                            onChange={(event) => profileForm.setData('nik', event.target.value)}
                                            error={profileForm.errors.nik}
                                            placeholder="16 digit NIK"
                                        />
                                        <FormInput
                                            label="Nama ibu kandung"
                                            value={profileForm.data.mother_name}
                                            onChange={(event) => profileForm.setData('mother_name', event.target.value)}
                                            error={profileForm.errors.mother_name}
                                        />
                                        <FormInput
                                            label="Tempat lahir"
                                            value={profileForm.data.birth_place}
                                            onChange={(event) => profileForm.setData('birth_place', event.target.value)}
                                            error={profileForm.errors.birth_place}
                                        />
                                        <FormInput
                                            type="date"
                                            label="Tanggal lahir"
                                            value={profileForm.data.birth_date}
                                            onChange={(event) => profileForm.setData('birth_date', event.target.value)}
                                            error={profileForm.errors.birth_date}
                                        />
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Jenis kelamin</label>
                                            <select
                                                value={profileForm.data.gender}
                                                onChange={(event) => profileForm.setData('gender', event.target.value)}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="">Pilih jenis kelamin</option>
                                                <option value="L">Laki-laki</option>
                                                <option value="P">Perempuan</option>
                                            </select>
                                            {profileForm.errors.gender ? <p className="mt-1 text-sm text-red-600">{profileForm.errors.gender}</p> : null}
                                        </div>
                                        <FormInput
                                            label="Nomor WhatsApp"
                                            value={profileForm.data.phone}
                                            onChange={(event) => profileForm.setData('phone', event.target.value)}
                                            error={profileForm.errors.phone}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                    </div>
                                ) : (
                                    <FormInput
                                        label="Nomor telepon"
                                        value={profileForm.data.phone}
                                        onChange={(event) => profileForm.setData('phone', event.target.value)}
                                        error={profileForm.errors.phone}
                                    />
                                )}
                                <FormTextarea
                                    label={student ? 'Alamat lengkap domisili' : 'Alamat'}
                                    value={profileForm.data.address}
                                    onChange={(event) => profileForm.setData('address', event.target.value)}
                                    error={profileForm.errors.address}
                                />
                                {student ? (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <FormInput
                                            label="Desa/Kelurahan domisili"
                                            value={profileForm.data.domicile_village_name}
                                            onChange={(event) => profileForm.setData('domicile_village_name', event.target.value)}
                                            error={profileForm.errors.domicile_village_name}
                                        />
                                        <FormInput
                                            label="Kecamatan domisili"
                                            value={profileForm.data.domicile_district_name}
                                            onChange={(event) => profileForm.setData('domicile_district_name', event.target.value)}
                                            error={profileForm.errors.domicile_district_name}
                                        />
                                        <FormInput
                                            label="Kabupaten/Kota domisili"
                                            value={profileForm.data.domicile_regency_name}
                                            onChange={(event) => profileForm.setData('domicile_regency_name', event.target.value)}
                                            error={profileForm.errors.domicile_regency_name}
                                        />
                                    </div>
                                ) : null}
                                {student ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                                        <label className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={profileForm.data.address_verified}
                                                onChange={(event) => profileForm.setData('address_verified', event.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-slate-700">
                                                Saya menyatakan alamat domisili di atas benar dan siap dipakai sebagai dasar penempatan otomatis KKN. Sistem tidak akan menempatkan saya di kabupaten/kota yang sama dengan domisili ini.
                                                {student.domicile_verified_at ? (
                                                    <span className="mt-1 block text-xs text-emerald-700">
                                                        Terverifikasi pada {new Date(student.domicile_verified_at).toLocaleString('id-ID')}.
                                                    </span>
                                                ) : null}
                                            </span>
                                        </label>
                                        {profileForm.errors.address_verified ? (
                                            <p className="mt-2 text-sm text-red-600">{profileForm.errors.address_verified}</p>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                                    >
                                        {profileForm.processing ? 'Menyimpan...' : student ? 'Simpan biodata peserta' : 'Simpan profil'}
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
