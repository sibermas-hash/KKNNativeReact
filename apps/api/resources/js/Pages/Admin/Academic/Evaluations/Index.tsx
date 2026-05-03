import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import {
  ShieldCheck,
  Activity,
  RefreshCw,
  Zap,
  Search,
  ChevronRight,
  FileText,
  Filter,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head, router } from '@inertiajs/react';
import { Pagination } from '@/Components/UI';
import { useState } from 'react';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import SearchInput from '@/Components/Premium/SearchInput';

interface EvaluationItem {
  criterion: string;
  score: number;
  weight: number;
}
interface EvaluationData {
  id: number;
  student_name: string;
  group_name: string;
  evaluator_name: string;
  evaluator_type: string;
  total_score: number | null;
  grade: string | null;
  evaluated_at: string;
  notes: string | null;
  items: EvaluationItem[];
}
interface PaginatedData {
  data: EvaluationData[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
}
interface Props extends PageProps {
  evaluations: PaginatedData;
}

export default function EvaluationsIndex({ evaluations }: Props) {
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    router.get(route('evaluasi.index'), { search }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout title="Monitoring Evaluasi">
      <div className="py-8 font-sans transition-all">
        <PageHeader
          title="Monitoring Evaluasi."
          subtitle="Pusat pemeriksaan hasil penilaian lapangan DPL & Mitra secara terpusat dan terverifikasi."
          icon={Activity}
          groupLabel="Akademik & Penilaian"
          stats={{
            label: 'Total Laporan',
            value: `${(evaluations.meta?.total || 0).toLocaleString()} Data`,
            icon: FileText,
          }}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Status Audit" value="Aktif" icon={ShieldCheck} variant="success" />
          <StatCard label="Keaslian Data" value="Terverifikasi" icon={Activity} variant="info" />
          <StatCard label="Koneksi Sistem" value="Normal" icon={RefreshCw} variant="success" />
          <StatCard label="Alur Kerja" value="Stabil" icon={Zap} variant="gray" />
        </div>

        <ContentPanel
          title="Indeks Hasil Evaluasi"
          description="Daftar laporan penilaian masuk dari lapangan."
          icon={FileText}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <SearchInput
                placeholder="CARI NIM ATAU NAMA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={handleSearch}
                className="w-80"
              />
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums leading-none">
                Pusat Data Evaluasi | Audit Penilaian KKN
              </span>
              {evaluations.meta && <Pagination meta={evaluations.meta as any} />}
            </div>
          }
        >
          <PremiumTable
            headers={[
              'Identitas Mahasiswa',
              'Unit Penempatan',
              'Petugas Penilai',
              'Skor Akhir',
              'Huruf',
              'Opsi',
            ]}
            isEmpty={evaluations.data.length === 0}
            emptyText="Belum ada data penilaian masuk."
          >
            {evaluations.data.map((ev) => (
              <PremiumTableRow key={ev.id}>
                <PremiumTableCell>
                  <div className="flex flex-col py-1">
                    <span className="text-[13px] font-black text-emerald-950 uppercase leading-none mb-2 font-display">
                      {ev.student_name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold tabular-nums tracking-wider uppercase leading-none">
                      ID LOG: #{ev.id.toString().padStart(5, '0')}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-black text-emerald-950 uppercase leading-none tracking-tight font-display">
                        {ev.group_name}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-3">
                      Wilayah Penugasan
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-emerald-950 leading-none mb-2 uppercase font-display">
                      {ev.evaluator_name}
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 tracking-widest">
                      {ev.evaluator_type}
                    </span>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <span className="text-xl font-black text-emerald-950 tabular-nums leading-none font-display">
                    {ev.total_score != null ? Number(ev.total_score).toFixed(1) : '0.0'}
                  </span>
                </PremiumTableCell>
                <PremiumTableCell align="center">
                  <span
                    className={clsx(
                      'inline-flex h-9 px-4 items-center justify-center rounded-xl text-xs font-black border transition-all shadow-sm font-display',
                      ev.grade?.startsWith('A')
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-100',
                    )}
                  >
                    {ev.grade ?? '-'}
                  </span>
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <button className="h-9 px-5 bg-emerald-950 text-white hover:bg-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md">
                    Audit Detail
                  </button>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>
      </div>
    </AppLayout>
  );
}
