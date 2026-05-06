'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormData } from '@sibermas/schemas';
import { useAuthStore } from '@/stores';
import { profileEndpoints } from '@sibermas/api-client';
import { api, profileApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  Shield, 
  Camera, 
  ChevronRight, 
  Save, 
  RefreshCw,
  LogOut,
  Settings,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchUser, clearUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        domicile_village_name: (user as any).domicile_village_name || '',
        domicile_district_name: (user as any).domicile_district_name || '',
        domicile_regency_name: (user as any).domicile_regency_name || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      await profileApi.update(data);
      await fetchUser();
      toast.success('Profil berhasil diperbarui');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Gagal memperbarui profil');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      await profileApi.updateAvatar(formData);
      await fetchUser();
      toast.success('Foto profil diperbarui');
    } catch (err: any) {
      toast.error('Gagal mengunggah foto profil');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      clearUser();
      router.replace('/login');
    }
  };

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  if (!isAuthenticated || !user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header Profile */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-3xl -z-10 rounded-[3rem]" />
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-4xl font-black text-emerald-700 shadow-inner overflow-hidden border-4 border-white">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-emerald-600" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-emerald-600 cursor-pointer hover:scale-110 transition-transform">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} title="Unggah foto profil" aria-label="Unggah foto profil" />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{user.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <Mail size={16} className="text-emerald-500" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <Shield size={16} className="text-cyan-500" /> {user.nim || user.username}
              </div>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                {(user as any).role_label || 'Mahasiswa'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                isEditing ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:-translate-y-1'
              }`}
            >
              {isEditing ? 'Batal' : <><Settings size={18} /> Edit Profil</>}
            </button>
            <button 
              onClick={handleLogout}
              className="p-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-colors"
              title="Keluar"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Security & Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Shield size={18} className="text-cyan-500" /> Keamanan Akun
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => router.push('/ganti-password')}
                className="w-full group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-slate-400 group-hover:text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">Ganti Kata Sandi</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Information Forms */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              {/* Personal Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Data Personal</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        {...register('name')}
                        disabled={!isEditing}
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        {...register('phone')}
                        disabled={!isEditing}
                        placeholder="08xxxxxxxxxx"
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </section>

              {/* Domicile Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-cyan-500 rounded-full" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Data Alamat & Domisili</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-4 text-slate-300" size={18} />
                      <textarea 
                        {...register('address')}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                        placeholder="Alamat domisili saat ini..."
                      />
                    </div>
                    {errors.address && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desa/Kelurahan</label>
                      <input 
                        {...register('domicile_village_name')}
                        disabled={!isEditing}
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                      <input 
                        {...register('domicile_district_name')}
                        disabled={!isEditing}
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kota/Kabupaten</label>
                      <input 
                        {...register('domicile_regency_name')}
                        disabled={!isEditing}
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-6"
                  >
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !isDirty}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><Save size={20} /> Simpan Perubahan</>}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
