import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Building2,
  Database,
  RefreshCw,
  Globe,
  ShieldCheck,
  LayoutGrid,
  Activity,
  History,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

interface Faculty {
  id: number;
  nama: string;
  kode: string | null;
  total_prodi: number;
  total_students: number;
  is_active: boolean;
}

interface Props {
  faculties: {
    data: Faculty[];
    meta: any;
  };
  summary: {
    total_faculties: number;
    total_prodi: number;
    total_students: number;
  };
}

export default function FacultiesIndex({ faculties, summary }: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout title="Direktori Fakultas">
      <Head title="Direktori Fakultas" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-24 text-emerald-950 font-sans"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Basis Struktural."
            subtitle="Manajemen arsitektur fakultas dan protokol pemetaan akademis institusional UIN SAIZU."
            icon={Building2}
            groupLabel="Data Master Institusi"
            stats={{
              label: 'Total Unit',
              value: `${(faculties?.meta?.total ?? 0).toLocaleString()} Fakultas`,
              icon: Database,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-white border border-emerald-100 rounded-xl px-4 py-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">
                    Status Sinkronisasi
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                      <Globe size={10} className="text-emerald-600" />
                      Terhubung ke Master
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PageHeader>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Fakultas"
            value={summary.total_faculties}
            icon={Building2}
            variant="gray"
          />
          <StatCard
            label="Total Prodi"
            value={summary.total_prodi}
            icon={LayoutGrid}
            variant="success"
          />
          <StatCard
            label="Populasi Peserta"
            value={summary.total_students.toLocaleString()}
            icon={Activity}
            variant="info"
          />
          <StatCard
            label="Integritas Data"
            value="STABIL"
            icon={ShieldCheck}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <ContentPanel title="Status Integrasi" icon={RefreshCw} padding={true}>
              <div className="space-y-6">
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                      Mode Operasi
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase">
                      Sync Only
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-emerald-900/60 uppercase leading-relaxed">
                    Data fakultas disinkronkan secara periodik dari API Master Akademik Pusat.
                    Perubahan nama atau kode unit harus dilakukan di sistem master.
                  </p>
                </div>

                <div className="flex items-center gap-4 px-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-emerald-700">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest">
                    Authorized Sync Agents
                  </span>
                </div>
              </div>
            </ContentPanel>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <ContentPanel title="Indeks Unit Fakultas" icon={LayoutGrid} padding={false}>
              <PremiumTable
                headers={['Nama Fakultas', 'Kode', 'Prod/Mhs', 'Status']}
                isEmpty={faculties.data.length === 0}
                emptyText="Data fakultas tidak ditemukan."
              >
                {faculties.data.map((f) => (
                  <PremiumTableRow key={f.id} className="group">
                    <PremiumTableCell>
                      <span className="text-sm font-black text-emerald-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                        {f.nama}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <span className="text-[10px] font-black text-emerald-800 tabular-nums">
                        {f.kode || '-'}
                      </span>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {f.total_prodi} Prodi
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {f.total_students} Mhs
                        </span>
                      </div>
                    </PremiumTableCell>
                    <PremiumTableCell>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100 uppercase">
                        Terverifikasi
                      </span>
                    </PremiumTableCell>
                  </PremiumTableRow>
                ))}
              </PremiumTable>
            </ContentPanel>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl border-b-4 border-emerald-950"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-16 -mt-16 pointer-events-none">
            <History size={250} />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner shrink-0 backdrop-blur-sm">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Aturan Integritas Struktural
              </h2>
              <p className="text-[11px] font-medium text-emerald-400/60 uppercase tracking-widest leading-relaxed max-w-3xl">
                Fondasi segmentasi akademis merupakan pilar validitas data. Akurasi basis mahasiswa
                dan alokasi program studi bergantung pada stabilitas arsitektur fakultas yang
                terdaftar dalam master sistem.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
