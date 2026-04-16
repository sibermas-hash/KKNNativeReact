import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
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
  ShieldCheck
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
    if (confirm('Apakah Anda yakin ingin memproses Yudisium untuk periode ini? Tindakan ini akan menghitung status kelulusan akhir mahasiswa.')) {
      setProcessing(true);
      router.post(route('admin.yudisium.proses'), { periode_id: periodeId }, {
        onFinish: () => setProcessing(false)
      });
    }
  };

  return (
    <AppLayout title="Sidang Yudisium & Kelulusan">
      <Head title="Yudisium KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <GraduationCap size={18} />
            <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Tahap Akhir Akademik</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                Sidang <span className="text-emerald-500">Yudisium.</span>
              </h1>
              <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
                Penetapan status kelulusan akhir bagi mahasiswa peserta KKN berdasarkan akumulasi nilai dan pemenuhan administrasi.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-72">
                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <select 
                  value={periodeId} 
                  onChange={(e) => handleFetchRekap(e.target.value)}
                  className="w-full h-14 pl-12 pr-10 bg-white border-2 border-emerald-50 rounded-2xl text-sm font-bold text-emerald-950 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">-- PILIH PERIODE --</option>
                  {periodes.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" size={18} />
              </div>

              <button
                onClick={handleProsesYudisium}
                disabled={!periodeId || processing}
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 disabled:opacity-50 text-sm tracking-widest uppercase"
              >
                {processing ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
                PROSES YUDISIUM
              </button>
            </div>
          </div>
        </div>

        {!rekap ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-emerald-50/30 rounded-[2.5rem] border-2 border-dashed border-emerald-100">
             <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-emerald-200 shadow-xl border border-emerald-50">
                <Search size={40} />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-900 tracking-tight uppercase">Belum Ada Data Terpilih</h3>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest max-w-sm">Silakan pilih periode KKN terlebih dahulu untuk menampilkan data rekapitulasi yudisium.</p>
             </div>
          </div>
        ) : (
          <>
            {/* --- ANALYTICS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                label="Total Mahasiswa" 
                value={rekap.total} 
                icon={Users} 
                color="emerald" 
              />
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
            <section className="bg-white border-2 border-emerald-50 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="p-6 bg-emerald-50/50 border-b-2 border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Daftar Hasil Sidang Yudisium</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Snapshot Terverifikasi</span>
                    </div>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50/50 border-b-2 border-emerald-100 text-emerald-950">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Mahasiswa</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Unit Kerja (Kelompok)</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest">Fakultas / Prodi</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-center">Skor Akhir</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-center">Status Lulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white">
                    {rekap.mahasiswa.map((m, idx) => (
                      <tr key={idx} className="group hover:bg-emerald-50/30 transition-all">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-emerald-950 leading-none mb-1.5 uppercase group-hover:text-emerald-700 transition-colors">{m.nama}</span>
                            <span className="text-[10px] font-semibold text-emerald-600 tracking-wider font-mono">{m.nim}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="inline-flex h-7 items-center px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                            {m.kelompok}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-emerald-900 leading-none uppercase mb-1">{m.fakultas}</span>
                            <span className="text-[10px] font-semibold text-emerald-500 leading-none uppercase">{m.prodi}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-emerald-950 tabular-nums leading-none mb-1.5 slashed-zero">{m.skor_akhir?.toFixed(1) || '-'}</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">GRADE {m.nilai_huruf || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <div className={clsx(
                              "h-9 px-5 flex items-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              m.status === 'lulus' ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100" :
                              m.status === 'tidak_lulus' ? "bg-rose-50 border-rose-100 text-rose-600" :
                              "bg-amber-50 border-amber-100 text-amber-600"
                            )}>
                              {m.status === 'lulus' ? <CheckCircle2 size={12} strokeWidth={3} /> : <XCircle size={12} strokeWidth={3} />}
                              {m.status === 'lulus' ? 'DINYATAKAN LULUS' : m.status === 'tidak_lulus' ? 'TIDAK LULUS' : 'MENUNGGU VERIFIKASI'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
                <div className="absolute top-0 right-0 p-10 opacity-10 -mr-20 -mt-20"><GraduationCap size={300} /></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 bg-emerald-900/50 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-800 shadow-inner">
                            <Trophy size={40} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Penetapan Hasil Yudisium</h2>
                            <p className="text-[12px] font-semibold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-2xl">
                                Data yang ditampilkan merupakan hasil finalisasi nilai yang telah divalidasi oleh LPPM. Mahasiswa yang DINYATAKAN LULUS berhak mendapatkan Sertifikat KKN Digital yang dapat diunduh melalui portal mahasiswa.
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

function StatCard({ label, value, icon: Icon, color, trend }: { label: string; value: string | number; icon: any; color: 'emerald' | 'amber'; trend?: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-7 flex items-center gap-6 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx(
        "h-16 w-16 rounded-3xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border",
        color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
      )}>
        <Icon size={30} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase leading-none mb-3">{label}</span>
        <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-emerald-950 tracking-tighter tabular-nums leading-none">{value}</span>
            {trend && <span className="text-[10px] font-bold text-emerald-500 mb-1 uppercase tracking-tight">{trend}</span>}
        </div>
      </div>
    </div>
  );
}
