'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Lock, Unlock, ShieldOff, Info } from 'lucide-react';

interface LocksPayload {
  mahasiswa_id: number;
  nim: string | null;
  nama: string | null;
  has_ever_been_in_kkn: boolean;
  is_unlockable: boolean;
  locked_fields: string[];
  user_locked_fields: string[];
}

interface UnlockSuccessPayload {
  remaining_mahasiswa_locks: string[];
  remaining_user_locks: string[];
}

export default function MahasiswaDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const mahasiswaId = Number(id);
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isSuperadmin = (user?.roles ?? []).includes('superadmin');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'mahasiswa', mahasiswaId],
    queryFn: async () => {
      const res = await api.get(`/admin/mahasiswa/${mahasiswaId}`);
      return (res as { data?: unknown })?.data ?? res;
    },
    enabled: Number.isFinite(mahasiswaId) && mahasiswaId > 0,
  });

  const locksQuery = useQuery({
    queryKey: ['admin', 'mahasiswa', mahasiswaId, 'locks'],
    queryFn: async () => {
      const res = await adminApi.locks.mahasiswa(mahasiswaId) as unknown as { data?: LocksPayload };
      return (res?.data ?? res) as LocksPayload;
    },
    enabled: Number.isFinite(mahasiswaId) && mahasiswaId > 0,
  });

  const unlockMutation = useMutation({
    mutationFn: ({ field, scope }: { field: string; scope: 'mahasiswa' | 'user' }) =>
      adminApi.locks.unlockMahasiswaField(mahasiswaId, field, scope) as unknown as Promise<{ data: UnlockSuccessPayload }>,
    onSuccess: () => {
      toast.success('Lock field berhasil dibuka. Sinkronisasi berikutnya akan mengisi ulang dari SIAKAD.');
      qc.invalidateQueries({ queryKey: ['admin', 'mahasiswa', mahasiswaId, 'locks'] });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Gagal membuka lock.'));
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Mahasiswa tidak ditemukan</div>;

  const mhs = data as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Detail Mahasiswa</h1>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div><p className="text-xs text-slate-500">NIM</p><p className="font-semibold">{String(mhs.nim || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Nama</p><p className="font-semibold">{String(mhs.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">NIK</p><p className="font-semibold">{String(mhs.nik || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Fakultas</p><p className="font-semibold">{String((mhs.fakultas as Record<string, unknown>)?.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Prodi</p><p className="font-semibold">{String((mhs.prodi as Record<string, unknown>)?.nama || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Angkatan</p><p className="font-semibold">{String(mhs.batch_year || '-')}</p></div>
          <div><p className="text-xs text-slate-500">IPK</p><p className="font-semibold">{String(mhs.gpa || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Semester</p><p className="font-semibold">{String(mhs.semester || '-')}</p></div>
          <div><p className="text-xs text-slate-500">SKS</p><p className="font-semibold">{String(mhs.sks_completed || '-')}</p></div>
        </div>
      </div>

      {/* Data Terkunci / Field-lock panel */}
      <LocksPanel
        isLoading={locksQuery.isLoading}
        locks={locksQuery.data}
        isSuperadmin={isSuperadmin}
        onUnlock={(field, scope) => unlockMutation.mutate({ field, scope })}
        isUnlocking={unlockMutation.isPending}
      />
    </div>
  );
}

function LocksPanel({
  isLoading,
  locks,
  isSuperadmin,
  onUnlock,
  isUnlocking,
}: {
  isLoading: boolean;
  locks: LocksPayload | undefined;
  isSuperadmin: boolean;
  onUnlock: (field: string, scope: 'mahasiswa' | 'user') => void;
  isUnlocking: boolean;
}): React.JSX.Element {
  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />;
  }
  if (!locks) {
    return <></>;
  }

  const mahasiswaLocks = locks.locked_fields ?? [];
  const userLocks = locks.user_locked_fields ?? [];
  const totalLocks = mahasiswaLocks.length + userLocks.length;
  const frozen = locks.has_ever_been_in_kkn;
  const canUnlock = isSuperadmin && locks.is_unlockable;

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800">Data Terkunci</h3>
          <p className="text-xs text-slate-500 mt-1">
            Field yang sudah diedit oleh mahasiswa (onboarding) atau disetujui superadmin via
            Perubahan Profil. Field terkunci <strong>tidak akan ditimpa</strong> saat sinkronisasi SIAKAD berikutnya.
          </p>
        </div>
      </div>

      {frozen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
          <ShieldOff className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Record dibekukan — mahasiswa sudah pernah KKN.</p>
            <p className="mt-1">
              Snapshot data pada saat KKN wajib dipertahankan sebagai bukti peserta. Lock tidak dapat
              dibuka dan SIAKAD tidak akan memperbarui record ini lagi.
            </p>
          </div>
        </div>
      )}

      {totalLocks === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
          <Info size={13} />
          Belum ada field yang dikunci. Record masih sepenuhnya disinkron dari SIAKAD.
        </div>
      ) : (
        <>
          {mahasiswaLocks.length > 0 && (
            <LockList
              title="Field mahasiswa"
              fields={mahasiswaLocks}
              scope="mahasiswa"
              canUnlock={canUnlock}
              frozen={frozen}
              isUnlocking={isUnlocking}
              onUnlock={onUnlock}
            />
          )}
          {userLocks.length > 0 && (
            <LockList
              title="Field akun (user)"
              fields={userLocks}
              scope="user"
              canUnlock={canUnlock}
              frozen={frozen}
              isUnlocking={isUnlocking}
              onUnlock={onUnlock}
            />
          )}
        </>
      )}

      {!isSuperadmin && totalLocks > 0 && !frozen && (
        <p className="text-[11px] text-slate-400 italic">
          Hanya superadmin yang dapat membuka lock.
        </p>
      )}
    </div>
  );
}

function LockList({
  title,
  fields,
  scope,
  canUnlock,
  frozen,
  isUnlocking,
  onUnlock,
}: {
  title: string;
  fields: string[];
  scope: 'mahasiswa' | 'user';
  canUnlock: boolean;
  frozen: boolean;
  isUnlocking: boolean;
  onUnlock: (field: string, scope: 'mahasiswa' | 'user') => void;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <ul className="space-y-1.5">
        {fields.map((field) => (
          <li
            key={`${scope}-${field}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm font-mono text-slate-700">
              <Lock size={12} className="text-amber-500" />
              {field}
            </div>
            {canUnlock && !frozen && (
              <button
                onClick={() => onUnlock(field, scope)}
                disabled={isUnlocking}
                className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                title={`Buka lock ${field} (SIAKAD akan menimpa data ini pada sinkronisasi berikutnya)`}
              >
                <Unlock size={11} /> Buka lock
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: { message?: string }; message?: string } } }).response;
    const msg = resp?.data?.error?.message ?? resp?.data?.message;
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
