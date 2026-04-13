import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { useRef, useState, type ChangeEvent, type FormEventHandler } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Fingerprint,
  Camera,
  Phone,
  MapPin,
  Lock,
  KeyRound,
  UserCheck,
  CreditCard,
  Stethoscope,
  AlertCircle,
  Info,
  ChevronRight,
  Sparkles,
  IdCard,
  Briefcase,
  GraduationCap,
  HeartPulse,
} from 'lucide-react';
import { clsx } from 'clsx';

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
  shirt_size: string | null;
  birth_place: string | null;
  birth_date: string | null;
  semester: number | null;
  gpa: number | null;
  sks_completed: number | null;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

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
    shirt_size: student?.shirt_size ?? '',
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
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    avatarForm.setData('avatar', file);
    avatarForm.post(route('profile.avatar'), { preserveScroll: true, forceFormData: true });
  };

  const avatarUrl = previewUrl || (user.avatar ? `/storage/${user.avatar}` : null);

  return (
    <AppLayout title="Profil Pengguna">
      <Head title="Profil Saya" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1200px] mx-auto py-10 space-y-12 px-4"
      >
        {/* --- HEADER ARCHITECTURE --- */}
        <motion.section
          variants={itemVariants}
          className="relative rounded-[3rem] bg-emerald-50 border border-emerald-100 p-12 overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500 opacity-5 skew-x-12 translate-x-32" />
          <div className="relative flex flex-col md:flex-row items-center gap-10">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div className="h-40 w-40 rounded-full border-4 border-emerald-100 overflow-hidden bg-emerald-100 shadow-sm relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-5xl font-black text-emerald-600">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={32} />
                </div>
              </div>
              <div className="absolute bottom-1 right-1 h-10 w-10 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform">
                <Sparkles size={16} />
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                  {user.name}
                </h1>
                <p className="mt-4 text-emerald-400 font-black uppercase tracking-[0.3em] text-xs">
                  Username: {user.username}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="bg-white/5 border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-3">
                  <Fingerprint size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-gray-400 tabular-nums lowercase">
                    {user.email}
                  </span>
                </div>
                {student && (
                  <div className="bg-emerald-500 text-gray-900 rounded-full px-6 py-2.5 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                    <GraduationCap size={16} strokeWidth={3} /> Verified Student
                  </div>
                )}
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </motion.section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* --- SIDEBAR DOSSIER --- */}
          <motion.aside variants={itemVariants} className="xl:col-span-4 space-y-8">
            {/* Clearance Status Matrix */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-4">
                Status Verifikasi <div className="h-px flex-1 bg-slate-50" />
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-1 bg-slate-50 rounded-3xl group">
                  <div className="flex items-center gap-4 pl-5">
                    <HeartPulse
                      size={20}
                      className={student?.bpjs_complete ? 'text-emerald-600' : 'text-amber-500'}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                      BPJS Integrity
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all',
                      student?.bpjs_complete
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {student?.bpjs_complete ? 'Clear' : 'Pending'}
                  </div>
                </div>

                <div className="flex items-center justify-between p-1 bg-slate-50 rounded-3xl group">
                  <div className="flex items-center gap-4 pl-5">
                    <MapPin
                      size={20}
                      className={student?.domicile_verified ? 'text-emerald-600' : 'text-amber-500'}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                      Geo-Verification
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all',
                      student?.domicile_verified
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {student?.domicile_verified ? 'Verified' : 'Unverified'}
                  </div>
                </div>
              </div>

              {!student?.bpjs_complete && student?.missing_bpjs_fields.length ? (
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-3">
                  <div className="flex items-center gap-3 text-amber-600">
                    <AlertCircle size={14} strokeWidth={3} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Protocol Required
                    </p>
                  </div>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                    Missing Fields: {student.missing_bpjs_fields.join(', ')}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Quick Statistics/Academic */}
            {student && (
              <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-white shadow-sm space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      IPK
                    </p>
                    <p className="text-2xl font-black text-gray-900 tabular-nums">
                      {student.gpa ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-white shadow-sm space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      SKS Lulus
                    </p>
                    <p className="text-2xl font-black text-gray-900 tabular-nums">
                      {student.sks_completed ?? 0}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <span>Data Fakultas</span>
                    <Briefcase size={12} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-tighter">
                      {student.faculty}
                    </h4>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight italic">
                      {student.program}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>

          {/* --- MAIN DATA MATRIX --- */}
          <div className="xl:col-span-8 space-y-10">
            {/* Information Matrix Card */}
            <motion.section
              variants={itemVariants}
              className="bg-white rounded-[3rem] border border-slate-100 p-8 lg:p-16 shadow-sm space-y-12"
            >
              <div className="flex items-center justify-between gap-6 border-b border-slate-50 pb-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase whitespace-nowrap">
                    Detail Profil
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    Update identitas personal dan alamat domisili.
                  </p>
                </div>
                <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <IdCard size={28} />
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {!student && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                        Nama Lengkap
                      </label>
                      <FormInput
                        value={profileForm.data.name}
                        onChange={(e) => profileForm.setData('name', e.target.value)}
                        error={profileForm.errors.name}
                        className="border-none bg-slate-50 h-14 rounded-2xl font-bold italic"
                      />
                    </div>
                  )}
                  <div className="space-y-4 opacity-70">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      System Email
                    </label>
                    <div className="h-14 bg-slate-100/50 rounded-2xl px-6 flex items-center border border-slate-100">
                      <span className="text-sm font-bold text-gray-500 italic lowercase tracking-tight">
                        {user.email}
                      </span>
                      <Lock size={14} className="ml-auto text-slate-300" />
                    </div>
                  </div>

                  {student && (
                    <>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          NIK (KTP)
                        </label>
                        <FormInput
                          value={profileForm.data.nik}
                          onChange={(e) => profileForm.setData('nik', e.target.value)}
                          error={profileForm.errors.nik}
                          placeholder="NIK Sesuai KTP"
                          className="border-none bg-slate-50 h-14 rounded-2xl font-bold tabular-nums"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Nama Ibu Kandung
                        </label>
                        <FormInput
                          value={profileForm.data.mother_name}
                          onChange={(e) => profileForm.setData('mother_name', e.target.value)}
                          error={profileForm.errors.mother_name}
                          placeholder="Input Nama Ibu"
                          className="border-none bg-slate-50 h-14 rounded-2xl font-bold italic"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Tempat Lahir
                        </label>
                        <FormInput
                          value={profileForm.data.birth_place}
                          onChange={(e) => profileForm.setData('birth_place', e.target.value)}
                          error={profileForm.errors.birth_place}
                          className="border-none bg-slate-50 h-14 rounded-2xl font-bold"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Tanggal Lahir
                        </label>
                        <FormInput
                          type="date"
                          value={profileForm.data.birth_date}
                          onChange={(e) => profileForm.setData('birth_date', e.target.value)}
                          error={profileForm.errors.birth_date}
                          className="border-none bg-slate-50 h-14 rounded-2xl font-bold tabular-nums"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Nomor HP
                        </label>
                        <FormInput
                          value={profileForm.data.phone}
                          onChange={(e) => profileForm.setData('phone', e.target.value)}
                          error={profileForm.errors.phone}
                          placeholder="08xxxxxxxxxx"
                          className="border-none bg-slate-50 h-14 rounded-2xl font-bold tabular-nums"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Jenis Kelamin
                        </label>
                        <select
                          value={profileForm.data.gender}
                          onChange={(e) =>
                            profileForm.setData('gender', e.target.value as 'L' | 'P')
                          }
                          className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner uppercase tracking-widest"
                        >
                          <option value="">Pilih Jenis Kelamin</option>
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                        {profileForm.errors.gender && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">
                            {profileForm.errors.gender}
                          </p>
                        )}
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                          Ukuran Baju/Jaket
                        </label>
                        <select
                          value={profileForm.data.shirt_size}
                          onChange={(e) => profileForm.setData('shirt_size', e.target.value)}
                          className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner uppercase tracking-widest"
                        >
                          <option value="">Pilih Ukuran</option>
                          {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        {profileForm.errors.shirt_size && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">
                            {profileForm.errors.shirt_size}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      Permanent Domicile Address
                    </label>
                    <FormTextarea
                      value={profileForm.data.address}
                      onChange={(e) => profileForm.setData('address', e.target.value)}
                      error={profileForm.errors.address}
                      className="border-none bg-slate-50 rounded-[1.5rem] p-6 font-bold min-h-[120px] shadow-inner"
                    />
                  </div>

                  {student && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'domicile_village_name', label: 'VILLAGE / DESA' },
                        { id: 'domicile_district_name', label: 'DISTRICT / KEC' },
                        { id: 'domicile_regency_name', label: 'REGENCY / KAB' },
                      ].map((loc) => (
                        <div key={loc.id} className="space-y-3">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">
                            {loc.label}
                          </label>
                          <FormInput
                            value={
                              profileForm.data[loc.id as keyof typeof profileForm.data] as string
                            }
                            onChange={(e) => profileForm.setData(String(loc.id), e.target.value)}
                            className="border-none bg-slate-50 h-12 rounded-xl text-xs font-black uppercase tracking-tighter"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {student && (
                    <div className="relative p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 group overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 h-full w-40 bg-emerald-500 skew-x-12 translate-x-24 opacity-5 group-hover:translate-x-16 transition-transform duration-1000" />
                      <label className="flex items-start gap-6 relative cursor-pointer group/check">
                        <div className="relative h-7 w-7 mt-1 shrink-0">
                          <input
                            type="checkbox"
                            checked={profileForm.data.address_verified}
                            onChange={(e) =>
                              profileForm.setData('address_verified', e.target.checked)
                            }
                            className="peer sr-only"
                          />
                          <div className="h-full w-full bg-white/10 border-2 border-white/20 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 rounded-lg transition-all" />
                          <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                            <ShieldCheck size={18} strokeWidth={3} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                            Verification Oath
                          </p>
                          <p className="text-[11px] font-bold text-gray-400 italic leading-relaxed uppercase tracking-tight">
                            "Saya menyatakan alamat domisili di atas benar dan siap dipakai sebagai
                            dasar penempatan otomatis KKN. Sistem tidak akan menempatkan saya di
                            kabupaten/kota yang sama dengan domisili ini."
                          </p>
                          {student.domicile_verified_at && (
                            <div className="pt-2 flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                              <UserCheck size={12} /> Verification Timestamp:{' '}
                              {new Date(student.domicile_verified_at).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </label>
                      {profileForm.errors.address_verified && (
                        <p className="mt-4 text-[10px] font-black text-rose-400 uppercase tracking-widest pl-12">
                          {profileForm.errors.address_verified}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-10">
                  <button
                    type="submit"
                    disabled={profileForm.processing}
                    className="h-20 min-w-full md:min-w-[320px] bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center gap-6 group hover:bg-emerald-700 transition-all duration-500 shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="text-sm font-black uppercase tracking-[0.3em]">
                      {profileForm.processing ? 'Menyinkronkan...' : 'Simpan Perubahan'}
                    </span>
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all duration-500">
                      <ChevronRight size={18} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Security Matrix Card */}
            <motion.section
              variants={itemVariants}
              className="bg-white rounded-[3rem] border border-slate-100 p-8 lg:p-16 shadow-sm space-y-12 overflow-hidden relative"
            >
              <div className="absolute -top-12 -right-12 h-64 w-64 border-[32px] border-slate-50/50 rounded-full -z-0" />
              <div className="border-b border-slate-50 pb-10 flex items-center gap-6 relative">
                <KeyRound size={28} className="text-gray-900" />
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                  Ganti Kata Sandi
                </h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      Kata Sandi Sekarang
                    </label>
                    <FormInput
                      type="password"
                      value={passwordForm.data.current_password}
                      onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                      error={passwordForm.errors.current_password}
                      className="border-none bg-slate-50 h-14 rounded-2xl"
                    />
                  </div>
                  <div className="hidden md:block" />
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      Kata Sandi Baru
                    </label>
                    <FormInput
                      type="password"
                      value={passwordForm.data.password}
                      onChange={(e) => passwordForm.setData('password', e.target.value)}
                      error={passwordForm.errors.password}
                      className="border-none bg-slate-50 h-14 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      Konfirmasi Sandi Baru
                    </label>
                    <FormInput
                      type="password"
                      value={passwordForm.data.password_confirmation}
                      onChange={(e) =>
                        passwordForm.setData('password_confirmation', e.target.value)
                      }
                      error={passwordForm.errors.password_confirmation}
                      className="border-none bg-slate-50 h-14 rounded-2xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={passwordForm.processing}
                    className="h-16 px-12 bg-white border border-slate-100 text-gray-900 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-900 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {passwordForm.processing ? 'Memproses...' : 'Perbarui Keamanan'}
                  </button>
                </div>
              </form>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
