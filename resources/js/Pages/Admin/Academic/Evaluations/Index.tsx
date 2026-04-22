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
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head, router } from '@inertiajs/react';
import { Pagination } from '@/Components/ui';
import { useState } from 'react';

interface EvaluationItem { criterion: string; score: number; weight: number; }
interface EvaluationData {
  id: number; student_name: string; group_name: string; evaluator_name: string;
  evaluator_type: string; total_score: number | null; grade: string | null;
  evaluated_at: string; notes: string | null; items: EvaluationItem[];
}
interface PaginatedData {
  data: EvaluationData[];
  meta?: { current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[]; };
}
interface Props extends PageProps { evaluations: PaginatedData; }

export default function EvaluationsIndex({ evaluations }: Props) {
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    router.get(route('evaluasi.index'), { search }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout title="Monitoring Evaluasi">

      <div className="py-8 font-sans transition-all">
        {/* Header Sederhana Sesuai Patokan Gold Standard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-emerald-50/50 pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-emerald-950">Monitoring Evaluasi.</h1>
            <p className="text-xs text-emerald-950/40 font-black uppercase tracking-widest">Pusat pemeriksaan hasil penilaian lapangan DPL & Mitra</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#e8f5ee] border border-emerald-50/60 rounded-lg flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-widest mb-1">Total Laporan</span>
                <span className="text-sm font-bold text-emerald-950 leading-none">{evaluations.meta?.total || 0} Data</span>
              </div>
              <Activity size={18} className="text-[#1a7a4a] opacity-40 ml-2" />
            </div>
          </div>
        </div>

        {/* Statistik Minimalis */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MiniStat icon={ShieldCheck} label="Status Audit" value="Aktif" />
          <MiniStat icon={Activity} label="Keaslian Data" value="Terverifikasi" />
          <MiniStat icon={RefreshCw} label="Koneksi Sistem" value="Normal" />
          <MiniStat icon={Zap} label="Alur Kerja" value="Stabil" />
        </div>

        <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          {/* Toolbar Toolbar Sederhana Patokan */}
          <div className="p-4 border-b border-[#f3f4f6]/50 bg-emerald-50/10 flex items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari NIM atau Nama Mahasiswa..." 
                className="w-full h-9 pl-9 pr-4 bg-white border border-emerald-50/60 rounded-lg text-xs font-bold text-emerald-950 placeholder:text-black/20 focus:border-[#f3f4f6]0 outline-none transition-all"
              />
            </div>
            <button onClick={handleSearch} className="h-9 px-6 bg-[#e8f5ee] border border-emerald-50 text-[#1a7a4a] hover:bg-[#16a34a] hover:text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all">
              Cari Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/20 border-b border-emerald-50/50">
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">Identitas Mahasiswa</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">Penempatan</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">Penilai</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">Skor Akhir</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">Hasil Huruf</th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]/60">
                {evaluations.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center text-emerald-950/20">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={40} />
                        <span className="text-xs font-black uppercase tracking-widest">Belum ada data penilaian</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  evaluations.data.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50/20 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-950 uppercase leading-none mb-1.5">{ev.student_name}</span>
                          <span className="text-xs text-emerald-950/40 font-black tabular-nums tracking-wider uppercase leading-none">NO LOG: #{ev.id.toString().padStart(5, '0')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-emerald-950/80">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-60" />
                            <span className="uppercase leading-none tracking-tight">{ev.group_name}</span>
                          </div>
                          <span className="text-[9px] text-emerald-950/40 font-black uppercase tracking-widest">Lokasi Lapangan</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-emerald-950 leading-none mb-1.5">{ev.evaluator_name}</span>
                          <span className="text-[9px] font-black text-emerald-950/40 uppercase bg-[#e8f5ee] px-2 py-0.5 rounded border border-emerald-50/50">{ev.evaluator_type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-base font-bold text-emerald-950 tabular-nums leading-none">
                          {ev.total_score != null ? Number(ev.total_score).toFixed(1) : '0.0'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={clsx(
                          "inline-flex h-8 px-3 items-center justify-center rounded-lg text-xs font-black border transition-all shadow-sm",
                          ev.grade?.startsWith('A') ? 'bg-[#16a34a] text-white border-emerald-600' : 'bg-white text-emerald-950/20 border-[#f3f4f6]'
                        )}>
                          {ev.grade ?? '-'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="h-9 px-4 bg-[#e8f5ee] text-[#1a7a4a] hover:bg-[#16a34a] hover:text-white border border-emerald-50 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                          Buka Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info (Gold Standard) */}
          <div className="px-8 py-4 bg-emerald-50/10 border-t border-[#f3f4f6]/50 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest leading-none">
              Pusat Data Evaluasi | Audit Penilaian KKN
            </span>
            {evaluations.meta && <Pagination meta={evaluations.meta as any} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="p-4 bg-white border border-emerald-50/60 rounded-xl flex items-center gap-4 shadow-sm group hover:border-emerald-300 transition-all">
      <div className="h-10 w-10 bg-[#e8f5ee] rounded-xl flex items-center justify-center text-[#1a7a4a] shrink-0 group-hover:rotate-6 transition-transform">
        <Icon size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <span className="text-lg font-bold text-emerald-950 tabular-nums leading-none tracking-tight uppercase">{value}</span>
      </div>
    </div>
  );
}
