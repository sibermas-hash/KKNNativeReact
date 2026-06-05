'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormData } from '@sibermas/schemas';
import { setProfileCompleteCookie, useAuthStore } from '@/stores';
import { profileApi } from '@/lib/api';
import { toast } from 'sonner';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AlertCircle, BadgeCheck, Camera, GraduationCap, IdCard, Info, LayoutDashboard, Lock, LogOut, Medal, PencilLine, RefreshCw, Save, User as UserIcon } from 'lucide-react';
import type { User } from '@sibermas/shared-types';
import { useTheme } from '@/components/ui/theme-provider';
import { THEMES, THEME_KEYS, THEME_TYPOGRAPHY, SOFT_CLASS, PRIMARY_CLASS, MUTED_TEXT_CLASS, ACCENT_TEXT_CLASS, FIELD_CLASS, type ThemeKey, type ThemeDefinition } from '@/lib/theme-config';

const ParticleBackground = dynamic(
  () => import('@/components/ui/particle-background').then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);

// NotificationPreferencesCard — hidden from student profile, managed via admin dashboard
// import { NotificationPreferencesCard } from '@/components/profile/notification-preferences-card';
import { TwoFactorCard } from '@/components/profile/two-factor-card';

type ReverseGeocodeAddress = {
  house_number?: string;
  road?: string;
  hamlet?: string;
  quarter?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
};

type ForwardGeocodeResult = {
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  addresstype?: string;
  importance?: number;
  display_name?: string;
};

type ChangeRequest = { id: number; status?: 'pending' | 'approved' | 'rejected'; requested_changes: Record<string, { old: unknown; new: unknown }>; rejection_reason?: string | null; reviewed_at?: string | null; created_at: string };
type ExternalProfile = { external_nim?: string; home_university?: string; external_faculty?: string | null; external_study_program?: string | null; external_email?: string | null; external_phone?: string | null };
type StudentProfile = { nim?: string; gpa?: number; sks_completed?: number; status_bta_ppi?: string | null; faculty?: { nama?: string }; prodi?: { nama?: string }; external_profile?: ExternalProfile | null; missing_biodata_fields?: string[]; missing_address_fields?: string[]; biodata_complete?: boolean; address_verified?: boolean; address_verified_at?: string | null; [key: string]: unknown };
type LecturerProfile = { nip?: string; faculty?: { nama?: string }; missing_biodata_fields?: string[]; biodata_complete?: boolean; jabatan?: string; status_aktif?: string; status_pegawai?: string; has_workshop?: boolean; workshop_date?: string; is_cpns?: boolean; is_tugas_belajar?: boolean; [key: string]: unknown };

type TypographyKeys = { page: string; eyebrow: string; heading: string; body: string; label: string; button: string; meta: string };

type SurfaceClass = string;

interface ProfileHeaderProps {
  refTarget: (node: HTMLElement | null) => void;
  themeRef: (node: HTMLElement | null) => void;
  theme: string;
  typography: TypographyKeys;
  themeConfig: ThemeDefinition;
  surfaceClass: SurfaceClass;
  isLecturer: boolean;
  profileComplete: boolean;
  profileStatusKnown: boolean;
  isEditing: boolean;
  pendingRequest: ChangeRequest | null;
  onThemeChange: (key: string) => void;
  onDashboard: () => void;
  onToggleEdit: () => void;
  onLogout: () => void;
}

interface ProfileSidebarProps {
  avatarRef: (node: HTMLElement | null) => void;
  statusRef: (node: HTMLElement | null) => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  user: User;
  student: StudentProfile | null;
  lecturer: LecturerProfile | null;
  isStudent: boolean;
  isLecturer: boolean;
  avatarLoading: boolean;
  typography: TypographyKeys;
  themeConfig: ThemeDefinition;
  surfaceStrongClass: SurfaceClass;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface StudentAddressSectionProps {
  register: ReturnType<typeof useForm<UpdateProfileFormData>>['register'];
  errors: ReturnType<typeof useForm<UpdateProfileFormData>>['formState']['errors'];
  isEditing: boolean;
  typography: TypographyKeys;
}

const FIELD_LABELS: Record<string, string> = {
  nik: 'NIK (KTP)',
  mother_name: 'Nama Ibu Kandung',
  birth_place: 'Tempat Lahir',
  birth_date: 'Tanggal Lahir',
  phone: 'Nomor HP',
  gender: 'Jenis Kelamin',
  shirt_size: 'Ukuran Baju/Jaket',
  nip: 'NIP/NIDN',
  nama: 'Nama Lengkap',
  jabatan: 'Jabatan Fungsional',
  golongan: 'Golongan',
  no_rekening: 'No. Rekening',
  nama_bank: 'Nama Bank',
  npwp: 'NPWP',
  address: 'Alamat Asli sesuai KTP',
  address_village_name: 'Desa/Kelurahan KTP',
  address_district_name: 'Kecamatan KTP',
  address_regency_name: 'Kabupaten/Kota KTP',
  address_postal_code: 'Kode Pos KTP',
  address_lat: 'Latitude Alamat KTP',
  address_lng: 'Longitude Alamat KTP',
  address_verified_at: 'Verifikasi Alamat',
  avatar: 'Foto Profil Formal',
  external_faculty: 'Fakultas Asal',
  external_study_program: 'Prodi Asal',
};

function dashboardPathFor(roles: string[]) {
  if (roles.some((role) => ['admin', 'admin', 'faculty_admin'].includes(role))) return '/admin';
  if (roles.some((role) => ['dosen', 'dpl'].includes(role))) return '/dosen';
  if (roles.includes('student')) return '/mahasiswa';
  return '/';
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// Aliases from global theme system for backward compatibility within this page
const softClass = SOFT_CLASS;
const primaryClass = PRIMARY_CLASS;
const mutedTextClass = MUTED_TEXT_CLASS;
const accentTextClass = ACCENT_TEXT_CLASS;
const fieldClass = FIELD_CLASS;

const PROFILE_TUTORIAL_KEY = 'sibermas_profile_tutorial_seen';
const PROFILE_TUTORIAL_STEPS = [
  {
    target: 'intro',
    placement: 'center',
    title: 'Selamat datang di Pusat Data Profil',
    body: 'Halaman ini menjadi Pusat Informasi KKN. Pastikan data pribadi, kontak, alamat tertulis sesuai KTP, dan foto formal sudah benar sebelum lanjut.',
  },
  {
    target: 'theme',
    placement: 'bottom-right',
    title: 'Pilih tema sesuai kebutuhan',
    body: 'Gunakan tombol bulat di kanan atas untuk memilih tampilan. Ada tema yang fokus keterbacaan, kenyamanan, atau tampilan modern.',
  },
  {
    target: 'avatar',
    placement: 'right',
    title: 'Unggah Foto Formal',
    body: 'Foto formal wajib diisi dan akan digunakan untuk cetak sertifikat. Gunakan foto HD, wajah jelas, pencahayaan baik, latar rapi/polos, dan bukan selfie atau foto kasual.',
  },
  {
    target: 'status',
    placement: 'right',
    title: 'Cek status kelengkapan',
    body: 'Panel status menunjukkan bagian mana yang sudah lengkap. Jika masih ada data wajib yang kosong, sistem akan menampilkan daftar field yang perlu dilengkapi.',
  },
  {
    target: 'form',
    placement: 'left',
    title: 'Isi dan simpan data',
    body: 'Klik Lengkapi Profil atau Edit Profil, isi data yang diperlukan, lalu tekan Simpan & Lanjutkan. Pengisian awal langsung tersimpan, perubahan setelah lengkap menunggu persetujuan admin.',
  },
] as const;

type TutorialTarget = typeof PROFILE_TUTORIAL_STEPS[number]['target'];

const TOUR_CSS = `
  .sibermas-profile-tour {
    max-width: min(360px, calc(100vw - 32px));
    border: 1px solid rgba(255,255,255,.6);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    color: #03110d;
    box-shadow: 0 24px 80px -34px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.75);
    backdrop-filter: blur(24px) saturate(180%);
  }
  .sibermas-profile-tour .driver-popover-title { font: 700 18px/1.25 var(--font-glass), system-ui, sans-serif; color: #03110d; }
  .sibermas-profile-tour .driver-popover-description { font: 500 13px/1.65 var(--font-glass), system-ui, sans-serif; color: #31534a; }
  .sibermas-profile-tour .driver-popover-progress-text { color: #31534a; font-weight: 700; }
  .sibermas-profile-tour button { border-radius: 10px !important; font-weight: 700 !important; text-shadow: none !important; }
  .sibermas-profile-tour .driver-popover-next-btn,
  .sibermas-profile-tour .driver-popover-done-btn { background: #047857 !important; border-color: #047857 !important; color: #fff !important; }
  .sibermas-profile-tour .driver-popover-prev-btn { background: #ecfdf5 !important; border-color: rgba(4,120,87,.25) !important; color: #064e3b !important; }
  .driver-active-element { transform: scale(1.025); transition: transform .24s ease; }
`;

function profileTutorialKey(user: { id?: number | string; username?: string } | null) {
  return `${PROFILE_TUTORIAL_KEY}:${user?.id ?? user?.username ?? 'anonymous'}`;
}

function cleanAdminName(value?: string | null) {
  return (value ?? '').replace(/^(Kabupaten|Kab\.|Kota|Kecamatan)\s+/i, '').trim();
}

function normalizeAddressSegment(value?: string | null) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function composeAddress(displayName?: string, address?: ReverseGeocodeAddress) {
  const roadLine = [address?.road, address?.house_number].filter(Boolean).join(' ');
  const parts = [
    roadLine,
    address?.hamlet || address?.quarter || address?.neighbourhood || address?.suburb,
    address?.village || address?.town || address?.city,
  ]
    .map((value) => normalizeAddressSegment(value))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : normalizeAddressSegment(displayName);
}

function joinAddressParts(parts: Array<string | null | undefined>) {
  return parts
    .map((value) => normalizeAddressSegment(value))
    .filter(Boolean)
    .join(', ');
}

function buildAddressQueries({
  fullAddress,
  village,
  district,
  regency,
  postalCode,
}: {
  fullAddress?: string | null;
  village?: string | null;
  district?: string | null;
  regency?: string | null;
  postalCode?: string | null;
}) {
  const queries = [
    joinAddressParts([fullAddress, village, district, regency, postalCode, 'Jawa Tengah', 'Indonesia']),
    joinAddressParts([fullAddress, village, district, regency, 'Jawa Tengah', 'Indonesia']),
    joinAddressParts([village, district, regency, postalCode, 'Jawa Tengah', 'Indonesia']),
    joinAddressParts([village, district, regency, 'Jawa Tengah', 'Indonesia']),
    joinAddressParts([district, regency, 'Jawa Tengah', 'Indonesia']),
  ];

  return Array.from(new Set(queries.filter(Boolean)));
}

const ADDRESS_STOP_WORDS = new Set([
  'jalan',
  'jln',
  'rt',
  'rw',
  'desa',
  'kelurahan',
  'kecamatan',
  'kabupaten',
  'kota',
  'provinsi',
  'jawa',
  'tengah',
  'indonesia',
]);

function addressTokens(value: string) {
  return normalizeAddressSegment(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3 && !ADDRESS_STOP_WORDS.has(token));
}

function scoreForwardGeocodeResult(result: ForwardGeocodeResult, tokens: string[]) {
  const addresstype = normalizeAddressSegment(result.addresstype).toLowerCase();
  const type = normalizeAddressSegment(result.type).toLowerCase();
  const resultClass = normalizeAddressSegment(result.class).toLowerCase();
  const displayName = (result.display_name ?? '').toLowerCase();

  let score = Number(result.importance ?? 0) * 20;

  if (resultClass === 'boundary') score -= 60;
  if (['administrative', 'county', 'city', 'state', 'region'].includes(addresstype) || ['administrative', 'county', 'city', 'state', 'region'].includes(type)) {
    score -= 60;
  }
  if (['building', 'house', 'residential', 'road', 'street', 'service', 'amenity', 'premise'].includes(addresstype) || ['building', 'house', 'residential', 'road', 'street', 'service'].includes(type)) {
    score += 40;
  }
  if (['building', 'amenity', 'highway'].includes(resultClass)) {
    score += 18;
  } else if (resultClass === 'place') {
    score += 8;
  }

  score += tokens.reduce((total, token) => total + (displayName.includes(token) ? 4 : 0), 0);
  return score;
}

function pickBestForwardGeocodeResult(results: ForwardGeocodeResult[], query: string) {
  const tokens = addressTokens(query);
  const ranked = results
    .map((result) => ({ result, score: scoreForwardGeocodeResult(result, tokens) }))
    .sort((left, right) => right.score - left.score);

  return ranked[0] && ranked[0].score > 0 ? ranked[0].result : null;
}

function focusProfileField(field: string) {
  const selector = `[name="${field}"]`;
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => element.focus(), 350);
    return true;
  }
  return false;
}

const SHIRT_SIZE_OPTIONS = [
  ['', 'Pilih ukuran baju/jaket'],
  ['S', 'S - Small'],
  ['M', 'M - Medium'],
  ['L', 'L - Large'],
  ['XL', 'XL - Extra Large'],
  ['XXL', 'XXL - Double Extra Large'],
  ['3XL', '3XL - Triple Extra Large'],
  ['4XL', '4XL'],
  ['5XL', '5XL'],
];

function StatusRow({ label, complete, subtitle, typography }: { label: string; complete: boolean; subtitle?: string; typography: typeof THEME_TYPOGRAPHY[ThemeKey] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className={`${typography.meta} text-[color:var(--profile-text)]`}>{label}</p>
        {subtitle && <p className={`${typography.meta} text-[color:var(--profile-muted)]`}>{subtitle}</p>}
      </div>
      <span className={cx('inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors', complete ? 'bg-emerald-100 text-emerald-950' : 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)]')}>
        {complete ? 'Lengkap' : 'Belum Lengkap'}
      </span>
    </div>
  );
}

function ProfileHeader({ refTarget, themeRef, theme, typography, themeConfig, surfaceClass, isLecturer, profileComplete, profileStatusKnown, isEditing, pendingRequest, onThemeChange, onDashboard, onToggleEdit, onLogout }: ProfileHeaderProps) {
  const dashboardDisabled = profileStatusKnown && !profileComplete;

  return (
    <div ref={refTarget} className={cx('flex flex-col gap-4 p-4 sm:p-5 sm:flex-row sm:items-end sm:justify-between border border-[color:var(--profile-border)]', themeConfig.shadow, surfaceClass)} style={{ borderRadius: 'var(--profile-radius)' }}>
      <div className="space-y-1">
        <div className="flex items-center gap-2"><UserIcon size={16} className={accentTextClass} /><span className={`${typography.eyebrow} ${accentTextClass}`}>Pengaturan Akun</span></div>
        <h1 className={`${typography.heading} text-xl sm:text-2xl drop-shadow-sm`}>Pusat Data Profil</h1>
        <p className={`max-w-xl text-xs sm:text-sm ${typography.body} ${mutedTextClass} drop-shadow-sm`}>{isLecturer ? 'Pastikan data kepegawaian dan kontak Anda valid untuk keperluan pembimbingan KKN.' : 'Lengkapi data pribadi, alamat tertulis sesuai KTP, dan foto formal HD untuk kelancaran proses KKN.'}</p>
      </div>
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:max-w-[34rem] sm:items-end sm:gap-3">
        <div ref={themeRef} className={cx('flex flex-wrap justify-center rounded-xl p-1 shadow-inner', 'border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]')} aria-label="Pilihan tema profil">
          {THEME_KEYS.map((key) => (
            <TooltipPrimitive.Root key={key}>
              <TooltipPrimitive.Trigger asChild><button type="button" onClick={() => onThemeChange(key)} aria-label={`Pilih tema ${THEMES[key].label} - ${THEMES[key].strength}`} aria-pressed={theme === key} className={cx('group relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-all duration-300', theme === key ? 'bg-[color:var(--profile-primary)] text-white shadow-sm shadow-black/10' : 'opacity-70 hover:bg-white/25 hover:opacity-100')}><span className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-br ${THEMES[key].preview} ring-1 ring-white/60 transition-transform group-hover:scale-125`} />{theme === key && <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.8)]" />}</button></TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal><TooltipPrimitive.Content side="bottom" align="center" sideOffset={10} className="z-50 max-w-56 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] px-3 py-2 text-left text-[color:var(--profile-text)] shadow-[0_18px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150"><p className={`${THEME_TYPOGRAPHY[key].meta} text-[color:var(--profile-text)]`}>{THEMES[key].label} - {THEMES[key].strength}</p><p className="mt-1 text-[11px] leading-4 text-[color:var(--profile-muted)]">{THEMES[key].description}</p><TooltipPrimitive.Arrow className="fill-[color:var(--profile-surface-strong)]" /></TooltipPrimitive.Content></TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          ))}
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onDashboard}
            disabled={dashboardDisabled}
            title={dashboardDisabled ? 'Dashboard aktif setelah biodata dan alamat KTP lengkap.' : 'Buka dashboard'}
            className={cx('inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto', typography.button, softClass, dashboardDisabled && 'border border-dashed border-[color:var(--profile-border)] opacity-50')}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button type="button" onClick={onToggleEdit} disabled={!!pendingRequest && profileComplete} className={cx('inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 disabled:opacity-50 sm:w-auto', typography.button, primaryClass)}><PencilLine size={16} />{isEditing ? 'Batal' : profileComplete ? 'Edit Profil' : 'Lengkapi Profil'}</button>

        </div>
        {dashboardDisabled && <p className={cx('text-left sm:text-right', typography.meta, mutedTextClass)}>Dashboard akan aktif setelah biodata dan alamat KTP lengkap.</p>}
      </div>
    </div>
  );
}

function ProfileSidebar({ avatarRef, statusRef, avatarInputRef, user, student, lecturer, isStudent, isLecturer, avatarLoading, typography, themeConfig, surfaceStrongClass, onAvatarChange }: ProfileSidebarProps) {
  const avatarModerationStatus = user.avatar_moderation_status;
  const avatarModerationReason = user.avatar_moderation_reason?.trim() || null;
  const avatarNeedsManualReview = avatarModerationStatus === 'pending'
    && !!avatarModerationReason
    && /server ai tidak tersedia|menunggu verifikasi admin|manual/i.test(avatarModerationReason);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div ref={avatarRef} className={cx('flex flex-col items-center gap-4 p-4 text-center sm:p-5 border border-[color:var(--profile-border)]', themeConfig.shadow, surfaceStrongClass)} style={{ borderRadius: 'var(--profile-radius)' }}>
        <button type="button" onClick={() => avatarInputRef.current?.click()} className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] sm:h-24 sm:w-24 transition-all duration-300 hover:scale-105 hover:shadow-xl">
          {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full flex-col items-center justify-center px-3 text-center text-[10px] font-black uppercase tracking-wider text-[color:var(--profile-soft-text)]"><Camera size={20} className="mb-1" />Foto Formal</span>}
          {avatarLoading && <span className="absolute inset-0 flex items-center justify-center bg-[color:var(--profile-surface)]/70"><RefreshCw className="animate-spin text-[color:var(--profile-accent)]" /></span>}
        </button>
        <div><p className={`${typography.label} text-[color:var(--profile-text)] drop-shadow-sm`}>{user.name}</p><p className={`${typography.meta} text-[color:var(--profile-muted)]`}>{user.username}</p>{student?.nim && <p className={`${typography.meta} text-[color:var(--profile-muted)] flex items-center gap-1`}><Lock size={12} className="text-amber-500" /> NIM: {student.nim}</p>}{lecturer?.nip && <p className={`${typography.meta} text-[color:var(--profile-muted)] flex items-center gap-1`}><Lock size={12} className="text-amber-500" /> NIP: {lecturer.nip}</p>}</div>
        <div className="space-y-2">
          <button type="button" onClick={() => avatarInputRef.current?.click()} className={cx('inline-flex items-center gap-2 rounded-lg px-3 py-2', typography.meta, SOFT_CLASS)}><Camera size={14} /><span className="whitespace-normal">Upload Foto Formal HD</span></button>
          <div className={`${typography.meta} max-w-72 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-3 text-left text-[color:var(--profile-warning-text)]`}>
            <p className="font-black uppercase tracking-wide">Syarat Foto Profil</p>
            <p className="mt-1">Foto dipakai untuk sertifikat. Sistem akan menolak otomatis jika tidak sesuai.</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Pas foto formal satu orang, wajah jelas menghadap kamera.</li>
              <li>Latar belakang merah polos/solid, bukan ruangan, pemandangan, twibbon, atau editan ramai.</li>
              <li>Wajib memakai jas almamater/blazer resmi kampus yang terlihat jelas.</li>
              <li>Komposisi kepala sampai dada/bahu, tidak selfie, tidak miring, tidak terpotong.</li>
              <li>Tidak memakai masker, kacamata hitam, filter, watermark, stiker, atau tulisan.</li>
              <li>Rasio wajib 3:4 portrait. File JPG/PNG, minimal 300×400 px, maksimal 2 MB.</li>
            </ul>
            <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
              <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] p-2 text-[color:var(--profile-soft-text)]">
                <p className="font-black">Contoh benar ✓</p>
                <p>Ukuran 600×800 / 900×1200 px, background merah polos, jas almamater terlihat, wajah jelas, crop kepala–dada.</p>
              </div>
              <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] p-2 text-[color:var(--profile-danger-text)]">
                <p className="font-black">Contoh salah ✕</p>
                <p>Selfie, twibbon/watermark, background kelas/rumah, tanpa jas almamater, foto ramai, blur/gelap.</p>
              </div>
            </div>
          </div>
          {avatarModerationStatus === 'pending' && (
            <div className={cx(
              'rounded-lg border px-3 py-2 text-[11px] font-semibold',
              avatarNeedsManualReview
                ? 'border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)]'
                : 'border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]',
            )}>
              Status foto: {avatarModerationReason || 'Sedang diverifikasi otomatis oleh sistem.'}
            </div>
          )}
          {avatarModerationStatus === 'approved' && user.avatar_url && (
            <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] px-3 py-2 text-[11px] font-semibold text-[color:var(--profile-soft-text)]">
              Status foto: Lolos verifikasi dan siap dipakai pada sertifikat.
            </div>
          )}
          {avatarModerationStatus === 'rejected' && (
            <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] px-3 py-2 text-[11px] font-semibold text-[color:var(--profile-danger-text)]">
              Status foto: Ditolak. {avatarModerationReason || 'Silakan upload ulang.'}
            </div>
          )}
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} aria-label="Upload foto profil" title="Pilih file foto profil" />
      </div>
      <div ref={statusRef} className={cx('space-y-4 p-4 sm:p-5 border border-[color:var(--profile-border)]', themeConfig.shadow, surfaceStrongClass)} style={{ borderRadius: 'var(--profile-radius)' }}>
        <h3 className={typography.label}>Informasi Status</h3>
        <StatusRow label="Biodata" typography={typography} complete={student?.biodata_complete ?? lecturer?.biodata_complete ?? true} subtitle={(student?.biodata_complete ?? lecturer?.biodata_complete) ? 'Telah lengkap' : 'Belum lengkap'} />
        {isStudent && <StatusRow label="Alamat KTP" typography={typography} complete={!!student?.address_complete} subtitle={student?.address_complete ? 'Alamat tertulis lengkap' : 'Belum lengkap'} />}
        {isStudent && <div className="grid grid-cols-3 gap-3 border-t border-[color:var(--profile-border)] pt-3"><div className="rounded-lg bg-[color:var(--profile-stat)] p-3 text-center transition-colors"><p className="text-lg font-bold text-[color:var(--profile-text)]">{student?.gpa ?? '-'}</p><p className={`${typography.meta} text-[color:var(--profile-muted)]`}>IPK</p></div><div className="rounded-lg bg-[color:var(--profile-stat)] p-3 text-center transition-colors"><p className="text-lg font-bold text-[color:var(--profile-text)]">{student?.sks_completed ?? 0}</p><p className={`${typography.meta} text-[color:var(--profile-muted)]`}>SKS</p></div><div className="rounded-lg bg-[color:var(--profile-stat)] p-3 text-center transition-colors"><p className={`text-sm font-bold ${(student as Record<string, unknown>)?.status_bta_ppi === 'LULUS' ? 'text-emerald-600' : 'text-amber-600'}`}>{((student as Record<string, unknown>)?.status_bta_ppi as string) ?? '-'}</p><p className={`${typography.meta} text-[color:var(--profile-muted)]`}>Status BTA PPI</p></div></div>}
        <div className={`space-y-1 border-t border-[color:var(--profile-border)] pt-2 ${typography.meta} text-[color:var(--profile-muted)]`}><div className="flex items-center gap-1.5"><GraduationCap size={13} />{student?.faculty?.nama || lecturer?.faculty?.nama || user.faculty?.nama || 'Fakultas belum diatur'}</div>{student?.prodi?.nama && <div className="flex items-center gap-1.5"><IdCard size={13} />{student.prodi.nama}</div>}{lecturer?.jabatan && <div className="flex items-center gap-1.5 italic"><Medal size={13} />{lecturer.jabatan}</div>}</div>
        {isLecturer && <div className="rounded-lg bg-[color:var(--profile-soft)] p-3 transition-colors"><div className="mb-2 flex items-center gap-2"><BadgeCheck size={14} className={accentTextClass} /><span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--profile-soft-text)]">Kualifikasi DPL</span></div><div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold"><span className={lecturer?.is_cpns ? 'rounded bg-[color:var(--profile-warning)] px-2 py-1 text-[color:var(--profile-warning-text)]' : 'rounded bg-[color:var(--profile-soft)] px-2 py-1 text-[color:var(--profile-soft-text)]'}>{lecturer?.is_cpns ? 'CPNS' : 'PNS/TETAP'}</span><span className={lecturer?.is_tugas_belajar ? 'rounded bg-[color:var(--profile-danger)] px-2 py-1 text-[color:var(--profile-danger-text)]' : 'rounded bg-blue-100/10 px-2 py-1 text-blue-700 dark:text-blue-300'}>{lecturer?.is_tugas_belajar ? 'TUGAS BELAJAR' : 'AKTIF'}</span></div></div>}
      </div>
    </div>
  );
}

function StudentAddressSection({ register, errors, isEditing, typography }: StudentAddressSectionProps) {
  return (
    <section className="space-y-4 border-t border-[color:var(--profile-border)] pt-5">
      <div className="space-y-1">
        <h2 className={`${typography.label} text-[color:var(--profile-text)]`}>Alamat Asli sesuai KTP</h2>
        <p className={`${typography.meta} text-[color:var(--profile-muted)]`}>Isi alamat asli sesuai KTP, bukan alamat kos atau alamat tinggal sementara. Alamat tertulis ini menjadi acuan utama data profil.</p>
      </div>
      <TextArea label="Alamat Lengkap sesuai KTP" registration={register('address')} disabled={!isEditing} error={errors.address?.message} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><TextInput label="Desa/Kelurahan KTP" registration={register('address_village_name')} disabled={!isEditing} /><TextInput label="Kecamatan KTP" registration={register('address_district_name')} disabled={!isEditing} /><TextInput label="Kabupaten/Kota KTP" registration={register('address_regency_name')} disabled={!isEditing} /><TextInput label="Kode Pos KTP" registration={register('address_postal_code')} disabled={!isEditing} /></div>
      <input type="hidden" {...register('address_lat', { valueAsNumber: true })} />
      <input type="hidden" {...register('address_lng', { valueAsNumber: true })} />
    </section>
  );
}

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, fetchUser, clearUser, setUser } = useAuthStore();
  const { theme, setTheme, config: themeConfig, typography, surfaceClass, surfaceStrongClass } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<{ student: StudentProfile | null; lecturer: LecturerProfile | null; pending: ChangeRequest | null } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [forwardGeocoding, setForwardGeocoding] = useState(false);
  const lastMapSyncedQueryRef = useRef('');
  const tutorialTargets = useRef<Record<TutorialTarget, HTMLElement | null>>({ intro: null, theme: null, avatar: null, status: null, form: null });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const vars = themeConfig.vars as Record<string, string>;
    Object.entries(vars).forEach(([key, value]) => el.style.setProperty(key, value));
    el.style.background = themeConfig.backdrop;
  }, [themeConfig]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting, isDirty } } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  const student = profileData?.student ?? null;
  const lecturer = profileData?.lecturer ?? null;
  const pendingRequest = profileData?.pending ?? null;
  const roles = user?.roles ?? [];
  const isStudent = !!student;
  const isLecturer = !!lecturer;
  const externalProfile = student?.external_profile ?? null;
  const isExternalStudent = !!externalProfile;
  const addressValue = watch('address');
  const addressLat = watch('address_lat');
  const addressLng = watch('address_lng');
  const villageValue = watch('address_village_name');
  const districtValue = watch('address_district_name');
  const regencyValue = watch('address_regency_name');
  const postalCodeValue = watch('address_postal_code');

  const setTutorialTargetRef = (target: TutorialTarget) => (node: HTMLElement | null) => {
    tutorialTargets.current[target] = node;
  };

  const changeTheme = (nextTheme: ThemeKey) => {
    setTheme(nextTheme);
  };

  const handleAddressPointChange = async (point: { lat: number; lng: number }) => {
    setValue('address_lat', point.lat, { shouldDirty: true });
    setValue('address_lng', point.lng, { shouldDirty: true });
    setReverseGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}&zoom=18&addressdetails=1`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json() as { display_name?: string; address?: ReverseGeocodeAddress };
      const address = data.address ?? {};
      // Do not overwrite user's manual KTP address from reverse geocode.
      // Logistics-style: manual address = truth; pin/geocode = delivery aid.
      const nextAddress = addressValue || composeAddress(data.display_name, address);
      const nextVillage = cleanAdminName(address.village || address.suburb || address.neighbourhood || address.town);
      const nextDistrict = cleanAdminName(address.municipality || address.county || address.state_district);
      const nextRegency = cleanAdminName(address.city || address.county || address.state_district);
      const nextPostalCode = address.postcode ?? '';

      if (!addressValue) setValue('address', nextAddress, { shouldDirty: true });
      setValue('address_village_name', nextVillage, { shouldDirty: true });
      setValue('address_district_name', nextDistrict, { shouldDirty: true });
      setValue('address_regency_name', nextRegency, { shouldDirty: true });
      setValue('address_postal_code', nextPostalCode, { shouldDirty: true });
      lastMapSyncedQueryRef.current = buildAddressQueries({
        fullAddress: nextAddress,
        village: nextVillage,
        district: nextDistrict,
        regency: nextRegency,
        postalCode: nextPostalCode,
      })[0] ?? '';
      toast.success('Titik peta tersimpan. Alamat manual tidak diubah.');
    } catch {
      toast.warning('Titik tersimpan. Alamat otomatis gagal dibaca, silakan lengkapi manual.');
    } finally {
      setReverseGeocoding(false);
    }
  };

  const syncMapFromAddress = async () => {
    const queries = buildAddressQueries({
      fullAddress: addressValue,
      village: villageValue,
      district: districtValue,
      regency: regencyValue,
      postalCode: postalCodeValue,
    });
    const primaryQuery = queries[0];

    if (!primaryQuery) {
      toast.warning('Lengkapi alamat KTP terlebih dahulu sebelum mencari titik peta.');
      return;
    }
    if (primaryQuery === lastMapSyncedQueryRef.current && typeof addressLat === 'number' && typeof addressLng === 'number') {
      return;
    }

    setForwardGeocoding(true);
    try {
      let bestResult: ForwardGeocodeResult | null = null;
      let matchedQuery = '';

      for (const query of queries) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=id&limit=5&q=${encodeURIComponent(query)}`, {
          headers: { Accept: 'application/json', 'Accept-Language': 'id,en' },
        });
        if (!response.ok) throw new Error('Forward geocoding failed');
        const results = await response.json() as ForwardGeocodeResult[];
        const candidate = pickBestForwardGeocodeResult(results, query);
        if (candidate) {
          bestResult = candidate;
          matchedQuery = query;
          break;
        }
      }

      if (!bestResult) throw new Error('Location not found');
      setValue('address_lat', Number(bestResult.lat), { shouldDirty: true });
      setValue('address_lng', Number(bestResult.lon), { shouldDirty: true });
      lastMapSyncedQueryRef.current = matchedQuery;
      toast.success('Peta alamat KTP disesuaikan dari alamat terdekat');
    } catch {
      toast.warning('Lokasi tidak ditemukan dari alamat. Lengkapi alamat lebih detail atau pilih titik pada peta.');
    } finally {
      setForwardGeocoding(false);
    }
  };

  const _closeTutorial = () => {
    try { window.localStorage.setItem(profileTutorialKey(user), '1'); } catch { /* private browsing */ }
    setShowTutorial(false);
  };

  useEffect(() => {
    if (!showTutorial) return;
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      animate: true,
      overlayOpacity: 0.72,
      stagePadding: 12,
      stageRadius: 18,
      nextBtnText: 'Lanjut',
      prevBtnText: 'Kembali',
      doneBtnText: 'Selesai',
      popoverClass: 'sibermas-profile-tour',
      onDestroyed: () => {
        try { window.localStorage.setItem(profileTutorialKey(user), '1'); } catch { /* private browsing */ }
        setShowTutorial(false);
      },
      steps: PROFILE_TUTORIAL_STEPS.map((step) => ({
        element: tutorialTargets.current[step.target] ?? undefined,
        popover: {
          title: step.title,
          description: step.body,
          side: step.placement === 'bottom-right' ? 'bottom' : step.placement === 'center' ? 'bottom' : step.placement,
          align: step.placement === 'bottom-right' ? 'end' : 'center',
        },
      })),
    });
    const start = window.setTimeout(() => driverObj.drive(), 120);
    return () => {
      window.clearTimeout(start);
      driverObj.destroy();
    };
  }, [showTutorial, user]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) router.replace('/login');
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user) return;
    profileApi.get().then((res: unknown) => {
      const r = res as { student?: StudentProfile; lecturer?: LecturerProfile; user?: { phone?: string; address?: string; address_village_name?: string; address_district_name?: string; address_regency_name?: string; address_postal_code?: string; address_verified_at?: string; address_lat?: number; address_lng?: number; mahasiswa?: StudentProfile; dosen?: LecturerProfile }; pending_change_request?: ChangeRequest };
      const nextStudent = r?.student ?? r?.user?.mahasiswa ?? null;
      const nextLecturer = r?.lecturer ?? r?.user?.dosen ?? null;
      setProfileData({ student: nextStudent, lecturer: nextLecturer, pending: r?.pending_change_request ?? null });
      reset({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: (r?.user?.phone ?? (user as unknown as { phone?: string }).phone ?? '') as string,
        address: (r?.user?.address ?? (user as unknown as { address?: string }).address ?? '') as string,
        address_village_name: (r?.user?.address_village_name ?? (user as unknown as { address_village_name?: string }).address_village_name ?? '') as string,
        address_district_name: (r?.user?.address_district_name ?? (user as unknown as { address_district_name?: string }).address_district_name ?? '') as string,
        address_regency_name: (r?.user?.address_regency_name ?? (user as unknown as { address_regency_name?: string }).address_regency_name ?? '') as string,
        address_postal_code: (r?.user?.address_postal_code ?? (user as unknown as { address_postal_code?: string }).address_postal_code ?? '') as string,
        address_verified: !!r?.user?.address_verified_at,
        address_lat: r?.user?.address_lat != null ? Number(r.user.address_lat) : null,
        address_lng: r?.user?.address_lng != null ? Number(r.user.address_lng) : null,
        nik: (nextStudent?.nik as string) ?? '',
        mother_name: (nextStudent?.mother_name as string) ?? '',
        gender: ((nextStudent?.gender ?? nextLecturer?.gender) as '' | 'L' | 'P') ?? '',
        shirt_size: ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', ''].includes((nextStudent?.shirt_size as string) ?? '') ? ((nextStudent?.shirt_size as '' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | '4XL' | '5XL') ?? '') : '',
        birth_place: ((nextStudent?.birth_place ?? nextLecturer?.tempat_lahir) as string) ?? '',
        birth_date: ((nextStudent?.birth_date ?? nextLecturer?.birth_date) as string) ?? '',
        external_faculty: (nextStudent?.external_profile?.external_faculty as string) ?? '',
        external_study_program: (nextStudent?.external_profile?.external_study_program as string) ?? '',
        nama_gelar: (nextLecturer?.nama_gelar as string) ?? '',
        nidn: (nextLecturer?.nidn as string) ?? '',
        dosen_nik: (nextLecturer?.nik as string) ?? '',
        jabatan: (nextLecturer?.jabatan as string) ?? '',
        kelas_jabatan: (nextLecturer?.kelas_jabatan as string) ?? '',
        tugas_tambahan: (nextLecturer?.tugas_tambahan as string) ?? '',
        golongan: (nextLecturer?.golongan as string) ?? '',
        pangkat: (nextLecturer?.pangkat as string) ?? '',
        no_rekening: (nextLecturer?.no_rekening as string) ?? '',
        nama_bank: (nextLecturer?.nama_bank as string) ?? '',
        npwp: (nextLecturer?.npwp as string) ?? '',
        dosen_alamat: (nextLecturer?.alamat as string) ?? '',
      });
    }).catch(() => toast.error('Gagal memuat profil'));
  }, [user, reset]);

  const missingFields = useMemo(() => {
    if (student) return [...(student.missing_biodata_fields ?? []), ...(student.missing_address_fields ?? [])];
    if (lecturer) return lecturer.missing_biodata_fields ?? [];
    return [];
  }, [student, lecturer]);
  const profileComplete = missingFields.length === 0;

  useEffect(() => {
    if (!profileData || !user || profileComplete) return;
    if (!window.localStorage.getItem(profileTutorialKey(user))) {
      setShowTutorial(true);
    }
  }, [profileData, profileComplete, user]);

  useEffect(() => {
    if (profileData && !profileComplete) setIsEditing(true);
  }, [profileData, profileComplete]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      const payload = { ...(data as unknown as Record<string, unknown>) };
      const updateRes = await profileApi.update(payload) as { map_fields_updated?: string[] } | null;
      setIsEditing(false);

      let successMessage = profileComplete
        ? 'Permintaan perubahan profil dikirim. Menunggu persetujuan admin.'
        : 'Profil berhasil disimpan. Pastikan semua data sudah valid.';
      let complete = profileComplete;

      try {
        const res = await profileApi.get() as unknown as { student?: StudentProfile; lecturer?: LecturerProfile; pending_change_request?: ChangeRequest; profile_complete?: boolean; user?: { biodata_complete?: boolean; address_complete?: boolean } };
        setProfileData({ student: res?.student ?? null, lecturer: res?.lecturer ?? null, pending: res?.pending_change_request ?? null });

        if (res?.pending_change_request) {
          successMessage = 'Permintaan perubahan profil dikirim. Menunggu persetujuan admin.';
        } else if (Array.isArray(updateRes?.map_fields_updated) && updateRes.map_fields_updated.length > 0) {
          successMessage = 'Titik peta dan metadata alamat berhasil diperbarui.';
        } else if (profileComplete) {
          successMessage = 'Perubahan profil berhasil disimpan.';
        }

        complete = !!res?.profile_complete || !!(res?.student?.biodata_complete && res?.student?.address_complete) || !!res?.lecturer?.biodata_complete;
      } catch {
        if (Array.isArray(updateRes?.map_fields_updated) && updateRes.map_fields_updated.length > 0) {
          successMessage = 'Titik peta berhasil diperbarui. Profil terbaru belum sempat dimuat ulang.';
        } else if (profileComplete) {
          successMessage = 'Perubahan profil tersimpan. Profil terbaru belum sempat dimuat ulang.';
        } else {
          successMessage = 'Profil tersimpan. Pastikan semua data sudah valid.';
        }
      }

      toast.success(successMessage);
      await fetchUser(true);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
      setProfileCompleteCookie(complete);
      if (complete) {
        const freshUser = useAuthStore.getState().user;
        toast.success('Profil lengkap. Mengarahkan ke dashboard...');
        router.replace(dashboardPathFor(freshUser?.roles ?? []));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { errors?: Record<string, string[]>; message?: string } } } };
      const apiErrors = e?.response?.data?.error?.errors;
      const firstField = apiErrors ? Object.keys(apiErrors)[0] : null;
      toast.error(firstField ? (apiErrors?.[firstField]?.[0] ?? 'Data belum valid.') : (e?.response?.data?.error?.message || 'Gagal mengirim permintaan'));
      if (firstField) focusProfileField(firstField);
    }
  };

  const onSubmitInvalid = (formErrors: Record<string, unknown>) => {
    const firstField = Object.keys(formErrors)[0];
    toast.error(firstField ? `Data belum valid: ${FIELD_LABELS[firstField] ?? firstField}` : 'Masih ada data yang belum valid.');
    if (firstField) focusProfileField(firstField);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sanity check only — format & size. Konten (background merah, jas almamater,
    // pose formal, wajah) divalidasi oleh AI di server (Layer 3 PRD_AVATAR_VALIDATION.md).
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Format foto harus JPG atau PNG.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2 MB.');
      e.target.value = '';
      return;
    }

    // Optimistic preview: show the picked file immediately via a local blob URL
    // so the user sees the new avatar the moment they pick it, not after the
    // upload completes.
    const previewUrl = URL.createObjectURL(file);
    const prevAvatarUrl = user?.avatar_url;
    if (user) {
      setUser({ ...user, avatar_url: previewUrl });
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarLoading(true);

    let uploadSucceeded = false;
    let moderationStatus: 'approved' | 'pending' | null = null;
    let moderationReason: string | null = null;

    try {
      // Step 1: the actual upload. Only a throw HERE means the upload failed.
      const uploadRes = await profileApi.updateAvatar(formData) as unknown as Record<string, unknown> & { data?: Record<string, unknown> };
      uploadSucceeded = true;
      moderationStatus = ((uploadRes?.data?.moderation_status ?? uploadRes?.moderation_status) as 'approved' | 'pending' | null) ?? null;
      moderationReason = ((uploadRes?.data?.moderation_reason ?? uploadRes?.moderation_reason) as string | null | undefined)?.trim() || null;
    } catch (error: unknown) {
      // R-008 fix: only rollback the preview when the UPLOAD itself failed.
      if (user) {
        setUser({ ...user, avatar_url: prevAvatarUrl });
      }
      const apiErr = error as { response?: { data?: { errors?: { avatar?: string[]; message?: string }; message?: string } } };
      const apiMessage = apiErr?.response?.data?.errors?.avatar?.[0] || apiErr?.response?.data?.message;
      toast.error(apiMessage || 'Gagal mengunggah foto profil');
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 2000);
      setAvatarLoading(false);
      e.target.value = '';
      return;
    }

    // Step 2: refresh the user + profile. These are best-effort — the photo
    // is already saved, so failures here must not roll back the preview.
    try {
      await fetchUser(true);
      const freshUser = useAuthStore.getState().user;
      if (freshUser && freshUser.avatar_url) {
        const base = freshUser.avatar_url.split('?')[0];
        setUser({ ...freshUser, avatar_url: `${base}?v=${Date.now()}` });
      }

      const res = await profileApi.get() as unknown as Record<string, unknown>;
      setProfileData({ student: (res?.student as StudentProfile) ?? null, lecturer: (res?.lecturer as LecturerProfile) ?? null, pending: (res?.pending_change_request as ChangeRequest) ?? null });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    } catch {
      // Don't revert — the file is saved server-side. Just warn.
      toast.warning('Foto sudah terunggah, tetapi data profil gagal dimuat ulang. Segarkan halaman untuk sinkron.');
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 2000);
      setAvatarLoading(false);
      e.target.value = '';
    }

    if (uploadSucceeded) {
      if (moderationStatus === 'pending') {
        const pendingMessage = moderationReason || 'Sedang diverifikasi otomatis oleh sistem.';
        const manualReview = /server ai tidak tersedia|menunggu verifikasi admin|manual/i.test(pendingMessage);

        if (manualReview) {
          toast.warning(`Foto terunggah. ${pendingMessage}`);
        } else {
          toast.message(`Foto terunggah. ${pendingMessage}`);
        }
      } else {
        toast.success('Foto profil diperbarui');
      }
    }
  };

  const handleLogout = async () => {
    try { await (await import('@/lib/api')).authApi.logout(); } catch { /* noop */ }
    clearUser();
    router.replace('/');
  };

  if (isLoading || !isAuthenticated || !user || !profileData) {
    return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div ref={rootRef} className={`relative min-h-screen overflow-hidden px-3 py-6 pb-12 sm:px-4 sm:py-8 text-[color:var(--profile-text)] transition-all duration-700 ease-out ${typography.page}`}>
      <style jsx global>{TOUR_CSS}</style>
      {themeConfig.useParticles && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-[180px] mix-blend-screen animate-pulse [animation-duration:15s]" />
          <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] mix-blend-screen" />
        </div>
      )}
      {!themeConfig.useParticles && (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-45 mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_34%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.09)_42%,transparent_62%)] opacity-70 mix-blend-screen" />
        </>
      )}
      {themeConfig.useParticles && (
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-45 mix-blend-screen">
          <ParticleBackground />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/10 to-transparent opacity-80" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[color:var(--profile-accent)]/10 blur-3xl transition-colors duration-700" />
      <div className="pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-[color:var(--profile-primary)]/10 blur-3xl transition-colors duration-700" />
      <div className="relative z-10 mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <ProfileHeader
        refTarget={setTutorialTargetRef('intro')}
        themeRef={setTutorialTargetRef('theme')}
        theme={theme}
        typography={typography}
        themeConfig={themeConfig}
        surfaceClass={surfaceClass}
        isLecturer={isLecturer}
        profileComplete={profileComplete}
        profileStatusKnown={!!profileData}
        isEditing={isEditing}
        pendingRequest={pendingRequest}
        onThemeChange={changeTheme}
        onDashboard={() => router.push(dashboardPathFor(roles))}
        onToggleEdit={() => setIsEditing((v) => !v)}
        onLogout={handleLogout}
      />

      {pendingRequest && profileComplete && pendingRequest.status !== 'approved' && (
        <div className={cx('rounded-xl border border-[color:var(--profile-border)] p-4 text-sm shadow-sm transition-colors duration-500', pendingRequest.status === 'rejected' ? 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)]' : 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)]')}>
          {pendingRequest.status === 'rejected' ? (
            <>Permintaan perubahan profil ditolak. Alasan: <strong>{pendingRequest.rejection_reason || 'Tidak ada alasan.'}</strong></>
          ) : (
            <>Permintaan perubahan profil sedang menunggu persetujuan admin.</>
          )}
        </div>
      )}
      {missingFields.length > 0 && <div className="flex gap-3 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-4 shadow-sm transition-colors duration-500"><AlertCircle size={18} className="mt-0.5 shrink-0 text-[color:var(--profile-warning-text)]" /><p className="text-sm text-[color:var(--profile-warning-text)]">Tahap awal wajib review dan melengkapi data berikut: <strong>{missingFields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}</strong>. Pengisian awal disimpan langsung, edit setelah lengkap akan menunggu approval admin.</p></div>}
 
       <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
         <ProfileSidebar
           avatarRef={setTutorialTargetRef('avatar')}
           statusRef={setTutorialTargetRef('status')}
           avatarInputRef={avatarInputRef}
           user={user}
           student={student}
           lecturer={lecturer}
           isStudent={isStudent}
           isLecturer={isLecturer}
           avatarLoading={avatarLoading}
           typography={typography}
           themeConfig={themeConfig}
           surfaceStrongClass={surfaceStrongClass}
           onAvatarChange={handleAvatarChange}
         />
 
         <div className="lg:col-span-2">
           <form ref={setTutorialTargetRef('form')} onSubmit={handleSubmit(onSubmit, onSubmitInvalid)} className={cx('space-y-4 p-4 sm:space-y-6 sm:p-6 border border-[color:var(--profile-border)]', themeConfig.shadow, surfaceClass)} style={{ borderRadius: 'var(--profile-radius)' }}>
             <section className="space-y-4">
               <h2 className={`flex items-center gap-2 ${typography.label} text-[color:var(--profile-text)]`}><IdCard size={16} /> Data Pribadi & Kontak</h2>
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <TextInput label="Email Sistem" registration={register('email')} disabled={!isEditing} error={errors.email?.message} />
                 <TextInput label="Nama Lengkap" registration={register('name')} disabled={!isEditing} error={errors.name?.message} />
                 <TextInput label="Nomor HP / WA" registration={register('phone')} disabled={!isEditing} error={errors.phone?.message} />
                 {isStudent && <TextInput label="NIK (KTP)" registration={register('nik')} disabled={!isEditing} error={errors.nik?.message} />}
                 {isLecturer && <TextInput label="NIP / NIDN" value={(lecturer?.nip as string) ?? '-'} disabled />}
                 {isStudent && <TextInput label="Nama Ibu Kandung" registration={register('mother_name')} disabled={!isEditing} error={errors.mother_name?.message} />}
                 {isStudent && <TextInput label="Tempat Lahir" registration={register('birth_place')} disabled={!isEditing} error={errors.birth_place?.message} />}
                 <TextInput label="Tanggal Lahir" type="date" registration={register('birth_date')} disabled={!isEditing} error={errors.birth_date?.message} />
                 <SelectInput label="Jenis Kelamin" registration={register('gender')} disabled={!isEditing} options={[['', 'Pilih'], ['L', 'Laki-laki'], ['P', 'Perempuan']]} error={errors.gender?.message} />
                 {isStudent && <SelectInput label="Ukuran Baju / Jaket" registration={register('shirt_size')} disabled={!isEditing} options={SHIRT_SIZE_OPTIONS} error={errors.shirt_size?.message} />}
               </div>
             </section>
 
             {isExternalStudent && <section className="space-y-4 border-t border-[color:var(--profile-border)] pt-5"><h2 className={`flex items-center gap-2 ${typography.label} text-[color:var(--profile-text)]`}><GraduationCap size={16} /> Data Kampus Asal</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><TextInput label="NIM Asal" value={externalProfile?.external_nim ?? '-'} disabled /><TextInput label="Kampus Asal" value={externalProfile?.home_university ?? '-'} disabled /><TextInput label="Fakultas Asal" registration={register('external_faculty')} disabled={!isEditing} error={errors.external_faculty?.message} /><TextInput label="Prodi Asal" registration={register('external_study_program')} disabled={!isEditing} error={errors.external_study_program?.message} /></div><div className={`flex gap-3 rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] p-4 text-[color:var(--profile-soft-text)] transition-colors ${typography.meta}`}><Info size={18} className="shrink-0" />Jika data sudah terisi dari import, cukup cek. Jika kosong atau salah, lengkapi/perbaiki di sini.</div></section>}
 
             {isStudent && <StudentAddressSection register={register} errors={errors} isEditing={isEditing} typography={typography} />}
 
             {isLecturer && <section className="space-y-4 border-t border-[color:var(--profile-border)] pt-5"><h2 className={`${typography.label} text-[color:var(--profile-text)]`}>Data Kepegawaian, Keuangan & Pajak</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><TextInput label="Nama Bergelar" registration={register('nama_gelar')} disabled={!isEditing} /><TextInput label="NIDN" registration={register('nidn')} disabled={!isEditing} /><TextInput label="NIK Dosen" registration={register('dosen_nik')} disabled={!isEditing} /><TextInput label="Jabatan Fungsional" registration={register('jabatan')} disabled={!isEditing} /><TextInput label="Kelas Jabatan" registration={register('kelas_jabatan')} disabled={!isEditing} /><TextInput label="Tugas Tambahan" registration={register('tugas_tambahan')} disabled={!isEditing} /><TextInput label="Golongan" registration={register('golongan')} disabled={!isEditing} /><TextInput label="Pangkat" registration={register('pangkat')} disabled={!isEditing} /><TextArea label="Alamat Dosen" registration={register('dosen_alamat')} disabled={!isEditing} /><TextInput label="No. Rekening" registration={register('no_rekening')} disabled={!isEditing} /><TextInput label="Nama Bank" registration={register('nama_bank')} disabled={!isEditing} /><TextInput label="NPWP" registration={register('npwp')} disabled={!isEditing} /><TextInput label="Status Aktif" value={(lecturer?.status_aktif as string) ?? '-'} disabled /><TextInput label="Status Pegawai" value={(lecturer?.status_pegawai as string) ?? '-'} disabled /><TextInput label="Workshop DPL" value={lecturer?.has_workshop ? `Sudah (${(lecturer?.workshop_date as string) ?? '-'})` : 'Belum'} disabled /></div><div className={`flex gap-3 rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] p-4 text-[color:var(--profile-soft-text)] transition-colors ${typography.meta}`}><Info size={18} className="shrink-0" />Kolom yang tidak relevan untuk proses KKN seperti tanggal pensiun dan pendidikan terakhir tidak ditampilkan. Pengisian awal disimpan langsung; perubahan setelah profil lengkap menunggu persetujuan admin.</div></section>}
 
             {isEditing && <button type="submit" disabled={isSubmitting || !isDirty || (!!pendingRequest && pendingRequest.status === 'pending' && profileComplete)} className={cx('flex h-11 w-full items-center justify-center gap-2 rounded-lg px-6 disabled:opacity-50 sm:w-auto', typography.button, primaryClass)}>{isSubmitting ? 'Menyimpan...' : profileComplete ? 'Ajukan Perubahan' : 'Simpan & Lanjutkan'}<Save size={16} /></button>}
           </form>
 
           <div className="mt-4 sm:mt-6">
             {/* NotificationPreferencesCard hidden — managed via admin dashboard */}
             <TwoFactorCard />
           </div>
         </div>
       </div>
       </div>
     </div>
   );
 }

function TextInput({ label, registration, value, type = 'text', step, disabled, error }: { label: string; registration?: Record<string, unknown>; value?: string; type?: string; step?: string; disabled?: boolean; error?: string }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium text-[color:var(--profile-text)]">{label}</label><input type={type} step={step} {...registration} value={registration ? undefined : value} disabled={disabled} className={cx('h-10 w-full rounded-lg border px-3 text-sm tracking-[-0.01em]', fieldClass)} />{error && <p className="text-xs text-rose-600">{error}</p>}</div>;
}

function TextArea({ label, registration, disabled, error }: { label: string; registration?: Record<string, unknown>; disabled?: boolean; error?: string }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium text-[color:var(--profile-text)]">{label}</label><textarea {...registration} disabled={disabled} rows={3} className={cx('w-full rounded-lg border px-3 py-2 text-sm leading-6 tracking-[-0.01em]', fieldClass)} />{error && <p className="text-xs text-rose-600">{error}</p>}</div>;
}

function SelectInput({ label, registration, disabled, options, error }: { label: string; registration?: Record<string, unknown>; disabled?: boolean; options: string[][]; error?: string }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium text-[color:var(--profile-text)]">{label}</label><select {...registration} disabled={disabled} className={cx('h-10 w-full rounded-lg border px-3 text-sm tracking-[-0.01em]', fieldClass)}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{error && <p className="text-xs text-rose-600">{error}</p>}</div>;
}
