import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/UI';
import {
  FileText,
  Download,
  MapPin,
  User,
  ChevronRight,
  Activity,
  Zap,
  Database,
  Archive,
  RefreshCw,
  Layers,
  Filter,
  FileSpreadsheet,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  ContentPanel,
  PremiumTable,
  PremiumTableRow,
  PremiumTableCell,
} from '@/Components/Premium';
import { clsx } from 'clsx';

interface Period {
  id: number;
  name: string;
  grading_start?: string | null;
  grading_end?: string | null;
}
interface Group {
  id: number;
  period_id: number;
  code: string;
  name: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  dpl: string;
}
interface Props {
  periods: Period[];
  groups: Group[];
}

export default function GradeGeneratorIndex({ periods, groups }: Props) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const activeGroups = useMemo(
    () =>
      selectedPeriodId ? groups.filter((g) => String(g.period_id) === selectedPeriodId) : groups,
    [groups, selectedPeriodId],
  );

    const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

return (
    <AppLayout title="Generator Blanko Nilai">
      <Head title="Generator Nilai KKN" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-24 text-emerald-950 font-sans px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <motion.div variants={itemVariants}>
<PageHeader
          title="Generator Nilai."
          subtitle="Fasilitas ekstraksi blanko penilaian operasional dan manajemen berkas lapangan terpadu bagi Dosen Pembimbing Lapangan."
          icon={FileText}
          groupLabel="Administrasi & Pencatatan"
          stats={{
            label: 'Unit Terdaftar',
            value: `${activeGroups.length} Kelompok`,
            icon: Archive,
          }}
        >
          <a
            href={
              selectedPeriodId
                ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}`
                : '/admin/generator-nilai/export-zip'
            }
            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest font-display"
          >
            <Download size={18} strokeWidth={3} />
            Unduh Semua (ZIP)
          </a>
        </PageHeader>
</motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Status Koneksi" value="AKTIF" icon={Zap} variant="success" />
          <StatCard label="Integritas Data" value="VALID" icon={ShieldCheck} variant="info" />
          <StatCard
            label="Total Entri"
            value={(groups.length * 12).toLocaleString()}
            icon={Database}
            variant="gray"
          />
          <StatCard label="Sinkronisasi" value="STABIL" icon={RefreshCw} variant="success" />
        </motion.div>

        <motion.div variants={itemVariants}>
<ContentPanel
          title="Indeks Kelompok KKN"
          description={`Menampilkan ${activeGroups.length} unit kelompok penugasan.`}
          icon={Layers}
          padding={false}
          headerAction={
            <div className="relative w-80 group">
              <Filter
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none z-10"
              />
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full h-11 pl-11 pr-10 bg-white border-2 border-emerald-50 rounded-xl text-[10px] font-black text-emerald-950 outline-none focus:border-emerald-600 transition-all appearance-none cursor-pointer shadow-sm font-display uppercase tracking-widest"
              >
                <option value="">SEMUA PERIODE</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronRight
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none"
                size={14}
              />
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] font-display">
                Data Generator Stabil
              </span>
              <span className="px-4 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black font-display uppercase tracking-widest border border-emerald-100">
                Total: {activeGroups.length} Unit
              </span>
            </div>
          }
        >
          <PremiumTable
            headers={['Identitas Unit', 'Lokasi Penugasan', 'DPL Pengampu', 'Ekstraksi Blanko']}
            isEmpty={activeGroups.length === 0}
            emptyText="Tidak ada kelompok yang ditemukan."
          >
            {activeGroups.map((group) => (
              <PremiumTableRow key={group.id}>
                <PremiumTableCell>
                  <div className="flex flex-col py-1">
                    <span className="text-[11px] font-black text-emerald-800/40 tabular-nums mb-1 font-mono tracking-widest">
                      #{group.code}
                    </span>
                    <span className="text-sm font-black text-emerald-950 uppercase tracking-tight font-display">
                      {group.name}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px] font-black text-emerald-950 uppercase leading-none font-display">
                      <MapPin size={10} className="text-rose-500" /> {group.desa}
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                      {group.kecamatan}, {group.kabupaten}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <div className="inline-flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-emerald-50/60">
                    <User size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest font-display truncate max-w-[150px]">
                      {group.dpl || 'DPL BELUM DITENTUKAN'}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={route('admin.nilai.index', { kelompok_id: group.id })}
                      className="h-9 px-5 bg-white ring-2 ring-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white hover:ring-emerald-950 rounded-xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all font-display no-underline"
                    >
                      Input Nilai <ChevronRight size={14} strokeWidth={3} />
                    </Link>
                    <a
                      href={`/admin/generator-nilai/${group.id}/export`}
                      className="h-9 w-9 bg-white border border-emerald-50 text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                      title="Ekspor Excel"
                    >
                      <FileSpreadsheet size={16} />
                    </a>
                    <a
                      href={`/admin/generator-nilai/${group.id}/export-pdf`}
                      className="h-9 w-9 bg-white border border-rose-50 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                      title="Ekspor PDF"
                    >
                      <FileText size={16} />
                    </a>
                  </div>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>
</motion.div>

        <div className="bg-emerald-950 rounded-[2rem] p-12 text-white relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-20 -mt-20 group-hover:rotate-45 transition-transform duration-1000">
            <RefreshCw size={350} />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex items-center gap-10">
              <div className="h-20 w-20 bg-emerald-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-emerald-800">
                <Download size={32} strokeWidth={3} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white leading-none">
                  Manajemen Dokumen Penilaian Terpusat.
                </h3>
                <p className="text-sm font-bold text-emerald-300 leading-relaxed max-w-2xl font-display opacity-80">
                  Modul ini memfasilitasi ekstraksi blanko penilaian operasional ke dalam format
                  dokumen (PDF/Excel) untuk verifikasi laporan fisik oleh Dosen Pembimbing Lapangan
                  secara terintegrasi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-emerald-900 px-6 py-3 rounded-2xl border border-emerald-800 shadow-inner">
              <ShieldCheck className="text-emerald-400" size={18} />
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest font-display">
                Otoritas Dokumen KKN
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
