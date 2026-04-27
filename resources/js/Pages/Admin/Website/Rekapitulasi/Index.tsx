import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
  Printer,
  Download,
  ArrowLeft,
  FileText,
  Database,
  Activity,
  MapPin,
  Layers,
  ShieldCheck,
  Cpu,
  Calendar,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';

interface RekapRow {
  id: number;
  uraian_kegiatan: string;
  satuan: string;
  volume: number;
  swadaya_mhs: number;
  swadaya_masyarakat: number;
  bantuan_pemerintah: number;
  donatur_lain: number;
  jumlah: number;
  keterangan?: string;
}
interface Lokasi {
  village_name: string;
  district_name: string;
  regency_name: string;
}
interface Periode {
  name: string;
}
interface KelompokData {
  id: number;
  nama_kelompok: string;
  lokasi: Lokasi;
  periode: Periode;
}
interface DplData {
  nama: string;
}
interface Props {
  kelompok: KelompokData;
  rekapitulasi: RekapRow[];
  dpl: DplData;
}

function formatCurrency(v: number): string {
  return v.toLocaleString('id-ID');
}

export default function AdminRekapitulasiIndex({ kelompok, rekapitulasi, dpl }: Props) {
  const totals = rekapitulasi.reduce(
    (acc, item) => ({
      mhs: acc.mhs + (item.swadaya_mhs || 0),
      masy: acc.masy + (item.swadaya_masyarakat || 0),
      bant: acc.bant + (item.bantuan_pemerintah || 0),
      don: acc.don + (item.donatur_lain || 0),
      total: acc.total + (item.jumlah || 0),
    }),
    { mhs: 0, masy: 0, bant: 0, don: 0, total: 0 },
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
    <AppLayout title="Audit Finansial">
      <Head title={`Rekapitulasi ${kelompok.nama_kelompok} | SIBERMAS`} />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans print:p-0 print:space-y-0">
        {/* PAGE HEADER */}
        <motion.div variants={itemVariants}>
<PageHeader
          title="Fiscal Audit."
          subtitle={`Rekapitulasi laporan kegiatan dan pengawasan finansial kelompok ${kelompok.nama_kelompok}.`}
          icon={Database}
          groupLabel="Operational Ledger"
          className="print:hidden"
        >
          <div className="flex items-center gap-3">
            <Link
              href={route('admin.kelompok.index')}
              className="h-11 px-6 bg-white border border-gray-100 text-emerald-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft size={16} /> Kembali
            </Link>
            <div className="h-8 w-[1px] bg-emerald-50 mx-1" />
            <button
              onClick={() => window.print()}
              className="h-11 px-6 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Printer size={16} /> Cetak Node
            </button>
          </div>
        </PageHeader>
</motion.div>

        {/* STATS GRID */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard
            label="Total Investasi"
            value={`Rp ${formatCurrency(totals.total)}`}
            icon={Wallet}
            variant="success"
          />
          <StatCard
            label="Swadaya Mhs"
            value={`Rp ${formatCurrency(totals.mhs)}`}
            icon={Activity}
            variant="info"
          />
          <StatCard label="Audit Status" value="VERIFIED" icon={ShieldCheck} variant="gray" />
          <StatCard label="Fiscal Kernel" value="vFIN 1.2" icon={Cpu} variant="gray" />
        </div>

        {/* DOCUMENT CANVAS */}
        <motion.div variants={itemVariants}>
<ContentPanel
          title="Rekapitulasi Laporan Kegiatan"
          description="Lembaga Penelitian dan Pengabdian Masyarakat (LPPM) UIN Saizu"
          icon={FileText}
          padding={true}
          className="print:border-0 print:shadow-none print:p-0"
        >
          <div className="space-y-8">
            {/* Header Cetak (Hanya tampil saat print) */}
            <div className="hidden print:block text-center border-b-2 border-emerald-950 pb-6 mb-8">
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">
                REKAPITULASI LAPORAN KEGIATAN KKN
              </h2>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] mt-2">
                LPPM UIN PROF. KH. SAIFUDDIN ZUHRI PURWOKERTO
              </p>
            </div>

            {/* Info Registry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 p-8 bg-[#F8FAF9] border border-emerald-50/50 rounded-3xl print:grid-cols-2 print:p-4 print:bg-white print:border-0 print:gap-y-2">
              <InfoItem label="Wilayah" value={kelompok.lokasi.village_name} icon={MapPin} />
              <InfoItem label="Identitas" value={kelompok.nama_kelompok} icon={Layers} />
              <InfoItem label="Kecamatan" value={kelompok.lokasi.district_name} />
              <InfoItem label="Temporal" value={kelompok.periode.name} icon={Calendar} />
              <InfoItem label="Kabupaten" value={kelompok.lokasi.regency_name} />
            </div>

            {/* Data Ledger */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-emerald-950/10 text-[11px] font-sans">
                <thead>
                  <tr className="bg-emerald-950 text-white border-b border-emerald-950">
                    <th
                      rowSpan={2}
                      className="border border-emerald-900 p-3 text-center font-black w-10"
                    >
                      NO
                    </th>
                    <th rowSpan={2} className="border border-emerald-900 p-3 text-left font-black">
                      URAIAN KEGIATAN
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-emerald-900 p-3 text-center font-black w-16"
                    >
                      UNIT
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-emerald-900 p-3 text-center font-black w-12"
                    >
                      VOL
                    </th>
                    <th
                      colSpan={4}
                      className="border border-emerald-900 p-3 text-center font-black bg-emerald-900/50 uppercase tracking-widest text-[9px]"
                    >
                      Komponen Fiskal (RP)
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-emerald-900 p-3 text-right font-black w-32 bg-emerald-600"
                    >
                      TOTAL (RP)
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-emerald-900 p-3 text-left font-black w-40"
                    >
                      KETERANGAN
                    </th>
                  </tr>
                  <tr className="bg-emerald-900 text-white text-[9px]">
                    <th className="border border-emerald-800 p-2 text-center font-black">MHS</th>
                    <th className="border border-emerald-800 p-2 text-center font-black">MASY</th>
                    <th className="border border-emerald-800 p-2 text-center font-black">PEM</th>
                    <th className="border border-emerald-800 p-2 text-center font-black">LAIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {rekapitulasi.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-50/30 transition-all font-bold text-emerald-950"
                    >
                      <td className="border border-emerald-50 p-3 text-center">{idx + 1}</td>
                      <td className="border border-emerald-50 p-3 uppercase tracking-tight">
                        {item.uraian_kegiatan}
                      </td>
                      <td className="border border-emerald-50 p-3 text-center opacity-40 uppercase">
                        {item.satuan}
                      </td>
                      <td className="border border-emerald-50 p-3 text-center tabular-nums">
                        {item.volume}
                      </td>
                      <td className="border border-emerald-50 p-3 text-right tabular-nums">
                        {formatCurrency(item.swadaya_mhs)}
                      </td>
                      <td className="border border-emerald-50 p-3 text-right tabular-nums">
                        {formatCurrency(item.swadaya_masyarakat)}
                      </td>
                      <td className="border border-emerald-50 p-3 text-right tabular-nums">
                        {formatCurrency(item.bantuan_pemerintah)}
                      </td>
                      <td className="border border-emerald-50 p-3 text-right tabular-nums">
                        {formatCurrency(item.donatur_lain)}
                      </td>
                      <td className="border border-emerald-50 p-3 text-right tabular-nums bg-gray-50/50">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="border border-emerald-50 p-3 text-[9px] font-medium text-emerald-950/40 italic uppercase">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                  {/* TOTAL ROW */}
                  <tr className="bg-emerald-50 text-emerald-950 font-black text-xs">
                    <td
                      colSpan={4}
                      className="border border-emerald-100 p-4 text-right uppercase tracking-widest"
                    >
                      Aggregate Total
                    </td>
                    <td className="border border-emerald-100 p-4 text-right tabular-nums">
                      {formatCurrency(totals.mhs)}
                    </td>
                    <td className="border border-emerald-100 p-4 text-right tabular-nums">
                      {formatCurrency(totals.masy)}
                    </td>
                    <td className="border border-emerald-100 p-4 text-right tabular-nums">
                      {formatCurrency(totals.bant)}
                    </td>
                    <td className="border border-emerald-100 p-4 text-right tabular-nums">
                      {formatCurrency(totals.don)}
                    </td>
                    <td className="border border-emerald-100 p-4 text-right tabular-nums bg-emerald-600 text-white shadow-xl">
                      {formatCurrency(totals.total)}
                    </td>
                    <td className="border border-emerald-100 p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-20 text-center text-[10px] font-black uppercase tracking-widest print:mt-12">
              <div className="space-y-24">
                <p className="text-emerald-950">Dosen Pembimbing Lapangan (DPL)</p>
                <div className="space-y-2">
                  <p className="text-emerald-950 underline decoration-2 underline-offset-8">
                    {dpl.nama}
                  </p>
                  <p className="text-emerald-950/30">NIP. ................................</p>
                </div>
              </div>
              <div className="space-y-24">
                <p className="text-emerald-950">Ketua Kelompok KKN</p>
                <div className="space-y-2">
                  <p className="text-emerald-950 underline decoration-2 underline-offset-8">
                    {kelompok.nama_kelompok}
                  </p>
                  <p className="text-emerald-950/30">NIM. ................................</p>
                </div>
              </div>
            </div>
          </div>
        </ContentPanel>
</motion.div>

        {/* PRINT STYLE */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page { margin: 2cm; }
            body { background: white !important; -webkit-print-color-adjust: exact; }
            .lg\\:pl-64 { padding-left: 0 !important; }
            main { padding: 0 !important; }
            table { border-collapse: collapse !important; width: 100% !important; }
            th, td { border: 1px solid #064e3b !important; }
            .bg-emerald-950 { background-color: #064e3b !important; color: white !important; }
            .bg-emerald-600 { background-color: #059669 !important; color: white !important; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .text-emerald-950 { color: #064e3b !important; }
          }
        `,
          }}
        />
      </motion.div>
    </AppLayout>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="flex items-center gap-6">
      <div className="w-24 text-[10px] font-black text-emerald-950/40 uppercase tracking-widest shrink-0">
        {label}
      </div>
      <div className="flex items-center gap-3 flex-1 border-b border-emerald-950/5 pb-1">
        {Icon && <Icon size={14} className="text-emerald-600" />}
        <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}
