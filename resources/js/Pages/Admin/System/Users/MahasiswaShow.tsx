import { Head, Link, router } from '@inertiajs/react';
import { GraduationCap, KeyRound, Lock, Unlock, ArrowLeft, CheckCircle2, XCircle, Users, MapPin, ClipboardList, ShieldCheck, RefreshCw } from 'lucide-react';
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
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800',
};
const STATUS_LABEL: Record<string, string> = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

function formatDate(v: string | null | undefined) {
  if (!v) return '—';
  try { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)); }
  catch { return v; }
}

export default function MahasiswaShow({ mahasiswa, account, registration, group, dispensasi }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  return (
    <>
      <AppLayout title={`Detail Mahasiswa: ${mahasiswa.nama}`}>
        <Head title={`Detail — ${mahasiswa.nama}`} />

        <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link href="/admin/mahasiswa" className="text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1.5 text-sm">
                  <ArrowLeft size={15} /> Direktori Mahasiswa
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">{mahasiswa.nama}</h1>
              <p className="text-sm text-gray-500">NIM: <strong>{mahasiswa.nim}</strong> · Angkatan <strong>{mahasiswa.batch_year || '—'}</strong></p>
            </div>
            {account && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setConfirmReset(true)}
                  className="h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <KeyRound size={15} /> Reset Password
                </button>
                <button
                  onClick={() => setConfirmToggle(true)}
                  className={clsx("h-10 px-4 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors", account.is_active ? "bg-white border border-gray-300 text-gray-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700" : "bg-emerald-600 text-white hover:bg-emerald-700")}
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Profil Akademik</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Kelayakan KKN</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center space-y-1">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{mahasiswa.sks_completed ?? 0}</p>
                    <p className="text-xs text-gray-500">SKS Selesai</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center space-y-1">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{Number(mahasiswa.gpa ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">IPK</p>
                  </div>
                  <div className={clsx("p-4 rounded-lg border text-center space-y-1.5 col-span-2", mahasiswa.is_bta_ppi_passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200')}>
                    <div className="flex items-center justify-center gap-2">
                      {mahasiswa.is_bta_ppi_passed
                        ? <><CheckCircle2 size={16} className="text-emerald-600" /><p className="text-sm font-semibold text-emerald-800">Lulus BTA-PPI</p></>
                        : <><XCircle size={16} className="text-rose-600" /><p className="text-sm font-semibold text-rose-800">Belum Lulus BTA-PPI</p></>
                      }
                    </div>
                    <p className="text-xs text-gray-500">Prasyarat Utama</p>
                  </div>
                </div>
              </div>

              {/* PENDAFTARAN */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <ClipboardList size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Status Pendaftaran</h2>
                </div>
                {registration ? (
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", STATUS_BADGE[registration.status] || 'bg-gray-100 text-gray-700')}>
                        {STATUS_LABEL[registration.status] || registration.status}
                      </span>
                    </div>
                    <InfoField label="Tanggal Daftar" value={registration.registration_date || '—'} />
                    <InfoField label="Periode" value={registration.period?.name || '—'} />
                    {registration.status === 'rejected' && registration.rejection_reason && (
                      <div className="col-span-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="text-xs text-rose-600 font-medium">Alasan Penolakan:</p>
                        <p className="text-sm text-rose-800 mt-0.5">{registration.rejection_reason}</p>
                      </div>
                    )}
                    <div className="col-span-3 text-right">
                      <Link href={`/admin/pendaftaran/${registration.id}`} className="text-sm text-emerald-600 hover:underline font-medium">
                        Lihat Detail Pendaftaran →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-sm text-gray-500">Belum ada pendaftaran.</div>
                )}
              </div>

              {/* KELOMPOK */}
              {group && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" />
                    <h2 className="text-sm font-semibold text-gray-800">Kelompok KKN</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoField label="Nama Kelompok" value={group.name} span={2} />
                    {group.period && <InfoField label="Periode" value={group.period.name} />}
                    {group.location && (
                      <>
                        <InfoField label="Desa / Kelurahan" value={group.location.village_name} />
                        <InfoField label="Kecamatan" value={group.location.district_name || '—'} />
                        <InfoField label="Kabupaten" value={group.location.regency_name || '—'} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              {/* AKUN */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Akun Sistem</h2>
                </div>
                {account ? (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", account.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
                        {account.is_active ? 'Aktif' : 'Terkunci'}
                      </span>
                    </div>
                    <InfoField label="Username" value={account.username} mono />
                    <InfoField label="Email" value={account.email || '—'} />
                    <InfoField label="Dibuat" value={account.created_at || '—'} />
                    {account.must_change_password && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        Wajib ganti sandi pada login berikutnya.
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <InfoField label="Sinkron Terakhir" value={formatDate(mahasiswa.master_synced_at)} />
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-sm text-gray-500">Belum memiliki akun sistem.</div>
                )}
              </div>

              {/* DISPENSASI */}
              {dispensasi.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-500" />
                    <h2 className="text-sm font-semibold text-gray-800">Dispensasi Aktif</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {dispensasi.map(d => (
                      <div key={d.id} className="p-4 space-y-2">
                        <p className="text-sm font-medium text-gray-800">{d.alasan}</p>
                        <p className="text-xs text-gray-500">Periode: {d.periode?.name || 'Semua'} · {d.created_at}</p>
                        <div className="flex flex-wrap gap-1">
                          {(d.bypassed_requirements || []).map(r => (
                            <span key={r} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">{r.replace('_', ' ')}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">Oleh: {d.granted_by}</p>
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
            title="Reset Password Sementara"
            message={`Hasilkan password sementara baru untuk "${mahasiswa.nama}"? Password lama akan digantikan dan ditampilkan sekali di layar.`}
            confirmLabel="Ya, Reset Sekarang"
          />
          <ConfirmDialog
            open={confirmToggle}
            onClose={() => setConfirmToggle(false)}
            onConfirm={() => { router.patch(`/admin/pengguna/${account.id}/toggle-status`, {}, { preserveScroll: true }); setConfirmToggle(false); }}
            title={account.is_active ? 'Kunci Akun Mahasiswa' : 'Aktifkan Akun Mahasiswa'}
            message={account.is_active
              ? `Akun "${mahasiswa.nama}" akan dikunci. Mahasiswa tidak dapat login sampai diaktifkan kembali.`
              : `Akun "${mahasiswa.nama}" akan diaktifkan. Mahasiswa dapat login kembali ke sistem.`
            }
            confirmLabel={account.is_active ? 'Kunci Akun' : 'Aktifkan Akun'}
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
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={clsx("text-sm text-gray-900 font-medium break-words", mono && "font-mono")}>{value}</p>
    </div>
  );
}
