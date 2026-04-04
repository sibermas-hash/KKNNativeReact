import { useForm, usePage } from '@inertiajs/react';
import { useRef, useState, type FormEventHandler } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

interface UserData {
 id: number;
 name: string;
 email: string;
 username: string;
 avatar: string | null;
 phone: string | null;
 address: string | null;
}

interface Props extends PageProps {
 user: UserData;
}

export default function ProfileShow() {
 const { user } = usePage<Props>().props;
 const avatarInputRef = useRef<HTMLInputElement>(null);
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);

 // Profile form
 const { data, setData, put, processing, errors } = useForm({
 name: user.name || '',
 phone: user.phone || '',
 address: user.address || '',
 });

 // Password form
 const passwordForm = useForm({
 current_password: '',
 password: '',
 password_confirmation: '',
 });

 // Avatar form
 const avatarForm = useForm<{ avatar: File | null }>({
 avatar: null,
 });

 const handleProfileSubmit: FormEventHandler = (e) => {
 e.preventDefault();
 put('/profile', { preserveScroll: true });
 };

 const handlePasswordSubmit: FormEventHandler = (e) => {
 e.preventDefault();
 passwordForm.post('/profile/password', {
 preserveScroll: true,
 onSuccess: () => passwordForm.reset(),
 });
 };

 const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // Preview
 const reader = new FileReader();
 reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
 reader.readAsDataURL(file);

 // Upload immediately
 avatarForm.setData('avatar', file);
 setTimeout(() => {
 avatarForm.post('/profile/avatar', {
 preserveScroll: true,
 forceFormData: true,
 });
 }, 100);
 };

 const avatarSrc = previewUrl || (user.avatar ? `/storage/${user.avatar}` : null);

 return (
 <AppLayout title="Profil Saya">
 <div className="grid gap-6 md:grid-cols-3">
 {/* Avatar Section */}
 <div className="md:col-span-1">
 <div className="rounded-lg border border-slate-200 bg-white/5 p-6
 <div className="text-center">
 <div className="relative inline-block">
 {avatarSrc ? (
 <img
 src={avatarSrc}
 alt={user.name}
 className="h-32 w-32 rounded-lg border-4 border-slate-200 object-cover
 />
 ) : (
 <div className="flex h-32 w-32 items-center justify-center rounded-lg border-4 border-slate-200 bg-whitetext-4xl text-sm text-white
 {user.name.charAt(0).toUpperCase()}
 </div>
 )}
 <button
 onClick={() => avatarInputRef.current?.click()}
 className="absolute bottom-0 right-0 rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700"
 >
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
 </svg>
 </button>
 </div>
 <input
 ref={avatarInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleAvatarChange}
 />
 <p className="mt-4 font-semibold text-white">{user.name}</p>
 <p className="text-sm text-slate-400">@{user.username}</p>
 <p className="mt-1 text-xs text-slate-500">{user.email}</p>

 {avatarForm.errors.avatar && (
 <p className="mt-2 text-sm text-rose-400">{avatarForm.errors.avatar}</p>
 )}
 </div>
 </div>
 </div>

 {/* Forms Section */}
 <div className="space-y-6 md:col-span-2">
 {/* Profile Form */}
 <div className="rounded-lg border border-slate-200 bg-white/5 p-6
 <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
 </svg>
 Informasi Pribadi
 </h2>

 <form onSubmit={handleProfileSubmit} className="space-y-4">
 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Nama Lengkap</label>
 <input
 value={data.name}
 onChange={(e) => setData('name', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
 />
 {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name}</p>}
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
 <input
 value={user.email}
 disabled
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-slate-500 opacity-50"
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Nomor Telepon</label>
 <input
 value={data.phone}
 onChange={(e) => setData('phone', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
 placeholder="08xxxxxxxxxx"
 />
 {errors.phone && <p className="mt-1 text-sm text-rose-400">{errors.phone}</p>}
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Alamat</label>
 <textarea
 value={data.address}
 onChange={(e) => setData('address', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
 rows={3}
 placeholder="Alamat lengkap..."
 />
 </div>

 <div className="flex justify-end">
 <button
 type="submit"
 disabled={processing}
 className="rounded-lg bg-whitepx-6 py-2 text-sm font-semibold text-white transition hover:hover:disabled:opacity-60"
 >
 {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
 </button>
 </div>
 </form>
 </div>

 {/* Password Form */}
 <div className="rounded-lg border border-slate-200 bg-white/5 p-6
 <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
 </svg>
 Keamanan - Ubah Password
 </h2>

 <form onSubmit={handlePasswordSubmit} className="space-y-4">
 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Password Saat Ini</label>
 <input
 type="password"
 value={passwordForm.data.current_password}
 onChange={(e) => passwordForm.setData('current_password', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
 />
 {passwordForm.errors.current_password && (
 <p className="mt-1 text-sm text-rose-400">{passwordForm.errors.current_password}</p>
 )}
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Password Baru</label>
 <input
 type="password"
 value={passwordForm.data.password}
 onChange={(e) => passwordForm.setData('password', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
 />
 <p className="mt-1 text-xs text-slate-500">
 Minimal 8 karakter, mengandung huruf besar, kecil, angka, dan simbol.
 </p>
 {passwordForm.errors.password && (
 <p className="mt-1 text-sm text-rose-400">{passwordForm.errors.password}</p>
 )}
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-slate-300">Konfirmasi Password Baru</label>
 <input
 type="password"
 value={passwordForm.data.password_confirmation}
 onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
 className="w-full rounded-lg border border-slate-200 bg-white/5 px-3 py-2 text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
 />
 </div>

 <div className="flex justify-end">
 <button
 type="submit"
 disabled={passwordForm.processing}
 className="rounded-lg bg-whitepx-6 py-2 text-sm font-semibold text-white transition hover:hover:disabled:opacity-60"
 >
 {passwordForm.processing ? 'Mengubah...' : 'Ubah Password'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
