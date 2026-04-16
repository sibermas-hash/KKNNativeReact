import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  CheckCircle, 
  ShieldAlert, 
  Zap,
  BarChart3,
  Activity,
  ScanLine,
  Database,
  ShieldCheck,
  Search,
  Filter,
  Trophy,
  SearchCode,
  FileSearch,
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldQuestion,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface AuditedReport {
  id: number;
  user_name: string;
  group_name: string;
  title: string;
  submitted_at: string;
  risk_score: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_flags: string[];
  description_preview: string;
}

interface Props {
  reports: { data: AuditedReport[]; meta: PaginationMeta };
  stats: { high_risk_count: number };
}

export default function QualityAuditIndex({ reports, stats }: Props) {
  return (
    <AppLayout title="Audit Kualitas & Integritas Aktivitas">
      <Head title="Audit Aktivitas" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <ShieldAlert size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Monitoring & Penjaminan Mutu</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Audit <span className="text-emerald-500">Integritas.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Pemindaian otomatis kualitas pelaporan dan kejujuran data aktivitas lapangan. Identifikasi anomali transmisi laporan untuk memastikan validitas output pengabdian.
                </p>
              </div>
              <div className="shrink-0">
                  <div className="h-20 px-10 bg-emerald-600 border-2 border-emerald-500 rounded-[2rem] flex items-center gap-8 text-white shadow-2xl shadow-emerald-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-2">Laporan Berisiko</span>
                      <span className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">{stats.high_risk_count} ENTITAS</span>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <ShieldQuestion size={28} className="text-white drop-shadow-lg" />
                  </div>
              </div>
           </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard label="Audit Pipeline" value="STABIL" icon={ShieldCheck} desc="Sistem Pemindaian" />
           <MetricCard label="Update Sinyal" value="REAL-TIME" icon={RefreshCw} desc="Analisis Lanjuatn" />
           <MetricCard label="Integritas Node" value="SECURE" icon={Database} desc="Keamanan Metadata" />
           <MetricCard label="Level Risiko" value="OPTIMAL" icon={Activity} desc="Parameter Global" />
        </div>

        {/* --- DATA TABLE CARD --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
           <div className="px-10 py-10 bg-emerald-50/20 border-b-2 border-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 bg-white rounded-[1.5rem] border-2 border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <ScanLine size={32} className="animate-pulse" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Scanner Integritas</h3>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Identifikasi Anomali Pelaporan Secara Otomatis</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-emerald-50 rounded-2xl shadow-sm">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
                 <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">SENTINEL_ACTIVE</span>
              </div>
           </div>

           <div className="overflow-x-auto min-h-[500px]">
             <table className="min-w-full text-left border-collapse whitespace-nowrap">
               <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                 <tr>
                   <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Identitas Peserta & Unit</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Rincian Transmisi Laporan</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Indikasi Temuan</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Risk Score</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-emerald-50">
                 {reports.data.length === 0 ? (
                    <EmptyState />
                 ) : (
                   reports.data.map((r) => (
                    <tr key={r.id} className={clsx(
                       "group hover:bg-emerald-50/30 transition-all font-sans",
                       r.risk_level === 'HIGH' ? 'bg-rose-50/20' : ''
                    )}>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className={clsx(
                             "h-12 w-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm border-2 shadow-sm transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600",
                             r.risk_level === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-emerald-100 border-emerald-50 text-emerald-700'
                          )}>
                             {r.user_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-tight group-hover:text-emerald-700 transition-colors max-w-[200px] truncate mb-2">{r.user_name}</span>
                            <span className="text-[9px] font-black text-emerald-400 tracking-widest opacity-60 uppercase leading-none">{r.group_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-black text-emerald-800 uppercase leading-tight max-w-[300px] truncate tracking-tight">{r.title}</span>
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="text-emerald-300" strokeWidth={3} />
                             <span className="text-[9px] font-black text-emerald-300 font-mono tracking-widest uppercase">{r.submitted_at}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          {r.risk_flags.length > 0 ? r.risk_flags.map((flag, idx) => (
                            <span key={idx} className="h-6 px-3 bg-rose-50 border-2 border-rose-100 text-rose-500 text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center shadow-sm">
                              {flag.replace(/_/g, ' ')}
                            </span>
                          )) : (
                            <span className="h-6 px-3 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center shadow-lg shadow-emerald-100">PASSED</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center text-center">
                        <div className={clsx(
                           'h-12 w-12 inline-flex items-center justify-center rounded-2xl text-[13px] font-black border-2 transition-all shadow-lg', 
                           r.risk_score >= 70 ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200' : 
                           r.risk_score >= 30 ? 'bg-amber-50 border-amber-100 text-amber-500 shadow-amber-50' : 
                           'bg-white border-emerald-50 text-emerald-600 shadow-emerald-50'
                        )}>
                           {r.risk_score}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                           <button className="h-10 px-5 bg-white border-2 border-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">
                              AUDIT_DETAIL <ArrowRight size={14} className="ml-2" strokeWidth={3} />
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
                 Data Halaman <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{reports.meta.current_page}</strong> Per <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{(reports.meta.total || 0).toLocaleString('id-ID')}</strong> Entitas Terdeteksi
              </span>
              <Pagination meta={reports.meta} />
           </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-emerald-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/audit">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-12 -mt-12 group-hover/audit:rotate-45 transition-transform duration-1000"><Activity size={200} /></div>
              <div className="flex items-center gap-8 relative z-10">
                 <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={32} className="text-emerald-400" strokeWidth={2.5} />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase tracking-tight leading-none">Integritas Sentinel</h4>
                    <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest leading-relaxed">Pemindaian kejujuran otomatis berjalan secara real-time pada setiap transmisi data pelaporan mahasiswa.</p>
                 </div>
              </div>
           </div>
           
           <div className="bg-emerald-600 rounded-[3rem] p-10 text-white flex items-center justify-between relative overflow-hidden group/meta shadow-2xl border border-emerald-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent)]" />
              <div className="space-y-4 relative z-10">
                 <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest text-emerald-200">System Surveillance Metadata</h4>
                 <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter uppercase italic text-white">KERNELS_NOMINAL</span>
                    <span className="text-[9px] font-black text-emerald-300 tracking-[0.3em] uppercase opacity-70">Security Registry Secured</span>
                 </div>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                 <div className="h-12 w-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner group-hover/meta:scale-110 transition-transform"><Database size={24} strokeWidth={2.5} /></div>
                 <div className="h-12 w-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner group-hover/meta:rotate-12 transition-transform"><BarChart3 size={24} strokeWidth={2.5} /></div>
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string; value: string; icon: any; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2 bg-emerald-50 text-emerald-600 border-emerald-50">
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
      <td colSpan={10} className="px-10 py-32 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <SearchCode size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">Audit Aktivitas Nihil</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">Tidak ditemukan indikasi risiko pelaporan untuk saat ini.</p>
          </div>
      </td>
    </tr>
  );
}
