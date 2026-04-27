import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/UI';
import {
  GraduationCap,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  Activity,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Periode {
  id: number;
  name: string;
}

interface MahasiswaRekap {
  nim: string;
  nama: string;
  fakultas: string;
  prodi: string;
  kelompok: string;
  skor_akhir: number | null;
  nilai_huruf: string | null;
  status: 'lulus' | 'tidak_lulus' | 'pending';
}

interface Rekap {
  total: number;
  lulus: number;
  tidak_lulus: number;
  mahasiswa: MahasiswaRekap[];
}

interface Props {
  periodes: Periode[];
  rekap: Rekap | null;
  selectedPeriodeId: string | null;
}

export default function YudisiumIndex({ periodes, rekap, selectedPeriodeId }: Props) {
  const [periodeId, setPeriodeId] = useState(selectedPeriodeId || '');
  const [processing, setProcessing] = useState(false);

  const handleFetchRekap = (id: string) => {
    setPeriodeId(id);
    router.get(route('admin.yudisium.index'), { periode_id: id }, { preserveState: true });
  };

  const handleProsesYudisium = () => {
    if (!periodeId) return;
    if (
      confirm(
        'Apakah Anda yakin ingin memproses Yudisium untuk periode ini? Tindakan ini akan menghitung status kelulusan akhir mahasiswa.',
      )
    ) {
      setProcessing(true);
      router.post(
        route('admin.yudisium.proses'),
        { periode_id: periodeId },
        {
          onFinish: () => setProcessing(false),
        },
      );
    }
  };

  return (
    <AppLayout title="Sidang Yudisium & Kelulusan">
      <Head title="Yudisium KKN" />

      <div className="space-y-8 pb-24 text-emerald-950 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#0d9488]">
            <GraduationCap size={18} />
            <span className="text-xs font-bold opacity-80">Tahap Akhir Akademik</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-emerald-950">
                Sidang <span className="text-[#0d9488]">Yudisium.</span>
              </h1>
              <p className="font-semibold text-xs text-emerald-800 mt-2 leading-relaxed max-w-2xl">
                Penetapan status kelulusan akhir bagi mahasiswa peserta KKN berdasarkan akumulasi
                nilai dan pemenuhan administrasi.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-72">
                <Filter
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0d9488]"
                />
                <select
                  value={periodeId}
                  onChange={(e) => handleFetchRekap(e.target.value)}
                  className="w-full h-14 pl-12 pr-10 bg-white border border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 outline-none focus:border-[#0d9488] transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">-- PILIH PERIODE --</option>
                  {periodes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none"
                  size={18}
                />
              </div>

              <button
                onClick={handleProsesYudisium}
                disabled={!periodeId || processing}
                className="h-14 px-8 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold transition-all shadow-sm shadow-none flex items-center gap-3 active:scale-95 disabled:opacity-50 text-sm"
              >
                {processing ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
                PROSES YUDISIUM
              </button>
            </div>
          </div>
        </div>

        {!rekap ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-gray-50 rounded-xl border border-dashed border-emerald-50">
            <div className="h-20 w-20 bg-white rounded-xl flex items-center justify-center text-emerald-700 shadow-sm border border-emerald-50">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1f2937]">Belum Ada Data Terpilih</h3>
              <p className="text-xs font-semibold text-[#0d9488] max-w-sm">
                Silakan pilih periode KKN terlebih dahulu untuk menampilkan data rekapitulasi
                yudisium.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* --- ANALYTICS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Mahasiswa" value={rekap.total} icon={Users} color="emerald" />
              <StatCard
                label="Dinyatakan Lulus"
                value={rekap.lulus}
                icon={CheckCircle2}
                color="emerald"
                trend={`${Math.round((rekap.lulus / rekap.total) * 100) || 0}% dari total`}
              />
              <StatCard
                label="Tidak Lulus / Pending"
                value={rekap.total - rekap.lulus}
                icon={AlertCircle}
                color="amber"
                trend={`${Math.round(((rekap.total - rekap.lulus) / rekap.total) * 100) || 0}% dari total`}
              />
            </div>

            {/* --- DATA TABLE --- */}
            <section className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50 border-b-2 border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-[#0d9488]" />
                  <span className="text-xs font-bold text-[#1f2937]">
                    Daftar Hasil Sidang Yudisium
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-50 shadow-sm">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-[#0d9488]">Snapshot Terverifikasi</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b-2 border-emerald-50 text-emerald-950">
                    <tr>
                      <th className="px-8 py-5 text-xs font-bold">Mahasiswa</th>
                      <th className="px-8 py-5 text-xs font-bold">Unit Kerja (Kelompok)</th>
                      <th className="px-8 py-5 text-xs font-bold">Fakultas / Prodi</th>
                      <th className="px-8 py-5 text-xs font-bold text-center">Skor Akhir</th>
                      <th className="px-8 py-5 text-xs font-bold text-center">Status Lulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6] bg-white">
                    {rekap.mahasiswa.map((m, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50 transition-all">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-emerald-950 leading-none mb-1.5 group-hover:text-emerald-800 transition-colors">
                              {m.nama}
                            </span>
                            <span className="text-xs font-semibold text-[#0d9488] font-mono">
                              {m.nim}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="inline-flex h-7 items-center px-3 bg-gray-50 border border-gray-300 text-emerald-800 rounded-lg text-xs font-bold tracking-wide">
                            {m.kelompok}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1f2937] leading-none mb-1">
                              {m.fakultas}
                            </span>
                            <span className="text-xs font-semibold text-[#0d9488] leading-none">
                              {m.prodi}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-semibold text-emerald-950 tabular-nums leading-none mb-1.5 slashed-zero">
                              {m.skor_akhir?.toFixed(1) || '-'}
                            </span>
                            <span className="text-xs font-bold text-[#0d9488]">
                              GRADE {m.nilai_huruf || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <div
                              className={clsx(
                                'h-9 px-5 flex items-center gap-2 rounded-xl text-xs font-bold border transition-all',
                                m.status === 'lulus'
                                  ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-sm shadow-none'
                                  : m.status === 'tidak_lulus'
                                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                                    : 'bg-amber-50 border-amber-100 text-amber-600',
                              )}
                            >
                              {m.status === 'lulus' ? (
                                <CheckCircle2 size={12} strokeWidth={3} />
                              ) : (
                                <XCircle size={12} strokeWidth={3} />
                              )}
                              {m.status === 'lulus'
                                ? 'DINYATAKAN LULUS'
                                : m.status === 'tidak_lulus'
                                  ? 'TIDAK LULUS'
                                  : 'MENUNGGU VERIFIKASI'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="bg-white rounded-xl p-10 text-white relative overflow-hidden shadow-sm border border-emerald-800">
              <div className="absolute top-0 right-0 p-10 opacity-10 -mr-20 -mt-20">
                <GraduationCap size={300} />
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 bg-gray-100/50 rounded-xl flex items-center justify-center text-emerald-800 border border-emerald-800 shadow-inner">
                    <Trophy size={40} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black font-display uppercase tracking-tighter">
                      Penetapan Hasil Yudisium
                    </h2>
                    <p className="text-sm font-semibold text-emerald-800 leading-relaxed max-w-2xl">
                      Data yang ditampilkan merupakan hasil finalisasi nilai yang telah divalidasi
                      oleh LPPM. Mahasiswa yang DINYATAKAN LULUS berhak mendapatkan Sertifikat KKN
                      Digital yang dapat diunduh melalui portal mahasiswa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: 'emerald' | 'amber';
  trend?: string;
}) {
  return (
    <div className="bg-white border border-emerald-50 rounded-xl p-7 flex items-center gap-6 shadow-sm hover:border-emerald-50 transition-all group overflow-hidden relative">
      <div
        className={clsx(
          'h-16 w-16 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border',
          color === 'emerald'
            ? 'bg-gray-50 text-[#0d9488] border-emerald-50'
            : 'bg-amber-50 text-amber-600 border-amber-100',
        )}
      >
        <Icon size={30} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-xs font-bold text-emerald-800 leading-none mb-3">{label}</span>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold text-emerald-950 er tabular-nums leading-none">
            {value}
          </span>
          {trend && <span className="text-xs font-bold text-[#0d9488] mb-1">{trend}</span>}
        </div>
      </div>
    </div>
  );
}
