import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ChevronLeft,
  ArrowUpRight,
  SearchX,
  Calendar,
  GraduationCap,
  Info,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, Variants } from 'framer-motion';

interface Registration {
  id: number;
  mahasiswa: {
    nama: string;
    nim: string;
    fakultas: { nama: string };
  };
  periode: { periode: string };
  created_at: string;
  status: string;
  kelompok?: {
    nama_kelompok: string;
    code: string;
  };
}

interface Props {
  jenisKkn: {
    id: number;
    name: string;
    code: string;
    description: string | null;
    registration_mode_label: string;
    placement_mode_label: string;
    min_sks: number;
    min_gpa: string;
    is_active: boolean;
    color: string;
  };
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  registrations: {
    data: Registration[];
    total: number;
  };
  filters: {
    search?: string;
  };
}

export default function JenisKknShow({ jenisKkn, stats, registrations, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.get(
      `/admin/jenis-kkn/${jenisKkn.id}`,
      { search },
      {
        preserveState: true,
        replace: true,
      },
    );
  };

  return (
    <AppLayout title={`Spesifikasi ${jenisKkn.name}`}>
      <Head title={`Ledger Data ${jenisKkn.name} - Panel Kontrol`} />

      <motion.div
        className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* --- MODERN HEADER --- */}
        <motion.div variants={itemVariants} className="space-y-6 pt-12">
          <div className="flex items-center gap-4 text-[#0d9488]">
            <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/admin/jenis-kkn"
                className="h-12 w-12 rounded-xl bg-white border border-emerald-50 flex items-center justify-center text-emerald-700 hover:text-[#0d9488] hover:border-gray-300 transition-all shadow-sm"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </Link>
            </motion.div>
            <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-bold text-emerald-700 leading-none uppercase tracking-wide">
              Basis Data Utama &middot; Aturan Skema
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-black font-display uppercase tracking-tighter text-emerald-950 leading-tight pt-2">
                {jenisKkn.name.split(' ')[0]}{' '}
                <span>{jenisKkn.name.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-xs font-bold text-emerald-600 mt-4 tracking-wide uppercase">
                KODE PROTOKOL: {jenisKkn.code}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/admin/pendaftaran?search=${jenisKkn.name}`}
                className="h-10 px-6 bg-[#0d9488] text-white rounded-xl font-bold shadow-sm flex items-center gap-6 text-sm transition-all active:scale-95 text-xs font-semibold hover:bg-[#0d9488] border-none no-underline"
              >
                <ArrowUpRight size={24} strokeWidth={3} /> VALIDASI MASSAL PROTOKOL
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* --- STATS GRID --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard
            label="Total Data Pendaftar"
            value={stats.total}
            icon={Users}
            color="emerald"
            desc="Total Pendaftar"
          />
          <MetricCard
            label="TERVALIDASI"
            value={stats.approved}
            icon={CheckCircle2}
            color="emerald"
            desc="Pendaftar Lolos"
          />
          <MetricCard
            label="DALAM TINJAUAN"
            value={stats.pending}
            icon={Clock}
            color="amber"
            desc="Menunggu Review"
          />
          <MetricCard
            label="DITOLAK"
            value={stats.rejected}
            icon={XCircle}
            color="rose"
            desc="Administrasi Gagal"
          />
        </motion.div>

        {/* --- PARAMETER PANEL --- */}
        <motion.section variants={itemVariants} className="bg-white border border-emerald-50 rounded-xl p-10 shadow-sm font-sans">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-20">
            <div className="flex items-center gap-6 shrink-0">
              <div className="h-16 w-16 bg-[#0d9488] text-white rounded-xl flex items-center justify-center shadow-sm shadow-emerald-900/20">
                <Info size={28} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-emerald-950 font-bold text-center">
                  Parameter Kualifikasi
                </h3>
                <span className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wide">
                  Kriteria Minimum Peserta
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-16 gap-y-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide leading-none mb-3">
                  Ambang Batas Kredit
                </span>
                <span className="text-lg font-bold text-emerald-950 tabular-nums">
                  {jenisKkn.min_sks} UNIT SKS
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide leading-none mb-3">
                  Ambang Batas IPK
                </span>
                <span className="text-lg font-bold text-emerald-950 tabular-nums">
                  {jenisKkn.min_gpa} INDEKS
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide leading-none mb-3">
                  Aturan Registrasi
                </span>
                <span className="text-lg font-bold text-emerald-950">
                  {jenisKkn.registration_mode_label}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide leading-none mb-3">
                  Nomenklatur Deskripsi
                </span>
                <span
                  className="text-sm font-semibold text-emerald-700 max-w-sm truncate"
                  title={jenisKkn.description || ''}
                >
                  {jenisKkn.description || 'NIHIL DESKRIPSI PROTOKOL.'}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* --- MAIN LEDGER --- */}
        <motion.section variants={itemVariants} className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-6 border-b border-emerald-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/50">
            <div className="flex items-center gap-8">
              <div className="h-16 w-16 bg-white border border-emerald-50 text-[#0d9488] rounded-xl flex items-center justify-center shadow-sm">
                <Layers size={28} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-emerald-950 font-bold text-center">
                  Indeks pendaftar terkini
                </h3>
                <span className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wide">
                  Log transmisi data registrasi terpadu.
                </span>
              </div>
            </div>
            <form onSubmit={handleSearch} className="relative w-full lg:w-[450px] group">
              <Search
                size={22}
                className="absolute left-8 top-1/2 -translated-y-1/2 text-emerald-700 group-focus-within:text-[#0d9488] transition-colors"
                strokeWidth={3}
              />
              <input
                type="text"
                placeholder="CARI DATA PESERTA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-18 pl-20 pr-8 bg-white border border-emerald-50 rounded-xl text-sm font-bold text-emerald-950 focus:border-[#0d9488] outline-none transition-all placeholder:text-emerald-800/30"
              />
            </form>
          </div>

          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left">
              <thead className="bg-white text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-50/50">
                <tr>
                  <th className="px-6 py-8">Data Peserta</th>
                  <th className="px-6 py-8">Basis Akademik</th>
                  <th className="px-6 py-8 text-center">Siklus Program</th>
                  <th className="px-6 py-8 text-center">Waktu Registrasi</th>
                  <th className="px-6 py-8 text-center">Status Validitas</th>
                  <th className="px-6 py-8 text-right">Distribusi Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]/50">
                {registrations.data.length > 0 ? (
                  registrations.data.map((reg, idx) => (
                    <motion.tr 
                      key={reg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.05) }}
                      className="hover:bg-gray-50 transition-all duration-300 group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-8">
                          <div className="h-16 w-16 bg-[#0d9488] text-white border border-emerald-800 flex items-center justify-center font-bold text-xl rounded-xl group-hover:scale-110 transition-all shadow-sm">
                            {reg.mahasiswa.nama.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-emerald-950 group-hover:text-emerald-800 transition-colors leading-none truncate max-w-[300px]">
                              {reg.mahasiswa.nama}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 mt-3 leading-none">
                              {reg.mahasiswa.nim}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <GraduationCap size={16} className="text-emerald-700" strokeWidth={2.5} />
                          <span className="text-sm font-bold text-emerald-950">
                            {reg.mahasiswa.fakultas.nama}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="inline-flex items-center px-6 py-2 rounded-xl bg-gray-50 text-emerald-800 text-sm font-bold tracking-normal border border-emerald-50 shadow-sm">
                          Siklus #{reg.periode.periode}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center gap-3 text-sm font-bold text-emerald-950 tabular-nums">
                            <Calendar size={14} className="text-emerald-800" strokeWidth={2.5} />
                            {new Date(reg.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {reg.status === 'approved' && (
                          <span className="inline-flex items-center gap-3 px-6 py-2 rounded-xl bg-gray-500 text-white text-sm font-bold text-xs font-semibold shadow-sm shadow-emerald-500/40 font-sans border-none">
                            TERVALIDASI
                          </span>
                        )}
                        {reg.status === 'pending' && (
                          <span className="inline-flex items-center gap-3 px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold text-xs font-semibold shadow-sm shadow-amber-500/40 font-sans border-none">
                            Peninjauan
                          </span>
                        )}
                        {reg.status === 'rejected' && (
                          <span className="inline-flex items-center gap-3 px-6 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold text-xs font-semibold shadow-sm shadow-rose-600/40 font-sans border-none">
                            DITOLAK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        {reg.kelompok ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-emerald-950">
                              {reg.kelompok.nama_kelompok}
                            </span>
                            <span className="text-sm font-bold text-[#0d9488] font-semibold text-xs mt-2">
                              {reg.kelompok.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-500 leading-none">
                            Belum Terdistribusi
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-64 text-center">
                      <div className="flex flex-col items-center gap-6 text-emerald-50">
                        <SearchX size={100} strokeWidth={0.5} className="opacity-40" />
                        <p className="text-xs font-bold leading-none opacity-30">
                          Log Distribusi Kosong
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  isText = false,
  desc,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: 'emerald' | 'rose' | 'amber' | 'slate';
  isText?: boolean;
  desc: string;
}) {
  const colorMap = {
    emerald: 'bg-gray-50 text-[#0d9488] border-emerald-50 hover:border-[#0d9488]',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-500',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-500',
    slate: 'bg-gray-50 text-slate-500 border-emerald-50 hover:border-[#0d9488]',
  };
  return (
    <div className="bg-white border border-emerald-50 p-8 rounded-xl shadow-sm hover:shadow-emerald-950/10 transition-all group overflow-hidden relative font-sans">
      <div className="flex items-center justify-between relative z-10 font-sans">
        <div
          className={clsx(
            'h-14 w-14 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-12 shadow-sm',
            colorMap[color],
          )}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide">{desc}</div>
      </div>
      <div className="mt-8 space-y-4 relative z-10 transition-all group-hover:translate-x-1">
        <p className="text-xs font-bold text-emerald-700 leading-none uppercase">
          {label}
        </p>
        <p
          className={clsx(
            'font-bold text-emerald-950 tabular-nums leading-none ',
            isText ? 'text-2xl' : 'text-2xl',
          )}
        >
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
