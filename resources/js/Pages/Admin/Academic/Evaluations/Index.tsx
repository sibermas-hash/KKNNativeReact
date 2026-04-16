import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { 
  Star, 
  Trophy,
  GraduationCap,
  BarChart3,
  Zap,
  ShieldCheck,
  Activity,
  Binary,
  Clock,
  RefreshCw,
  Search,
  ChevronRight,
  ArrowRight,
  Target,
  SearchCode
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head } from '@inertiajs/react';
import { Pagination } from '@/Components/ui';
import { motion } from 'framer-motion';

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
  return (
    <AppLayout title="Audit Monitoring Evaluasi Akademik">
      <Head title="Monitoring Evaluasi" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <Star size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Direktori Kinerja Mahasiswa</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Monitoring <span className="text-emerald-500">Evaluasi.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Analisis audit hasil evaluasi lapangan yang diinput oleh DPL dan Mitra Desa. Pantau kualitas distribusi nilai secara real-time berdasarkan matriks kinerja akademik yang telah ditetapkan.
                </p>
              </div>
              <div className="shrink-0">
                  <div className="h-20 px-10 bg-emerald-600 border-2 border-emerald-500 rounded-[2rem] flex items-center gap-8 text-white shadow-2xl shadow-emerald-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-2">Populasi Evaluasi</span>
                      <span className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">{evaluations.meta?.total?.toLocaleString('id-ID') || 0} DATA</span>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <Trophy size={28} className="text-white drop-shadow-lg" />
                  </div>
              </div>
           </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard label="Audit Aktif" value="SIAP" icon={ShieldCheck} desc="Siklus 2026/2027" />
           <MetricCard label="Integritas Nilai" value="TERVERIFIKASI" icon={Activity} desc="Sesuai Rubrik" />
           <MetricCard label="Sinkronisasi" value="REAL-TIME" icon={RefreshCw} desc="Database Utama" />
           <MetricCard label="Aktivitas" value="TINGGI" icon={Zap} desc="Periode Grading" />
        </div>

        {/* --- DATA TABLE CARD --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
           <div className="px-10 py-10 bg-emerald-50/20 border-b-2 border-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 bg-white rounded-[1.5rem] border-2 border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Binary size={32} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Aliran Nilai Evaluasi</h3>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Pusat Audit Parameter Akademik Terpadu</p>
                 </div>
              </div>

              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" strokeWidth={3} />
                <input 
                  type="text" 
                  placeholder="CARI NAMA ATAU KELOMPOK..." 
                  className="w-full h-14 pl-14 pr-6 bg-white border-2 border-emerald-50 rounded-2xl text-[11px] font-black text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-widest shadow-sm"
                />
              </div>
           </div>

           <div className="overflow-x-auto min-h-[500px]">
             <table className="min-w-full text-left border-collapse whitespace-nowrap">
               <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                 <tr>
                   <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Identitas Peserta [MAHASISWA]</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Penugasan Wilayah</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Evaluator Resmi</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Skor Metrik</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Grade Kualifikasi</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-emerald-50 font-sans">
                 {evaluations.data.length === 0 ? (
                    <EmptyState />
                 ) : (
                   evaluations.data.map((ev) => (
                    <tr key={ev.id} className="group hover:bg-emerald-50/30 transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 bg-emerald-100 text-emerald-700 border-2 border-emerald-50 rounded-[1.25rem] flex items-center justify-center font-black text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                             {ev.student_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-tight mb-2 group-hover:text-emerald-700 transition-colors">{ev.student_name}</span>
                            <span className="text-[9px] font-black text-emerald-500 tracking-[0.2em] uppercase leading-none font-mono">HASHID: #{ev.id.toString().padStart(6, '0')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                           <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{ev.group_name.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-black text-emerald-950 uppercase leading-none mb-1.5">{ev.evaluator_name}</span>
                          <span className="px-3 py-1 bg-white border-2 border-emerald-50 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest shadow-sm">{ev.evaluator_type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <span className="text-2xl font-black text-emerald-950 tabular-nums tracking-tighter group-hover:text-emerald-700 transition-colors">
                           {ev.total_score != null ? ev.total_score.toFixed(1) : '0.0'}
                        </span>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <div className="flex justify-center">
                          <div className={clsx(
                             'h-12 w-12 flex items-center justify-center rounded-2xl font-black text-xl transition-all shadow-lg border-2', 
                             ev.grade?.includes('A') ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-100' : 
                             ev.grade?.includes('B') ? 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-50' : 
                             'bg-white border-emerald-100 text-emerald-600'
                          )}>
                             {ev.grade ?? '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                           <button className="h-10 px-5 bg-white border-2 border-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center gap-3">
                              RINCIAN <ChevronRight size={14} strokeWidth={3} />
                           </button>
                        </div>
                      </td>
                    </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>

           {/* PAGINATION */}
           <div className="px-10 py-8 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                 Data Halaman <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{evaluations.meta?.current_page || 1}</strong> Per <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{evaluations.meta?.last_page || 1}</strong> Otoritas
              </span>
              {evaluations.meta && <Pagination meta={evaluations.meta as any} />}
           </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
            <BarChart3 size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <GraduationCap size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Integritas Audit Akademik</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Protokol Penjaminan Mutu Evaluasi</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                 Seluruh matriks penilaian yang terdata dalam sistem ini telah melewati validasi parameter SIKKKN UIN SAIZU. Administrator dilarang mengubah skor tanpa dasar Berita Acara (BA) resmi. Setiap aktivitas intervensi nilai akan terekam dalam log audit transparan untuk menjamin keabsahan yudisium KKN.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, type, desc }: { label: string; value: any; icon: any; type?: 'success' | 'danger'; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2", 
        type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
        type === 'danger' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-400 border-emerald-50'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value}</span>
        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6} className="px-10 py-32 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <SearchCode size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">Audit Evaluasi Nihil</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">Belum ditemukan entri evaluasi resmi dari DPL maupun Mitra dalam sistem.</p>
          </div>
      </td>
    </tr>
  );
}
