import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { FormEventHandlerType } from '@/types/events';
import { route } from 'ziggy-js';
import {
  User, Camera, Lock, UserCheck,
  AlertCircle, ChevronRight, IdCard, Briefcase, GraduationCap, Loader2,
  BadgeCheck,
  Info,
  Medal
} from 'lucide-react';
import { clsx } from 'clsx';

interface UserData {
  id: number; name: string; email: string; username: string;
  avatar: string | null; phone: string | null; address: string | null;
  domicile_village_name: string | null; domicile_district_name: string | null;
  domicile_regency_name: string | null; address_verified_at: string | null;
  must_change_password: boolean;
}

interface StudentData {
  nim: string; nik: string | null; name: string; mother_name: string | null;
  faculty: string | null; program: string | null; batch_year: number | null;
  gender: 'L' | 'P' | null; shirt_size: string | null; birth_place: string | null;
  birth_date: string | null; semester: number | null; gpa: number | null;
  sks_completed: number | null;
  biodata_complete: boolean; missing_biodata_fields: string[];
  domicile_complete: boolean; domicile_verified: boolean; domicile_verified_at: string | null;
  missing_domicile_fields: string[];
}

interface LecturerData {
  nip: string; nama: string; gender: 'L' | 'P' | null;
  is_cpns: boolean; is_tugas_belajar: boolean; faculty: string | null;
  birth_date: string | null; jabatan: string | null;
  golongan: string | null; no_rekening: string | null; nama_bank: string | null; npwp: string | null;
  biodata_complete: boolean; missing_biodata_fields: string[];
}

interface Props extends PageProps {
  user: UserData;
  student: StudentData | null;
  lecturer: LecturerData | null;
  is_onboarding: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  nik: 'NIK (KTP)', mother_name: 'Nama Ibu Kandung', birth_place: 'Tempat Lahir',
  birth_date: 'Tanggal Lahir', phone: 'Nomor HP', gender: 'Jenis Kelamin',
  shirt_size: 'Ukuran Baju/Jaket', nip: 'NIP / NIDN', nama: 'Nama Lengkap',
  jabatan: 'Jabatan Fungsional', golongan: 'Golongan', no_rekening: 'No. Rekening',
  nama_bank: 'Nama Bank', npwp: 'NPWP'
};

export default function ProfileShow() {
  const { user, student, lecturer, is_onboarding: isOnboarding } = usePage<Props>().props;
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nikCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nikChecking, setNikChecking] = useState(false);
  const [nikUniqueError, setNikUniqueError] = useState<string | null>(null);
  
  const mustChangePassword = user?.must_change_password ?? false;

  const profileForm = useForm({
    name: user?.name ?? '', phone: user?.phone ?? '', address: user?.address ?? '',
    domicile_village_name: user?.domicile_village_name ?? '',
    domicile_district_name: user?.domicile_district_name ?? '',
    domicile_regency_name: user?.domicile_regency_name ?? '',
    address_verified: !!user?.address_verified_at,
    nik: student?.nik ?? '', mother_name: student?.mother_name ?? '',
    gender: student?.gender ?? lecturer?.gender ?? '', 
    shirt_size: student?.shirt_size ?? '',
    birth_place: student?.birth_place ?? '', 
    birth_date: student?.birth_date ?? lecturer?.birth_date ?? '',
    jabatan: lecturer?.jabatan ?? '',
    golongan: lecturer?.golongan ?? '',
    no_rekening: lecturer?.no_rekening ?? '',
    nama_bank: lecturer?.nama_bank ?? '',
    npwp: lecturer?.npwp ?? '',
  });

  const avatarForm = useForm<{ avatar: File | null }>({ avatar: null });

  const validateNik = (value: string): string | undefined => {
    if (!student) return undefined; // Only for students
    if (!value) return 'NIK wajib diisi';
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length !== 16) return 'NIK harus terdiri dari 16 digit angka';
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value) return 'Nomor HP wajib diisi';
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return 'Nomor HP harus 10-15 digit';
    return undefined;
  };

  const handleNikChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    profileForm.setData('nik', value);
    profileForm.setError('nik', validateNik(value) ?? '');
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    profileForm.setData('phone', value);
    profileForm.setError('phone', validatePhone(value) ?? '');
  };

  useEffect(() => {
    const isStudent = !!student;
    if (!isStudent) return;

    const nik = profileForm.data.nik;
    if (nik.length !== 16) {
      setNikUniqueError(null);
      return;
    }

    if (nikCheckTimeout.current) {
      clearTimeout(nikCheckTimeout.current);
    }

    setNikChecking(true);
    setNikUniqueError(null);

    nikCheckTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(route('profile.check-nik', { nik }));
        const data = await response.json();
        if (!data.valid) {
          setNikUniqueError(data.message);
        }
      } catch (error) {
        console.error('Failed to check NIK:', error);
      } finally {
        setNikChecking(false);
      }
    }, 500);

    return () => {
      if (nikCheckTimeout.current) {
        clearTimeout(nikCheckTimeout.current);
      }
    };
  }, [profileForm.data.nik, student]);

  const handleProfileSubmit: FormEventHandlerType = (e) => {
    e.preventDefault();
    
    const nikError = student ? validateNik(profileForm.data.nik) : undefined;
    const phoneError = validatePhone(profileForm.data.phone);
    
    if (nikError) {
      profileForm.setError('nik', nikError);
    }
    if (phoneError) {
      profileForm.setError('phone', phoneError);
    }
    if (nikUniqueError) {
      profileForm.setError('nik', nikUniqueError);
    }
    
    if (nikError || phoneError || nikUniqueError) {
      return;
    }

    if (student && !student.domicile_verified_at && !profileForm.data.address_verified) {
      profileForm.setData('address_verified', false);
      return;
    }
    
    profileForm.patch(route('profile.update'), { preserveScroll: true });
  };

  // If must change password, redirect to dedicated page
  if (mustChangePassword) {
    if (typeof window !== 'undefined') {
      router.visit(route('profile.password-change'));
    }
    return null;
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    fetch(route('profile.avatar'), {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
    }).then(() => {
      router.reload({ only: ['user'] });
    }).catch(() => {
      setPreviewUrl(null);
    });
  };

  const avatarUrl = previewUrl || (user.avatar ? `/storage/${user.avatar}` : null);
  
  // Biodata status
  const isStudent = !!student;
  const isLecturer = !!lecturer;
  
  const biodataComplete = isStudent ? (student?.biodata_complete ?? true) : (lecturer?.biodata_complete ?? true);
  const missingFields = isStudent ? (student?.missing_biodata_fields ?? []) : (lecturer?.missing_biodata_fields ?? []);

  return (
    <AppLayout title="Profil Pengguna">
      <Head title="Profil Saya" />

      <div className="max-w-5xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Pengaturan Akun</span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 tracking-tight leading-tight">Profil Saya</h1>
            <p className="text-sm text-emerald-700 max-w-xl">
              {isLecturer ? 'Pastikan data kepegawaian Anda valid untuk keperluan pembimbingan KKN.' : 'Lengkapi data pribadi Anda untuk kelancaran proses pendaftaran dan penempatan KKN.'}
            </p>
          </div>
        </div>



        {!mustChangePassword && !biodataComplete && missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Data profil Anda belum lengkap</p>
              <p className="text-sm text-amber-700">
                Informasi berikut wajib diisi: <strong>{missingFields.map(f => FIELD_LABELS[f] ?? f).join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-5">
            <div className="bg-white border border-emerald-50 rounded-xl shadow-sm p-5 flex flex-col items-center gap-4 text-center">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="h-24 w-24 rounded-full border-2 border-emerald-50 overflow-hidden bg-gray-100 relative">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-emerald-600">{user.name.charAt(0)}</div>
                  }
                  <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-emerald-950 text-sm">{user.name}</p>
                <p className="text-xs text-emerald-700">{user.username}</p>
                {isStudent && <p className="text-xs text-emerald-700 mt-0.5">NIM: {student.nim}</p>}
                {isLecturer && <p className="text-xs text-emerald-700 mt-0.5">NIP: {lecturer.nip}</p>}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Kelengkapan Data Badge */}
            <div className="bg-white border border-emerald-50 rounded-xl shadow-sm p-5 space-y-4">
               <h3 className="text-sm font-semibold text-emerald-950">Informasi Status</h3>
               <div className="space-y-3">
                  <StatusRow
                    label="Biodata"
                    complete={biodataComplete}
                    subtitle={biodataComplete ? 'Telah lengkap' : 'Belum lengkap'}
                  />
                  {isStudent && (
                    <StatusRow
                      label="Domisili"
                      complete={student?.domicile_verified ?? false}
                      subtitle={student?.domicile_verified ? 'Tervalidasi' : 'Belum verifikasi'}
                    />
                  )}
               </div>

               {isStudent && (
                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-lg font-bold text-emerald-950 tabular-nums">{student.gpa ?? '—'}</p>
                    <p className="text-xs text-emerald-700">IPK</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-lg font-bold text-emerald-950 tabular-nums">{student.sks_completed ?? 0}</p>
                    <p className="text-xs text-emerald-700">SKS</p>
                  </div>
                </div>
               )}

               <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <GraduationCap size={13} />
                    <span>{student?.faculty || lecturer?.faculty || 'Fakultas Belum Diatur'}</span>
                  </div>
                  {isLecturer && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 italic">
                      <Medal size={13} />
                      <span>{lecturer.jabatan || 'Jabatan Belum Diatur'}</span>
                    </div>
                  )}
                  {isStudent && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                      <Briefcase size={13} />
                      <span>{student.program}</span>
                    </div>
                  )}
               </div>

{isLecturer && (
                  <div className="mt-2 p-3 bg-emerald-50 rounded-lg space-y-2">
                     <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider text-emerald-950 uppercase">Kualifikasi DPL</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className={clsx("px-2 py-1 rounded text-[10px] font-bold text-center", lecturer.is_cpns ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                           {lecturer.is_cpns ? 'CPNS' : 'PNS/TETAP'}
                        </div>
                        <div className={clsx("px-2 py-1 rounded text-[10px] font-bold text-center", lecturer.is_tugas_belajar ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800")}>
                           {lecturer.is_tugas_belajar ? 'TGS BELAJAR' : 'AKTIF'}
                        </div>
                     </div>
                     {lecturer.is_tugas_belajar && (
                       <p className="text-[9px] text-rose-600 italic leading-tight">* Dosen tugas belajar tidak diperbolehkan mendaftar sebagai DPL.</p>
                     )}
                  </div>
                )}


                {isLecturer && (lecturer.golongan || lecturer.no_rekening || lecturer.nama_bank || lecturer.npwp) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Data Keuangan & Pajak</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {lecturer.golongan && (
                        <div><span className="text-gray-500">Golongan:</span> <span className="font-medium text-gray-900">{lecturer.golongan}</span></div>
                      )}
                      {lecturer.no_rekening && (
                        <div><span className="text-gray-500">No. Rekening:</span> <span className="font-medium text-gray-900">{lecturer.no_rekening}</span></div>
                      )}
                      {lecturer.nama_bank && (
                        <div><span className="text-gray-500">Nama Bank:</span> <span className="font-medium text-gray-900">{lecturer.nama_bank}</span></div>
                      )}
                      {lecturer.npwp && (
                        <div><span className="text-gray-500">NPWP:</span> <span className="font-medium text-gray-900">{lecturer.npwp}</span></div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                <IdCard size={16} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-emerald-950">
                  {isLecturer ? 'Data Kepegawaian & Kontak' : 'Data Pribadi & Domisili'}
                </h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-emerald-800">Email Sistem</label>
                    <div className="h-10 bg-gray-50 border border-emerald-50 rounded-md px-3 flex items-center gap-2">
                      <span className="text-sm text-emerald-700">{user.email}</span>
                      <Lock size={13} className="ml-auto text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                      Nomor HP / WA <span className="text-rose-500">*</span>
                    </label>
                    <FormInput
                      value={profileForm.data.phone}
                      onChange={handlePhoneChange}
                      error={profileForm.errors.phone}
                      placeholder="08xxxxxxxxxx"
                      className="h-10"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">Biodata Diri</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isStudent && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">NIK (KTP) <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <FormInput 
                            value={profileForm.data.nik} 
                            onChange={handleNikChange} 
                            error={profileForm.errors.nik || nikUniqueError || undefined} 
                            placeholder="16 digit NIK" 
                            className="h-10 font-mono pr-10" 
                            inputMode="numeric"
                            autoComplete="off"
                          />
                          {nikChecking && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 size={16} className="text-emerald-600 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isLecturer && (
                       <div className="space-y-1.5">
                        <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">NIP / NIDN</label>
                        <div className="h-10 bg-gray-50 border border-emerald-50 rounded-md px-3 flex items-center">
                          <span className="text-sm text-emerald-700">{lecturer.nip}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                      <FormInput value={profileForm.data.name} onChange={e => profileForm.setData('name', e.target.value)} error={profileForm.errors.name} placeholder="Nama sesuai KTP" className="h-10" />
                    </div>

{isLecturer && (
                       <div className="space-y-1.5">
                         <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Jabatan Fungsional <span className="text-rose-500">*</span></label>
                         <FormInput value={profileForm.data.jabatan} onChange={e => profileForm.setData('jabatan', e.target.value)} error={profileForm.errors.jabatan} placeholder="Contoh: Lektor Kepala" className="h-10" />
                       </div>
                     )}

                     {isLecturer && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                           <label className="text-sm font-medium text-emerald-800">Golongan</label>
                           <FormInput value={profileForm.data.golongan} onChange={e => profileForm.setData('golongan', e.target.value)} error={profileForm.errors.golongan} placeholder="Contoh: IV/a" className="h-10" />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-sm font-medium text-emerald-800">NPWP</label>
                           <FormInput value={profileForm.data.npwp} onChange={e => profileForm.setData('npwp', e.target.value)} error={profileForm.errors.npwp} placeholder="Contoh: 12.345.678.9-012.345" className="h-10" />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-sm font-medium text-emerald-800">No. Rekening</label>
                           <FormInput value={profileForm.data.no_rekening} onChange={e => profileForm.setData('no_rekening', e.target.value)} error={profileForm.errors.no_rekening} placeholder="Contoh: 1234567890" className="h-10" inputMode="numeric" />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-sm font-medium text-emerald-800">Nama Bank</label>
                           <FormInput value={profileForm.data.nama_bank} onChange={e => profileForm.setData('nama_bank', e.target.value)} error={profileForm.errors.nama_bank} placeholder="Contoh: Bank Negara Indonesia" className="h-10" />
                         </div>
                       </div>
                     )}

                    {isStudent && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Nama Ibu Kandung <span className="text-rose-500">*</span></label>
                          <FormInput value={profileForm.data.mother_name} onChange={e => profileForm.setData('mother_name', e.target.value)} error={profileForm.errors.mother_name} placeholder="Nama ibu sesuai KTP" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Tempat Lahir <span className="text-rose-500">*</span></label>
                          <FormInput value={profileForm.data.birth_place} onChange={e => profileForm.setData('birth_place', e.target.value)} error={profileForm.errors.birth_place} placeholder="Kota tempat lahir" className="h-10" />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Tanggal Lahir <span className="text-rose-500">*</span></label>
                      <FormInput type="date" value={profileForm.data.birth_date} onChange={e => profileForm.setData('birth_date', e.target.value)} error={profileForm.errors.birth_date} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
                      <select value={profileForm.data.gender} onChange={e => profileForm.setData('gender', e.target.value as 'L' | 'P')} className="w-full h-10 pl-3 pr-8 rounded-md border-gray-300 bg-white text-sm text-emerald-800 focus:border-[#0d9488] focus:ring-emerald-500 shadow-sm transition-colors">
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                      {profileForm.errors.gender && <p className="text-xs text-rose-600">{profileForm.errors.gender}</p>}
                    </div>
                    
                    {isStudent && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">Ukuran Baju / Jaket <span className="text-rose-500">*</span></label>
                        <select value={profileForm.data.shirt_size} onChange={e => profileForm.setData('shirt_size', e.target.value)} className="w-full h-10 pl-3 pr-8 rounded-md border-gray-300 bg-white text-sm text-emerald-800 focus:border-[#0d9488] focus:ring-emerald-500 shadow-sm transition-colors">
                          <option value="">Pilih Ukuran</option>
                          {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {isStudent && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">Alamat Domisili</p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-emerald-800">Alamat Lengkap</label>
                        <FormTextarea value={profileForm.data.address} onChange={e => profileForm.setData('address', e.target.value)} error={profileForm.errors.address} className="min-h-[80px] rounded-md" placeholder="Jl. ..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'domicile_village_name', label: 'Desa / Kelurahan' },
                          { id: 'domicile_district_name', label: 'Kecamatan' },
                          { id: 'domicile_regency_name', label: 'Kabupaten / Kota' },
                        ].map(loc => (
                          <div key={loc.id} className="space-y-1.5">
                            <label className="text-sm font-medium text-emerald-800">{loc.label}</label>
                            <FormInput
                              value={profileForm.data[loc.id as keyof typeof profileForm.data] as string}
                              onChange={e => profileForm.setData(loc.id as any, e.target.value)}
                              className="h-10"
                            />
                          </div>
                        ))}
                      </div>
                      <label className={clsx("flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors", profileForm.data.address_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-emerald-50 hover:border-emerald-200')}>
                        <input
                          type="checkbox" checked={profileForm.data.address_verified}
                          onChange={e => profileForm.setData('address_verified', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-emerald-950">Saya menyatakan alamat domisili di atas benar adanya</p>
                          <p className="text-xs text-emerald-700">Alamat ini digunakan sebagai acuan penempatan otomatis KKN. Sistem tidak akan menempatkan Anda di kabupaten/kota yang sama.</p>
                          {student && !student.domicile_verified_at && !profileForm.data.address_verified && (
                            <p className="text-xs text-rose-600 font-medium">Centang untuk melanjutkan</p>
                          )}
                          {student?.domicile_verified_at && (
                            <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600">
                              <UserCheck size={12} /> Dikonfirmasi {new Date(student.domicile_verified_at).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {isLecturer && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
                     <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                     <p className="text-xs text-emerald-800 leading-relaxed">
                        Beberapa data kepegawaian (seperti Fakultas) ditarik otomatis dari integrasi data master universitas. Hubungi Admin Kepegawaian jika terdapat ketidaksesuaian data.
                     </p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button type="submit" disabled={profileForm.processing} className="h-10 px-6 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                    {profileForm.processing ? 'Menyimpan...' : isOnboarding ? 'Lanjutkan' : 'Simpan Perubahan'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </form>
            </div>


          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatusRow({ label, complete, subtitle }: { label: string; complete: boolean; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs font-medium text-emerald-950">{label}</p>
        {subtitle && <p className="text-xs text-emerald-700">{subtitle}</p>}
      </div>
      <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0", complete ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-800')}>
        {complete ? 'Lengkap' : 'Belum Lengkap'}
      </span>
    </div>
  );
}
