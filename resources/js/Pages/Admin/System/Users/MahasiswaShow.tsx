import { Head, Link, router } from '@inertiajs/react';
import { GraduationCap, KeyRound, Lock, Unlock, ArrowLeft, CheckCircle2, XCircle, Users, MapPin, ClipboardList, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog } from '@/Components/ui';
import { useState } from 'react';

interface MahasiswaData {
  id: number; nim: string; nik: string | null; nama: string; gender: 'L' | 'P' | null;
  batch_year: number | null; sks_completed: number | null; gpa: number | null;
  is_bta_ppi_passed: boolean; mother_name: string | null; address: string | null;
  master_synced_at: string | null;
  fakultas: { id: number; nama: string } | null;
  prodi: { id: number; nama: string } | null;
}
interface AccountData {
  id: number; username: string; name: string; email: string | null;
  is_active: boolean; must_change_password: boolean; roles: string[];
  created_at: string | null;
}
interface RegistrationData {
  id: number; status: string; registration_date: string | null;
  period: { id: number; name: string } | null;
  rejection_reason: string | null; notes: string | null;
}
interface GroupData {
  id: number; name: string;
  location: { village_name: string; district_name: string | null; regency_name: string | null } | null;
  period: { name: string } | null;
}
interface DispensasiItem {
  id: number; alasan: string; bypassed_requirements: string[] | null;
  is_active: boolean; periode: { name: string } | null;
  granted_by: string; created_at: string | null;
}
interface Props {
  mahasiswa: MahasiswaData; account: AccountData | null;
  registration: RegistrationData | null; group: GroupData | null;
  dispensasi: DispensasiItem[];
  flash?: { temporary_password_display?: { password?: string, username?: string } };
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200', 
  approved: 'bg-[#e8f5ee] text-[#1a7a4a] border border-emerald-200', 
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
};
const STATUS_LABEL: Record<string, string> = { 
  pending: 'Menunggu', 
  approved: 'Disetujui', 
  rejected: 'Ditolak' 
};

function formatDate(v: string | null | undefined) {
  if (!v) return '—';
  try { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)); }
  catch { return v; }
}

export default function MahasiswaShow({ mahasiswa, account, registration, group, dispensasi, flash }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const tempPasswordData = flash?.temporary_password_display;

  return (
    <>
      <AppLayout title={`Detail Mahasiswa: ${mahasiswa.nama}`}>
        <Head title={`Detail — ${mahasiswa.nama}`} />

        <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
          {/* TEMPORARY PASSWORD BANNER */}
          {tempPasswordData && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-amber-700">Password Sementara Berhasil Dibuat</span>
                  <span className="text-sm text-amber-900">
                    Password baru: <code className="bg-white px-2 py-0.5 rounded border border-amber-200 font-mono font-bold select-all">{tempPasswordData.password}</code>
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wider max-w-[120px] text-right leading-tight">
                Kopi dan berikan ke mahasiswa. Segera ganti.
              </p>
            </div>
          )}

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link href="/admin/mahasiswa" className="text-emerald-800 hover:text-[#1a7a4a] transition-colors flex items-center gap-1.5 text-sm">
                  <ArrowLeft size={15} /> Direktori Mahasiswa
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-emerald-950 leading-tight">{mahasiswa.nama}</h1>
              <p className="text-sm text-emerald-800">NIM: <strong className="text-emerald-800">{mahasiswa.nim}</strong> · Angkatan <strong className="text-emerald-800">{mahasiswa.batch_year || '—'}</strong></p>
            </div>
            {account && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setConfirmReset(true)}
                  className="h-10 px-4 bg-white border border-gray-300 text-emerald-800 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <KeyRound size={15} /> Reset Password
                </button>
                <button
                  onClick={() => setConfirmToggle(true)}
                  className={clsx(
                    "h-10 px-4 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors",
                    account.is_active 
                      ? "bg-white border border-gray-300 text-emerald-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700" 
                      : "bg-[#16a34a] text-white hover:bg-[#15803d] shadow-none"
                  )}
                >
                  {account.is_active ? <><Lock size={15} /> Kunci Akun</> : <><Unlock size={15} /> Aktifkan Akun</>}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: BIODATA */}
            <div className="lg:col-span-2 space-y-6">
              {/* PROFIL AKADEMIK */}
              <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#1a7a4a]"/>
                  <h2 className="text-sm font-semibold text-[#1f2937]">Profil Akademik</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <InfoField label="Nama Lengkap" value={mahasiswa.nama} span={2} />
                  <InfoField label="NIM" value={mahasiswa.nim} mono />
                  <InfoField label="NIK" value={mahasiswa.nik || '—'} mono />
                  <InfoField label="Jenis Kelamin" value={mahasiswa.gender === 'L' ? 'Laki-laki' : mahasiswa.gender === 'P' ? 'Perempuan' : '—'} />
                  <InfoField label="Angkatan" value={mahasiswa.batch_year?.toString() || '—'} />
                  <InfoField label="Nama Ibu" value={mahasiswa.mother_name || '—'} />
                  <InfoField label="Fakultas" value={mahasiswa.fakultas?.nama || '—'} span={2} />
                  <InfoField label="Program Studi" value={mahasiswa.prodi?.nama || '—'} span={2} />
                  <InfoField label="Alamat" value={mahasiswa.address || '—'} span={3} />
                </div>
              </div>

              {/* KELAYAKAN */}
              <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#1a7a4a]"/>
                  <h2 className="text-sm font-semibold text-[#1f2937]">Kelayakan KKN</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 border border-emerald-50 text-center space-y-1">
                    <p className="text-2xl font-bold text-emerald-950 tabular-nums">{mahasiswa.sks_completed ?? 0}</p>
                    <p className="text-xs text-emerald-800 font-medium">SKS Selesai</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-emerald-50 text-center space-y-1">
                    <p className="text-2xl font-bold text-emerald-950 tabular-nums">{Number(mahasiswa.gpa ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-emerald-800 font-medium">IPK</p>
                  </div>
                  <div className={clsx(
                    "p-4 rounded-lg border text-center space-y-1.5 col-span-2 flex flex-col items-center justify-center",
                    mahasiswa.is_bta_ppi_passed ? 'bg-gray-50 border-emerald-50' : 'bg-rose-50 border-rose-100'
                  )}>
                    <div className="flex items-center justify-center gap-2">
                      {mahasiswa.is_bta_ppi_passed
                        ? <><CheckCircle2 size={18} className="text-[#1a7a4a]"/><p className="text-sm font-bold text-emerald-950">Lulus BTA-PPI</p></>
                        : <><XCircle size={18} className="text-rose-600"/><p className="text-sm font-bold text-rose-800">Belum Lulus BTA-PPI</p></>
                      }
                    </div>
                    <p className="text-xs text-emerald-800 uppercase tracking-wider font-bold text-center">Prasyarat Utama</p>
                  </div>
                </div>
              </div>

              {/* PENDAFTARAN */}
              <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                  <ClipboardList size={16} className="text-[#1a7a4a]"/>
                  <h2 className="text-sm font-semibold text-[#1f2937]">Status Pendaftaran</h2>
                </div>
                {registration ? (
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-emerald-800 mb-1.5">Status Saat Ini</p>
                      <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", STATUS_BADGE[registration.status] || 'bg-gray-100 text-emerald-800')}>
                        {STATUS_LABEL[registration.status] || registration.status}
                      </span>
                    </div>
                    <InfoField label="Tanggal Daftar" value={registration.registration_date || '—'} />
                    <InfoField label="Periode Terdaftar" value={registration.period?.name || '—'} />
                    {registration.status === 'rejected' && registration.rejection_reason && (
                      <div className="col-span-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                        <p className="text-xs text-rose-600 font-bold uppercase tracking-tight">Alasan Penolakan:</p>
                        <p className="text-sm text-rose-800 mt-1 font-medium">{registration.rejection_reason}</p>
                      </div>
                    )}
                    <div className="col-span-3 pt-2 text-right">
                      <Link href={`/admin/pendaftaran/${registration.id}`} className="text-sm text-[#1a7a4a] hover:text-[#1a7a4a] font-bold flex items-center gap-1 justify-end transition-colors">
                        Lihat Berkas Pendaftaran <ArrowLeft size={14} className="rotate-180" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-gray-200 mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-emerald-800 font-medium">Mahasiswa ini belum melakukan pendaftaran KKN.</p>
                  </div>
                )}
              </div>

              {/* KELOMPOK */}
              {group && (
                <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                    <Users size={16} className="text-[#1a7a4a]"/>
                    <h2 className="text-sm font-semibold text-[#1f2937]">Penempatan Kelompok</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <InfoField label="Nama Unit/Kelompok" value={group.name} span={2} />
                    {group.period && <InfoField label="Tahun/Periode" value={group.period.name} />}
                    {group.location && (
                      <>
                        <InfoField label="Wilayah Desa" value={group.location.village_name} />
                        <InfoField label="Kecamatan" value={group.location.district_name || '—'} />
                        <InfoField label="Kabupaten/Kota" value={group.location.regency_name || '—'} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              {/* AKUN */}
              <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#1a7a4a]"/>
                  <h2 className="text-sm font-semibold text-[#1f2937]">Hak Akses & Akun</h2>
                </div>
                {account ? (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-xs font-medium text-emerald-800">Status Akun</span>
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase", 
                        account.is_active ? "bg-[#e8f5ee] text-[#1a7a4a] border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}>
                        {account.is_active ? 'Aktif' : 'Terkunci'}
                      </span>
                    </div>
                    <InfoField label="ID Pengguna (Username)" value={account.username} mono />
                    <InfoField label="Alamat Email" value={account.email || '—'} />
                    <InfoField label="Waktu Pendaftaran" value={account.created_at || '—'} />
                    {account.must_change_password && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 font-medium">
                        User diwajibkan melakukan pembaruan kata sandi saat masuk kembali.
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <InfoField label="Sinkronisasi Terakhir LPPM" value={formatDate(mahasiswa.master_synced_at)} />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <XCircle className="mx-auto h-8 w-8 text-gray-200 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">Akun sistem belum diinisialisasi melalui sinkronisasi master.</p>
                  </div>
                )}
              </div>

              {/* DISPENSASI */}
              {dispensasi.length > 0 && (
                <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-500"/>
                    <h2 className="text-sm font-semibold text-[#1f2937]">Dispensasi Khusus</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dispensasi.map(d => (
                      <div key={d.id} className="p-5 space-y-3">
                        <p className="text-sm font-bold text-[#1f2937] leading-tight">{d.alasan}</p>
                        <p className="text-xs font-medium text-emerald-800 uppercase">Periode: {d.periode?.name || 'Semua'} · {d.created_at}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(d.bypassed_requirements || []).map(r => (
                            <span key={r} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-bold uppercase">{r.replace('_', ' ')}</span>
                          ))}
                        </div>
                        <p className="text-xs text-emerald-800 font-medium">Otorisator: <span className="text-emerald-800">{d.granted_by}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>

      {account && (
        <>
          <ConfirmDialog
            open={confirmReset}
            onClose={() => setConfirmReset(false)}
            onConfirm={() => { router.post(`/admin/pengguna/${account.id}/reset-password-sementara`, {}, { preserveScroll: true }); setConfirmReset(false); }}
            title="Reset Password Pengguna"
            message={`Sistem akan menonaktifkan password lama dan menghasilkan identitas akses baru untuk "${mahasiswa.nama}". Anda harus segera menyerahkan password tersebut kepada yang bersangkutan secara manual.`}
            confirmLabel="Reset Sekarang"
          />
          <ConfirmDialog
            open={confirmToggle}
            onClose={() => setConfirmToggle(false)}
            onConfirm={() => { router.patch(`/admin/pengguna/${account.id}/toggle-status`, {}, { preserveScroll: true }); setConfirmToggle(false); }}
            title={account.is_active ? 'Bekukan Akses Mahasiswa' : 'Pulihkan Akses Mahasiswa'}
            message={account.is_active
              ? `Status login untuk "${mahasiswa.nama}" akan dinonaktifkan. Mahasiswa tidak memiliki akses ke portal sampai status dipulihkan.`
              : `Akses login untuk "${mahasiswa.nama}" akan dipulihkan. Mahasiswa dapat kembali masuk menggunakan kredensial yang ada.`
            }
            confirmLabel={account.is_active ? 'Ya, Bekukan' : 'Ya, Pulihkan'}
            confirmVariant={account.is_active ? 'danger' : 'primary'}
          />
        </>
      )}
    </>
  );
}

function InfoField({ label, value, mono = false, span }: { label: string; value: string; mono?: boolean; span?: number }) {
  return (
    <div className={span ? `col-span-${span}` : undefined}>
      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 opacity-70">{label}</p>
      <p className={clsx("text-sm text-emerald-950 font-semibold break-words", mono && "font-mono tracking-tight")}>{value}</p>
    </div>
  );
}
