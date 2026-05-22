'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Lock, Unlock, ShieldOff, Info, ArrowLeft, User, GraduationCap, MapPin, FileText, Shield } from 'lucide-react';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

const LABEL: Record<string, string> = {
  nim: 'NIM', nama: 'Nama Lengkap', nik: 'NIK', mother_name: 'Nama Ibu Kandung',
  gender: 'Jenis Kelamin', birth_place: 'Tempat Lahir', birth_date: 'Tanggal Lahir',
  marital_status: 'Status Pernikahan', shirt_size: 'Ukuran Baju',
  phone: 'No. HP', alamat: 'Alamat', api_email: 'Email SIAKAD',
  batch_year: 'Angkatan', semester: 'Semester', sks_completed: 'SKS',
  gpa: 'IPK', status_bta_ppi: 'Status BTA/PPI', status_aktif: 'Status Aktif',
  is_paid_ukt: 'Lunas UKT', health_certificate_path: 'Surat Sehat',
  parent_permission_path: 'Izin Orang Tua', profile_completion: 'Kelengkapan Profil',
};

const GENDER_MAP: Record<string, string> = { L: 'Laki-laki', P: 'Perempuan' };

function fmt(key: string, val: unknown): string {
  if (val === null || val === undefined || val === '') return '-';
  if (key === 'gender') return GENDER_MAP[String(val)] ?? String(val);
  if (key === 'is_paid_ukt') return val ? 'Lunas' : 'Belum';
  if (key === 'profile_completion') return typeof val === 'number' ? `${val}%` : String(val);
  if (key === 'health_certificate_path' || key === 'parent_permission_path') return val ? 'Sudah diunggah' : 'Belum';
  return String(val);
}

export default function MahasiswaDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const mahasiswaId = Number(id);
  const qc = useQueryClient();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const isSuperadmin = (authUser?.roles ?? []).includes('superadmin');

  const { data, isLoading, isError } = useQuery({
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
      toast.success('Lock field berhasil dibuka.');
      qc.invalidateQueries({ queryKey: ['admin', 'mahasiswa', mahasiswaId, 'locks'] });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Gagal membuka lock.'));
    },
  });

  if (isLoading) return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
    </div>
  );

  if (isError || !data) return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-center">
      <p className="text-lg font-bold text-rose-700">Mahasiswa tidak ditemukan</p>
      <button onClick={() => router.back()} className="mt-4 rounded-xl bg-slate-200 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Kembali</button>
    </div>
  );

  const mhs = data as R;
  const fakultas = mhs.faculty as R | undefined;
  const prodi = mhs.prodi as R | undefined;
  const usr = mhs.user as R | undefined;
  const avatarUrl = usr?.avatar_url as string | undefined;

  const identitas = ['nim', 'nama', 'nik', 'mother_name', 'gender', 'birth_place', 'birth_date', 'marital_status', 'shirt_size'];
  const kontak = ['phone', 'alamat', 'api_email'];
  const akademik = ['batch_year', 'semester', 'sks_completed', 'gpa', 'status_bta_ppi', 'status_aktif', 'is_paid_ukt'];
  const dokumen = ['health_certificate_path', 'parent_permission_path', 'profile_completion'];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Header */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Profile header card */}
      <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={String(mhs.nama || 'Avatar')} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cyan-50 text-2xl font-black text-cyan-700">
              {String(mhs.nama || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{String(mhs.nama || '-')}</h1>
          <p className="mt-1 text-sm font-mono font-bold text-slate-500">{String(mhs.nim || '-')}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {prodi && <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700 ring-1 ring-cyan-200">{String(prodi.nama || '-')}</span>}
            {fakultas && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 ring-1 ring-indigo-200">{String(fakultas.nama || '-')}</span>}
            {mhs.status_aktif && <span className={`rounded-full px-2.5 py-1 font-black uppercase ${String(mhs.status_aktif).toUpperCase() === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>{String(mhs.status_aktif)}</span>}
          </div>
          {usr && (
            <p className="mt-2 text-xs text-slate-400">
              Akun: {String(usr.username || '-')} · {String(usr.email || '-')} · {usr.is_active ? 'Aktif' : 'Nonaktif'}
            </p>
          )}
        </div>
      </div>

      {/* Sections */}
      <Section icon={<User size={16} />} title="Identitas Pribadi" fields={identitas} data={mhs} />
      <Section icon={<MapPin size={16} />} title="Kontak & Alamat" fields={kontak} data={mhs} />
      <Section icon={<GraduationCap size={16} />} title="Data Akademik" fields={akademik} data={mhs} />
      <Section icon={<FileText size={16} />} title="Dokumen & Kelengkapan" fields={dokumen} data={mhs} />

      {/* KKN participation */}
      {Array.isArray((mhs.peserta as unknown[])) && (mhs.peserta as R[]).length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700"><Shield size={16} /> Riwayat KKN</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-black uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Kelompok</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(mhs.peserta as R[]).map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-semibold">{String((p.kelompok as R)?.nama || p.kelompok_id || '-')}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : p.status === 'approved' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-600'}`}>{String(p.status || '-')}</span></td>
                    <td className="px-3 py-2 text-xs text-slate-500">{p.joined_group_at ? String(p.joined_group_at).slice(0, 10) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Locks */}
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

function Section({ icon, title, fields, data }: { icon: React.ReactNode; title: string; fields: string[]; data: R }): React.JSX.Element {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">{icon} {title}</h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
        {fields.map((key) => (
          <div key={key}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{LABEL[key] || key}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{fmt(key, data[key])}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocksPanel({ isLoading, locks, isSuperadmin, onUnlock, isUnlocking }: {
  isLoading: boolean; locks: LocksPayload | undefined; isSuperadmin: boolean;
  onUnlock: (field: string, scope: 'mahasiswa' | 'user') => void; isUnlocking: boolean;
}): React.JSX.Element {
  if (isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />;
  if (!locks) return <></>;

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
            Field yang sudah diedit mahasiswa atau disetujui superadmin. Field terkunci <strong>tidak akan ditimpa</strong> saat sinkronisasi SIAKAD.
          </p>
        </div>
      </div>

      {frozen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
          <ShieldOff className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Record dibekukan — mahasiswa sudah pernah KKN.</p>
            <p className="mt-1">Snapshot data wajib dipertahankan sebagai bukti peserta.</p>
          </div>
        </div>
      )}

      {totalLocks === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
          <Info size={13} /> Belum ada field yang dikunci.
        </div>
      ) : (
        <>
          {mahasiswaLocks.length > 0 && <LockList title="Field mahasiswa" fields={mahasiswaLocks} scope="mahasiswa" canUnlock={canUnlock} frozen={frozen} isUnlocking={isUnlocking} onUnlock={onUnlock} />}
          {userLocks.length > 0 && <LockList title="Field akun (user)" fields={userLocks} scope="user" canUnlock={canUnlock} frozen={frozen} isUnlocking={isUnlocking} onUnlock={onUnlock} />}
        </>
      )}

      {!isSuperadmin && totalLocks > 0 && !frozen && (
        <p className="text-[11px] text-slate-400 italic">Hanya superadmin yang dapat membuka lock.</p>
      )}
    </div>
  );
}

function LockList({ title, fields, scope, canUnlock, frozen, isUnlocking, onUnlock }: {
  title: string; fields: string[]; scope: 'mahasiswa' | 'user'; canUnlock: boolean; frozen: boolean; isUnlocking: boolean;
  onUnlock: (field: string, scope: 'mahasiswa' | 'user') => void;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <ul className="space-y-1.5">
        {fields.map((field) => (
          <li key={`${scope}-${field}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-mono text-slate-700"><Lock size={12} className="text-amber-500" /> {LABEL[field] || field}</div>
            {canUnlock && !frozen && (
              <button onClick={() => onUnlock(field, scope)} disabled={isUnlocking}
                className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                title={`Buka lock ${field}`}
              ><Unlock size={11} /> Buka lock</button>
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
