'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * ProfileIncompleteGuard
 * 
 * Mounted inside (student) layout. On every navigation / mount it
 * re-checks the backend for real-time profile_complete status.
 * If incomplete → shows a blocking modal that cannot be dismissed
 * and forces the user to complete their profile.
 */
export function ProfileIncompleteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [incomplete, setIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

  const FIELD_LABELS: Record<string, string> = {
    avatar: 'Foto Formal / Foto Profil',
    phone: 'Nomor HP / WhatsApp',
    profile_required: 'Lengkapi data wajib di halaman profil',
    address: 'Alamat KTP / Domisili',
    address_village_name: 'Kelurahan/Desa',
    address_district_name: 'Kecamatan',
    address_regency_name: 'Kabupaten/Kota',
    nik: 'NIK',
    mother_name: 'Nama Ibu Kandung',
    birth_place: 'Tempat Lahir',
    birth_date: 'Tanggal Lahir',
    gender: 'Jenis Kelamin',
    shirt_size: 'Ukuran Kaos',
    marital_status: 'Status Pernikahan',
  };

  const checkProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    // Skip for non-student roles
    if (user.roles?.includes('superadmin') || user.roles?.includes('dosen') || user.roles?.includes('dpl')) {
      setChecking(false);
      return;
    }
    // Skip if already on profile page
    if (pathname === '/profil') {
      setChecking(false);
      return;
    }

    try {
      const { api } = await import('@/lib/api');
      const data = await api.get('/profile') as {
        profile_complete?: boolean;
        student?: {
          missing_biodata_fields?: string[];
          missing_address_fields?: string[];
        };
        lecturer?: {
          missing_biodata_fields?: string[];
        };
      };
      const isComplete = !!data?.profile_complete;

      if (!isComplete) {
        const bioMissing = data?.student?.missing_biodata_fields ?? data?.lecturer?.missing_biodata_fields ?? [];
        const addrMissing = data?.student?.missing_address_fields ?? [];
        const combined = [...bioMissing, ...addrMissing];
        setMissingFields(combined.length > 0 ? combined : ['profile_required']);
        setIncomplete(true);
      } else {
        setIncomplete(false);
        setMissingFields([]);
      }
    } catch {
      // If API fails, don't block — fail open
      setIncomplete(false);
    } finally {
      setChecking(false);
    }
  }, [isAuthenticated, user, pathname]);

  useEffect(() => {
    setChecking(true);
    checkProfile();
  }, [checkProfile, pathname]);

  // Don't show anything while checking or if complete
  if (checking || !incomplete) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-2xl border border-amber-200 bg-white shadow-2xl dark:border-amber-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-4 rounded-t-2xl dark:border-amber-900 dark:bg-amber-950/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Profil Belum Lengkap
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Lengkapi data profil untuk mengakses dashboard
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Sistem mendeteksi data wajib profil Anda belum lengkap. Lengkapi item di bawah ini pada halaman Profil agar akses dashboard dan pendaftaran tidak tertahan.
            </p>

            {missingFields.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Form/data yang wajib dilengkapi:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(missingFields)].map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800"
                    >
                      {FIELD_LABELS[f] ?? f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4 rounded-b-2xl dark:border-slate-800">
            <button
              onClick={() => router.push('/profil')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-500 hover:to-emerald-500 hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98]"
            >
              Lengkapi Profil Sekarang
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
